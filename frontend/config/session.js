const session = require('express-session');
const MongoStore = require('connect-mongo');

module.exports = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 14* 24 * 60 * 60 
  }),
  cookie: {
    maxAge: 14* 24 * 60 * 60 , 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
});