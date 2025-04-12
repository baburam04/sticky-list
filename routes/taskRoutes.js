const express = require("express");
const Task = require("../models/Task");
const Checklist = require("../models/Checklist");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// Create new task within a checklist
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (!req.body.title || !req.body.checklistId) {
      return res.status(400).json({ 
        message: "Task title and checklist ID are required" 
      });
    }

    // Verify checklist exists and belongs to user
    const checklist = await Checklist.findOne({
      _id: req.body.checklistId,
      user: req.user.userId
    });

    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    // Get the highest order value within this checklist
    const highestOrderTask = await Task.findOne({ 
      checklist: req.body.checklistId 
    })
      .sort({ order: -1 })
      .limit(1);
    
    const order = highestOrderTask ? highestOrderTask.order + 1 : 0;

    const task = new Task({
      user: req.user.userId,
      checklist: req.body.checklistId,
      title: req.body.title,
      color: req.body.color || "#FFFFFF",
      pinned: req.body.pinned || false,
      completed: req.body.completed || false,
      dueDate: req.body.dueDate || null,
      order: order
    });

    await task.save();
    
    // Return task with checklist reference populated
    const populatedTask = await Task.findById(task._id)
      .populate('checklist', 'title color');
    
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
});

// Reorder tasks within a checklist
router.patch("/reorder", authMiddleware, async (req, res) => {
  try {
    const { checklistId, orderedTasks } = req.body;
    
    if (!checklistId || !orderedTasks || !Array.isArray(orderedTasks)) {
      return res.status(400).json({ 
        message: "Checklist ID and ordered tasks array are required" 
      });
    }

    // Verify checklist ownership
    const checklist = await Checklist.findOne({
      _id: checklistId,
      user: req.user.userId
    });

    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    const bulkOps = orderedTasks.map((task, index) => ({
      updateOne: {
        filter: { 
          _id: task.id, 
          user: req.user.userId,
          checklist: checklistId
        },
        update: { $set: { order: index } }
      }
    }));

    await Task.bulkWrite(bulkOps);

    res.json({ message: "Tasks reordered successfully" });
  } catch (error) {
    console.error("Error reordering tasks:", error);
    res.status(500).json({ 
      message: "Server error", 
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
      return res.status(404).json({ message: "Checklist not found" });
    }

    const tasks = await Task.find({ 
      user: req.user.userId,
      checklist: req.params.checklistId
    })
      .sort({ pinned: -1, order: 1 })
      .populate('checklist', 'title color');

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ 
      message: "Server error", 
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
      .sort({ order: 1 })
      .populate('checklist', 'title color');

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching pinned tasks:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
});

// Toggle task completion status
router.patch("/:id/complete", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { 
        _id: req.params.id, 
        user: req.user.userId 
      },
      { $set: { completed: req.body.completed } },
      { new: true }
    ).populate('checklist', 'title color');

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error toggling completion status:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
});

// Toggle pin status
router.patch("/:id/pin", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { 
        _id: req.params.id, 
        user: req.user.userId 
      },
      { $set: { pinned: req.body.pinned } },
      { new: true }
    ).populate('checklist', 'title color');

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error toggling pin status:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
});

// Update task details
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const updates = {};
    const validFields = ['title', 'color', 'dueDate', 'pinned', 'completed'];
    
    // Only allow specific fields to be updated
    validFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const task = await Task.findOneAndUpdate(
      { 
        _id: req.params.id, 
        user: req.user.userId 
      },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('checklist', 'title color');

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
});

// Delete task
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.userId 
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ 
      message: "Task deleted successfully",
      deletedTask: task
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
});

module.exports = router;