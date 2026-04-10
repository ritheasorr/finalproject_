const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  status: { type: String, enum: ['submitted', 'reviewing', 'interview', 'rejected', 'hired'], default: 'submitted' },
  coverLetter: { type: String, trim: true },
  resume: {
    originalName: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    size: { type: Number },
    url: { type: String, trim: true }
  },
  resumeText: { type: String, default: '' },
  aiScore: { type: Number, min: 0, max: 100, default: 0 }
}, { timestamps: true });

ApplicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
