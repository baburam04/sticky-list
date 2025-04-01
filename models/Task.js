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
    index: true  // Added index for better query performance
  },
  title: { 
    type: String, 
    required: [true, "Task title is required"],
    trim: true
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
  order: { 
    type: Number, 
    default: 0,
    min: 0
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(v) {
        // Allow null/undefined or valid future dates
        return !v || v > Date.now();
      },
      message: "Due date must be in the future"
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,  // Auto-manage createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for better query performance on common operations
TaskSchema.index({ checklist: 1, order: 1 });
TaskSchema.index({ user: 1, pinned: -1, order: 1 });  // For pinned task sorting
TaskSchema.index({ user: 1, completed: 1 });  // For completed tasks filtering

// Virtual for formatted due date
TaskSchema.virtual('dueDateFormatted').get(function() {
  if (!this.dueDate) return null;
  return this.dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format
});

// Middleware to update order of other tasks when order changes
TaskSchema.pre('save', async function(next) {
  if (this.isModified('order')) {
    try {
      await this.model('Task').updateMany(
        {
          checklist: this.checklist,
          order: { $gte: this.order },
          _id: { $ne: this._id }
        },
        { $inc: { order: 1 } }
      );
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("Task", TaskSchema);