

const EmployeeFile = require('../models/employeeFile');

exports.uploadEmployeeFile = async (req, res) => {
  try {
    const {
       employeeId,
      employeeName,
      name,
      description,
      sharedWithType,
      employeeIds,
      folder,
      expiryDate,
      isPolicy,
      noDeadline,
      enforceDeadline,
      ackDeadline,
      downloadAccess,
      notifyFeed,
      notifyEmail,
      permissions
    } = req.body;

    // Convert comma-separated string to array of employee IDs
    const sharedWith = employeeIds ? employeeIds.split(',') : [];

    const newFile = new EmployeeFile({
      employeeId, // Use the employeeId from the request body
      employeeName, // Use the employeeName from the request body
      name,
      description,
      sharedWithType: sharedWith.length > 1 ? 'multiple' : sharedWithType,
      sharedWith,
      folder,
      expiryDate: expiryDate || null,
      isPolicy: isPolicy || false,
      noDeadline: noDeadline || false,
      enforceDeadline: enforceDeadline || false,
      ackDeadline: ackDeadline || null,
      downloadAccess: downloadAccess || false,
      notifyFeed: notifyFeed || false,
      notifyEmail: notifyEmail || false,
      permissions: permissions ? JSON.parse(permissions) : {
        view: { employee: true, manager: false },
        download: { employee: true, manager: false }
      },
      filePath: req.file?.path || ''
    });

    await newFile.save();
    res.status(201).json({ 
      message: 'Employee file uploaded successfully', 
      file: newFile 
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ 
      error: 'Server error while uploading file',
      details: err.message 
    });
  }
};