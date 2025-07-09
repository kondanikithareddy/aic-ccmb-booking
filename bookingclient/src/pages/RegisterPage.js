import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import WaitingForApproval from '../components/WaitingForApproval'; // <-- IMPORT THE NEW COMPONENT

const RegisterPage = () => {
    // State for all form fields
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        startupName: '',
        idCardNumber: '',
        idCardExpiry: ''
    });

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // --- KEY CHANGE: This state will now hold the response from the server ---
    const [registrationData, setRegistrationData] = useState(null);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Get the response data from the server, which includes the userId
            const { data } = await axios.post('/auth/register', formData);
            setRegistrationData(data); // Store the response
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- KEY CHANGE: Conditional Rendering Logic ---
    // If registrationData exists, it means registration was successful.
    // Render the WaitingForApproval component instead of the form.
    if (registrationData) {
        return <WaitingForApproval userId={registrationData.userId} userEmail={formData.email} />;
    }

    // The old `if (isRegistered)` block is now replaced by the logic above.
    
    // If registration has not happened yet, show the form.
    return (
        <div className="card">
            <h2>Register an Account</h2>
            <p>Your account will require admin approval before you can log in.</p>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <form onSubmit={handleSubmit}>
                <label>Full Name</label>
                <input type="text" name="name" placeholder="e.g., John Doe" onChange={handleInputChange} required />
                
                <label>Email Address</label>
                <input type="email" name="email" placeholder="e.g., john.doe@example.com" onChange={handleInputChange} required />
                
                <label>Password</label>
                <input type="password" name="password" placeholder="Choose a secure password" onChange={handleInputChange} required />
                
                <label>Startup Name (Optional)</label>
                <input type="text" name="startupName" placeholder="e.g., BioGen Innovations" onChange={handleInputChange} />
                
                <label>ID Card Number</label>
                <input type="text" name="idCardNumber" placeholder="Enter your ID number" onChange={handleInputChange} required />

                <label>ID Card Expiry Date</label>
                <input type="date" name="idCardExpiry" onChange={handleInputChange} required />

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Registering...' : 'Register'}
                </button>
            </form>
            
            <p style={{ marginTop: '15px' }}>
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
    );
};

export default RegisterPage;