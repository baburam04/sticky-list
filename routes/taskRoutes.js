const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// Create new task
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ message: "Task title is required" });
    }

    // Get the current highest order value to place new task at the end
    const highestOrderTask = await Task.findOne({ user: req.user.userId })
      .sort({ order: -1 })
      .limit(1);
    
    const order = highestOrderTask ? highestOrderTask.order + 1 : 0;

    const task = new Task({
      user: req.user.userId,
      title: req.body.title,
      color: req.body.color || "#FFFFFF",
      pinned: req.body.pinned || false,
      order: order
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Reorder tasks
router.patch("/reorder", authMiddleware, async (req, res) => {
  try {
    const { orderedTasks } = req.body;
    
    if (!orderedTasks || !Array.isArray(orderedTasks)) {
      return res.status(400).json({ message: "Invalid task order data" });
    }

    // Use bulk write for better performance
    const bulkOps = orderedTasks.map((task, index) => ({
      updateOne: {
        filter: { _id: task.id, user: req.user.userId },
        update: { $set: { order: index } }
      }
    }));

    await Task.bulkWrite(bulkOps);

    res.json({ message: "Tasks reordered successfully" });
  } catch (error) {
    console.error("Error reordering tasks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all tasks (sorted by pinned status and then by order)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.userId })
      .sort({ pinned: -1, order: 1 }); // -1 for descending (pinned first)
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Toggle pin status
router.patch("/:id/pin", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { $set: { pinned: req.body.pinned } },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error toggling pin status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;