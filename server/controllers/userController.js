
const User = require('../models/userModel');
// --- KEY CHANGE: Import both email helpers ---
const { sendApprovalEmail, sendRejectionEmail } = require('../utils/emailHelper');

// Get all users (for the admin panel)
const getAllUsers = async (req, res) => {
    const users = await User.find({}).select('-password');
    res.json(users);
};

// Update a user's role
const updateUserRole = async (req, res) => {
    const { role } = req.body;
    if (req.user.id === req.params.id) {
        return res.status(400).json({ message: "You cannot change your own role." });
    }
    const user = await User.findById(req.params.id);
    if (user) {
        user.role = role;
        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// Soft-delete a user
const deleteUser = async (req, res) => {
    if (req.user.id === req.params.id) {
        return res.status(400).json({ message: "You cannot delete your own account." });
    }
    const user = await User.findById(req.params.id);
    if (user) {
        user.is_deleted = true;
        await user.save();
        res.json({ message: 'User has been deleted.' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// Approve a user
const approveUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user && user.account_status === 'pending') {
        user.account_status = 'active';
        await user.save();
        
        const io = req.app.get('socketio');
        io.to(user._id.toString()).emit('account_approved');
        
        await sendApprovalEmail(user.email, user.name);
        
        res.json({ message: 'User has been approved and notified via email.' });
    } else {
        res.status(404).json({ message: 'User not found or cannot be approved.' });
    }
};

// --- NEW FUNCTION: Reject a user ---
const rejectUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user && user.account_status === 'pending') {
        user.is_deleted = true;
        user.account_status = 'rejected';
        await user.save();
        
        // --- KEY WEBSOCKET CHANGE ---
        // Get the io instance from the app
        const io = req.app.get('socketio');
        // Emit an 'account_rejected' event to the user's specific room
        io.to(user._id.toString()).emit('account_rejected');
        
        // Also send the email notification
        await sendRejectionEmail(user.email, user.name);

        res.json({ message: 'User has been rejected and removed.' });
    } else {
        res.status(404).json({ message: 'User not found or cannot be rejected.' });
    }
};

// --- KEY CHANGE: Add rejectUser to the exports ---
module.exports = { getAllUsers, updateUserRole, deleteUser, approveUser, rejectUser };