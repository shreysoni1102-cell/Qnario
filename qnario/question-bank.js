// Question Bank - Built-in questions for all subjects and exam types

export const QUESTION_BANK = [
    // ===== PHYSICS =====
    {
        id: 'q1',
        examType: 'JEE',
        subject: 'Physics',
        type: 'MCQ',
        difficulty: 'Easy',
        text: 'What is the SI unit of velocity?',
        options: ['m/s', 'km/h', 'm/s²', 'N'],
        correctOption: 'A',
        answerText: 'm/s'
    },
    {
        id: 'q2',
        examType: 'JEE',
        subject: 'Physics',
        type: 'MCQ',
        difficulty: 'Medium',
        text: 'A body moves with constant acceleration. The distance traveled is: s = ut + (1/2)at². If u = 10 m/s, a = 2 m/s², t = 5s, what is the distance?',
        options: ['25 m', '50 m', '100 m', '150 m'],
        correctOption: 'C',
        answerText: '100 m'
    },
    {
        id: 'q3',
        examType: 'NEET',
        subject: 'Physics',
        type: 'MCQ',
        difficulty: 'Easy',
        text: 'Which of the following is a vector quantity?',
        options: ['Speed', 'Distance', 'Displacement', 'Time'],
        correctOption: 'C',
        answerText: 'Displacement'
    },
    {
        id: 'q4',
        examType: '12th',
        subject: 'Physics',
        type: 'MCQ',
        difficulty: 'Hard',
        text: 'A projectile is thrown at an angle of 45° with the horizontal. The horizontal range is R. What is the maximum height?',
        options: ['R/2', 'R/3', 'R/4', 'R'],
        correctOption: 'C',
        answerText: 'R/4'
    },

    // ===== CHEMISTRY =====
    {
        id: 'q5',
        examType: 'JEE',
        subject: 'Chemistry',
        type: 'MCQ',
        difficulty: 'Easy',
        text: 'What is the chemical symbol for Gold?',
        options: ['Go', 'Gd', 'Au', 'Ag'],
        correctOption: 'C',
        answerText: 'Au'
    },
    {
        id: 'q6',
        examType: 'NEET',
        subject: 'Chemistry',
        type: 'MCQ',
        difficulty: 'Medium',
        text: 'Balance the equation: Fe + O₂ → Fe₂O₃. The balanced form is:',
        options: ['Fe + O₂ → FeO', '2Fe + O₂ → Fe₂O₂', '4Fe + 3O₂ → 2Fe₂O₃', 'Fe + 3O₂ → Fe₃O₂'],
        correctOption: 'C',
        answerText: '4Fe + 3O₂ → 2Fe₂O₃'
    },
    {
        id: 'q7',
        examType: '12th',
        subject: 'Chemistry',
        type: 'MCQ',
        difficulty: 'Easy',
        text: 'What is the atomic number of Carbon?',
        options: ['4', '6', '8', '12'],
        correctOption: 'B',
        answerText: '6'
    },
    {
        id: 'q8',
        examType: 'JEE',
        subject: 'Chemistry',
        type: 'MCQ',
        difficulty: 'Hard',
        text: 'Which of the following has the highest electronegativity?',
        options: ['Chlorine', 'Fluorine', 'Nitrogen', 'Oxygen'],
        correctOption: 'B',
        answerText: 'Fluorine'
    },

    // ===== BIOLOGY =====
    {
        id: 'q9',
        examType: 'NEET',
        subject: 'Biology',
        type: 'MCQ',
        difficulty: 'Easy',
        text: 'Which organelle is responsible for photosynthesis?',
        options: ['Mitochondria', 'Chloroplast', 'Nucleus', 'Ribosome'],
        correctOption: 'B',
        answerText: 'Chloroplast'
    },
    {
        id: 'q10',
        examType: 'NEET',
        subject: 'Biology',
        type: 'MCQ',
        difficulty: 'Medium',
        text: 'How many bones are in the adult human body?',
        options: ['186', '206', '226', '246'],
        correctOption: 'B',
        answerText: '206'
    },
    {
        id: 'q11',
        examType: '12th',
        subject: 'Biology',
        type: 'MCQ',
        difficulty: 'Easy',
        text: 'Which blood type is the universal donor?',
        options: ['AB+', 'O+', 'B-', 'A+'],
        correctOption: 'B',
        answerText: 'O+'
    },
    {
        id: 'q12',
        examType: 'JEE',
        subject: 'Biology',
        type: 'MCQ',
        difficulty: 'Hard',
        text: 'What does DNA stand for?',
        options: ['Deoxyribose Nucleotide Array', 'Deoxynucleic Acid', 'Deoxyribonucleic Acid', 'Deoxynucleus Acid'],
        correctOption: 'C',
        answerText: 'Deoxyribonucleic Acid'
    },
    {
  id: 'q17',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Elemental analysis of earth crust and living organism reveals that living organism have',
  options: [
    'Higher abundance of C and H as compared to earth’s crust',
    'Lower abundance of C and H as compared to earth’s crust',
    'Equal amount of C and H as compared to earth’s crust',
    'None of these'
  ],
  correctOption: 'A',
  answerText: 'Higher abundance of C and H as compared to earth’s crust'
},
{
  id: 'q18',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'If a living tissue is grinded in trichloroacetic acid and filtered, the acid soluble portion will come in',
  options: ['Filtrate', 'Retentate', 'No acid soluble portion will be there', 'None of these'],
  correctOption: 'A',
  answerText: 'Filtrate'
},
{
  id: 'q19',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'After evaporation of all the water from living tissue we get the',
  options: ['Dry weight', 'Wet weight', 'Ash', 'None of these'],
  correctOption: 'A',
  answerText: 'Dry weight'
},
{
  id: 'q20',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Analysis of a compound gives an idea of the kind of',
  options: ['Organic constituents', 'Inorganic constituents', 'Both 1 and 2', 'None of these'],
  correctOption: 'C',
  answerText: 'Both organic and inorganic constituents'
},
{
  id: 'q21',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'From biological point of view compounds can be classified into',
  options: ['Amino acids', 'Nucleotide bases', 'Fatty acids', 'All of these'],
  correctOption: 'D',
  answerText: 'All of these'
},
{
  id: 'q22',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Amino acids are organic compounds containing amino and acidic group on same ______ carbon',
  options: ['Beta', 'Alpha', 'Gamma', 'None of these'],
  correctOption: 'B',
  answerText: 'Alpha carbon'
},
{
  id: 'q23',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'The chemical and physical properties of amino acids are due to',
  options: ['Amino group', 'Carboxyl group', 'R functional group', 'All of these'],
  correctOption: 'D',
  answerText: 'All of these'
},
{
  id: 'q24',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Which of the following are aromatic amino acids',
  options: ['All of these', 'a and b only', 'a, b, c', 'b and c only'],
  correctOption: 'C',
  answerText: 'Tryptophan, Tyrosine and Phenylalanine'
},
{
  id: 'q25',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Palmitic and arachidonic acid have how many carbons excluding carboxyl carbon',
  options: ['16,18', '16,20', '15,19', '15,20'],
  correctOption: 'C',
  answerText: '15 and 19'
},
{
  id: 'q26',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'In lipids glycerol and fatty acids are joined by',
  options: ['Esterification', 'Glycosidic linkage', 'Aldehyde', 'None of these'],
  correctOption: 'A',
  answerText: 'Esterification'
},
{
  id: 'q27',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Lipids having glycerol and fatty acids may be',
  options: ['Mono glycerides only', 'Diglyceride only', 'Tri glyceride only', 'All of these'],
  correctOption: 'D',
  answerText: 'All of these'
},
{
  id: 'q28',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Which of the following is a phospholipid',
  options: ['Gingely oil', 'Lecithin', 'Palmitic acid', 'Arachidonic acid'],
  correctOption: 'B',
  answerText: 'Lecithin'
},
{
  id: 'q29',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Which of the following is a phospholipid',
  options: ['Gingely oil', 'Lecithin', 'Palmitic acid', 'Arachidonic acid'],
  correctOption: 'B',
  answerText: 'Lecithin'
},
{
  id: 'q30',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Phosphate group is attached to nucleoside by',
  options: ['Phosphoester bond', 'Glycosidic bond', 'Ether bond', 'None of these'],
  correctOption: 'A',
  answerText: 'Phosphoester bond'
},
{
  id: 'q31',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Which of the following is not a nucleoside',
  options: ['Adenosine and guanosine', 'Thymidine and cytidine', 'Uridylic acid', 'All are nucleoside'],
  correctOption: 'C',
  answerText: 'Uridylic acid'
},
{
  id: 'q32',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'The acid soluble pool have molecular weight ranging from',
  options: ['18-8000 daltons', '18-800 daltons', '8-18000 daltons', 'None of these'],
  correctOption: 'B',
  answerText: '18-800 daltons'
},
{
  id: 'q33',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'When a tissue is grinded acid soluble fraction is roughly represented by',
  options: [
    'Vesicles in acid soluble fraction',
    'Vesicles in acid insoluble fraction',
    'Macromolecules in cytoplasm in acid insoluble fraction, lipid vesicles and organelles',
    'Cytoplasmic composition'
  ],
  correctOption: 'D',
  answerText: 'Cytoplasmic composition'
},
{
  id: 'q34',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Proteins are generally',
  options: ['Homo polymer', 'Heteropolymer', 'Monomer', 'None of these'],
  correctOption: 'B',
  answerText: 'Heteropolymer'
},
{
  id: 'q35',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Source of essential amino acids are',
  options: ['Synthesised in body', 'Diet', 'Both 1 and 2', 'None of these'],
  correctOption: 'B',
  answerText: 'Diet'
},
{
  id: 'q36',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Which of the following is the most abundant protein in whole biosphere',
  options: ['RubisCO', 'Collagen', 'Keratin', 'Myoglobin'],
  correctOption: 'A',
  answerText: 'RubisCO'
},
{
  id: 'q37',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Building blocks of polysaccharides is',
  options: ['Amino acids', 'Monosaccharides', 'Nucleotides', 'None of these'],
  correctOption: 'B',
  answerText: 'Monosaccharides'
},
{
  id: 'q38',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Which of the following is a store house of energy in plant tissues',
  options: ['Cellulose', 'Glucose', 'Starch', 'Chitin'],
  correctOption: 'C',
  answerText: 'Starch'
},
{
  id: 'q39',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'In a polysaccharide chain right and left end represents',
  options: [
    'Reducing ends',
    'Non reducing ends',
    'Reducing and non reducing ends',
    'Non reducing end and reducing end'
  ],
  correctOption: 'C',
  answerText: 'Reducing and non reducing ends'
},
{
  id: 'q40',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Cholesterol is synthesized from',
  options: ['Acetic acid', 'Lactic acid', 'Butyric acid', 'Malic acid'],
  correctOption: 'A',
  answerText: 'Acetic acid'
},
{
  id: 'q41',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'In our skeletal muscle during anaerobic condition glucose gets converted into',
  options: ['Lactic acid', 'Ethanol', 'Acetic acid', 'None of these'],
  correctOption: 'A',
  answerText: 'Lactic acid'
},
{
  id: 'q42',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Biological enzymes differ from inorganic catalyst as inorganic catalyst work efficiently at',
  options: [
    'High temperature',
    'High pressure',
    'Enzymes except isolated from thermophilic organism damage at high temperature',
    'All are true'
  ],
  correctOption: 'D',
  answerText: 'All are true'
},
{
  id: 'q43',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Concanavalin A is',
  options: ['A pigment', 'An alkaloid', 'An essential oil', 'A lectin'],
  correctOption: 'D',
  answerText: 'A lectin'
},
{
  id: 'q44',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Ramachandran plot is used to confirm the structure of',
  options: ['RNA', 'Proteins', 'Triacylglycerides', 'DNA'],
  correctOption: 'B',
  answerText: 'Proteins'
},
{
  id: 'q45',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'The two functional groups characteristic of sugars are',
  options: [
    'Hydroxyl and methyl',
    'Carbonyl and methyl',
    'Carbonyl and phosphate',
    'Carbonyl and hydroxyl'
  ],
  correctOption: 'D',
  answerText: 'Carbonyl and hydroxyl'
},
{
  id: 'q46',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Which of the following statement is correct with reference to enzymes',
  options: [
    'Holoenzyme = Apoenzyme + Coenzyme',
    'Coenzyme = Apoenzyme + Holoenzyme',
    'Holoenzyme = Coenzyme + Co-factor',
    'Apoenzyme = Holoenzyme + Coenzyme'
  ],
  correctOption: 'A',
  answerText: 'Holoenzyme = Apoenzyme + Coenzyme'
},
{
  id: 'q47',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'A non-proteinaceous enzyme is',
  options: ['Lysozyme', 'Ribozyme', 'Ligase', 'Deoxyribonuclease'],
  correctOption: 'B',
  answerText: 'Ribozyme'
},
{
  id: 'q48',
  examType: 'JEE',
  subject: 'Biology',
  type: 'MCQ',
  difficulty: 'Hard',
  text: 'Which one of the following statements is wrong',
  options: [
    'Uracil is a pyrimidine',
    'Glycine is a sulphur containing amino acid',
    'Sucrose is a disaccharide',
    'Cellulose is a polysaccharide'
  ],
  correctOption: 'B',
  answerText: 'Glycine is a sulphur containing amino acid'
}


    // ===== MATHEMATICS =====
    ,{
        id: 'q13',
        examType: 'JEE',
        subject: 'Maths',
        type: 'MCQ',
        difficulty: 'Easy',
        text: 'What is the value of 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctOption: 'B',
        answerText: '4'
    },
    {
        id: 'q14',
        examType: 'JEE',
        subject: 'Maths',
        type: 'MCQ',
        difficulty: 'Medium',
        text: 'Find the integral of ∫x² dx',
        options: ['x³/3 + C', 'x³ + C', '2x + C', 'x² + C'],
        correctOption: 'A',
        answerText: 'x³/3 + C'
    },
    {
        id: 'q15',
        examType: '12th',
        subject: 'Maths',
        type: 'MCQ',
        difficulty: 'Easy',
        text: 'What is the value of sin(90°)?',
        options: ['0', '1', '-1', '0.5'],
        correctOption: 'B',
        answerText: '1'
    },
    {
        id: 'q16',
        examType: '12th',
        subject: 'Maths',
        type: 'MCQ',
        difficulty: 'Hard',
        text: 'The sum of an infinite geometric series with first term a and common ratio r (|r| < 1) is:',
        options: ['a/(1-r)', 'a(1-r)', 'ar/(1-r)', 'a/(1+r)'],
        correctOption: 'A',
        answerText: 'a/(1-r)'
    },
    

    // ===== PRACTICE TEST QUESTIONS =====
    {
        id: 'p1',
        examType: 'Practice Test',
        subject: 'Physics',
        type: 'MCQ',
        difficulty: 'Easy',
        text: 'What is the speed of light?',
        options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'],
        correctOption: 'A',
        answerText: '300,000 km/s'
    },
    {
        id: 'p2',
        examType: 'Practice Test',
        subject: 'Chemistry',
        type: 'MCQ',
        difficulty: 'Medium',
        text: 'What is the pH of pure water at 25°C?',
        options: ['5', '6', '7', '8'],
        correctOption: 'C',
        answerText: '7'
    },
    {
        id: 'p3',
        examType: 'Practice Test',
        subject: 'Biology',
        type: 'MCQ',
        difficulty: 'Easy',
        text: 'How many chambers does the human heart have?',
        options: ['2', '3', '4', '5'],
        correctOption: 'C',
        answerText: '4'
    },
    {
        id: 'p4',
        examType: 'Practice Test',
        subject: 'Maths',
        type: 'MCQ',
        difficulty: 'Hard',
        text: 'What is the derivative of x³?',
        options: ['x²', '3x²', '3x³', 'x'],
        correctOption: 'B',
        answerText: '3x²'
    },
    {
        id: 'p5',
        examType: 'Practice Test',
        subject: 'Physics',
        type: 'MCQ',
        difficulty: 'Medium',
        text: 'Newton\'s second law states F = ma. What does a represent?',
        options: ['Amplitude', 'Acceleration', 'Area', 'Angle'],
        correctOption: 'B',
        answerText: 'Acceleration'
    },
    {
        id: 'p6',
        examType: 'Practice Test',
        subject: 'Chemistry',
        type: 'MCQ',
        difficulty: 'Easy',
        text: 'What is the molecular weight of H₂O?',
        options: ['16', '18', '20', '22'],
        correctOption: 'B',
        answerText: '18'
    },
    {
        id: 'p7',
        examType: 'Practice Test',
        subject: 'Biology',
        type: 'MCQ',
        difficulty: 'Medium',
        text: 'What is the process by which plants make food?',
        options: ['Respiration', 'Photosynthesis', 'Fermentation', 'Digestion'],
        correctOption: 'B',
        answerText: 'Photosynthesis'
    },
    {
        id: 'p8',
        examType: 'Practice Test',
        subject: 'Maths',
        type: 'MCQ',
        difficulty: 'Easy',
        text: 'What is the value of π (pi) approximately?',
        options: ['2.14', '3.14', '4.14', '5.14'],
        correctOption: 'B',
        answerText: '3.14'
    }
];
