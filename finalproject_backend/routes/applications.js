const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function ensureCandidate(req, res, next) {
  if (req.user && req.user.role === 'candidate') {
    return next();
  }
  return res.status(403).json({ error: 'Candidate access required' });
}

function ensureRecruiter(req, res, next) {
  if (req.user && req.user.role === 'recruiter') {
    return next();
  }
  return res.status(403).json({ error: 'Recruiter access required' });
}

router.get('/my', authMiddleware, ensureCandidate, async function(req, res, next) {
  try {
    const applications = await Application.find({ candidate: req.user.id })
      .populate('job', 'title company type location status')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ applications: applications });
  } catch (err) {
    next(err);
  }
});

router.get('/received', authMiddleware, ensureRecruiter, async function(req, res, next) {
  try {
    const jobIds = await Job.find({ recruiter: req.user.id }).distinct('_id');
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('job', 'title company type location status')
      .populate('candidate', 'firstName lastName email phoneNumber school')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ applications: applications });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authMiddleware, ensureRecruiter, async function(req, res, next) {
  try {
    const nextStatus = req.body.status;
    if (!['hired', 'rejected'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id).populate('job', 'recruiter');
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (!application.job || application.job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Recruiter access required' });
    }

    application.status = nextStatus;
    await application.save();

    res.json({ application: application });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
