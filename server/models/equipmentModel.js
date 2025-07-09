const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: Number, required: true, enum: [1, 2, 3] }, // 1: On-Demand, 2: 2hr-Prep, 3: 24/7
    operational_status: { type: String, required: true, enum: ['Available', 'Under Maintenance'], default: 'Available' },
    is_deleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Equipment', equipmentSchema);