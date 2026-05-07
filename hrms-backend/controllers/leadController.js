const Lead = require('../models/Lead');

// Create new lead
exports.createLead = async (req, res) => {
  try {
    const newLead = new Lead(req.body);
    const savedLead = await newLead.save();
    res.status(201).json(savedLead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lead', details: error.message });
  }
};

// Get all leads
exports.getAllLeads = async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 }); // most recent first
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads', details: error.message });
  }
};

// Get a single lead by ID
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id); // Find lead by ID from the URL parameter

    if (!lead) {
      // If no lead is found with the given ID, send a 404 Not Found response
      return res.status(404).json({ message: 'Lead not found' });
    }

    // If a lead is found, send it as a JSON response
    res.status(200).json(lead);
  } catch (error) {
    console.error('Error fetching lead by ID:', error);
    // Handle cases where the provided ID format is invalid (e.g., not a valid MongoDB ObjectId)
    if (error.name === 'CastError') { // Mongoose throws CastError for invalid ObjectId format
      return res.status(400).json({ message: 'Invalid lead ID format.' });
    }
    // For any other server-side errors, send a 500 Internal Server Error
    res.status(500).send('Server Error');
  }
};