import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Pages Import
import Landing from './pages/Landing';
import RoleSelection from './pages/RoleSelection';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import StudentDashboard from './pages/StudentDashboard';
import StudentPractice from './pages/StudentPractice';
import ExamRoom from './pages/ExamRoom';
import TeacherDashboard from './pages/TeacherDashboard';
import SyllabusUpload from './pages/SyllabusUpload';
import PaperPreview from './pages/PaperPreview';
import LiveMonitor from './pages/LiveMonitor';
import AdminDashboard from './pages/AdminDashboard';

// Route guards to protect secure screens
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="main-wrapper">
                <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>Verifying session cookies...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

const AppContent = () => {
    return (
        <Router>
            <Routes>
                {/* Public Gateways */}
                <Route path="/" element={<Landing />} />
                <Route path="/role-selection" element={<RoleSelection />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Secure Student portals */}
                <Route 
                    path="/student/dashboard" 
                    element={
                        <ProtectedRoute allowedRoles={['student']}>
                            <StudentDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/student/practice" 
                    element={
                        <ProtectedRoute allowedRoles={['student']}>
                            <StudentPractice />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/student/exam/:code" 
                    element={
                        <ProtectedRoute allowedRoles={['student']}>
                            <ExamRoom />
                        </ProtectedRoute>
                    } 
                />

                {/* Secure Teacher workspaces */}
                <Route 
                    path="/teacher/dashboard" 
                    element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                            <TeacherDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/teacher/syllabus/upload" 
                    element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                            <SyllabusUpload />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/teacher/paper/:id" 
                    element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                            <PaperPreview />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/teacher/monitor/:code" 
                    element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                            <LiveMonitor />
                        </ProtectedRoute>
                    } 
                />

                {/* Secure Admin portals */}
                <Route 
                    path="/admin/dashboard" 
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } 
                />

                {/* Redirection fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <SocketProvider>
                <AppContent />
            </SocketProvider>
        </AuthProvider>
    );
};

export default App;
