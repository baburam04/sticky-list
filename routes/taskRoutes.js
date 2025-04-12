const express = require("express");
const Task = require("../models/Task");
const Checklist = require("../models/Checklist");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// Create new task within a checklist
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, checklistId } = req.body;
    
    if (!title || !checklistId) {
      return res.status(400).json({ 
        success: false,
        message: "Task title and checklist ID are required" 
      });
    }

    // Verify checklist exists and belongs to user
    const checklist = await Checklist.findOne({
      _id: checklistId,
      user: req.user.userId
    });

    if (!checklist) {
      return res.status(404).json({ 
        success: false,
        message: "Checklist not found" 
      });
    }

    const task = new Task({
      user: req.user.userId,
      checklist: checklistId,
      title: title.trim(),
      completed: false,
      pinned: false
    });

    const savedTask = await task.save();
    
    res.status(201).json({
      success: true,
      task: {
        id: savedTask._id,
        title: savedTask.title,
        checklistId: savedTask.checklist,
        completed: savedTask.completed,
        pinned: savedTask.pinned,
        createdAt: savedTask.createdAt
      }
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create task",
      error: error.message 
    });
  }
});

// Get all tasks for a specific checklist
router.get("/checklist/:checklistId", authMiddleware, async (req, res) => {
  try {
    // Verify checklist ownership
    const checklist = await Checklist.findOne({
      _id: req.params.checklistId,
      user: req.user.userId
    });

    if (!checklist) {
      return res.status(404).json({ 
        success: false,
        message: "Checklist not found" 
      });
    }

    const tasks = await Task.find({ 
      user: req.user.userId,
      checklist: req.params.checklistId
    })
    .sort({ pinned: -1, createdAt: -1 }) // Pinned first, then newest first
    .lean();

    res.json({
      success: true,
      tasks: tasks.map(t => ({
        id: t._id,
        title: t.title,
        completed: t.completed,
        pinned: t.pinned,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch tasks",
      error: error.message 
    });
  }
});

// Get all pinned tasks across all checklists
router.get("/pinned", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ 
      user: req.user.userId,
      pinned: true
    })
    .sort({ createdAt: -1 }) // Newest first
    .populate('checklist', 'title')
    .lean();

    res.json({
      success: true,
      tasks: tasks.map(t => ({
        id: t._id,
        title: t.title,
        completed: t.completed,
        pinned: t.pinned,
        createdAt: t.createdAt,
        checklist: {
          id: t.checklist._id,
          title: t.checklist.title
        }
      }))
    });
  } catch (error) {
    console.error("Error fetching pinned tasks:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch pinned tasks",
      error: error.message 
    });
  }
});

// Toggle task completion status
router.patch("/:id/complete", authMiddleware, async (req, res) => {
  try {
    const { completed } = req.body;
    
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ 
        success: false,
        message: "Completed status is required and must be boolean" 
      });
    }

    const task = await Task.findOneAndUpdate(
      { 
        _id: req.params.id, 
        user: req.user.userId 
      },
      { $set: { completed } },
      { new: true }
    ).lean();

    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: "Task not found" 
      });
    }

    res.json({
      success: true,
      task: {
        id: task._id,
        title: task.title,
        completed: task.completed,
        pinned: task.pinned,
        createdAt: task.createdAt
      }
    });
  } catch (error) {
    console.error("Error toggling completion status:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update task status",
      error: error.message 
    });
  }
});

// Toggle pin status
router.patch("/:id/pin", authMiddleware, async (req, res) => {
  try {
    const { pinned } = req.body;
    
    if (typeof pinned !== 'boolean') {
      return res.status(400).json({ 
        success: false,
        message: "Pinned status is required and must be boolean" 
      });
    }

    const task = await Task.findOneAndUpdate(
      { 
        _id: req.params.id, 
        user: req.user.userId 
      },
      { $set: { pinned } },
      { new: true }
    ).lean();

    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: "Task not found" 
      });
    }

    res.json({
      success: true,
      task: {
        id: task._id,
        title: task.title,
        completed: task.completed,
        pinned: task.pinned,
        createdAt: task.createdAt
      }
    });
  } catch (error) {
    console.error("Error toggling pin status:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update pin status",
      error: error.message 
    });
  }
});

// Update task details
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const updates = {};
    const validFields = ['title', 'dueDate', 'pinned', 'completed'];
    
    // Only allow specific fields to be updated
    validFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "No valid fields provided for update" 
      });
    }

    const task = await Task.findOneAndUpdate(
      { 
        _id: req.params.id, 
        user: req.user.userId 
      },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: "Task not found" 
      });
    }

    res.json({
      success: true,
      task: {
        id: task._id,
        title: task.title,
        completed: task.completed,
        pinned: task.pinned,
        dueDate: task.dueDate,
        createdAt: task.createdAt
      }
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update task",
      error: error.message 
    });
  }
});

// Delete task
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    console.log(`Attempting to delete task ${req.params.id} for user ${req.user.userId}`);
    
    const task = await Task.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.userId 
    });

    if (!task) {
      console.log(`Task not found: ${req.params.id}`);
      return res.status(404).json({ 
        success: false,
        message: "Task not found" 
      });
    }

    console.log(`Successfully deleted task: ${task._id}`);
    res.json({ 
      success: true,
      message: "Task deleted successfully",
      deletedTaskId: task._id
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: "Invalid task ID format" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error while deleting task", 
      error: error.message 
    });
  }
});

module.exports = router;