require('dotenv').config();
const path    = require('path');
const express = require('express');
const cors    = require('cors');
const connectDB = require('./config/db');
const passport  = require('./config/passport');

const app = express();
connectDB();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(passport.initialize());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/habits', require('./routes/habits'));

// ✅ FIX: Serve auth-callback.html when Google redirects to /auth/callback
app.get('/auth/callback', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth-callback.html'));
});

// Root → login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Running on http://localhost:${PORT}`));