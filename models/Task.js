const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  checklist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Checklist',
    required: true,
    index: true
  },
  title: { 
    type: String, 
    required: [true, "Task title is required"],
    trim: true,
    maxlength: [200, "Task title cannot exceed 200 characters"]
  },
  color: { 
    type: String, 
    default: "#FFFFFF",
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: props => `${props.value} is not a valid color code!`
    }
  },
  pinned: { 
    type: Boolean, 
    default: false 
  },
  completed: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(v) {
        // Allow null/undefined or valid future dates
        return !v || new Date(v) > new Date();
      },
      message: "Due date must be in the future"
    }
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v; // Remove version key
      return ret;
    }
  },
  toObject: { 
    virtuals: true 
  }
});

// Improved indexes for better performance
TaskSchema.index({ checklist: 1, pinned: -1, createdAt: -1 }); // For checklist task listing
TaskSchema.index({ user: 1, pinned: 1, completed: 1 }); // For pinned tasks across all checklists
TaskSchema.index({ checklist: 1, completed: 1 }); // For completed tasks within a checklist

// Virtual for formatted due date
TaskSchema.virtual('dueDateFormatted').get(function() {
  if (!this.dueDate) return null;
  return this.dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format
});

// Pre-save hook to validate checklist exists
TaskSchema.pre('save', async function(next) {
  try {
    // Verify the checklist exists and belongs to the same user
    const checklist = await mongoose.model('Checklist').findOne({
      _id: this.checklist,
      user: this.user
    });
    
    if (!checklist) {
      throw new Error('Checklist not found or does not belong to user');
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Pre-remove hook to clean up any task references (if needed)
TaskSchema.pre('remove', async function(next) {
  // Add any cleanup logic here if needed
  next();
});

module.exports = mongoose.model("Task", TaskSchema);