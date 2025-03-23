const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// ✅ FIXED: Correct endpoint for adding tasks
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const { title, color, pinned } = req.body;
    const task = new Task({ user: req.user.userId, title: req.body.title, color, pinned: pinned || false });
    await task.save();

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ FIXED: Reorder route should be separate
router.post("/reorder", authMiddleware, async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ message: "Invalid task order data" });
    }

    for (let i = 0; i < tasks.length; i++) {
      await Task.findByIdAndUpdate(tasks[i]._id, { order: i });
    }

    res.json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("Error reordering tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.userId }).sort({ pinned: -1, _id: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id/pin", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.pinned = !task.pinned; // Toggle the pinned state
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


router.delete("/:id", authMiddleware, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: "Task deleted" });
});

module.exports = router;
