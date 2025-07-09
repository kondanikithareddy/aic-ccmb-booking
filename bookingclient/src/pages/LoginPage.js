
import React, { useState, useContext, useEffect } from 'react'; // <-- Import useEffect
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();

    // --- THIS IS THE FIX ---
    // This logic now runs as a side-effect, AFTER the component renders.
    // It depends on 'user' and 'navigate', so it will re-run if they change.
    useEffect(() => {
        if (user) {
            navigate(user.role === 'admin' ? '/admin' : '/');
        }
    }, [user, navigate]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            // The useEffect above will handle the navigation automatically now.
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="card">
            <h2>Login</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Login</button>
            </form>
            <p style={{marginTop: '15px'}}>
                                Don't have an account? <Link to="/register">Register here</Link>
                            </p>
        </div>
    );
};

export default LoginPage;


