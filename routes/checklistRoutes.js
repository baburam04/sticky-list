const express = require('express');
const Checklist = require('../models/Checklist');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Create new checklist (simplified)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ 
        success: false,
        message: 'Checklist title is required' 
      });
    }

    const checklist = new Checklist({
      user: req.user.userId,
      title: title.trim(),
      // Color is optional, will use default from model
    });

    const savedChecklist = await checklist.save();
    
    res.status(201).json({
      success: true,
      checklist: {
        id: savedChecklist._id,
        title: savedChecklist.title,
        createdAt: savedChecklist.createdAt,
        taskCount: 0 // New checklist has no tasks
      }
    });
  } catch (error) {
    console.error('Error creating checklist:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create checklist',
      error: error.message 
    });
  }
});

// Get all checklists with task counts (simplified)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Get checklists sorted by creation date (newest first)
    const checklists = await Checklist.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    // Add task counts to each checklist
    const checklistsWithCounts = await Promise.all(
      checklists.map(async (checklist) => {
        const taskCount = await Task.countDocuments({ 
          checklist: checklist._id,
          user: req.user.userId
        });
        return {
          id: checklist._id,
          title: checklist.title,
          createdAt: checklist.createdAt,
          taskCount
        };
      })
    );

    res.json({
      success: true,
      checklists: checklistsWithCounts
    });
  } catch (error) {
    console.error('Error fetching checklists:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch checklists',
      error: error.message 
    });
  }
});

// Search checklists by title
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const checklists = await Checklist.find({
      user: req.user.userId,
      title: { $regex: query, $options: 'i' } // Case-insensitive search
    })
    .sort({ createdAt: -1 })
    .lean();

    res.json({
      success: true,
      checklists: checklists.map(c => ({
        id: c._id,
        title: c.title,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    console.error('Error searching checklists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search checklists',
      error: error.message
    });
  }
});

// Update checklist title
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ 
        success: false,
        message: 'New title is required' 
      });
    }

    const checklist = await Checklist.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { $set: { title: title.trim() } },
      { new: true, runValidators: true }
    );

    if (!checklist) {
      return res.status(404).json({ 
        success: false,
        message: 'Checklist not found' 
      });
    }

    res.json({
      success: true,
      checklist: {
        id: checklist._id,
        title: checklist.title,
        createdAt: checklist.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update checklist',
      error: error.message 
    });
  }
});

// Delete checklist and its tasks
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // First delete the checklist
    const checklist = await Checklist.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.userId 
    });

    if (!checklist) {
      return res.status(404).json({ 
        success: false,
        message: 'Checklist not found' 
      });
    }

    // Then delete all associated tasks
    const result = await Task.deleteMany({ 
      checklist: req.params.id,
      user: req.user.userId
    });

    res.json({
      success: true,
      message: 'Checklist and its tasks deleted successfully',
      deletedTasksCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete checklist',
      error: error.message 
    });
  }
});

module.exports = router;