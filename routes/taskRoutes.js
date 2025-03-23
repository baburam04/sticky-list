const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

<<<<<<< HEAD
router.post("/reorder", authMiddleware, async (req, res) => {
=======
// ✅ FIXED: Correct endpoint for adding tasks
router.post("/", authMiddleware, async (req, res) => {
>>>>>>> 1e3f679 (Fixed task creation and reordering routes)
  try {
    if (!req.body.title) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const task = new Task({ user: req.user.userId, title: req.body.title });
    await task.save();

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
<<<<<<< HEAD
  try {
    const { tasks } = req.body;
    for (let i = 0; i < tasks.length; i++) {
      await Task.findByIdAndUpdate(tasks[i]._id, { order: i });
    }
    res.json({ message: "Order updated" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
=======
>>>>>>> 1e3f679 (Fixed task creation and reordering routes)
});

// ✅ FIXED: Reorder route should be separate
router.post("/reorder", authMiddleware, async (req, res) => {
  try {
    const { tasks } = req.body;
    for (let i = 0; i < tasks.length; i++) {
      await Task.findByIdAndUpdate(tasks[i]._id, { order: i });
    }
    res.json({ message: "Order updated" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  const tasks = await Task.find({ user: req.user.userId });
  res.json(tasks);
});

router.delete("/:id", authMiddleware, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: "Task deleted" });
});

module.exports = router;
