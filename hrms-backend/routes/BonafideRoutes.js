
// const express = require('express');
// const router = express.Router();
// const BonafideModel = require('../models/BonafideModel'); // <- You missed this import in your earlier get route

// const { validateBonafideLetter } = require('../middlewares/BonafideMiddleware');
// const { createBonafideLetter } = require('../controllers/BonafideController');

// router.post('/bonafide-letter', validateBonafideLetter, createBonafideLetter);

// router.get('/bonafide-letter', async (req, res) => {
//   try {
//     const letters = await BonafideModel.find()
//       .sort({ createdAt: -1 })
//       .select('-__v'); // Exclude version key
      
//     res.status(200).json(letters);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to fetch bonafide letters' });
//   }
// });
// // DELETE - Delete bonafide letter by ID
// router.delete('/bonafide-letter/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleted = await BonafideModel.findByIdAndDelete(id);

//     if (!deleted) {
//       return res.status(404).json({ message: 'Bonafide letter not found' });
//     }

//     res.status(200).json({ message: 'Bonafide letter deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting bonafide letter:', error.message);
//     res.status(500).json({ message: 'Failed to delete bonafide letter' });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const BonafideModel = require('../models/BonafideModel');
const { validateBonafideLetter } = require('../middlewares/BonafideMiddleware');
const { createBonafideLetter } = require('../controllers/BonafideController');

// POST - Create new bonafide letter
router.post('/bonafide-letter', validateBonafideLetter, createBonafideLetter);

// GET - Get all letters (for admin)
router.get('/bonafide-letter', async (req, res) => {
  try {
    // In a real app, you would check the user role here
    // For now, we'll just return all letters
    const letters = await BonafideModel.find()
      .sort({ createdAt: -1 })
      .select('-__v');
      
    res.status(200).json(letters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch bonafide letters' });
  }
});

// GET - Get letters for specific employee
router.get('/bonafide-letter/employee/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // In a real app, you would verify the requesting user is the same employee
    const letters = await BonafideModel.find({ employeeEmail: email.toLowerCase() })
      .sort({ createdAt: -1 })
      .select('-__v');
      
    res.status(200).json(letters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch bonafide letters' });
  }
});

// DELETE - Delete bonafide letter by ID
router.delete('/bonafide-letter/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real app, you would check if user is admin here
    const deleted = await BonafideModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Bonafide letter not found' });
    }

    res.status(200).json({ message: 'Bonafide letter deleted successfully' });
  } catch (error) {
    console.error('Error deleting bonafide letter:', error.message);
    res.status(500).json({ message: 'Failed to delete bonafide letter' });
  }
});

module.exports = router;