import React, { useState, useEffect, useMemo } from 'react';
import axios from '../api/axios';
import { format, formatDistanceStrict } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const AdminBookingLog = () => {
    // This state ALWAYS holds all bookings from the server.
    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State for the date filters
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const fetchAllBookings = async () => {
            try {
                const { data } = await axios.get('/bookings/all');
                setAllBookings(data);
            } catch (error) {
                console.error("Failed to fetch bookings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllBookings();
    }, []);

    // --- NEW: Filter the DISPLAYED data based on state ---
    // useMemo optimizes this so it only runs when the dates or the main booking list change.
    const filteredBookings = useMemo(() => {
        if (!startDate || !endDate) {
            return allBookings; // If no date range, show all
        }
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        const end = new Date(endDate).setHours(23, 59, 59, 999);

        return allBookings.filter(b => {
            const bookingDate = new Date(b.scheduled_start_time);
            return bookingDate >= start && bookingDate <= end;
        });
    }, [startDate, endDate, allBookings]);


    const calculateDuration = (start, end) => {
        if (!start || !end) return 'N/A';
        return formatDistanceStrict(new Date(end), new Date(start));
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const params = {};
            // Only add params if both dates are selected
            if (startDate && endDate) {
                params.startDate = startDate.toISOString();
                params.endDate = endDate.toISOString();
            }

            const response = await axios.get('/bookings/export', {
                params: params,
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Booking_Logs.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Could not export the data.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>All Bookings Log ({filteredBookings.length} found)</h3>
                <div className="export-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Export from:</span>
                    <DatePicker 
                        selected={startDate} 
                        onChange={(date) => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        placeholderText="Start Date"
                        isClearable
                    />
                    <span>to:</span>
                    <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        placeholderText="End Date"
                        isClearable
                    />
                    <button onClick={handleExport} disabled={exporting || (!startDate || !endDate)}>
                        {exporting ? 'Exporting...' : 'Export Selected Range'}
                    </button>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>User</th><th>Startup</th><th>Equipment</th><th>Start Time</th><th>End Time</th><th>Duration</th><th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="7">Loading...</td></tr>
                    ) : (
                        // --- The table now maps over the FILTERED list ---
                        filteredBookings.map(b => (
                            <tr key={b._id}>
                                <td>{b.user?.name || 'N/A'}</td>
                                <td>{b.user?.startupName || 'N/A'}</td>
                                <td>{b.equipment?.name || 'N/A'}</td>
                                <td>{b.actual_start_time ? format(new Date(b.actual_start_time), 'p, MM/dd/yyyy') : 'N/A'}</td>
                                <td>{b.actual_end_time ? format(new Date(b.actual_end_time), 'p, MM/dd/yyyy') : 'N/A'}</td>
                                <td>{b.status === 'Completed' ? calculateDuration(b.actual_start_time, b.actual_end_time) : 'N/A'}</td>
                                <td className={`status-${b.status}`}>{b.status}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AdminBookingLog;