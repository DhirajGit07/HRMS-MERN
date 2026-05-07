

// const express = require('express');
// const router = express.Router();
// const upload = require('../middlewares/employeeuploadMiddleware');
// const EmployeeFile = require('../models/employeeFile');
// const { uploadEmployeeFile } = require('../controllers/EmployeefileController');

// // POST route for file upload
// router.post('/Empuploads', upload.single('employeeFile'), uploadEmployeeFile);

// router.get('/employee-files', async (req, res) => {
//   try {
//     const files = await EmployeeFile.find()
//       .sort({ updatedAt: -1 })
//       .lean();
    
//     // Safely transform the data
//     const transformedFiles = files.map(file => {
//       // Ensure sharedWith is always treated as an array
//       const sharedWithArray = Array.isArray(file.sharedWith) 
//         ? file.sharedWith 
//         : (file.sharedWith ? [file.sharedWith] : []);
      
//       return {
//         ...file,
//         sharedWith: sharedWithArray.join(', '), // Now safe to join
//         sharedWithArray: sharedWithArray, // Keep original array format if needed
//         updatedAt: file.updatedAt,
//         _id: file._id.toString(),
//         fileName: file.filePath?.split('/').pop() || '' // Safe file name extraction
//       };
//     });

//     res.status(200).json(transformedFiles);
//   } catch (err) {
//     console.error('Detailed fetch error:', {
//       message: err.message,
//       stack: err.stack,
//       query: err.query,
//       parameters: err.parameters
//     });
//     res.status(500).json({ 
//       error: 'Server error while fetching files',
//       details: err.message
//     });
//   }
// });

// // GET route to fetch files for a specific employee
// router.get('/employee-files/:employeeId', async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     const files = await EmployeeFile.find({ sharedWith: employeeId })
//       .sort({ updatedAt: -1 });
    
//     res.status(200).json(files);
//   } catch (err) {
//     console.error('Fetch error:', err);
//     res.status(500).json({ 
//       error: 'Server error while fetching employee files',
//       details: err.message 
//     });
//   }
// });

// // Add this route to your existing routes
// router.delete('/:fileId', async (req, res) => {
//   try {
//     const { fileId } = req.params;
    
//     // First find the file to get its path
//     const file = await EmployeeFile.findById(fileId);
//     if (!file) {
//       return res.status(404).json({ error: 'File not found' });
//     }

//     // Delete from database
//     await EmployeeFile.findByIdAndDelete(fileId);
    
//     // Optionally: Delete the actual file from storage
//     // You would need to implement this using fs or your storage system
//     // fs.unlinkSync(file.filePath); 

//     res.status(200).json({ message: 'File deleted successfully' });
//   } catch (err) {
//     console.error('Delete error:', {
//       message: err.message,
//       stack: err.stack
//     });
//     res.status(500).json({ 
//       error: 'Server error while deleting file',
//       details: err.message 
//     });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const upload = require('../middlewares/employeeuploadMiddleware');
const EmployeeFile = require('../models/employeeFile');
const { uploadEmployeeFile } = require('../controllers/EmployeefileController');
const path = require('path');
const fs = require('fs');

// Serve static files from uploads directory
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// POST route for file upload
router.post('/Empuploads', upload.single('employeeFile'), uploadEmployeeFile);

// GET route to download a file
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await EmployeeFile.findById(fileId);
    
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

router.get('/employee-files', async (req, res) => {
  try {
    const files = await EmployeeFile.find()
      .sort({ updatedAt: -1 })
      .lean();
    
    // Safely transform the data
    const transformedFiles = files.map(file => {
      // Ensure sharedWith is always treated as an array
      const sharedWithArray = Array.isArray(file.sharedWith) 
        ? file.sharedWith 
        : (file.sharedWith ? [file.sharedWith] : []);
      
      return {
        ...file,
        sharedWith: sharedWithArray.join(', '), // Now safe to join
        sharedWithArray: sharedWithArray, // Keep original array format if needed
        updatedAt: file.updatedAt,
        _id: file._id.toString(),
        fileName: file.filePath?.split('/').pop() || '' // Safe file name extraction
      };
    });

    res.status(200).json(transformedFiles);
  } catch (err) {
    console.error('Detailed fetch error:', {
      message: err.message,
      stack: err.stack,
      query: err.query,
      parameters: err.parameters
    });
    res.status(500).json({ 
      error: 'Server error while fetching files',
      details: err.message
    });
  }
});

// GET route to fetch files for a specific employee
router.get('/employee-files/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const files = await EmployeeFile.find({ sharedWith: employeeId })
      .sort({ updatedAt: -1 });
    
    res.status(200).json(files);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ 
      error: 'Server error while fetching employee files',
      details: err.message 
    });
  }
});

// Add this route to your existing routes
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // First find the file to get its path
    const file = await EmployeeFile.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from database
    await EmployeeFile.findByIdAndDelete(fileId);

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete error:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Server error while deleting file',
      details: err.message 
    });
  }
});

module.exports = router;