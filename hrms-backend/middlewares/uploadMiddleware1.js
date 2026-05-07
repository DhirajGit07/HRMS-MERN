// middlewares/uploadMiddleware.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'upload/images';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});

// Allow only image uploads
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Accept profileImage as file, rest as text fields
const upload = multer({ storage, fileFilter });

const uploadMiddleware = upload.fields([
  { name: 'profileImage', maxCount: 1 }
]);

module.exports = { uploadMiddleware };
