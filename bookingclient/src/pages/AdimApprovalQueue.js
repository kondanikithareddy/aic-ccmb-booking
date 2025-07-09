import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { format } from 'date-fns';

const AdminApprovalQueue = ({ onDecision }) => {
    const [pendingBookings, setPendingBookings] = useState([]);

    const fetchPendingBookings = async () => {
        try {
            const { data } = await axios.get('/bookings/all');
            setPendingBookings(data.filter(b => b.status === 'Pending'));
        } catch (error) {
            console.error("Failed to fetch pending bookings", error);
        }
    };

    useEffect(() => {
        fetchPendingBookings();
    }, []);

    const handleDecision = async (bookingId, action) => {
        if (window.confirm(`Are you sure you want to ${action} this booking?`)) {
            try {
                await axios.put(`/bookings/${bookingId}/${action.toLowerCase()}`);
                fetchPendingBookings(); // Refresh the list
                onDecision();
            } catch (error) {
                alert(`Failed to ${action} booking.`);
            }
        }
    };

    if (pendingBookings.length === 0) {
        return <div className="card"><p>No bookings are currently pending approval.</p></div>;
    }

    return (
        <div className="card">
            <h3>Bookings Pending Approval</h3>
            <table>
                <thead>
                    <tr><th>User</th><th>Equipment</th><th>From</th><th>To</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    {pendingBookings.map(b => (
                        <tr key={b._id}>
                            <td>{b.user?.name || 'N/A'}</td>
                            <td>{b.equipment?.name || 'N/A'}</td>
                            <td>{format(new Date(b.scheduled_start_time), 'Pp')}</td>
                            <td>{format(new Date(b.scheduled_end_time), 'Pp')}</td>
                            <td>
                                <button className="success" onClick={() => handleDecision(b._id, 'Approve')}>Approve</button>
                                <button className="danger" onClick={() => handleDecision(b._id, 'Reject')}>Reject</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminApprovalQueue;