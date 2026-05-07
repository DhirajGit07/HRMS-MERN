// routes/candidates.js
const express   = require('express');
const router    = express.Router();
const Candidate = require('../models/Candidate');

// ▶️ Helper: convert "Yes"/"No" strings into true/false
function normalizeOfferLetter(val) {
  if (typeof val === 'boolean') return val;
  return String(val).toLowerCase() === 'yes';
}

// GET all candidates
router.get('/', async (req, res) => {
  try {
    const candidates = await Candidate.find();
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a single candidate by ID
router.get('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE a new candidate
router.post('/', async (req, res) => {
  try {
    // 1️⃣ Normalize the offerLetterReceived field
    const body = {
      ...req.body,
      offerLetterReceived: normalizeOfferLetter(req.body.offerLetterReceived)
    };

    // 2️⃣ Check for duplicates
    const existing = await Candidate.findOne({
      $or: [
        { employeeId: body.employeeId },
        { candidateId: body.candidateId },
        { email:      body.email      },
        { mobile:     body.mobile     },
        { panCard:    body.panCard    },
        { aadhaarCard:body.aadhaarCard },
        ...(body.uanNumber ? [{ uanNumber: body.uanNumber }] : [])
      ]
    });
    if (existing) {
      const dupe = [];
      if (existing.employeeId === body.employeeId)    dupe.push('employeeId');
         if (existing.candidateId === body.candidateId)    dupe.push('Candiadte');
      if (existing.email      === body.email)         dupe.push('email');
      if (existing.mobile     === body.mobile)        dupe.push('mobile');
      if (existing.panCard    === body.panCard)       dupe.push('PAN card');
      if (existing.aadhaarCard=== body.aadhaarCard)   dupe.push('Aadhaar card');
      if (body.uanNumber && existing.uanNumber === body.uanNumber) dupe.push('UAN number');

      return res.status(409).json({
        success:   false,
        message:   'Duplicate values found',
        duplicates: dupe
      });
    }

    // 3️⃣ Save
    const newCandidate = new Candidate(body);
    await newCandidate.save();
    res.status(201).json({
      success:   true,
      message:   'Candidate added successfully',
      candidate: newCandidate
    });
  } catch (error) {
    console.error('Error saving candidate:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// UPDATE an existing candidate
router.put('/:id', async (req, res) => {
  try {
    // 1️⃣ Normalize the offerLetterReceived field
    const body = {
      ...req.body,
      offerLetterReceived: normalizeOfferLetter(req.body.offerLetterReceived)
    };

    // 2️⃣ Ensure candidate exists
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // 3️⃣ Check duplicates among *other* docs
    const existing = await Candidate.findOne({
      _id: { $ne: req.params.id },
      $or: [
        { employeeId: body.employeeId },
         { candidateId: body.candidateId },
        { email:      body.email      },
        { mobile:     body.mobile     },
        { panCard:    body.panCard    },
        { aadhaarCard:body.aadhaarCard },
        ...(body.uanNumber ? [{ uanNumber: body.uanNumber }] : [])
      ]
    });
    if (existing) {
      const dupe = [];
      if (existing.employeeId === body.employeeId)    dupe.push('employeeId');
        if (existing.candidateId === body.candidateId)    dupe.push('Candiadte');
      if (existing.email      === body.email)         dupe.push('email');
      if (existing.mobile     === body.mobile)        dupe.push('mobile');
      if (existing.panCard    === body.panCard)       dupe.push('PAN card');
      if (existing.aadhaarCard=== body.aadhaarCard)   dupe.push('Aadhaar card');
      if (body.uanNumber && existing.uanNumber === body.uanNumber) dupe.push('UAN number');

      return res.status(409).json({
        success:   false,
        message:   'Duplicate values found',
        duplicates: dupe
      });
    }

    // 4️⃣ Update & return
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true, runValidators: true }
    );
    res.json({
      success:   true,
      message:   'Candidate updated successfully',
      candidate: updatedCandidate
    });
  } catch (error) {
    console.error('Error updating candidate:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE a candidate
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Candidate.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }
    res.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
