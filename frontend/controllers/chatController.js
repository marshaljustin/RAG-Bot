const mongoose = require('mongoose');
const ChatHistory = require('../models/ChatHistory');

exports.saveMessage = async (userId, sessionId, role, content) => {
  try {
 
    const today = new Date().toISOString().split('T')[0];
    
    
    const dailySessionId = `daily-${today}`;

    const result = await ChatHistory.findOneAndUpdate(
      { 
        user: userId,
        session_id: dailySessionId 
      },
      {
        $push: {
          messages: {
            role,
            content,
            timestamp: new Date()
          }
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { 
        upsert: true,
        new: true,
        runValidators: true
      }
    );
    
    return result;
  } catch (err) {
    throw err;
  }
};


exports.getChatHistory = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const chats = await ChatHistory.find({ user: req.user._id })
      .sort("-createdAt")
      .lean(); 

  
    const dailySessions = chats.reduce((acc, chat) => {
      const date = new Date(chat.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!acc[date]) {
        acc[date] = {
          date,
          sessions: []
        };
      }
      
      acc[date].sessions.push(chat);
      return acc;
    }, {});

    res.status(200).json(Object.values(dailySessions));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};