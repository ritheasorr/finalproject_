var express = require('express');
var router = express.Router();
var authMiddleware = require('../middleware/auth');
var User = require('../models/User');
var Job = require('../models/Job');
var Application = require('../models/Application');

router.get('/me', authMiddleware, function(req, res) {
  res.json({ user: req.user });
});

router.patch('/me', authMiddleware, async function(req, res, next) {
  try {
    const allowed = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phoneNumber: req.body.phoneNumber,
      school: req.body.school,
    };

    Object.keys(allowed).forEach(function(key) {
      if (typeof allowed[key] !== 'string' || !allowed[key].trim()) {
        delete allowed[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: allowed },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        phoneNumber: updatedUser.phoneNumber || '',
        school: updatedUser.school || '',
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/public', authMiddleware, async function(req, res, next) {
  try {
    const recruiter = await User.findById(req.params.id)
      .select('firstName lastName email phoneNumber role')
      .lean();

    if (!recruiter || recruiter.role !== 'recruiter') {
      return res.status(404).json({ error: 'Recruiter not found' });
    }

    const activeJobs = await Job.find({ recruiter: recruiter._id, status: 'open' })
      .select('title company location createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const recruiterJobIds = activeJobs.map(function(job) { return job._id; });
    const totalApplicants = recruiterJobIds.length
      ? await Application.countDocuments({ job: { $in: recruiterJobIds } })
      : 0;

    const company = activeJobs.find(function(job) { return !!job.company; })?.company || 'CareerLaunch Hiring Team';
    const location = activeJobs.find(function(job) { return !!job.location; })?.location || '';

    return res.json({
      recruiter: {
        id: recruiter._id,
        fullName: [recruiter.firstName, recruiter.lastName].filter(Boolean).join(' ').trim(),
        firstName: recruiter.firstName || '',
        lastName: recruiter.lastName || '',
        email: recruiter.email,
        phoneNumber: recruiter.phoneNumber || '',
        company: company,
        location: location,
        totalActiveJobs: activeJobs.length,
        totalApplicants: totalApplicants,
      },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
