const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const checkNoShowBookings = require('./jobs/bookingCleanup');

// --- 1. IMPORT REQUIRED MODULES ---
const http = require('http');
const { Server } = require("socket.io");
const path = require('path'); // <-- 1. ADD THIS LINE AT THE TOP

// Load env vars and connect to DB
dotenv.config();
connectDB();

const app = express();

// --- 2. CREATE HTTP SERVER & SOCKET.IO INSTANCE ---
// We create a standard HTTP server and pass our Express app to it.
const server = http.createServer(app); 

// We then create a new Socket.IO server and attach it to the HTTP server.
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Allow connection from your React app
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// --- 3. THIS IS THE CRITICAL FIX ---
// We attach the 'io' instance to the Express app object.
// Now, any route handler can access it via 'req.app.get('socketio')'.
app.set('socketio', io);

// --- 4. DEFINE WEBSOCKET CONNECTION LOGIC ---
io.on('connection', (socket) => {
    console.log(`A user connected with socket ID: ${socket.id}`);
    
    // This is the listener for when a user waits on the registration page.
    socket.on('join_user_room', (userId) => {
        socket.join(userId);
        console.log(`User with socket ID ${socket.id} joined room: ${userId}`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected with socket ID: ${socket.id}`);
    });
});

// Standard Middleware
app.use(express.json());
app.use(cors());

// Mount Routers (This must come AFTER the setup above)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// --- 2. ADD THIS ENTIRE BLOCK OF CODE ---
// This serves the built React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../bookingclient/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../bookingclient', 'build', 'index.html'));
    });
}

// Start the cron job
checkNoShowBookings();

const PORT = process.env.PORT || 5000;

// --- 5. START THE HTTP SERVER, NOT THE EXPRESS APP ---
// This ensures both Express and Socket.IO are running on the same port.
server.listen(PORT, () => console.log(`Server with WebSockets running on port ${PORT}`));