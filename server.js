require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Routes
const checklistRoutes = require('./routes/checklistRoutes');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');

// Connect to database
connectDB();

const app = express();

// ================== MIDDLEWARE FIXES ================== //
// Enhanced CORS configuration (allows Postman + frontend)
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://7-todolist.netlify.app',
    'https://sticky-list.onrender.com',
    'http://localhost:3000' // For local frontend testing
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser with size limit
app.use(express.json({ limit: '10mb' }));

// ================== ROUTES ================== //
app.use('/api/checklists', checklistRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// ================== TEST ENDPOINT ================== //
// Add this to verify your API is reachable
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'active',
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// ================== ERROR HANDLING ================== //
// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('⚠️ Server Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : null
  });
});

// ================== SERVER START ================== //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  🚀 Server running in ${process.env.NODE_ENV || 'development'} mode
  🔗 Base URL: http://localhost:${PORT}
  📄 API Docs: http://localhost:${PORT}/api/health
  `);
});