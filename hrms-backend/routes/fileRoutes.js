

// const express = require('express');
// const router = express.Router();
// const upload = require('../middlewares/uploadMiddleware');
// const File = require('../models/File');
// const { uploadFile } = require('../controllers/fileController');

// // POST - Upload file
// router.post('/uploads', upload.single('file'), uploadFile);

// // GET - Fetch all organization files sorted by createdAt (newest first)
// router.get('/organization-files', async (req, res) => {
//   try {
//     const files = await File.find().sort({ createdAt: -1 });
//     res.status(200).json(files);
//   } catch (error) {
//     console.error('Error fetching files:', error);
//     res.status(500).json({ message: 'Failed to fetch files' });
//   }
// });

// // DELETE - Delete a file
// router.delete('/organization-files/:id', async (req, res) => {
//   try {
//     const file = await File.findByIdAndDelete(req.params.id);
//     if (!file) {
//       return res.status(404).json({ message: 'File not found' });
//     }
//     res.status(200).json({ message: 'File deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting file:', error);
//     res.status(500).json({ message: 'Failed to delete file' });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const File = require('../models/File');
const { uploadFile } = require('../controllers/fileController');
const path = require('path');
const fs = require('fs');

// POST - Upload file
router.post('/uploads', upload.single('file'), uploadFile);

// GET - Fetch all organization files sorted by createdAt (newest first)
router.get('/organization-files', async (req, res) => {
  try {
    const files = await File.find().sort({ createdAt: -1 });
    res.status(200).json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Failed to fetch files' });
  }
});

// GET - Download a file
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(__dirname, '..', file.filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ 
      error: 'Server error while downloading file',
      details: err.message 
    });
  }
});

// DELETE - Delete a file
router.delete('/organization-files/:id', async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

module.exports = router;