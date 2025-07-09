import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from '../api/axios';
import AuthContext from '../context/AuthContext';
import { format } from 'date-fns';
import Select from 'react-select'; // <-- 1. IMPORT REACT-SELECT


const DashboardPage = () => {
    const { user } = useContext(AuthContext);
    const [equipment, setEquipment] = useState([]);
    const [bookings, setBookings] = useState([]);
    // --- THIS IS CORRECT ---
    const [bookingDetails, setBookingDetails] = useState({ equipmentId: '', start: '', end: '' });
    const [error, setError] = useState('');
    const [selectedEquipment, setSelectedEquipment] = useState(null);


    const fetchData = async () => {
        const { data: equipData } = await axios.get('/equipment');
        const { data: bookingData } = await axios.get('/bookings/mybookings');
        setEquipment(equipData);
        setBookings(bookingData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const categorizedEquipmentOptions = useMemo(() => {
        const categories = {
            1: { label: 'On-Demand', options: [] },
            2: { label: '2-Hour Prep', options: [] },
            3: { label: '24/7 Always-On', options: [] },
        };

        equipment
            .filter(e => e.operational_status === 'Available')
            .forEach(eq => {
                const option = { value: eq._id, label: eq.name, category: eq.category };
                if (categories[eq.category]) {
                    categories[eq.category].options.push(option);
                }
            });
        
        // Return an array of category groups that have at least one option
        return Object.values(categories).filter(group => group.options.length > 0);
    }, [equipment]); // This will only re-calculate when the equipment list changes.


    // --- THIS IS CORRECT ---
const handleEquipmentChange = (selectedOption) => {
        if (selectedOption) {
            const eqId = selectedOption.value;
            setBookingDetails({ ...bookingDetails, equipmentId: eqId });
            const eq = equipment.find(item => item._id === eqId);
            setSelectedEquipment(eq);
        } else {
            // Handle case where user clears the selection
            setBookingDetails({ ...bookingDetails, equipmentId: '' });
            setSelectedEquipment(null);
        }
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post('/bookings', {
                equipmentId: bookingDetails.equipmentId,
                scheduled_start_time: bookingDetails.start,
                scheduled_end_time: bookingDetails.end
            });
            setBookingDetails({ equipmentId: '', start: '', end: '' });
            setSelectedEquipment(null);
            fetchData();
        } catch (err) {
            // --- THIS IS THE KEY CHANGE: Detailed error handling ---
            const resError = err.response?.data;

            if (resError && resError.errorCode === 'PREP_TIME_REQUIRED') {
                const details = resError.details;
                const earliestTime = format(new Date(details.earliestStartTime), 'p'); // "5:55 PM"

                if (details.reason === 'First booking') {
                    setError(`This is the first booking of the day. The equipment needs a 2-hour prep time, so the earliest you can book is ${earliestTime}.`);
                } else {
                    const prevEndTime = format(new Date(details.previousBookingEndTime), 'p'); // "3:55 PM"
                    setError(`The previous session ends at ${prevEndTime}. Since the equipment has been idle for over 40 minutes, it needs a 2-hour prep time. The earliest you can book this slot is ${earliestTime}.`);
                }
            } else if (resError && resError.conflict) {
                // This is our existing conflict handling
                const conflictStart = format(new Date(resError.conflict.start), 'p');
                const conflictEnd = format(new Date(resError.conflict.end), 'p');
                setError(`${resError.message} It is booked from ${conflictStart} to ${conflictEnd}.`);
            } else {
                // Fallback for all other generic errors
                setError(resError?.message || 'An unexpected error occurred. Please try again.');
            }
        }
    };

    // --- THIS IS CORRECT ---
    const handleAction = async (bookingId, action) => {
        if (window.confirm(`Are you sure you want to ${action} this booking?`)) {
            try {
                await axios.put(`/bookings/${bookingId}/${action}`, {});
                fetchData();
            } catch (err) {
                console.error(`Failed to ${action} booking.`, err);
                setError(err.response?.data?.message || `Could not ${action} the booking.`);
            }
        }
    };

    // const activeBookings = bookings.filter(b => b.status === 'Active');
    // const upcomingBookings = bookings.filter(b => b.status === 'Booked');
    // const pastBookings = bookings.filter(b => b.status === 'Completed' || b.status === 'Cancelled');

    const pendingBookings = bookings.filter(b => b.status === 'Pending');
    const upcomingBookings = bookings.filter(b => b.status === 'Approved'); // <-- Was 'Booked'
    const activeBookings = bookings.filter(b => b.status === 'Active');
    const pastBookings = bookings.filter(b => ['Completed', 'Cancelled', 'Rejected'].includes(b.status));

    const nowForDisabling = new Date(); // Renamed to avoid confusion with the other 'now'
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const minDateTime = now.toISOString().slice(0, 16);

    // --- THIS IS CORRECT ---
    const BookingRuleMessage = ({ equipment }) => {
        if (!equipment) return null;
        let message = '';
        switch (equipment.category) {
            case 1: message = 'On-demand use. Please book for your estimated usage time.'; break;
            case 2: message = 'Requires 2-hour prep time if idle. Book accordingly.'; break;
            case 3: message = 'Always on. Please reserve your time slot.'; break;
            default: return null;
        }
        return <p style={{ color: '#0056b3', fontStyle: 'italic', marginTop: '5px' }}>{message}</p>;
    };


    return (
        <div>
            <h2>Welcome, {user.name}!</h2>
            <div className="card">
                <h3>Book New Equipment</h3>
                {error && <p style={{ color: 'red' }}>{error}</p>}

                <form onSubmit={handleBooking}>
                    {/* --- FIX 1 & 2 ARE HERE --- */}
                    <Select
                        options={categorizedEquipmentOptions}
                        onChange={handleEquipmentChange}
                        // Find the currently selected option object to display
                        value={
                            categorizedEquipmentOptions
                                .flatMap(group => group.options)
                                .find(option => option.value === bookingDetails.equipmentId) || null
                        }
                        placeholder="Type to search for equipment..."
                        isClearable
                        required
                    />

                    <BookingRuleMessage equipment={selectedEquipment} />
                    <p> Select Start Time </p>
                    <input
                        type="datetime-local"
                        value={bookingDetails.start}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, start: e.target.value })}
                        min={minDateTime}
                        required
                    />
                    <p> Select End Time </p>
                    <input
                        type="datetime-local"
                        value={bookingDetails.end}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, end: e.target.value })}
                        min={minDateTime}
                        required
                    />
                    <button type="submit">Book Now</button>
                </form>
            </div>


            {activeBookings.length > 0 && <div className="card">
                <h3>Active Booking</h3>
                {activeBookings.map(b => (
                    <div key={b._id}>
                        <p><strong>{b.equipment?.name || 'N/A'}</strong> started at {b.actual_start_time ? format(new Date(b.actual_start_time), 'Pp') : ''}</p>
                        <button className="danger" onClick={() => handleAction(b._id, 'end')}>End Session</button>
                    </div>
                ))}
            </div>}

            {pendingBookings.length > 0 && <div className="card">
                <h3>Pending Approval</h3>
                <table>
                    <thead><tr><th>Equipment</th><th>Scheduled Time</th><th>Status</th></tr></thead>
                    <tbody>
                        {pendingBookings.map(b => (
                            <tr key={b._id}>
                                <td>{b.equipment?.name || 'N/A'}</td>
                                <td>{format(new Date(b.scheduled_start_time), 'Pp')}</td>
                                <td><span className="status-Pending">Pending</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>}

            <div className="card">
                <h3>Upcoming Bookings</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Equipment</th>
                            <th>Scheduled Start</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {upcomingBookings.map(b => {
                            const scheduledStart = new Date(b.scheduled_start_time);
                            const gracePeriodEnd = new Date(scheduledStart.getTime() + 15 * 60000);
                            const isTooEarly = nowForDisabling < scheduledStart;
                            const isTooLate = nowForDisabling > gracePeriodEnd;

                            return (
                                <tr key={b._id}>
                                    <td>{b.equipment?.name || 'N/A'}</td>
                                    <td>{format(scheduledStart, 'Pp')}</td>
                                    <td>
                                        <button
                                            className="success"
                                            onClick={() => handleAction(b._id, 'start')}
                                            disabled={isTooEarly || isTooLate}
                                            title={isTooEarly ? 'Session cannot be started yet.' : isTooLate ? 'Grace period to start has passed.' : 'Start Session'}
                                        >
                                            Start
                                        </button>
                                        <button
                                            className="danger"
                                            onClick={() => handleAction(b._id, 'cancel')}
                                        >
                                            Cancel
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="card">
                <h3>Past Bookings</h3>
                <table>
                    <thead><tr><th>Equipment</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
                    <tbody>
                        {pastBookings.map(b => (
                            <tr key={b._id}>
                                <td>{b.equipment?.name || 'N/A'}</td>
                                <td>{b.actual_start_time ? format(new Date(b.actual_start_time), 'Pp') : 'N/A'}</td>
                                <td>{b.actual_end_time ? format(new Date(b.actual_end_time), 'Pp') : 'N/A'}</td>
                                <td className={`status-${b.status}`}>{b.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>

    );
};

export default DashboardPage;