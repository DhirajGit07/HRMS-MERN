// controllers/experienceLetterController.js
const ExperienceLetter = require('../models/ExperienceLetterModel'); // Adjust if needed

// @desc    Create a new Experience Letter request
// @route   POST /api/experience-letter
// @access  Private
exports.createExperienceLetter = async (req, res) => {
  try {
    const {
      employeeId,
      requestDate,
      reasonForRequest,
      otherReason,
      dateOfJoining,
      designation,
      department,
      currentExperience
    } = req.body;

    if (!employeeId || !requestDate || !reasonForRequest) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const newLetter = new ExperienceLetter({
      employeeId,
      requestDate,
      reasonForRequest,
      otherReason: reasonForRequest === 'other' ? otherReason : '',
      dateOfJoining,
      designation,
      department,
      currentExperience
    });

    const savedLetter = await newLetter.save();

    res.status(201).json({ message: 'Experience letter submitted', data: savedLetter });
  } catch (error) {
    console.error('Error creating experience letter:', error.message);
    res.status(500).json({ message: 'Failed to submit experience letter' });
  }
};
