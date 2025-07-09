import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Header = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="header">
            <Link to={user ? (user.role === 'admin' ? '/admin' : '/') : '/login'}><h1>AIC-CCMB Equipment Booking</h1></Link>
            <nav>
                {user ? (
                    <>
                        <span>Hello, {user.name}</span>
                        {user.role === 'admin' && <Link to="/admin">Admin</Link>}
                        <Link to="/">Dashboard</Link>
                        <button onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <Link to="/login">Login</Link>
                )}
            </nav>
        </header>
    );
};

export default Header;