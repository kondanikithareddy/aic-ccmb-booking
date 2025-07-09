import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import AdminBookingLog from './AdminLogPage';
import AdminUserManagement from './AdminUserManagement';
import AdminApprovalQueue from './AdimApprovalQueue'; // Corrected typo from your code
import AdminDataManagement from './AdminDataManagement';
import './AdminDashboard.css';

const AdminDashboardPage = () => {
    // Component State
    const [equipment, setEquipment] = useState([]);
    const [form, setForm] = useState({ id: null, name: '', category: 1, operational_status: 'Available' });
    const [activeTab, setActiveTab] = useState('approval');
    
    // Notification Count State
    const [pendingBookingCount, setPendingBookingCount] = useState(0);
    const [pendingUserCount, setPendingUserCount] = useState(0); // <-- NEW STATE FOR USER APPROVALS
    
    // Equipment Management State
    const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);

    // --- Data Fetching Functions ---
    const fetchEquipment = async () => {
        try {
            const { data: equipData } = await axios.get('/equipment');
            setEquipment(equipData);
        } catch (error) {
            console.error("Could not fetch equipment", error);
        }
    };

    const fetchAllCounts = async () => {
        try {
            // Fetch booking data for booking count
            const { data: bookingData } = await axios.get('/bookings/all');
            const bookingCount = bookingData.filter(b => b.status === 'Pending').length;
            setPendingBookingCount(bookingCount);

            // --- NEW: Fetch user data for user count ---
            const { data: userData } = await axios.get('/users');
            const userCount = userData.filter(u => u.account_status === 'pending').length;
            setPendingUserCount(userCount);

        } catch (error) {
            console.error("Could not fetch pending counts", error);
        }
    };

    // --- useEffect Hooks ---
    useEffect(() => {
        // Fetch all counts when the component first loads
        fetchAllCounts();
    }, []);

    useEffect(() => {
        // Fetch equipment list only when that specific tab is active
        if (activeTab === 'equipment') {
            fetchEquipment();
        }
    }, [activeTab]);

    // --- Event Handlers ---
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (form.id) {
            await axios.put(`/equipment/${form.id}`, { name: form.name, category: form.category, operational_status: form.operational_status });
        } else {
            await axios.post('/equipment', { name: form.name, category: form.category, operational_status: form.operational_status });
        }
        setForm({ id: null, name: '', category: 1, operational_status: 'Available' });
        fetchEquipment();
    };

    const handleEdit = (item) => {
        setForm({ id: item._id, name: item.name, category: item.category, operational_status: item.operational_status });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this equipment?')) {
            await axios.delete(`/equipment/${id}`);
            fetchEquipment();
        }
    };

    // --- NEW HANDLERS for checkboxes ---
    const handleSelectOne = (id) => {
        setSelectedEquipmentIds(prevSelected =>
            prevSelected.includes(id)
                ? prevSelected.filter(selectedId => selectedId !== id)
                : [...prevSelected, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedEquipmentIds(equipment.map(item => item._id));
        } else {
            setSelectedEquipmentIds([]);
        }
    };
    
    // --- NEW HANDLERS for bulk delete actions ---
    const handleDeleteSelected = async () => {
        if (selectedEquipmentIds.length === 0) {
            alert('Please select at least one equipment item to delete.');
            return;
        }
        if (window.confirm(`Are you sure you want to delete ${selectedEquipmentIds.length} selected equipment items?`)) {
            try {
                await axios.post('/equipment/bulk-delete', { ids: selectedEquipmentIds });
                fetchEquipment();
                setSelectedEquipmentIds([]);
            } catch (error) {
                alert('Failed to delete selected items.');
            }
        }
    };

    const handleDeleteAll = async () => {
        if (window.confirm('ARE YOU SURE you want to delete ALL equipment items? This action cannot be undone.')) {
            const allIds = equipment.map(item => item._id);
            try {
                await axios.post('/equipment/bulk-delete', { ids: allIds });
                fetchEquipment();
                setSelectedEquipmentIds([]);
            } catch (error) {
                alert('Failed to delete all items.');
            }
        }
    };

    // This single function can be passed to any child component to trigger a refresh
    const refreshData = () => {
        fetchAllCounts();
        if (activeTab === 'equipment') {
            fetchEquipment();
        }
    };

    return (
        <div>
            <h2>Admin Dashboard</h2>
            <div className="admin-tabs">
                <button className={activeTab === 'approval' ? 'active' : ''} onClick={() => setActiveTab('approval')}>
                    Approval Queue
                    {pendingBookingCount > 0 && <span className="notification-badge">{pendingBookingCount}</span>}
                </button>
                <button className={activeTab === 'equipment' ? 'active' : ''} onClick={() => setActiveTab('equipment')}>
                    Equipment Management
                </button>
                <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>
                    Booking Logs
                </button>
                {/* --- UPDATED: User Management tab with badge --- */}
                <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
                    User Management
                    {pendingUserCount > 0 && <span className="notification-badge">{pendingUserCount}</span>}
                </button>
                <button className={activeTab === 'data' ? 'active' : ''} onClick={() => setActiveTab('data')}>
                    Data Management
                </button>
            </div>

            {/* --- Pass the refreshData function to children that perform actions --- */}
            {activeTab === 'approval' && <AdminApprovalQueue onDecision={refreshData} />}
            
            {activeTab === 'equipment' && (
                <div>
                    <div className="card">
                        <h3>{form.id ? 'Edit Equipment' : 'Add New Equipment'}</h3>
                        <form onSubmit={handleFormSubmit}>
                            <input type="text" placeholder="Equipment Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                <option value={1}>On-Demand</option>
                                <option value={2}>2-Hour Prep</option>
                                <option value={3}>24/7 Always-On</option>
                            </select>
                            <select value={form.operational_status} onChange={e => setForm({ ...form, operational_status: e.target.value })}>
                                <option value="Available">Available</option>
                                <option value="Under Maintenance">Under Maintenance</option>
                            </select>
                            <button type="submit">{form.id ? 'Update' : 'Add'}</button>
                            {form.id && <button type="button" onClick={() => setForm({ id: null, name: '', category: 1, operational_status: 'Available' })}>Cancel Edit</button>}
                        </form>
                    </div>
                    <div className="card">
                        <h3>All Equipment</h3>
                        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                            <button className="danger" onClick={handleDeleteSelected} disabled={selectedEquipmentIds.length === 0}>
                                Delete Selected ({selectedEquipmentIds.length})
                            </button>
                            <button className="danger" onClick={handleDeleteAll} disabled={equipment.length === 0}>
                                Delete All
                            </button>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={equipment.length > 0 && selectedEquipmentIds.length === equipment.length}
                                        />
                                    </th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipment.map(item => (
                                    <tr key={item._id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedEquipmentIds.includes(item._id)}
                                                onChange={() => handleSelectOne(item._id)}
                                            />
                                        </td>
                                        <td>{item.name}</td>
                                        <td>{item.category === 1 ? 'On-Demand' : item.category === 2 ? '2-Hour Prep' : '24/7'}</td>
                                        <td className={`status-${item.operational_status.replace(' ', '-')}`}>{item.operational_status}</td>
                                        <td>
                                            <button onClick={() => handleEdit(item)}>Edit</button>
                                            <button className="danger" onClick={() => handleDelete(item._id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'logs' && <AdminBookingLog />}
            
            {/* --- UPDATED: Pass refreshData to AdminUserManagement --- */}
            {activeTab === 'users' && <AdminUserManagement onAction={refreshData} />}

            {activeTab === 'data' && <AdminDataManagement onImportSuccess={refreshData} />}
        </div>
    );
};

export default AdminDashboardPage;