const express = require('express');
const router = express.Router();
const { saveMessage, getChatHistory } = require('../controllers/chatController');
const { requireAuth } = require('../middleware/auth');

router.post('/message', requireAuth, async (req, res) => {
  try {
    await saveMessage(
      req.session.userId,
      req.sessionID,
      req.body.role,
      req.body.content
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', requireAuth, async (req, res) => {
    try {
      const history = await getChatHistory(req, res);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  module.exports = router;
