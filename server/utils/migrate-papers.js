/**
 * migrate-papers.js
 * One-time migration script: reads all existing papers from syllabus-papers.json
 * and saves them into the MongoDB `generatedquestions` collection.
 *
 * Run once with: node utils/migrate-papers.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const GeneratedQuestion = require('../models/GeneratedQuestion');

const fallbackPapersFile = path.join(__dirname, '..', 'syllabus-papers.json');

async function migratePapers() {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('🔌 Connected.\n');

    // Read local JSON file
    let papers = [];
    try {
        const raw = fs.readFileSync(fallbackPapersFile, 'utf8');
        papers = JSON.parse(raw);
    } catch (err) {
        console.error('❌ Could not read syllabus-papers.json:', err.message);
        process.exit(1);
    }

    if (!Array.isArray(papers) || papers.length === 0) {
        console.log('⚠️  No papers found in syllabus-papers.json. Nothing to migrate.');
        process.exit(0);
    }

    console.log(`📄 Found ${papers.length} paper(s) in syllabus-papers.json`);
    console.log('🚀 Starting migration...\n');

    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    for (const paper of papers) {
        try {
            // Skip if this paperId already exists in MongoDB (avoid duplicates)
            const existing = await GeneratedQuestion.findOne({ paperId: paper.id });
            if (existing) {
                console.log(`⏭️  Skipped (already in MongoDB): [${paper.subject}] ${paper.id}`);
                skipped++;
                continue;
            }

            // Map paper questions into GeneratedQuestion schema format
            const mappedQuestions = (paper.questions || []).map((q, i) => {
                // options can be [{id:'A', text:'...'}, ...] or ['string', ...]
                let mappedOptions = [];
                if (Array.isArray(q.options)) {
                    mappedOptions = q.options.map(o => {
                        if (typeof o === 'string') return o;
                        if (o && typeof o === 'object') return o.text || o.id || '';
                        return '';
                    }).filter(Boolean);
                }

                // explanation can be at q.answer.explanation or q.answer.value
                const explanation = q.answer?.explanation || q.answer?.value || '';
                const correctOption = q.correctAnswer || q.answer?.correctOption || '';

                return {
                    questionNumber: q.questionNo || q.questionNumber || (i + 1),
                    text: q.text || q.question || '',
                    section: q.section || '',
                    type: q.type || 'MCQ',
                    options: mappedOptions,
                    answer: {
                        correctOption,
                        explanation
                    },
                    marks: q.marks || 1,
                    difficulty: q.difficulty || paper.difficulty || 'Medium'
                };
            });

            // Build unique question types string from section types
            const qTypes = [...new Set(mappedQuestions.map(q => q.type).filter(Boolean))].join(', ') || 'MCQ';

            const gqDoc = new GeneratedQuestion({
                teacherEmail: paper.teacherEmail || 'unknown@qnario.com',
                paperId: paper.id,
                syllabusId: paper.syllabusId || null,
                subject: paper.subject || 'Unknown',
                className: paper.className || null,
                paperType: paper.paperType || 'Custom',
                level: 'Mixed',
                difficulty: paper.difficulty || 'Medium',
                language: paper.language || 'English',
                duration: paper.duration || null,
                marks: String(paper.totalMarks || mappedQuestions.length),
                questionType: qTypes,
                status: paper.status || 'draft',
                questions: mappedQuestions,
                createdAt: paper.createdAt ? new Date(paper.createdAt) : new Date()
            });

            await gqDoc.save();
            console.log(`✅ Migrated: [${paper.subject}] ${paper.id} → MongoDB _id: ${gqDoc._id} (${mappedQuestions.length} questions)`);
            inserted++;

        } catch (err) {
            console.error(`❌ Failed to migrate paper ${paper.id}:`, err.message);
            if (err.errors) {
                Object.keys(err.errors).forEach(k => {
                    console.error(`   Field error [${k}]:`, err.errors[k].message);
                });
            }
            failed++;
        }
    }

    console.log('\n========================================');
    console.log('📊 Migration Complete!');
    console.log(`   ✅ Inserted : ${inserted}`);
    console.log(`   ⏭️  Skipped  : ${skipped} (already existed)`);
    console.log(`   ❌ Failed   : ${failed}`);
    console.log('========================================');
    console.log('\n👉 Open MongoDB Compass → qnario → generatedquestions to verify.\n');

    await mongoose.disconnect();
    process.exit(0);
}

migratePapers().catch(err => {
    console.error('💥 Migration crashed:', err);
    process.exit(1);
});
