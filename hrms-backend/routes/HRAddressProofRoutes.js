const express = require('express');
const router = express.Router();
const HRAddressProof = require('../models/HRAddressProofModel');
const { createAddressProof } = require('../controllers/HRAddressProofController');
const { validateAddressProof } = require('../middlewares/HRValidationMiddleware');

router.post('/address-proof', validateAddressProof, createAddressProof);

// ✅ GET - Fetch all address proofs
router.get('/address-proof', async (req, res) => {
  try {
    const proofs = await HRAddressProof.find().sort({ createdAt: -1 });
    res.status(200).json(proofs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch address proofs' });
  }
});

// DELETE - Delete address proof by ID
router.delete('/address-proof/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await HRAddressProof.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Address proof not found' });
    }

    res.status(200).json({ message: 'Address proof deleted successfully' });
  } catch (error) {
    console.error('Error deleting address proof:', error.message);
    res.status(500).json({ message: 'Failed to delete address proof' });
  }
});

module.exports = router;
