const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    scheduled_start_time: { type: Date, required: true },
    scheduled_end_time: { type: Date, required: true },
    actual_start_time: { type: Date },
    actual_end_time: { type: Date },
    // status: { type: String, enum: ['Booked', 'Active', 'Completed', 'Cancelled'], default: 'Booked' },
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Active', 'Completed', 'Cancelled', 'Rejected'], 
        default: 'Pending' // New bookings are now Pending by default
    },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);