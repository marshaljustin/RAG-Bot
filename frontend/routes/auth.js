const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User'); 


router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);


router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.json({ email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get user data' });
  }
});

// Chat routes
router.post('/message', async (req, res) => {
  try {
    const { role, content } = req.body;
    await saveMessage(req.session.userId, req.session.sessionID, role, content);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get chat history
router.get('/history', async (req, res) => {
  try {
    await getChatHistory(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;