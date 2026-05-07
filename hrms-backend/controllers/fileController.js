const File = require('../models/File');

exports.uploadFile = async (req, res) => {
  try {
    const {
       employeeId,
      employeeName,
      name, description, sharedWith, folder, expiryDate,
      isPolicy, noDeadline, enforceDeadline, ackDeadline,
      downloadAccess, notifyFeed, notifyEmail
    } = req.body;

    const fileData = new File({
       employeeId,
      employeeName,
      name,
      description,
      sharedWith,
      folder,
      expiryDate,
      isPolicy,
      noDeadline,
      enforceDeadline,
      ackDeadline,
      downloadAccess,
      notifyFeed,
      notifyEmail,
      filePath: req.file?.path || '',
    });

    await fileData.save();
    res.status(201).json({ message: 'File uploaded successfully', file: fileData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while uploading file' });
  }
};
