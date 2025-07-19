const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/\S+@\S+\.\S+/, 'Invalid email format']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  sessions: [{
    sessionId: String,
    startTime: Date,
    endTime: Date,
    duration: Number, // in milliseconds
    expired: Boolean
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook remains the same
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);