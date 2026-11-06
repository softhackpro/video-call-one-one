const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    projectId: { type: String, required: true }, // The Developer's App ID
    roomId: { type: String, required: true },
    participants: [{ type: String }],            // Socket IDs or User IDs
    startTime: { type: Date },
    endTime: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    billedAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);