const PFESICRecord = require('../models/PFESICRecord');
const fs          = require('fs');
const path        = require('path');

// Create a new record
exports.createRecord = async (req, res) => {
  try {
    const data = req.body;
    let docPath = null;

    if (req.file) {
      docPath = `PFESICRecords/${req.file.filename}`;
    }

    const newRecord = new PFESICRecord({
      ...data,
      docPath,
      recordType: data.recordType || 'PF'
    });

    await newRecord.save();
    return res.status(201).json(newRecord);

  } catch (error) {
    // 1) Duplicate key → 409 Conflict
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A record for this employee and type already exists'
      });
    }

    // 2) Mongoose validation → 400 Bad Request
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.values(error.errors).forEach(errObj => {
        errors[errObj.path] = errObj.message;
      });
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    // 3) Any other error → 500 Internal Server Error
    console.error('PFESIC createRecord error:', error);
    return res.status(500).json({
      message: 'Server error creating record'
    });
  }
};

// Get all records (with optional filtering by type)
exports.getAllRecords = async (req, res) => {
  try {
    const { type } = req.query;
    const query   = type ? { recordType: type } : {};
    const records = await PFESICRecord.find(query).sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error('PFESIC getAllRecords error:', error);
    res.status(500).json({ message: 'Server error fetching records' });
  }
};

// Get a single record by ID
exports.getRecord = async (req, res) => {
  try {
    const record = await PFESICRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (error) {
    console.error('PFESIC getRecord error:', error);
    res.status(500).json({ message: 'Server error fetching record' });
  }
};

// Update an existing record
exports.updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const data   = req.body;

    const existing = await PFESICRecord.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Record not found' });
    }

    let docPath = existing.docPath;
    if (req.file) {
      // delete old file
      if (existing.docPath) {
        const oldPath= path.join(process.cwd(), 'upload', existing.docPath);
        fs.unlink(oldPath, err => { if (err) console.error(err); });
      }
      docPath = `PFESICRecords/${req.file.filename}`;
    }

    const updated = await PFESICRecord.findByIdAndUpdate(
      id,
      {
        ...data,
        docPath,
        dob:       data.dob ? new Date(data.dob) : existing.dob,
        actualDoj: data.actualDoj ? new Date(data.actualDoj) : existing.actualDoj,
        dojepfo:   data.dojepfo ? new Date(data.dojepfo) : existing.dojepfo,
        leaving:   data.leaving ? new Date(data.leaving) : existing.leaving
      },
      { new: true, runValidators: true }
    );
    res.json(updated);

  } catch (error) {
    // duplicate key
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A record for this employee and type already exists'
      });
    }
    // validation
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.values(error.errors).forEach(errObj => {
        errors[errObj.path] = errObj.message;
      });
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }
    console.error('PFESIC updateRecord error:', error);
    res.status(500).json({ message: 'Server error updating record' });
  }
};

// Delete a record
exports.deleteRecord = async (req, res) => {
  try {
    const record = await PFESICRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    // delete file
    if (record.docPath) {
      const filePath = path.join(process.cwd(), 'upload', record.docPath);
      fs.unlink(filePath, err => { if (err) console.error(err); });
    }
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('PFESIC deleteRecord error:', error);
    res.status(500).json({ message: 'Server error deleting record' });
  }
};

// Download a record’s PDF
exports.downloadDocument = async (req, res) => {
  try {
    console.log('Download request received for ID:', req.params.id);
    
    const record = await PFESICRecord.findById(req.params.id);
    if (!record || !record.docPath) {
      console.log('Document not found in database');
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = path.join(process.cwd(), 'upload', record.docPath);
    console.log('Looking for file at:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found at path:', filePath);
      return res.status(404).json({ message: 'File not found on server' });
    }

    const filename = req.query.filename || path.basename(record.docPath);
    console.log('Serving file:', filename);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file' });
      }
    });

  } catch (error) {
    console.error('PFESIC downloadDocument error:', error);
    res.status(500).json({ message: 'Server error downloading document' });
  }
};