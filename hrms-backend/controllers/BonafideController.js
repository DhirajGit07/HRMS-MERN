// const BonafideLetter = require('../models/BonafideModel'); // Adjust path if needed

// exports.createBonafideLetter = async (req, res) => {
//   try {
//     const data = req.body;

//     const newLetter = new BonafideLetter({
//       employeeId: data.employeeId,
//       requestDate: data.requestDate,
//       dateOfJoining: data.dateOfJoining || null,
//       designation: data.designation || '',
//       department: data.department || '',
//       reasonForRequest: data.reasonForRequest,
//       otherReason: data.otherReason || ''
//     });

//     const savedLetter = await newLetter.save();
//     res.status(201).json({ message: 'Bonafide letter submitted', data: savedLetter });
//   } catch (error) {
//     console.error('Error saving bonafide letter:', error.message, error.stack);
//     res.status(500).json({ message: 'Failed to submit bonafide letter' });
//   }
// };


const BonafideLetter = require('../models/BonafideModel');

exports.createBonafideLetter = async (req, res) => {
  try {
    const data = req.body;

    const newLetter = new BonafideLetter({
      employeeId: data.employeeId,
      employeeEmail: data.employeeEmail.toLowerCase(), // Store lowercase
      requestDate: data.requestDate,
      dateOfJoining: data.dateOfJoining || null,
      designation: data.designation || '',
      department: data.department || '',
      reasonForRequest: data.reasonForRequest,
      otherReason: data.otherReason || ''
    });

    const savedLetter = await newLetter.save();
    res.status(201).json({ 
      message: 'Bonafide letter submitted', 
      data: savedLetter 
    });
  } catch (error) {
    console.error('Error saving bonafide letter:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to submit bonafide letter' });
  }
};