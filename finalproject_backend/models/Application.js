const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  status: { type: String, enum: ['submitted', 'reviewing', 'interview', 'rejected', 'hired'], default: 'submitted' },
  coverLetter: { type: String, trim: true }
}, { timestamps: true });

ApplicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
