const User = require('../models/User'); 
module.exports = async (req, res, next) => {
    if (req.session.userId) {
      try {
        const user = await User.findById(req.session.userId);
        const activeSession = user.sessions.find(s => 
          s.sessionId === req.sessionID && !s.endTime
        );
        
        if (!activeSession) {
          user.sessions.push({
            sessionId: req.sessionID,
            startTime: new Date(),
            expired: false
          });
          await user.save();
        }
      } catch (err) {
        console.error('Session tracking error:', err);
      }
    }
    next();
  };