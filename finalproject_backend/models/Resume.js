const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  parsedText: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Resume', ResumeSchema);
