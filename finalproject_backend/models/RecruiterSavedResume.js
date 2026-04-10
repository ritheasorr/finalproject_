const mongoose = require('mongoose');

const RecruiterSavedResumeSchema = new mongoose.Schema({
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  folderName: { type: String, required: true, trim: true },
  folderSlug: { type: String, required: true, trim: true, index: true },
  note: { type: String, default: '', trim: true },
  originalResumeUrl: { type: String, required: true, trim: true },
  savedResumeUrl: { type: String, required: true, trim: true },
  savedFilename: { type: String, required: true, trim: true },
  sourceResumeName: { type: String, default: '', trim: true },
  sourceResumeMimeType: { type: String, default: '', trim: true },
}, { timestamps: true });

RecruiterSavedResumeSchema.index({ recruiter: 1, application: 1, folderSlug: 1 }, { unique: true });

module.exports = mongoose.model('RecruiterSavedResume', RecruiterSavedResumeSchema);
