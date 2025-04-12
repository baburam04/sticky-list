const mongoose = require('mongoose');

const checklistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Keep if you need user association
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    default: '#80D8FF'
  }
}, {
  timestamps: true // Will create createdAt and updatedAt
});

checklistSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Checklist', checklistSchema);