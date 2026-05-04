const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Import models
const Subject = require('./models/Subject');
const Exam = require('./models/Exam');
const Topic = require('./models/Topic');
const Question = require('./models/Question');
const StudentAttempt = require('./models/StudentAttempt');
const StudentResult = require('./models/StudentResult');
const ExamSchedule = require('./models/ExamSchedule');
const Analytics = require('./models/Analytics');

// Sample data to seed
const SUBJECTS = [
    { name: 'Physics', code: 'PHY', applicableExams: [{ examName: 'JEE Main', weight: 25 }, { examName: 'NEET', weight: 25 }] },
    { name: 'Chemistry', code: 'CHM', applicableExams: [{ examName: 'JEE Main', weight: 25 }, { examName: 'NEET', weight: 25 }] },
    { name: 'Biology', code: 'BIO', applicableExams: [{ examName: 'NEET', weight: 50 }] },
    { name: 'Mathematics', code: 'MAT', applicableExams: [{ examName: 'JEE Main', weight: 50 }] },
    { name: 'English', code: 'ENG', applicableExams: [{ examName: '12th Board', weight: 20 }] },
    { name: 'History', code: 'HIS', applicableExams: [{ examName: '12th Board', weight: 15 }] }
];

const EXAMS = [
    {
        name: 'JEE Main',
        code: 'JEE_MAIN',
        examDetails: {
            totalDuration: 180,
            totalMarks: 300,
            negativeMarking: true,
            negativeMarkPercentage: 0.25
        },
        subjects: ['Physics', 'Chemistry', 'Mathematics']
    },
    {
        name: 'NEET',
        code: 'NEET',
        examDetails: {
            totalDuration: 180,
            totalMarks: 720,
            negativeMarking: true,
            negativeMarkPercentage: 0.33
        },
        subjects: ['Physics', 'Chemistry', 'Biology']
    },
    {
        name: '12th Board',
        code: 'BOARD_12',
        examDetails: {
            totalDuration: 180,
            totalMarks: 500,
            negativeMarking: false,
            negativeMarkPercentage: 0
        },
        subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'History']
    }
];

const TOPICS = [
    { name: 'Mechanics', code: 'MECH', subjectName: 'Physics' },
    { name: 'Thermodynamics', code: 'THERM', subjectName: 'Physics' },
    { name: 'Bonding', code: 'BOND', subjectName: 'Chemistry' },
    { name: 'Organic Chemistry', code: 'ORG', subjectName: 'Chemistry' },
    { name: 'Cell Biology', code: 'CELL', subjectName: 'Biology' },
    { name: 'Genetics', code: 'GEN', subjectName: 'Biology' }
];

const SAMPLE_QUESTIONS = [
    {
        text: 'What is Newtons second law of motion?',
        type: 'MCQ',
        marks: 4,
        examName: 'JEE Main',
        subjectName: 'Physics',
        topicName: 'Mechanics',
        difficulty: 'Easy',
        options: ['F = ma', 'F = m/a', 'F = a/m', 'F = m + a'],
        answer: { correctOption: 'F = ma', explanation: 'Newton\'s 2nd law states F = ma' },
        totalAttempts: 0,
        correctAttempts: 0
    },
    {
        text: 'Valence bond theory explains molecular bonding through?',
        type: 'MCQ',
        marks: 4,
        examName: 'JEE Main',
        subjectName: 'Chemistry',
        topicName: 'Bonding',
        difficulty: 'Medium',
        options: ['Orbital overlap', 'Electron transfer', 'Ionic interaction', 'Hydrogen bonding'],
        answer: { correctOption: 'Orbital overlap', explanation: 'VBT explains bonding by orbital overlap' },
        totalAttempts: 0,
        correctAttempts: 0
    },
    {
        text: 'Mitochondria is the powerhouse of the cell because?',
        type: 'MCQ',
        marks: 1,
        examName: 'NEET',
        subjectName: 'Biology',
        topicName: 'Cell Biology',
        difficulty: 'Easy',
        options: ['It produces ATP', 'It stores DNA', 'It synthesizes proteins', 'It controls growth'],
        answer: { correctOption: 'It produces ATP', explanation: 'Mitochondria produces ATP through cellular respiration' },
        totalAttempts: 0,
        correctAttempts: 0
    },
    {
        text: 'What is the derivative of x^3?',
        type: 'MCQ',
        marks: 4,
        examName: 'JEE Main',
        subjectName: 'Mathematics',
        topicName: 'Calculus',
        difficulty: 'Hard',
        options: ['3x^2', 'x^3', '3x', 'x^2'],
        answer: { correctOption: '3x^2', explanation: 'd/dx(x^3) = 3x^2' },
        totalAttempts: 0,
        correctAttempts: 0
    },
    {
        text: 'Photosynthesis occurs in which part of the plant?',
        type: 'MCQ',
        marks: 1,
        examName: 'NEET',
        subjectName: 'Biology',
        topicName: 'Cell Biology',
        difficulty: 'Easy',
        options: ['Leaves', 'Roots', 'Stem', 'Flowers'],
        answer: { correctOption: 'Leaves', explanation: 'Photosynthesis primarily occurs in plant leaves' },
        totalAttempts: 0,
        correctAttempts: 0
    },
    {
        text: 'The rate constant k depends on?',
        type: 'MCQ',
        marks: 4,
        examName: 'NEET',
        subjectName: 'Chemistry',
        topicName: 'Kinetics',
        difficulty: 'Medium',
        options: ['Temperature', 'Concentration', 'Volume', 'Pressure'],
        answer: { correctOption: 'Temperature', explanation: 'Rate constant k varies with temperature following Arrhenius equation' },
        totalAttempts: 0,
        correctAttempts: 0
    }
];

async function seedDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        
        // Give connection more time
        setTimeout(async () => {
            await connectDB();
            console.log('✅ MongoDB connected');
        }, 2000);

        // Wait a bit for connection
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('🗑️  Clearing existing data...');
        try {
            await Subject.deleteMany({});
            await Exam.deleteMany({});
            await Topic.deleteMany({});
            await Question.deleteMany({});
            console.log('✅ Cleared existing data');
        } catch (err) {
            console.log('⚠️  Could not clear data - proceeding anyway');
        }

        // Insert subjects
        console.log('📚 Seeding subjects...');
        const subjectsInserted = await Subject.insertMany(SUBJECTS);
        console.log(`✅ ${subjectsInserted.length} subjects added`);

        // Insert exams
        console.log('📋 Seeding exams...');
        const examsInserted = await Exam.insertMany(EXAMS);
        console.log(`✅ ${examsInserted.length} exams added`);

        // Insert topics
        console.log('🔖 Seeding topics...');
        const topicsInserted = await Topic.insertMany(TOPICS);
        console.log(`✅ ${topicsInserted.length} topics added`);

        // Insert sample questions
        console.log('❓ Seeding questions...');
        const questionsInserted = await Question.insertMany(SAMPLE_QUESTIONS);
        console.log(`✅ ${questionsInserted.length} sample questions added`);

        console.log('\n🎉 DATABASE SEEDED SUCCESSFULLY!');
        console.log('\n📊 Summary:');
        console.log(`   • Subjects: ${subjectsInserted.length}`);
        console.log(`   • Exams: ${examsInserted.length}`);
        console.log(`   • Topics: ${topicsInserted.length}`);
        console.log(`   • Questions: ${questionsInserted.length}`);
        console.log('\n✨ Your database is ready to use!');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
