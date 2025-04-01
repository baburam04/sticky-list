require('dotenv').config();
const express = require('express');
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/todoapp";
const connectDB = require('./config/db');
const cors = require('cors');
const checklistRoutes = require('./routes/checklistRoutes');
const taskRoutes = require('./routes/taskRoutes');

connectDB();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/checklists', checklistRoutes);  // Fixed this line
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

app.listen(process.env.PORT || 5000, () => console.log('Server running'));