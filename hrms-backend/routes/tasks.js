

const express = require('express');
const Task = require('../models/Task');
const router = express.Router();

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().lean();
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).lean();
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a task
router.post('/', async (req, res) => {
  try {
    const task = new Task({
      employeeId: req.body.employeeId,
      taskOwner: req.body.taskOwner,
      assignedTo: req.body.assignedTo || [],
      taskName: req.body.taskName,
      description: req.body.description,
      startDate: req.body.startDate,
      dueDate: req.body.dueDate,
      reminder: req.body.reminder,
      priority: req.body.priority || 'Moderate',
      status: req.body.status || 'Open',
    });

    const newTask = await task.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (req.body.taskOwner) task.taskOwner = req.body.taskOwner;
    if (req.body.assignedTo) task.assignedTo = req.body.assignedTo;
    if (req.body.taskName) task.taskName = req.body.taskName;
    if (req.body.description) task.description = req.body.description;
    if (req.body.startDate) task.startDate = req.body.startDate;
    if (req.body.dueDate) task.dueDate = req.body.dueDate;
    if (req.body.reminder) task.reminder = req.body.reminder;
    if (req.body.priority) task.priority = req.body.priority;
    if (req.body.status) task.status = req.body.status;

    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;