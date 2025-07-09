const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // startupName: { type: String, required: true },
    startupName: { type: String },
    idCardNumber: { type: String, required: true },
    idCardExpiry: { type: Date, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    account_status: {
        type: String,
        // Add 'rejected' to the list of allowed values.
        enum: ['pending', 'active', 'suspended', 'rejected'],
        default: 'pending'
    },
    is_deleted: { type: Boolean, default: false },

}, { timestamps: true });

// Encrypt password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);