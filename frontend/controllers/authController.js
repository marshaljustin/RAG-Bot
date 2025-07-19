const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ email, password });
    await user.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ 
      message: 'Registration failed',
      error: err.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Add session tracking
    const sessionData = {
      sessionId: req.sessionID,
      startTime: new Date(),
      expired: false
    };

    // Close any expired sessions
    const now = new Date();
    user.sessions = user.sessions.map(session => {
      if (!session.endTime && session.startTime < new Date(now - 14 * 24 * 60 * 60 * 1000)) {
        return {
          ...session.toObject(),
          endTime: new Date(session.startTime.getTime() + 14 * 24 * 60 * 60 * 1000),
          duration: 14 * 24 * 60 * 60 * 1000,
          expired: true
        };
      }
      return session;
    });

    user.sessions.push(sessionData);
    await user.save();

    req.session.userId = user.id;
    req.session.sessionId = req.sessionID;
    res.json({ message: 'Login successful' });


  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
};

exports.logout = async (req, res) => {
  try {
    // Destroy the session first
    await new Promise((resolve, reject) => {
      req.session.destroy(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.clearCookie('connect.sid');
    res.set('Cache-Control', 'no-store, must-revalidate');
    res.redirect('/login');
  } catch (err) {
    res.status(500).json({ message: 'Logout failed' });
  }
};