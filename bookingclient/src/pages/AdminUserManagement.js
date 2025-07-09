
import React, { useState, useEffect, useContext } from 'react';
import axios from '../api/axios';
import AuthContext from '../context/AuthContext';
import { format } from 'date-fns';

const AdminUserManagement = ({ onAction }) => {
    const [users, setUsers] = useState([]);
    const { user: loggedInUser } = useContext(AuthContext);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get('/users');
            // Filter out soft-deleted users from the view
            setUsers(data.filter(u => !u.is_deleted));
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApprove = async (userId) => {
        if (window.confirm('Are you sure you want to approve this user?')) {
            try {
                await axios.put(`/users/${userId}/approve`);
                fetchUsers();
                onAction();
            } catch (error) {
                alert('Failed to approve user.');
            }
        }
    };

    // --- NEW FUNCTION to handle rejection ---
    const handleReject = async (userId) => {
        if (window.confirm('Are you sure you want to REJECT and REMOVE this user registration?')) {
            try {
                await axios.put(`/users/${userId}/reject`);
                fetchUsers();
                onAction();
            } catch (error) {
                alert('Failed to reject user.');
            }
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        const userToUpdate = users.find(u => u._id === userId);
        if (window.confirm(`Are you sure you want to change ${userToUpdate.name}'s role to "${newRole}"?`)) {
            try {
                await axios.put(`/users/${userId}/role`, { role: newRole });
                fetchUsers();
            } catch (error) {
                alert(error.response?.data?.message || "Failed to update role.");
            }
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (window.confirm(`Are you sure you want to delete the user "${userName}"?`)) {
            try {
                await axios.delete(`/users/${userId}`);
                fetchUsers();
            } catch (error) {
                alert(error.response?.data?.message || "Failed to delete user.");
            }
        }
    };

    return (
        <div className="card" style={{ padding: '20px' }}>
            <h3>User Management</h3>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Startup</th>
                        <th>ID Card Number</th>
                        <th>ID Card Expiry</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user._id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.startupName || 'N/A'}</td>
                            <td>{user.idCardNumber}</td>
                            <td>{user.idCardExpiry ? format(new Date(user.idCardExpiry), 'MM/dd/yyyy') : 'N/A'}</td>
                            <td>{user.role}</td>
                            <td>
                                <span className={`status-${user.account_status}`}>{user.account_status}</span>
                            </td>
                            <td>
                                {loggedInUser._id !== user._id ? (
                                    <>
                                        {user.account_status === 'pending' ? (
                                            // --- KEY CHANGE: Add Reject button ---
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button className="success" onClick={() => handleApprove(user._id)}>Approve</button>
                                                <button className="danger" onClick={() => handleReject(user._id)}>Reject</button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                >
                                                    <option value="user">user</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                                <button
                                                    className="danger"
                                                    onClick={() => handleDeleteUser(user._id, user.name)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <span>(Your Account)</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminUserManagement;