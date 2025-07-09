import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';

const WaitingForApproval = ({ userId, userEmail }) => {
    // --- NEW STATE: Tracks the final outcome ---
    const [finalStatus, setFinalStatus] = useState(null); // Can be 'approved', 'rejected', or null

    useEffect(() => {
        const socket = io('http://localhost:5000');
        socket.emit('join_user_room', userId);

        // Listener 1: For Approvals
        socket.on('account_approved', () => {
            setFinalStatus('approved');
            socket.disconnect();
        });

        // --- NEW LISTENER: For Rejections ---
        socket.on('account_rejected', () => {
            setFinalStatus('rejected');
            socket.disconnect();
        });

        return () => {
            socket.disconnect();
        };
    }, [userId]);

    // --- NEW CONDITIONAL RENDERING ---

    // Case 1: Account was Approved
    if (finalStatus === 'approved') {
        return (
            <div className="card">
                <h2>Account Approved! ✅</h2>
                <p>Your account has just been activated by an administrator.</p>
                <p>You can now log in to the system.</p>
                <Link to="/login" style={{ display: 'inline-block', marginTop: '15px' }}>Proceed to Login</Link>
            </div>
        );
    }
    
    // Case 2: Account was Rejected
    if (finalStatus === 'rejected') {
        return (
            <div className="card">
                <h2>Registration Update ❌</h2>
                <p>After a review, your registration could not be approved at this time.</p>
                <p>An email with more information has been sent to <u>{userEmail}</u>. If you believe this is an error, please contact an administrator.</p>
                <Link to="/register" style={{ display: 'inline-block', marginTop: '15px' }}>Back to Registration</Link>
            </div>
        );
    }
    
    // Default Case: Still Waiting
    return (
        <div className="card">
            <h2>Waiting for Approval...</h2>
            <p>Your registration is complete. An administrator has been notified.</p>
            <p>
                You can keep this page open for a real-time status update, 
                or close this window. **An email will be sent to <u>{userEmail}</u> once a decision is made.**
            </p>
        </div>
    );
};

export default WaitingForApproval;