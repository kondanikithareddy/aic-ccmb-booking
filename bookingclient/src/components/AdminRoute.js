import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    return user && user.role === 'admin' ? children : <Navigate to="/" />;
};

export default AdminRoute;