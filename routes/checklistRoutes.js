// routes/checklistRoutes.js
const express = require('express');
const Checklist = require('../models/Checklist');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Create new checklist
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ message: 'Checklist title is required' });
    }

    // Get the highest order to place new checklist at the end
    const highestOrderChecklist = await Checklist.findOne({ user: req.user.userId })
      .sort({ order: -1 })
      .limit(1);

    const order = highestOrderChecklist ? highestOrderChecklist.order + 1 : 0;

    const checklist = new Checklist({
      user: req.user.userId,
      title: req.body.title,
      color: req.body.color || '#80D8FF',
      order: order
    });

    await checklist.save();
    res.status(201).json(checklist);
  } catch (error) {
    console.error('Error creating checklist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all checklists with task counts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const checklists = await Checklist.find({ user: req.user.userId })
      .sort({ order: 1 })
      .lean(); // Convert to plain JavaScript objects

    // Add task counts to each checklist
    const checklistsWithCounts = await Promise.all(
      checklists.map(async (checklist) => {
        const taskCount = await Task.countDocuments({ checklist: checklist._id });
        return {
          ...checklist,
          taskCount
        };
      })
    );

    res.json(checklistsWithCounts);
  } catch (error) {
    console.error('Error fetching checklists:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reorder checklists
router.patch('/reorder', authMiddleware, async (req, res) => {
  try {
    const { orderedChecklists } = req.body;
    
    if (!orderedChecklists || !Array.isArray(orderedChecklists)) {
      return res.status(400).json({ message: 'Invalid checklist order data' });
    }

    const bulkOps = orderedChecklists.map((checklist, index) => ({
      updateOne: {
        filter: { _id: checklist.id, user: req.user.userId },
        update: { $set: { order: index } }
      }
    }));

    await Checklist.bulkWrite(bulkOps);
    res.json({ message: 'Checklists reordered successfully' });
  } catch (error) {
    console.error('Error reordering checklists:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update checklist (title/color)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, color } = req.body;
    const updates = {};
    
    if (title) updates.title = title;
    if (color) updates.color = color;

    const checklist = await Checklist.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { $set: updates },
      { new: true }
    );

    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    res.json(checklist);
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete checklist and its tasks
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // First delete all tasks in this checklist
    await Task.deleteMany({ 
      checklist: req.params.id,
      user: req.user.userId
    });

    // Then delete the checklist
    const checklist = await Checklist.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.userId 
    });

    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    res.json({ message: 'Checklist and its tasks deleted successfully' });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;