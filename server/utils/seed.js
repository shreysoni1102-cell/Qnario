const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');

// Import all Mongoose models
const User = require('../models/User');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const StudentAttempt = require('../models/StudentAttempt');
const StudentResult = require('../models/StudentResult');
const ExamSchedule = require('../models/ExamSchedule');
const Analytics = require('../models/Analytics');
const GeneratedQuestion = require('../models/GeneratedQuestion');

// 1. Initial User Accounts Data
const SEED_USERS = [
    {
        name: 'Dr. Eleanor Vance',
        email: 'teacher@qnario.com',
        password: 'password123',
        role: 'teacher',
        isEmailVerified: true
    },
    {
        name: 'Alex Mercer',
        email: 'student@qnario.com',
        password: 'password123',
        role: 'student',
        isEmailVerified: true
    },
    {
        name: 'Qnario Admin',
        email: 'admin@qnario.com',
        password: 'password123',
        role: 'admin',
        isEmailVerified: true
    }
];

// 2. Subjects Data
const SEED_SUBJECTS = [
    {
        name: 'Physics',
        code: 'phy',
        description: 'Study of matter, energy, space, time, and forces.',
        icon: 'physics-icon',
        totalTopics: 2,
        totalQuestions: 3
    },
    {
        name: 'Chemistry',
        code: 'chm',
        description: 'Study of atoms, molecules, reactions, and bonds.',
        icon: 'chemistry-icon',
        totalTopics: 2,
        totalQuestions: 2
    },
    {
        name: 'Biology',
        code: 'bio',
        description: 'Study of cell structures, living organisms, and genetics.',
        icon: 'biology-icon',
        totalTopics: 2,
        totalQuestions: 2
    },
    {
        name: 'Mathematics',
        code: 'mat',
        description: 'Study of calculus, logic, geometry, and algorithms.',
        icon: 'math-icon',
        totalTopics: 0,
        totalQuestions: 1
    }
];

// 3. Exams Data
const SEED_EXAMS = [
    {
        name: 'JEE Main',
        code: 'jee_main',
        description: 'Joint Entrance Examination (Main) for Engineering Aspirants.',
        examDetails: {
            totalDuration: 180, // 3 hours
            totalQuestions: 75,
            totalMarks: 300,
            negativeMarking: true,
            negativeMarkPercentage: 0.25,
            passingPercentage: 40,
            sectionWise: [
                { sectionName: 'Physics', duration: 60, questions: 25, marks: 100 },
                { sectionName: 'Chemistry', duration: 60, questions: 25, marks: 100 },
                { sectionName: 'Mathematics', duration: 60, questions: 25, marks: 100 }
            ]
        }
    },
    {
        name: 'NEET',
        code: 'neet',
        description: 'National Eligibility cum Entrance Test for Medical Aspirants.',
        examDetails: {
            totalDuration: 180,
            totalQuestions: 180,
            totalMarks: 720,
            negativeMarking: true,
            negativeMarkPercentage: 0.25,
            passingPercentage: 50,
            sectionWise: [
                { sectionName: 'Physics', duration: 60, questions: 45, marks: 180 },
                { sectionName: 'Chemistry', duration: 60, questions: 45, marks: 180 },
                { sectionName: 'Biology', duration: 60, questions: 90, marks: 360 }
            ]
        }
    },
    {
        name: '12th Board',
        code: 'board_12',
        description: 'Standard 12th Grade Board examination.',
        examDetails: {
            totalDuration: 180,
            totalQuestions: 80,
            totalMarks: 100,
            negativeMarking: false,
            negativeMarkPercentage: 0,
            passingPercentage: 35
        }
    }
];

// 4. Topics Data
const SEED_TOPICS = [
    // Physics
    {
        name: 'Mechanics',
        code: 'phy_mechanics',
        subjectCode: 'phy',
        description: 'Dynamics of moving bodies, Newton\'s laws, kinematics.',
        resources: [
            { type: 'notes', title: 'Kinematics & Newton\'s Laws', url: 'https://qnario.com/study/phy/mechanics.pdf' },
            { type: 'video', title: 'Understanding Torque and Motion', url: 'https://youtube.com/watch?v=mocktorque', duration: 1800 }
        ]
    },
    {
        name: 'Thermodynamics',
        code: 'phy_thermo',
        subjectCode: 'phy',
        description: 'Laws of heat exchanges, entropy, internal energies.',
        resources: [
            { type: 'article', title: 'Intro to Carnot Engine', url: 'https://qnario.com/study/phy/thermo.html' }
        ]
    },
    // Chemistry
    {
        name: 'Chemical Bonding',
        code: 'chm_bonding',
        subjectCode: 'chm',
        description: 'Lewis dot structures, VSEPR model, ionic & covalent bounds.',
        resources: [
            { type: 'notes', title: 'Valence Bond Theory Overview', url: 'https://qnario.com/study/chm/bonding.pdf' }
        ]
    },
    {
        name: 'Organic Chemistry',
        code: 'chm_organic',
        subjectCode: 'chm',
        description: 'Alkanes, Alkenes, Functional groups and standard pathways.',
        resources: []
    },
    // Biology
    {
        name: 'Cell Biology',
        code: 'bio_cell',
        subjectCode: 'bio',
        description: 'Structure, organelles, and respiration functions of eukaryotic cells.',
        resources: []
    },
    {
        name: 'Genetics',
        code: 'bio_genetics',
        subjectCode: 'bio',
        description: 'Mendelian inheritances, DNA structures, chromosomal maps.',
        resources: []
    }
];

// 5. Questions Data
const SEED_QUESTIONS = [
    // Physics - Mechanics
    {
        questionNumber: 1,
        text: 'What is the SI unit of force?',
        type: 'MCQ',
        marks: 4,
        examCode: 'jee_main',
        subjectCode: 'phy',
        topicCode: 'phy_mechanics',
        difficulty: 'Easy',
        options: [
            { id: 'A', text: 'Kilogram' },
            { id: 'B', text: 'Newton' },
            { id: 'C', text: 'Joule' },
            { id: 'D', text: 'Watt' }
        ],
        answer: {
            correctOption: 'B',
            explanation: 'Newton (N) is the SI unit of force. 1 Newton = 1 kg·m/s².',
            solutionSteps: [
                'Recall standard units in physics.',
                'Newton is used for Force.',
                'Others: Kg (mass), Joule (energy), Watt (power).'
            ]
        }
    },
    {
        questionNumber: 2,
        text: 'A car accelerates from rest with constant acceleration of 5 m/s². What is its velocity after 10 seconds?',
        type: 'MCQ',
        marks: 4,
        examCode: 'jee_main',
        subjectCode: 'phy',
        topicCode: 'phy_mechanics',
        difficulty: 'Easy',
        options: [
            { id: 'A', text: '25 m/s' },
            { id: 'B', text: '50 m/s' },
            { id: 'C', text: '100 m/s' },
            { id: 'D', text: '150 m/s' }
        ],
        answer: {
            correctOption: 'B',
            explanation: 'Using the kinematic equation v = u + at where u = 0, a = 5 m/s², and t = 10s: v = 0 + 5 * 10 = 50 m/s.',
            solutionSteps: [
                'Identify given inputs: u = 0, a = 5, t = 10.',
                'Select correct kinematic equation: v = u + at.',
                'Substitute and solve: v = 50 m/s.'
            ]
        }
    },
    {
        questionNumber: 3,
        text: 'A ball is thrown vertically upward with initial velocity 20 m/s. What is the maximum height reached? (g = 10 m/s²)',
        type: 'MCQ',
        marks: 4,
        examCode: 'jee_main',
        subjectCode: 'phy',
        topicCode: 'phy_mechanics',
        difficulty: 'Medium',
        options: [
            { id: 'A', text: '10 m' },
            { id: 'B', text: '15 m' },
            { id: 'C', text: '20 m' },
            { id: 'D', text: '25 m' }
        ],
        answer: {
            correctOption: 'C',
            explanation: 'At maximum height, final velocity v = 0. Using v² = u² - 2gh: 0 = 20² - 2 * 10 * h => 20h = 400 => h = 20m.',
            solutionSteps: [
                'Set final velocity v = 0.',
                'Use equation: v² = u² - 2gh.',
                'Substitute u = 20 and g = 10 to solve for h.',
                'h = 400 / 20 = 20 meters.'
            ]
        }
    },
    // Chemistry - Chemical Bonding
    {
        questionNumber: 4,
        text: 'What is the chemical formula of table salt?',
        type: 'MCQ',
        marks: 4,
        examCode: 'jee_main',
        subjectCode: 'chm',
        topicCode: 'chm_bonding',
        difficulty: 'Easy',
        options: [
            { id: 'A', text: 'NaCl' },
            { id: 'B', text: 'KCl' },
            { id: 'C', text: 'CaCl₂' },
            { id: 'D', text: 'MgCl₂' }
        ],
        answer: {
            correctOption: 'A',
            explanation: 'Sodium Chloride (NaCl) is the chemical formula for common table salt, forming a crystalline ionic lattice.',
            solutionSteps: [
                'Identify common table salt component.',
                'It is composed of Sodium and Chlorine ions in 1:1 ratio.',
                'Formula: NaCl.'
            ]
        }
    },
    {
        questionNumber: 5,
        text: 'Valence bond theory explains molecular bonding through which mechanism?',
        type: 'MCQ',
        marks: 4,
        examCode: 'jee_main',
        subjectCode: 'chm',
        topicCode: 'chm_bonding',
        difficulty: 'Medium',
        options: [
            { id: 'A', text: 'Atomic orbital overlap' },
            { id: 'B', text: 'Complete electron transfer' },
            { id: 'C', text: 'Electrostatic force fields' },
            { id: 'D', text: 'Intermolecular hydrogen bonds' }
        ],
        answer: {
            correctOption: 'A',
            explanation: 'Valence Bond Theory asserts that covalent bonds form when atomic orbitals of adjacent atoms overlap, pairing valence electrons.',
            solutionSteps: [
                'Recall foundational tenets of Valence Bond Theory.',
                'Bonds form by overlapping orbitals.',
                'Therefore, Option A is correct.'
            ]
        }
    },
    // Biology - Cell Biology & Genetics
    {
        questionNumber: 6,
        text: 'Mitochondria is the powerhouse of the cell because?',
        type: 'MCQ',
        marks: 1,
        examCode: 'neet',
        subjectCode: 'bio',
        topicCode: 'bio_cell',
        difficulty: 'Easy',
        options: [
            { id: 'A', text: 'It produces ATP through cellular respiration' },
            { id: 'B', text: 'It stores DNA chromosomal structures' },
            { id: 'C', text: 'It synthesizes ribonuclear proteins' },
            { id: 'D', text: 'It regulates active cellular division' }
        ],
        answer: {
            correctOption: 'A',
            explanation: 'Mitochondria generates adenosine triphosphate (ATP), the chemical energy currency of the cell, making it the powerhouse.',
            solutionSteps: [
                'Understand mitochondrial functions.',
                'ATP generation is the primary task.',
                'Option A correctly explains this.'
            ]
        }
    },
    {
        questionNumber: 7,
        text: 'What is the basic functional and structural unit of all living organisms?',
        type: 'MCQ',
        marks: 1,
        examCode: 'neet',
        subjectCode: 'bio',
        topicCode: 'bio_cell',
        difficulty: 'Easy',
        options: [
            { id: 'A', text: 'Tissue' },
            { id: 'B', text: 'Organ' },
            { id: 'C', text: 'Cell' },
            { id: 'D', text: 'Atom' }
        ],
        answer: {
            correctOption: 'C',
            explanation: 'The cell is the basic structural, functional, and biological unit of all known living organisms.',
            solutionSteps: [
                'Recall levels of biological organization.',
                'The smallest structure performing all life processes is the cell.'
            ]
        }
    },
    // Mathematics
    {
        questionNumber: 8,
        text: 'What is the derivative of x³ with respect to x?',
        type: 'MCQ',
        marks: 4,
        examCode: 'jee_main',
        subjectCode: 'mat',
        topicCode: null, // General math question
        difficulty: 'Medium',
        options: [
            { id: 'A', text: '3x²' },
            { id: 'B', text: 'x³' },
            { id: 'C', text: '3x' },
            { id: 'D', text: 'x²' }
        ],
        answer: {
            correctOption: 'A',
            explanation: 'Using the power rule d/dx(x^n) = n * x^(n-1), the derivative of x³ is 3 * x^(3-1) = 3x².',
            solutionSteps: [
                'Recall the power rule for derivatives.',
                'Apply rule: drop power down, subtract 1 from power.',
                'd/dx(x³) = 3x².'
            ]
        }
    }
];

async function seedDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB database...');
        await connectDB();
        console.log('🔌 Connection confirmed.');

        console.log('🗑️ Clearing existing data across all collections...');
        await User.deleteMany({});
        await Subject.deleteMany({});
        await Exam.deleteMany({});
        await Topic.deleteMany({});
        await Question.deleteMany({});
        await StudentAttempt.deleteMany({});
        await StudentResult.deleteMany({});
        await ExamSchedule.deleteMany({});
        await Analytics.deleteMany({});
        await GeneratedQuestion.deleteMany({});
        console.log('🧹 Clearing completed.');

        // 1. Seed Users
        console.log('👤 Seeding accounts...');
        const seededUsers = [];
        for (const userData of SEED_USERS) {
            const user = new User(userData);
            await user.save();
            seededUsers.push(user);
        }
        console.log(`✓ ${seededUsers.length} standard accounts successfully seeded.`);
        seededUsers.forEach(u => {
            console.log(`  - [${u.role.toUpperCase()}] ${u.email} (password: password123)`);
        });

        // 2. Seed Subjects
        console.log('📚 Seeding subjects...');
        const seededSubjects = await Subject.insertMany(SEED_SUBJECTS);
        const subjectMap = {};
        seededSubjects.forEach(sub => {
            subjectMap[sub.code] = sub;
        });
        console.log(`✓ ${seededSubjects.length} subjects successfully seeded.`);

        // 3. Seed Exams
        console.log('📋 Seeding exams...');
        const examMap = {};
        for (const examData of SEED_EXAMS) {
            const exam = new Exam(examData);
            
            // Map subjects to this exam based on common definitions
            // For example: JEE has PHY, CHM, MAT
            const examSubjects = [];
            if (exam.code === 'jee_main') {
                examSubjects.push(
                    { subjectId: subjectMap['phy']._id, subjectName: 'Physics', questionCount: 25, marks: 100, weight: 33.33 },
                    { subjectId: subjectMap['chm']._id, subjectName: 'Chemistry', questionCount: 25, marks: 100, weight: 33.33 },
                    { subjectId: subjectMap['mat']._id, subjectName: 'Mathematics', questionCount: 25, marks: 100, weight: 33.33 }
                );
            } else if (exam.code === 'neet') {
                examSubjects.push(
                    { subjectId: subjectMap['phy']._id, subjectName: 'Physics', questionCount: 45, marks: 180, weight: 25 },
                    { subjectId: subjectMap['chm']._id, subjectName: 'Chemistry', questionCount: 45, marks: 180, weight: 25 },
                    { subjectId: subjectMap['bio']._id, subjectName: 'Biology', questionCount: 90, marks: 360, weight: 50 }
                );
            } else {
                examSubjects.push(
                    { subjectId: subjectMap['phy']._id, subjectName: 'Physics', questionCount: 20, marks: 25, weight: 25 },
                    { subjectId: subjectMap['chm']._id, subjectName: 'Chemistry', questionCount: 20, marks: 25, weight: 25 },
                    { subjectId: subjectMap['bio']._id, subjectName: 'Biology', questionCount: 20, marks: 25, weight: 25 }
                );
            }

            exam.subjects = examSubjects;
            
            // Set creator to the first seeded teacher or admin
            const teacher = seededUsers.find(u => u.role === 'teacher');
            if (teacher) {
                exam.createdBy = teacher._id;
            }

            await exam.save();
            examMap[exam.code] = exam;

            // Retroactively update Subject's applicableExams
            for (const es of examSubjects) {
                const subject = subjectMap[es.subjectId.toString() === subjectMap['phy']._id.toString() ? 'phy' : 
                                           es.subjectId.toString() === subjectMap['chm']._id.toString() ? 'chm' :
                                           es.subjectId.toString() === subjectMap['bio']._id.toString() ? 'bio' : 'mat'];
                if (subject) {
                    subject.applicableExams.push({
                        examId: exam._id,
                        examName: exam.name,
                        weight: es.weight
                    });
                    await subject.save();
                }
            }
        }
        console.log(`✓ ${Object.keys(examMap).length} exams successfully seeded.`);

        // 4. Seed Topics
        console.log('🔖 Seeding topics...');
        const topicMap = {};
        for (const topicData of SEED_TOPICS) {
            const subject = subjectMap[topicData.subjectCode];
            const topic = new Topic({
                name: topicData.name,
                code: topicData.code,
                description: topicData.description,
                subjectId: subject._id,
                subjectName: subject.name,
                resources: topicData.resources
            });
            await topic.save();
            topicMap[topic.code] = topic;

            // Push this topic ID into the Subject topics list
            subject.topics.push(topic._id);
            await subject.save();
        }
        console.log(`✓ ${Object.keys(topicMap).length} topics successfully seeded.`);

        // 5. Seed Questions
        console.log('❓ Seeding questions...');
        let questionsSeededCount = 0;
        for (const qData of SEED_QUESTIONS) {
            const exam = examMap[qData.examCode];
            const subject = subjectMap[qData.subjectCode];
            const topic = qData.topicCode ? topicMap[qData.topicCode] : null;

            const question = new Question({
                questionNumber: qData.questionNumber,
                text: qData.text,
                type: qData.type,
                marks: qData.marks,
                examId: exam._id.toString(), // Store Object ID string
                examName: exam.name,
                subjectId: subject._id.toString(),
                subjectName: subject.name,
                topicId: topic ? topic._id : null,
                topicName: topic ? topic.name : null,
                difficulty: qData.difficulty,
                options: qData.options,
                answer: qData.answer,
                createdBy: seededUsers.find(u => u.role === 'teacher')._id
            });

            await question.save();
            questionsSeededCount++;

            // Increment difficulty statistics on topic if topic exists
            if (topic) {
                const diffKey = qData.difficulty.toLowerCase();
                if (topic.questionsByDifficulty[diffKey] !== undefined) {
                    topic.questionsByDifficulty[diffKey]++;
                }
                topic.totalQuestions++;
                await topic.save();
            }
        }
        console.log(`✓ ${questionsSeededCount} sample questions successfully seeded.`);

        console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
        console.log('----------------------------------------------------');
        console.log(`✓ Users: ${seededUsers.length}`);
        console.log(`✓ Subjects: ${seededSubjects.length}`);
        console.log(`✓ Exams: ${Object.keys(examMap).length}`);
        console.log(`✓ Topics: ${Object.keys(topicMap).length}`);
        console.log(`✓ Questions: ${questionsSeededCount}`);
        console.log('----------------------------------------------------');
        console.log('✨ All systems are go. Database initialized for Qnario!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database seeding failed with fatal error:', error);
        process.exit(1);
    }
}

seedDatabase();
