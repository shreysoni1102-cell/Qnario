/**
 * SEED DATA - Initial Data Structure
 * This file contains the format for adding data to your database
 */

// =====================================================
// 1. SUBJECTS - Create these first
// =====================================================
const SUBJECTS = [
    {
        name: 'Physics',
        code: 'physics',
        description: 'Study of matter, energy, and forces',
        applicableExams: [
            { examId: 'jee_main', examName: 'JEE Main', weight: 33.33 },
            { examId: 'jee_advanced', examName: 'JEE Advanced', weight: 33.33 },
            { examId: 'neet', examName: 'NEET', weight: 33.33 }
        ]
    },
    {
        name: 'Chemistry',
        code: 'chemistry',
        description: 'Study of atoms, molecules, and reactions',
        applicableExams: [
            { examId: 'jee_main', examName: 'JEE Main', weight: 33.33 },
            { examId: 'jee_advanced', examName: 'JEE Advanced', weight: 33.33 },
            { examId: 'neet', examName: 'NEET', weight: 33.33 }
        ]
    },
    {
        name: 'Biology',
        code: 'biology',
        description: 'Study of living organisms',
        applicableExams: [
            { examId: 'neet', examName: 'NEET', weight: 50 }
        ]
    },
    {
        name: 'Mathematics',
        code: 'mathematics',
        description: 'Study of numbers and quantitative reasoning',
        applicableExams: [
            { examId: 'jee_main', examName: 'JEE Main', weight: 33.33 },
            { examId: 'jee_advanced', examName: 'JEE Advanced', weight: 33.33 },
            { examId: '12th_board', examName: '12th Board', weight: 100 }
        ]
    },
    {
        name: 'English',
        code: 'english',
        description: 'Language and literature studies',
        applicableExams: [
            { examId: '12th_board', examName: '12th Board', weight: 20 }
        ]
    },
    {
        name: 'History',
        code: 'history',
        description: 'Study of past events and civilizations',
        applicableExams: [
            { examId: '12th_board', examName: '12th Board', weight: 20 }
        ]
    }
];

// =====================================================
// 2. EXAMS - Create these after subjects
// =====================================================
const EXAMS = [
    {
        name: 'JEE Main',
        code: 'jee_main',
        description: 'Joint Entrance Examination (Main)',
        examDetails: {
            totalDuration: 180, // 3 hours
            totalQuestions: 75,
            totalMarks: 300,
            negativeMarking: true,
            negativeMarkPercentage: 0.25, // 1/4 of marks
            passingPercentage: 40,
            sectionWise: [
                { sectionName: 'Physics', duration: 60, questions: 25, marks: 100 },
                { sectionName: 'Chemistry', duration: 60, questions: 25, marks: 100 },
                { sectionName: 'Mathematics', duration: 60, questions: 25, marks: 100 }
            ]
        },
        subjects: [
            { subjectId: 'physics_id', subjectName: 'Physics', questionCount: 25, marks: 100, weight: 33.33 },
            { subjectId: 'chemistry_id', subjectName: 'Chemistry', questionCount: 25, marks: 100, weight: 33.33 },
            { subjectId: 'mathematics_id', subjectName: 'Mathematics', questionCount: 25, marks: 100, weight: 33.33 }
        ]
    },
    {
        name: 'NEET',
        code: 'neet',
        description: 'National Eligibility cum Entrance Test',
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
        },
        subjects: [
            { subjectId: 'physics_id', subjectName: 'Physics', questionCount: 45, marks: 180, weight: 25 },
            { subjectId: 'chemistry_id', subjectName: 'Chemistry', questionCount: 45, marks: 180, weight: 25 },
            { subjectId: 'biology_id', subjectName: 'Biology', questionCount: 90, marks: 360, weight: 50 }
        ]
    },
    {
        name: '12th Board',
        code: '12th_board',
        description: '12th Grade Board Examination',
        examDetails: {
            totalDuration: 180,
            totalQuestions: 80,
            totalMarks: 100,
            negativeMarking: false,
            passingPercentage: 35
        }
    }
];

// =====================================================
// 3. TOPICS - Create these after subjects
// =====================================================
const TOPICS = [
    // Physics Topics
    {
        name: 'Mechanics',
        code: 'physics_mechanics',
        subjectId: 'physics_id',
        subjectName: 'Physics',
        description: 'Study of motion and forces',
        resources: [
            { type: 'notes', title: 'Newton\'s Laws', url: 'http://...' },
            { type: 'video', title: 'Introduction to Mechanics', url: 'http://...', duration: 1200 }
        ]
    },
    {
        name: 'Thermodynamics',
        code: 'physics_thermodynamics',
        subjectId: 'physics_id',
        subjectName: 'Physics',
        description: 'Study of heat and energy'
    },
    // Chemistry Topics
    {
        name: 'Chemical Bonding',
        code: 'chemistry_bonding',
        subjectId: 'chemistry_id',
        subjectName: 'Chemistry',
        description: 'Study of bonds between atoms'
    },
    {
        name: 'Organic Chemistry',
        code: 'chemistry_organic',
        subjectId: 'chemistry_id',
        subjectName: 'Chemistry',
        description: 'Study of carbon compounds'
    },
    // Biology Topics
    {
        name: 'Cell Biology',
        code: 'biology_cells',
        subjectId: 'biology_id',
        subjectName: 'Biology',
        description: 'Study of cells and cell structures'
    },
    {
        name: 'Genetics',
        code: 'biology_genetics',
        subjectId: 'biology_id',
        subjectName: 'Biology',
        description: 'Study of heredity and genes'
    }
];

// =====================================================
// 4. QUESTIONS - Create after all above
// =====================================================
const SAMPLE_QUESTIONS = [
    // Easy Physics Questions - JEE
    {
        questionNumber: 1,
        text: 'What is the SI unit of force?',
        type: 'MCQ',
        marks: 4,
        examName: 'JEE Main',
        examId: 'jee_main',
        subjectName: 'Physics',
        subjectId: 'physics_id',
        topicName: 'Mechanics',
        topicId: 'mechanics_id',
        difficulty: 'Easy',
        options: [
            { id: 'A', text: 'Kilogram' },
            { id: 'B', text: 'Newton' },
            { id: 'C', text: 'Joule' },
            { id: 'D', text: 'Watt' }
        ],
        answer: {
            correctOption: 'B',
            explanation: 'Newton (N) is the SI unit of force. 1 Newton = 1 kg·m/s²',
            solutionSteps: [
                'Recall SI units of physical quantities',
                'Force is measured in Newtons',
                'Other options: Kg (mass), Joule (energy), Watt (power)'
            ]
        }
    },
    {
        questionNumber: 2,
        text: 'A car accelerates from rest with constant acceleration of 5 m/s². What is its velocity after 10 seconds?',
        type: 'MCQ',
        marks: 4,
        examName: 'JEE Main',
        examId: 'jee_main',
        subjectName: 'Physics',
        subjectId: 'physics_id',
        topicName: 'Mechanics',
        topicId: 'mechanics_id',
        difficulty: 'Easy',
        options: [
            { id: 'A', text: '25 m/s' },
            { id: 'B', text: '50 m/s' },
            { id: 'C', text: '100 m/s' },
            { id: 'D', text: '150 m/s' }
        ],
        answer: {
            correctOption: 'B',
            explanation: 'Using v = u + at where u = 0, a = 5 m/s², t = 10s\nv = 0 + 5×10 = 50 m/s',
            solutionSteps: [
                'Initial velocity u = 0 (starts from rest)',
                'Acceleration a = 5 m/s²',
                'Time t = 10 seconds',
                'Use equation v = u + at',
                'v = 0 + 5×10 = 50 m/s'
            ]
        }
    },
    // Easy Chemistry Questions - JEE
    {
        questionNumber: 3,
        text: 'What is the chemical formula of table salt?',
        type: 'MCQ',
        marks: 4,
        examName: 'JEE Main',
        examId: 'jee_main',
        subjectName: 'Chemistry',
        subjectId: 'chemistry_id',
        topicName: 'Chemical Bonding',
        topicId: 'bonding_id',
        difficulty: 'Easy',
        options: [
            { id: 'A', text: 'NaCl' },
            { id: 'B', text: 'KCl' },
            { id: 'C', text: 'CaCl₂' },
            { id: 'D', text: 'MgCl₂' }
        ],
        answer: {
            correctOption: 'A',
            explanation: 'Sodium Chloride (NaCl) is the chemical name for table salt. It is an ionic compound formed between sodium (Na) and chlorine (Cl).',
            solutionSteps: [
                'Table salt is sodium chloride',
                'Formula: NaCl',
                'It is a 1:1 ionic compound'
            ]
        }
    },
    // Medium Physics - JEE
    {
        questionNumber: 4,
        text: 'A ball is thrown vertically upward with initial velocity 20 m/s. What is the maximum height reached? (g = 10 m/s²)',
        type: 'MCQ',
        marks: 4,
        examName: 'JEE Main',
        examId: 'jee_main',
        subjectName: 'Physics',
        subjectId: 'physics_id',
        topicName: 'Mechanics',
        topicId: 'mechanics_id',
        difficulty: 'Medium',
        options: [
            { id: 'A', text: '10 m' },
            { id: 'B', text: '15 m' },
            { id: 'C', text: '20 m' },
            { id: 'D', text: '25 m' }
        ],
        answer: {
            correctOption: 'C',
            explanation: 'At maximum height, v = 0\nUsing v² = u² - 2gh\n0 = 400 - 2(10)h\nh = 20 m',
            solutionSteps: [
                'At maximum height, final velocity v = 0',
                'Initial velocity u = 20 m/s',
                'Use equation: v² = u² - 2gh',
                '0² = 20² - 2×10×h',
                '0 = 400 - 20h',
                'h = 20 m'
            ]
        }
    },
    // Easy Chemistry - NEET
    {
        questionNumber: 5,
        text: 'Which of the following is a noble gas?',
        type: 'MCQ',
        marks: 1,
        examName: 'NEET',
        examId: 'neet',
        subjectName: 'Chemistry',
        subjectId: 'chemistry_id',
        topicName: 'Chemical Bonding',
        topicId: 'bonding_id',
        difficulty: 'Easy',
        options: [
            { id: 'A', text: 'Oxygen' },
            { id: 'B', text: 'Nitrogen' },
            { id: 'C', text: 'Neon' },
            { id: 'D', text: 'Chlorine' }
        ],
        answer: {
            correctOption: 'C',
            explanation: 'Neon (Ne) is a noble gas with atomic number 10. Noble gases are chemically inert and have complete valence shells.'
        }
    },
    // Easy Biology - NEET
    {
        questionNumber: 6,
        text: 'What is the basic unit of life?',
        type: 'MCQ',
        marks: 1,
        examName: 'NEET',
        examId: 'neet',
        subjectName: 'Biology',
        subjectId: 'biology_id',
        topicName: 'Cell Biology',
        topicId: 'cells_id',
        difficulty: 'Easy',
        options: [
            { id: 'A', text: 'Tissue' },
            { id: 'B', text: 'Organ' },
            { id: 'C', text: 'Cell' },
            { id: 'D', text: 'Atom' }
        ],
        answer: {
            correctOption: 'C',
            explanation: 'Cell is the basic structural and functional unit of life. All living organisms are made up of cells.'
        }
    }
];

// =====================================================
// 5. DATA INSERTION SCRIPT
// =====================================================
async function seedDatabase() {
    const Subject = require('../models/Subject');
    const Exam = require('../models/Exam');
    const Topic = require('../models/Topic');
    const Question = require('../models/Question');

    try {
        // 1. Insert Subjects
        console.log('Inserting subjects...');
        const subjects = await Subject.insertMany(SUBJECTS);
        const subjectMap = {};
        subjects.forEach(s => { subjectMap[s.code] = s._id; });

        // 2. Insert Exams
        console.log('Inserting exams...');
        const exams = await Exam.insertMany(EXAMS);

        // 3. Insert Topics
        console.log('Inserting topics...');
        const topicsData = TOPICS.map(t => ({
            ...t,
            subjectId: subjectMap[t.code.split('_')[0] + '_topics'.replace('_topics', '')]
        }));
        const topics = await Topic.insertMany(topicsData);
        const topicMap = {};
        topics.forEach(t => { topicMap[t.code] = t._id; });

        // 4. Insert Questions
        console.log('Inserting questions...');
        const questionsData = SAMPLE_QUESTIONS.map(q => ({
            ...q,
            subjectId: subjectMap[q.subjectId.replace('_id', '')],
            topicId: topicMap[q.topicId.replace('_id', '')],
            examId: exams.find(e => e.code === q.examId.replace('_id', ''))._id
        }));
        await Question.insertMany(questionsData);

        console.log('✅ Database seeding completed successfully!');
        console.log(`✓ ${subjects.length} subjects inserted`);
        console.log(`✓ ${exams.length} exams inserted`);
        console.log(`✓ ${topics.length} topics inserted`);
        console.log(`✓ ${questionsData.length} questions inserted`);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
}

module.exports = {
    SUBJECTS,
    EXAMS,
    TOPICS,
    SAMPLE_QUESTIONS,
    seedDatabase
};

// To run: 
// const { seedDatabase } = require('./seed-data');
// seedDatabase();
