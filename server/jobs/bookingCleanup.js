const cron = require('node-cron');
const Booking = require('../models/bookingModel');
const { subMinutes } = require('date-fns'); // A helpful date library

const checkNoShowBookings = () => {
    // This cron job will run every minute ('* * * * *')
    cron.schedule('* * * * *', async () => {
        console.log('Running a check for no-show bookings...');
        try {
            // The time 15 minutes ago
            const fifteenMinutesAgo = subMinutes(new Date(), 15);

            // Find bookings that are still 'Booked' AND their start time was more than 15 minutes ago.
            const noShowBookings = await Booking.find({
                status: 'Booked',
                scheduled_start_time: { $lt: fifteenMinutesAgo }
            });

            if (noShowBookings.length > 0) {
                console.log(`Found ${noShowBookings.length} no-show bookings to cancel.`);
                
                // Get the IDs of all bookings to be cancelled
                const idsToCancel = noShowBookings.map(booking => booking._id);

                // Update all of them at once for efficiency
                await Booking.updateMany(
                    { _id: { $in: idsToCancel } },
                    { $set: { status: 'Cancelled' } }
                );

                console.log('Successfully cancelled no-show bookings.');
            }

        } catch (error) {
            console.error('Error during no-show booking cleanup:', error);
        }
    });
};

module.exports = checkNoShowBookings;