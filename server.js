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

// Middleware
app.use(cors({
  origin: "https://7-todolist.netlify.app/", // Your frontend URL
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/checklists', checklistRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));