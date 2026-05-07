const express = require('express');
const router = express.Router();
const ExitDetail = require('../models/ExitDetail');

// Create a new exit detail
router.post('/', async (req, res) => {
  try {
    const exitDetailData = {
      ...req.body,
      status: req.body.status || 'pending' // Ensure status is set
    };
    const exitDetail = new ExitDetail(exitDetailData);
    await exitDetail.save();
    res.status(201).json(exitDetail);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all exit details
router.get('/', async (req, res) => {
  try {
    const exitDetails = await ExitDetail.find();
    res.json(exitDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single exit detail
router.get('/:id', async (req, res) => {
  try {
    const exitDetail = await ExitDetail.findById(req.params.id);
    if (!exitDetail) {
      return res.status(404).json({ message: 'Exit detail not found' });
    }
    res.json(exitDetail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update an exit detail
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      status: req.body.status || 'pending' // Ensure status is set
    };
    
    const exitDetail = await ExitDetail.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!exitDetail) {
      return res.status(404).json({ message: 'Exit detail not found' });
    }
    res.json(exitDetail);
  } catch (error) {
    res.status(400).json({ 
      message: error.message || 'Failed to update exit detail' 
    });
  }
});

// Delete an exit detail
router.delete('/:id', async (req, res) => {
  try {
    const exitDetail = await ExitDetail.findByIdAndDelete(req.params.id);
    if (!exitDetail) {
      return res.status(404).json({ message: 'Exit detail not found' });
    }
    res.json({ message: 'Exit detail deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;