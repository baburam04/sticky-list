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
  color: {
    type: String,
    default: '#80D8FF' // Default color if none provided
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Removed tasks array since we'll query tasks separately
  // Removed order field since we'll handle sorting on frontend
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for better performance
checklistSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Checklist', checklistSchema);