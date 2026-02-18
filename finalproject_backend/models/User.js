const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  phoneNumber: { type: String, trim: true },
  school: { type: String, trim: true },
  role: { type: String, enum: ['candidate', 'recruiter'], default: 'candidate' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
