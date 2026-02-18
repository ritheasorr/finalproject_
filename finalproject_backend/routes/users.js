var express = require('express');
var router = express.Router();
var authMiddleware = require('../middleware/auth');

/* GET users listing. */
router.get('/me', authMiddleware, function(req, res) {
  res.json({ user: req.user });
});

module.exports = router;
