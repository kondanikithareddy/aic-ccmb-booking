import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import Header from './pages/Header';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import RegisterPage from './pages/RegisterPage';
// import CheckStatusPage from './pages/CheckStatusPage'; // <-- IMPORT

function App() {
    return (
        <AuthProvider>
            <Router>
                <Header />
                <div className="container">
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        {/* <Route path="/status" element={<CheckStatusPage />} /> */}

                        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;