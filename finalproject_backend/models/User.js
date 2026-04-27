const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  phoneNumber: { type: String, trim: true },
  school: { type: String, trim: true },
  role: { type: String, enum: ['candidate', 'recruiter'], default: 'candidate' },

  // Candidate profile builder fields.
  location: { type: String, trim: true, default: '' },
  professionalTitle: { type: String, trim: true, default: '' },
  bio: { type: String, trim: true, default: '' },
  skills: [{ type: String, trim: true }],
  experienceEntries: [{
    role: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    period: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' }
  }],
  educationEntries: [{
    school: { type: String, trim: true, default: '' },
    degree: { type: String, trim: true, default: '' },
    year: { type: String, trim: true, default: '' }
  }],
  portfolio: {
    github: { type: String, trim: true, default: '' },
    linkedin: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' }
  },
  avatarUrl: { type: String, trim: true, default: '' },
  coverImageUrl: { type: String, trim: true, default: '' },

  // Jobseeker private resume vault + dynamic career insights.
  resumeUrl: { type: String, trim: true, default: '' },
  resumeFilename: { type: String, trim: true, default: '' },
  resumeExtractedText: { type: String, default: '' },
  resumeUpdatedAt: { type: Date },
  careerInsights: [{ type: String, trim: true }],

  // Candidate saved jobs for dashboard usage.
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
