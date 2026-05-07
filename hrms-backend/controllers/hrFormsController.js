const HRForm = require('../models/HRForm');
const fs = require('fs');
const path = require('path');

// Get all HR forms
exports.getAllHRForms = async (req, res) => {
  try {
    const forms = await HRForm.find().sort({ createdAt: -1 });
    res.status(200).json(forms);
  } catch (error) {
    console.error('Error fetching HR forms:', error);
    res.status(500).json({ message: 'Server error while fetching HR forms' });
  }
};

// Upload a new HR form
exports.uploadHRForm = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { fileName, description, employeeId, employeeName } = req.body;

    const newForm = new HRForm({
      name: fileName,
       employeeId,
      employeeName,
      
      description,
      filePath: req.file.path,
      originalFileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });

    await newForm.save();

    res.status(201).json(newForm);
  } catch (error) {
    console.error('Error uploading HR form:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
    
    res.status(500).json({ message: 'Server error while uploading HR form' });
  }
};

// Download an HR form
exports.downloadHRForm = async (req, res) => {
  try {
    const form = await HRForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: 'HR form not found' });
    }

    if (!fs.existsSync(form.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(form.filePath, form.originalFileName);
  } catch (error) {
    console.error('Error downloading HR form:', error);
    res.status(500).json({ message: 'Server error while downloading HR form' });
  }
};

// Delete an HR form
exports.deleteHRForm = async (req, res) => {
  try {
    const form = await HRForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: 'HR form not found' });
    }

    // Delete the file from the filesystem
    if (fs.existsSync(form.filePath)) {
      fs.unlink(form.filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    await HRForm.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'HR form deleted successfully' });
  } catch (error) {
    console.error('Error deleting HR form:', error);
    res.status(500).json({ message: 'Server error while deleting HR form' });
  }
};