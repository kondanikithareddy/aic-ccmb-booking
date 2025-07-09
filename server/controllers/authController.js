const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
// --- Make sure to import the helper at the top ---
const { sendNewUserAdminNotification } = require('../utils/emailHelper');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
    const { name, email, password, startupName, idCardNumber, idCardExpiry } = req.body;
    try {
        if (!name || !email || !password || !idCardNumber || !idCardExpiry) {
            return res.status(400).json({ message: 'Please fill out all required fields.' });
        }

        // --- NEW: Helper function to prevent repeating code ---
        const notifyAdmins = async (newUserData) => {
            // Find all active admin accounts
            const admins = await User.find({ role: 'admin', account_status: 'active' });
            if (admins && admins.length > 0) {
                // Get just their email addresses
                const adminEmails = admins.map(admin => admin.email);
                // Send the notification
                await sendNewUserAdminNotification(adminEmails, newUserData.name, newUserData.email);
            }
        };

        let user = await User.findOne({ email });

        if (user) {
            if (user.account_status === 'active' || user.account_status === 'pending') {
                return res.status(400).json({ message: 'A user with this email already exists or is pending approval.' });
            }

            if (user.account_status === 'rejected' || user.is_deleted) {
                console.log(`Re-registration attempt for ${email}. Overwriting old record.`);
                user.name = name;
                user.password = password;
                user.startupName = startupName;
                user.idCardNumber = idCardNumber;
                user.idCardExpiry = idCardExpiry;
                user.account_status = 'pending';
                user.role = 'user';
                user.is_deleted = false;

                await user.save();

                // --- KEY CHANGE: Notify admins on re-registration ---
                await notifyAdmins(user);

                return res.status(201).json({
                    message: 'Re-registration successful. Your account is now pending approval again.',
                    userId: user._id
                });
            }
        }

        const isFirstAccount = (await User.countDocuments({})) === 0;
        const role = isFirstAccount ? 'admin' : 'user';
        const account_status = isFirstAccount ? 'active' : 'pending';

        const newUser = await User.create({
            name, email, password, startupName, idCardNumber, idCardExpiry, role, account_status
        });

        if (newUser) {
            // --- KEY CHANGE: Notify admins on new registration ---
            // We only send the notification if the new user is actually pending approval.
            if (newUser.account_status === 'pending') {
                console.log('>>> ABOUT TO NOTIFY ADMINS of new user:', newUser.email);

                await notifyAdmins(newUser);
            }

            return res.status(201).json({
                message: 'Registration successful. Your account is pending admin approval.',
                userId: newUser._id
            });
        } else {
            return res.status(400).json({ message: 'Invalid user data provided.' });
        }

    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({ message: "Server error during registration." });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, is_deleted: false });

        if (user && (await user.matchPassword(password))) {
            if (user.account_status !== 'active') {
                return res.status(403).json({ message: `Your account is currently ${user.account_status}. Please contact an administrator.` });
            }
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login." });
    }
};

module.exports = { registerUser, loginUser };