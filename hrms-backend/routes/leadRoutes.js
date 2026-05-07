const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

// Create a new lead
router.post('/leads', leadController.createLead);

// Get all leads
router.get('/leads', leadController.getAllLeads);

router.get('/leads/:id', leadController.getLeadById); // <--- THIS LINE IS CRUCIAL


module.exports = router;
