// models/Checklist.js
const mongoose = require('mongoose');

const checklistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  color: {
    type: String,
    default: '#80D8FF'
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for better performance
checklistSchema.index({ user: 1, order: 1 });

module.exports = mongoose.model('Checklist', checklistSchema);