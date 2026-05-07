const express = require('express');
const router = express.Router();
const Holiday = require('../models/Holiday');

// Create a new holiday
router.post('/', async (req, res) => {
  try {
    const { companyId, date, label } = req.body;
    
    // Validate date format
    if (!date || isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    const holiday = new Holiday({
      companyId,
      date: new Date(date),
      label
    });
    
    await holiday.save();
    res.status(201).json(holiday);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Holiday for this date already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Get all holidays
router.get('/', async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a holiday
router.put('/:id', async (req, res) => {
  try {
    const { companyId, date, label } = req.body;
    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      {companyId, date: new Date(date), label },
      { new: true, runValidators: true }
    );
    
    if (!holiday) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    
    res.json(holiday);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Holiday for this date already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Delete a holiday
router.delete('/:id', async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    
    if (!holiday) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    
    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;