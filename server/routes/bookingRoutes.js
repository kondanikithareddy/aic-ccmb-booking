
const express = require('express');
const router = express.Router();

const {
    createBooking,
    getMyBookings,
    getAllBookings,
    startBooking,
    endBooking,
    cancelBooking,
    approveBooking,
    rejectBooking,
    exportBookings, // Uncomment if you want to use this route
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/authMiddleware');

// This line handles the POST request to create a booking.
// This is the route that is currently failing with a 404.
router.route('/').post(protect, createBooking);

// These are other routes for different actions.
router.route('/mybookings').get(protect, getMyBookings);
router.route('/all').get(protect, admin, getAllBookings);
router.route('/:id/start').put(protect, startBooking);
router.route('/:id/end').put(protect, endBooking);
router.route('/:id/cancel').put(protect, cancelBooking);
router.route('/:id/approve').put(protect, admin, approveBooking);
router.route('/:id/reject').put(protect, admin, rejectBooking);
router.route('/export').get(protect, admin, exportBookings);


module.exports = router;