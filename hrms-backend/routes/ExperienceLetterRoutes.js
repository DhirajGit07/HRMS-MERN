const express = require('express');
const router = express.Router();
const ExperienceLetter = require('../models/ExperienceLetterModel');

const { validateExperienceLetter } = require('../middlewares/ExperienceLetterMiddleware');
const { createExperienceLetter } = require('../controllers/ExperienceLetterController');

// POST: Create new experience letter request
router.post('/experience-letter', validateExperienceLetter, createExperienceLetter);

// ✅ GET: Fetch all experience letter requests
router.get('/experience-letter', async (req, res) => {
  try {
    const letters = await ExperienceLetter.find().sort({ createdAt: -1 });
    res.status(200).json(letters);
  } catch (error) {
    console.error('Error fetching experience letters:', error.message);
    res.status(500).json({ message: 'Failed to fetch experience letters' });
  }
});


// DELETE: Remove an experience letter by ID
router.delete('/experience-letter/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ExperienceLetter.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting experience letter:', error.message);
    res.status(500).json({ message: 'Failed to delete experience letter' });
  }
});

module.exports = router;
