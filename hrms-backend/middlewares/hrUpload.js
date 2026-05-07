const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory for HR forms if it doesn't exist
const hrUploadDir = path.join(process.cwd(), 'upload', 'HRForms');
if (!fs.existsSync(hrUploadDir)) {
  fs.mkdirSync(hrUploadDir, { recursive: true });
}

const hrStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, hrUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});


// Updated file filter to accept multiple file types
const hrFileFilter = (req, file, cb) => {
  // Allow these MIME types
  const allowedMimeTypes = [
    'application/pdf', // PDF
    'application/msword', // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.ms-excel', // XLS
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, Excel, text, image, and archive files are allowed'), false);
  }
};

// Create the multer instance for HR forms
const hrUpload = multer({ 
  storage: hrStorage,
  fileFilter: hrFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

module.exports = hrUpload;