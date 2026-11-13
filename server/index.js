require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const aptitudeRoutes = require('./routes/aptitude');
const codingRoutes = require('./routes/coding');
const technicalRoutes = require('./routes/technical');
const mockInterviewRoutes = require('./routes/mockInterview');
const resumeRoutes = require('./routes/resume');
const progressRoutes = require('./routes/progress');
const adminRoutes = require('./routes/admin');
const preferencesRoutes = require('./routes/preferences');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
const sessionSecret = process.env.SESSION_SECRET || 'smart-interview-prep-secret-key-2026-dev-only';
if (!process.env.SESSION_SECRET) {
  console.warn('[WARN] SESSION_SECRET not set in .env — using insecure default (development only)');
}
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  })
);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));
// Serve uploaded avatars
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/aptitude', aptitudeRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/technical', technicalRoutes);
app.use('/api/mock-interview', mockInterviewRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/preferences', preferencesRoutes);



// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Smart Interview Preparation System API', timestamp: new Date() });
});

// Fallback for SPA routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  } else {
    res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Smart Interview Prep System running on port ${PORT}`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
