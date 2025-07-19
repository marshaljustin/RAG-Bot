
require('dotenv').config();
const cors = require('cors');
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const session = require('./config/session');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const errorHandler = require('./middleware/errorHandler');
const sessionTracker = require('./middleware/sessiontracker');

const app = express();

// Connect to MongoDB FIRST
connectDB();

// Middleware ORDER IS CRUCIAL
app.use(cors({
  origin: "http://localhost: ",// Adjust this to your port number
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware BEFORE routes
app.use(session);
app.use(sessionTracker);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Cache control
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Error handler LAST
app.use(errorHandler);

const PORT = process.env.PORT || ;// Adjust this to your port number
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));