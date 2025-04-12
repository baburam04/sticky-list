// routes/checklistRoutes.js
const express = require('express');
const Checklist = require('../models/Checklist');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Create new checklist
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('Received request to create checklist:', req.body);
    console.log('Authenticated user ID:', req.user.userId);
    
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

    const savedChecklist = await checklist.save();
    console.log('Checklist created successfully:', savedChecklist);
    
    // Convert to plain object to ensure proper JSON conversion
    const checklistObj = savedChecklist.toObject();
    
    res.status(201).json({
      ...checklistObj,
      taskCount: 0 // Add taskCount for consistency with GET response
    });
  } catch (error) {
    console.error('Error creating checklist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all checklists with task counts
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching checklists for user:', req.user.userId);
    
    const checklists = await Checklist.find({ user: req.user.userId })
      .sort({ order: 1 })
      .lean(); // Convert to plain JavaScript objects

    console.log('Found checklists:', checklists.length);

    // Add task counts to each checklist
    const checklistsWithCounts = await Promise.all(
      checklists.map(async (checklist) => {
        const taskCount = await Task.countDocuments({ checklist: checklist._id });
        console.log(`Checklist ${checklist._id} has ${taskCount} tasks`);
        return {
          ...checklist,
          taskCount
        };
      })
    );

    console.log('Returning checklists with counts');
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
    console.log('Reordering checklists:', orderedChecklists);
    
    if (!orderedChecklists || !Array.isArray(orderedChecklists)) {
      return res.status(400).json({ message: 'Invalid checklist order data' });
    }

    // Handle both formats: {id: '...'} or {_id: '...'}
    const bulkOps = orderedChecklists.map((checklist, index) => {
      const checklistId = checklist.id || checklist._id;
      console.log(`Setting checklist ${checklistId} to order ${index}`);
      
      return {
        updateOne: {
          filter: { _id: checklistId, user: req.user.userId },
          update: { $set: { order: index } }
        }
      };
    });

    const result = await Checklist.bulkWrite(bulkOps);
    console.log('Reorder result:', result);
    res.json({ message: 'Checklists reordered successfully', updated: result.modifiedCount });
  } catch (error) {
    console.error('Error reordering checklists:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update checklist (title/color)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, color } = req.body;
    console.log(`Updating checklist ${req.params.id}:`, req.body);
    
    const updates = {};
    if (title) updates.title = title;
    if (color) updates.color = color;

    const checklist = await Checklist.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { $set: updates },
      { new: true }
    );

    if (!checklist) {
      console.log(`Checklist ${req.params.id} not found for user ${req.user.userId}`);
      return res.status(404).json({ message: 'Checklist not found' });
    }

    console.log('Checklist updated successfully:', checklist);
    
    // Get task count for consistency with GET response
    const taskCount = await Task.countDocuments({ checklist: checklist._id });
    
    // Convert to plain object and add task count
    const checklistObj = checklist.toObject();
    
    res.json({
      ...checklistObj,
      taskCount
    });
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete checklist and its tasks
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    console.log(`Deleting checklist ${req.params.id} and its tasks`);
    
    // First delete all tasks in this checklist
    const tasksResult = await Task.deleteMany({ 
      checklist: req.params.id,
      user: req.user.userId
    });
    
    console.log(`Deleted ${tasksResult.deletedCount} tasks`);

    // Then delete the checklist
    const checklist = await Checklist.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.userId 
    });

    if (!checklist) {
      console.log(`Checklist ${req.params.id} not found for deletion`);
      return res.status(404).json({ message: 'Checklist not found' });
    }

    console.log('Checklist deleted successfully');
    res.json({ 
      message: 'Checklist and its tasks deleted successfully',
      deletedTasksCount: tasksResult.deletedCount
    });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;