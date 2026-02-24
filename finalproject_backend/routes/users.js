var express = require('express');
var router = express.Router();
var authMiddleware = require('../middleware/auth');
var User = require('../models/User');

/* GET current user */
router.get('/me', authMiddleware, async function(req, res, next) {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ 
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        school: user.school,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

/* PATCH update user profile */
router.patch('/me', authMiddleware, async function(req, res, next) {
  try {
    const updates = {};
    
    if (req.body.firstName !== undefined) updates.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) updates.lastName = req.body.lastName;
    if (req.body.phoneNumber !== undefined) updates.phoneNumber = req.body.phoneNumber;
    if (req.body.school !== undefined) updates.school = req.body.school;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        school: user.school,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
