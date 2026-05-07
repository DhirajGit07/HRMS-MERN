// middleware/experienceLetterValidator.js

exports.validateExperienceLetter = (req, res, next) => {
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

  // Required fields
  if (!employeeId || !requestDate || !reasonForRequest) {
    return res.status(400).json({
      message: 'Employee ID, request date, and reason for request are required.'
    });
  }

  // If "other" is selected as reason, otherReason must be filled
  if (reasonForRequest === 'other' && (!otherReason || otherReason.trim() === '')) {
    return res.status(400).json({
      message: 'Please provide a specific reason when "Other" is selected.'
    });
  }

  // Optional: basic type checks (non-blocking, just for logging/debugging)
  if (dateOfJoining && isNaN(Date.parse(dateOfJoining))) {
    return res.status(400).json({ message: 'Invalid date of joining format.' });
  }

  // You can also sanitize or normalize inputs here if needed

  next(); // All checks passed, move to controller
};
