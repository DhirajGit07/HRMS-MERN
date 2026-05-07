const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define schema for working-from options
const workingFromSchema = new mongoose.Schema({
    companyId: { type: String, required: true },
    option: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const WorkingFromOption = mongoose.model('WorkingFromOption', workingFromSchema);

// POST: Save a new working-from option
router.post('/working-from-options', async (req, res) => {
    try {
        const { companyId, option } = req.body;
        if (!companyId || !option) {
            return res.status(400).json({ message: 'companyId and option are required' });
        }
        const existingOption = await WorkingFromOption.findOne({ companyId, option });
        if (existingOption) {
            return res.status(400).json({ message: 'Option already exists' });
        }
        const newOption = new WorkingFromOption({ companyId, option });
        await newOption.save();
        res.status(201).json({ message: 'Option saved successfully', option });
    } catch (error) {
        console.error('Error saving working-from option:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET: Fetch working-from options for a company
router.get('/working-from-options', async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId) {
            return res.status(400).json({ message: 'companyId is required' });
        }
        const options = await WorkingFromOption.find({ companyId }).select('option');
        res.status(200).json({ options: options.map(opt => opt.option) });
    } catch (error) {
        console.error('Error fetching working-from options:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE: Remove a working-from option
router.delete('/working-from-options', async (req, res) => {
    try {
        const { companyId, option } = req.body;
        if (!companyId || !option) {
            return res.status(400).json({ message: 'companyId and option are required' });
        }
        const result = await WorkingFromOption.deleteOne({ companyId, option });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Option not found' });
        }
        res.status(200).json({ message: 'Option deleted successfully' });
    } catch (error) {
        console.error('Error deleting working-from option:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;