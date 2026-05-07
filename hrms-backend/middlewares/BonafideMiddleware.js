// // bonafideLetterValidator.js

// exports.validateBonafideLetter = (req, res, next) => {
//   const {
//     employeeId,
//     requestDate,
//     reasonForRequest,
//     otherReason
//   } = req.body;

//   // Required field validation
//   if (!employeeId || !requestDate || !reasonForRequest) {
//     return res.status(400).json({
//       message: 'Employee ID, request date, and reason for request are required.'
//     });
//   }

//   // Conditionally required: otherReason if "other" is selected
//   if (reasonForRequest === 'other' && (!otherReason || otherReason.trim() === '')) {
//     return res.status(400).json({
//       message: 'Please specify the reason when selecting "Other".'
//     });
//   }

//   next(); // Proceed to controller or next middleware
// };



exports.validateBonafideLetter = (req, res, next) => {
  const {
    employeeId,
    employeeEmail,  // Add this
    requestDate,
    reasonForRequest,
    otherReason
  } = req.body;

  // Required field validation
  if (!employeeId || !employeeEmail || !requestDate || !reasonForRequest) {
    return res.status(400).json({
      message: 'Employee ID, email, request date, and reason for request are required.'
    });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeEmail)) {
    return res.status(400).json({
      message: 'Please provide a valid email address.'
    });
  }

  // Conditionally required: otherReason if "other" is selected
  if (reasonForRequest === 'other' && (!otherReason || otherReason.trim() === '')) {
    return res.status(400).json({
      message: 'Please specify the reason when selecting "Other".'
    });
  }

  next();
};