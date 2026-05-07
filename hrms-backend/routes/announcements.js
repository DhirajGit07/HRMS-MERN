const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// Create a new announcement
router.post('/', async (req, res) => {
  try {
    const {companyId, date, text } = req.body;
    
    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Announcement text is required' });
    }

    const announcement = new Announcement({
      companyId,
      date: date || new Date(),
      text
    });
    
    await announcement.save();
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all announcements (sorted by date descending)
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ date: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update an announcement
router.put('/:id', async (req, res) => {
  try {
    const {companyId, date, text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Announcement text is required' });
    }

    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      {companyId, date: date || new Date(), text },
      { new: true, runValidators: true }
    );
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete an announcement
router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;