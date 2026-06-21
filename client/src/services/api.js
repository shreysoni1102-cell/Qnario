import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    withCredentials: true
});

// Pass token dynamically if available in storage
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const authAPI = {
    sendSignupOTP: (name, email, password, role) => API.post('/api/auth/send-signup-otp', { name, email, password, role }),
    login: (email, password) => API.post('/api/auth/login', { email, password }),
    signup: (name, email, password, role, otp) => API.post('/api/auth/signup', { name, email, password, role, otp }),
    logout: () => API.post('/api/auth/logout'),
    getProfile: () => API.get('/api/auth/profile'),
    forgotPassword: (email) => API.post('/api/auth/forgot-password', { email }),
    resetPassword: (token, newPassword) => API.post('/api/auth/reset-password', { token, newPassword }),
    adminLogin: (email, password) => API.post('/api/auth/admin-login', { email, password }),
    getAllUsers: () => API.get('/api/auth/admin/all-users'),
    deleteUser: (id) => API.delete(`/api/auth/admin/user/${id}`)
};

export const examAPI = {
    getExams: () => API.get('/api/exams'),
    getExamById: (id) => API.get(`/api/exams/${id}`),
    getExamSubjects: (id) => API.get(`/api/exams/${id}/subjects`),
    getQuestions: (params) => API.get('/api/questions', { params }),
    getQuestionById: (id) => API.get(`/api/questions/${id}`),
    getQuestionPreview: (id) => API.get(`/api/questions/${id}/preview`),
    submitAttempt: (payload) => API.post('/api/attempts/submit', payload),
    getStudentAttempts: (studentId, examId) => API.get(`/api/attempts/student/${studentId}`, { params: { examId } }),
    generateResult: (payload) => API.post('/api/results/generate', payload),
    getResultById: (id) => API.get(`/api/results/${id}`),
    getStudentResults: (studentId) => API.get(`/api/results/student/${studentId}`),
    getPracticeTest: (params) => API.get('/api/practice-test', { params }),
    getStudentDashboard: (studentId) => API.get(`/api/dashboard/student/${studentId}`),
    deleteResult: (id) => API.delete(`/api/results/${id}`)
};

export const syllabusAPI = {
    uploadSyllabus: (formData) => API.post('/api/syllabus/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    listSyllabi: (teacherEmail) => API.get('/api/syllabus/list', { params: { teacherEmail } }),
    getSyllabusById: (id) => API.get(`/api/syllabus/${id}`),
    generatePaper: (id, payload) => API.post(`/api/syllabus/${id}/generate`, payload),
    listPapers: (teacherEmail) => API.get('/api/syllabus-papers', { params: { teacherEmail } }),
    getPaperById: (id) => API.get(`/api/syllabus-papers/${id}`),
    updateQuestion: (paperId, qNo, payload) => API.patch(`/api/syllabus-papers/${paperId}/question/${qNo}`, payload),
    deletePaper: (id) => API.delete(`/api/syllabus-papers/${id}`)
};

export const examRoomAPI = {
    createRoom: (payload) => API.post('/api/exam-room/create', payload),
    getRoomInfo: (code) => API.get(`/api/exam-room/${code}`),
    getRoomPaper: (code) => API.get(`/api/exam-room/${code}/paper`),
    submitRoomAnswers: (code, payload) => API.post(`/api/exam-room/${code}/submit`, payload),
    submitPractice: (payload) => API.post('/api/practice/submit', payload),
    getTeacherReports: (teacherEmail) => API.get('/api/exam-room/teacher/reports', { params: { teacherEmail } }),
    deleteRoomReport: (code) => API.delete(`/api/exam-room/${code}`)
};

export const codingAPI = {
    getCodingPractice: (params) => API.get('/api/coding-practice', { params }),
    submitCodingAnswers: (payload) => API.post('/api/coding-practice/submit', payload),
};

export default API;
