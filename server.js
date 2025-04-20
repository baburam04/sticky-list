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

app.get('/', (_req, res) => {
  res.json({ 
    status: 'running',
    message: 'Sticky List API',
    docs: 'https://sticky-list.onrender.com/api/health' 
  });
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://7-todolist.netlify.app',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/checklists', checklistRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));``