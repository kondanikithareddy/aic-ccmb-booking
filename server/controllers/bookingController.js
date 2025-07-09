const Booking = require('../models/bookingModel');
const Equipment = require('../models/equipmentModel');
const xlsx = require('xlsx'); // Make sure this is imported
const { subDays, startOfMonth, startOfYear } = require('date-fns'); // Import helpers
const { format, formatDistanceStrict } = require('date-fns'); // Import format if needed


const createBooking = async (req, res) => {
    const { equipmentId, scheduled_start_time, scheduled_end_time } = req.body;

    // --- 1. Basic Validations (Confirmed Working) ---
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found.' });
    if (equipment.operational_status === 'Under Maintenance') return res.status(400).json({ message: 'This equipment is under maintenance.' });

    const newStartTime = new Date(scheduled_start_time);
    const newEndTime = new Date(scheduled_end_time);

    if (isNaN(newStartTime.getTime()) || isNaN(newEndTime.getTime())) {
        return res.status(400).json({ message: 'Invalid date format provided.' });
    }
    if (newEndTime <= newStartTime) {
        return res.status(400).json({ message: 'Validation Error: The booking end time must be after the start time.' });
    }
    if (newStartTime < new Date()) {
        return res.status(400).json({ message: 'Booking time cannot be in the past.' });
    }

    // --- 2. Conflict Check (Confirmed Working) ---
    const conflictingBooking = await Booking.findOne({
        equipment: equipmentId,
        status: { $in: ['Booked', 'Active'] },
        scheduled_start_time: { $lt: newEndTime },
        scheduled_end_time: { $gt: newStartTime }
    });

    if (conflictingBooking) {
        return res.status(400).json({
            message: 'Time slot conflict. The equipment has another booking during this time.',
            conflict: { start: conflictingBooking.scheduled_start_time, end: conflictingBooking.scheduled_end_time }
        });
    }

    // --- 3. THE FINAL CORRECTED CATEGORY 2 LOGIC ---
    if (equipment.category === 2) {
    const latestPreviousBooking = await Booking.findOne({
        // ... (query is the same)
    }).sort({ scheduled_end_time: -1 });

    if (!latestPreviousBooking) {
        // First booking logic (this part is fine, but we can improve the message)
        const twoHoursFromNow = new Date(new Date().getTime() + 120 * 60000);
        if (newStartTime < twoHoursFromNow) {
            return res.status(400).json({ 
                message: `This is the first booking of the day and requires a 2-hour prep time.`,
                // Adding context for the frontend
                errorCode: 'PREP_TIME_REQUIRED',
                details: {
                    reason: 'First booking',
                    earliestStartTime: twoHoursFromNow
                }
            });
        }
    } else {
        const idleTimeMinutes = (newStartTime - latestPreviousBooking.scheduled_end_time) / (1000 * 60);

        if (idleTimeMinutes > 40) {
            const requiredStartTime = new Date(latestPreviousBooking.scheduled_end_time.getTime() + 120 * 60 * 1000);

            if (newStartTime < requiredStartTime) {
                // --- THIS IS THE KEY CHANGE: A more detailed JSON response ---
                return res.status(400).json({
                    message: `Prep time is required due to a long idle period.`,
                    // Adding an error code and details for the frontend to easily parse
                    errorCode: 'PREP_TIME_REQUIRED',
                    details: {
                        reason: 'Idle time exceeded 40 minutes.',
                        previousBookingEndTime: latestPreviousBooking.scheduled_end_time,
                        idleTime: Math.round(idleTimeMinutes), // Send the calculated idle time
                        earliestStartTime: requiredStartTime
                    }
                });
            }
        }
    }
}

    // --- 4. Create the booking if all checks pass ---
    const booking = new Booking({
        user: req.user._id,
        equipment: equipmentId,
        scheduled_start_time: newStartTime,
        scheduled_end_time: newEndTime,
    });
    const createdBooking = await booking.save();
    res.status(201).json(createdBooking);
};

// Get bookings for logged in user
const getMyBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate('equipment', 'name category')
        .sort({ scheduled_start_time: 1 });
    res.json(bookings);
};

const getAllBookings = async (req, res) => {
    const bookings = await Booking.find({})
        .populate('user', 'name startupName')
        .populate('equipment', 'name')
        .sort({ scheduled_start_time: -1 });
    res.json(bookings);
};


// Start a booking
const startBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
        booking.status = 'Active';
        booking.actual_start_time = new Date();
        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } else {
        res.status(404).json({ message: 'Booking not found' });
    }
};

// End a booking
const endBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
        booking.status = 'Completed';
        booking.actual_end_time = new Date();
        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } else {
        res.status(404).json({ message: 'Booking not found' });
    }
};

//Cancel a booking
const cancelBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (booking && booking.user.toString() === req.user._id.toString()) {
        // User can cancel a booking if it's Pending or Approved
        if (booking.status === 'Pending' || booking.status === 'Approved') {
            booking.status = 'Cancelled';
            await booking.save();
            res.json({ message: 'Booking cancelled' });
        } else {
            res.status(400).json({ message: 'Cannot cancel an active or completed booking.' });
        }
    } else {
        res.status(404).json({ message: 'Booking not found or not authorized' });
    }
};

// Get bookings by equipment ID
const getBookingsByEquipment = async (req, res) => {
    try {
        const bookings = await Booking.find({
            equipment: req.params.equipmentId,
            status: { $in: ['Booked', 'Active'] } // Only show active and upcoming
        });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Approve a booking (for admin use)
const approveBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (booking && booking.status === 'Pending') {
        booking.status = 'Approved';
        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } else {
        res.status(404).json({ message: 'Booking not found or cannot be approved' });
    }
};

// Reject a booking (for admin use)
const rejectBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (booking && booking.status === 'Pending') {
        booking.status = 'Rejected';
        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } else {
        res.status(404).json({ message: 'Booking not found or cannot be rejected' });
    }
};



// --- THIS IS THE MISSING FUNCTION ---
const exportBookings = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        // --- THIS IS THE KEY LOGIC ---
        // If a start and end date are provided in the query, build a filter.
        if (startDate && endDate) {
            query.scheduled_start_time = {
                $gte: new Date(startDate), // Greater than or equal to the start of the start day
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) // Less than or equal to the end of the end day
            };
        }

        // Use the query object to filter the database results. If no dates, it will be empty and find all.
        const bookings = await Booking.find(query)
            .populate('user', 'name startupName')
            .populate('equipment', 'name')
            .sort({ scheduled_start_time: -1 })
            .lean(); // .lean() is a performance optimization

        // Map the filtered data to the desired Excel columns
        const dataForSheet = bookings.map(b => {
            const duration = (b.actual_start_time && b.actual_end_time)
                ? formatDistanceStrict(new Date(b.actual_end_time), new Date(b.actual_start_time))
                : 'N/A';
            
            return {
                'User': b.user?.name || 'N/A',
                'Startup': b.user?.startupName || 'N/A',
                'Equipment': b.equipment?.name || 'N/A',
                // Use actual_start_time if available, otherwise fall back to scheduled
                'Start Time': b.actual_start_time ? format(new Date(b.actual_start_time), 'yyyy-MM-dd p') : 'N/A',
                'End Time': b.actual_end_time ? format(new Date(b.actual_end_time), 'yyyy-MM-dd p') : 'N/A',
                'Duration': duration,
                'Status': b.status
            };
        });
        
        const worksheet = xlsx.utils.json_to_sheet(dataForSheet);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Booking Logs');

        const filename = (startDate && endDate) 
            ? `Booking_Logs_Filtered.xlsx`
            : `Booking_Logs_All.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);

    } catch (error) {
        console.error("Booking export error:", error);
        res.status(500).json({ message: 'Failed to export booking data.' });
    }
};

module.exports = { createBooking, getMyBookings, getAllBookings, startBooking, endBooking, cancelBooking, getBookingsByEquipment, approveBooking, rejectBooking, exportBookings };