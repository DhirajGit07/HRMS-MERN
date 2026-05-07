// hrms-backend/routes/settings.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

// — multer storage for wallpaper →
const wallpaperStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../upload/wallpaper'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const uploadWallpaper = multer({ storage: wallpaperStorage });

// — multer storage for logo →
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../upload/logo'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const uploadLogo = multer({ storage: logoStorage });

/**
 * POST /api/settings/upload-wallpaper
 * Accepts field `wallpaper` (multipart/form-data)
 * → saves file under /upload/wallpaper
 * → returns { wallpaperUrl }
 */
router.post(
  '/upload-wallpaper',
  uploadWallpaper.single('wallpaper'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const wallpaperUrl = `/upload/wallpaper/${req.file.filename}`;
    res.json({ wallpaperUrl });
  }
);

/**
 * POST /api/settings/upload-logo
 * Accepts field `logo` (multipart/form-data)
 * → saves file under /upload/logo
 * → returns { logoUrl }
 */
router.post(
  '/upload-logo',
  uploadLogo.single('logo'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const logoUrl = `/upload/logo/${req.file.filename}`;
    res.json({ logoUrl });
  }
);

/**
 * POST /api/settings
 * Body: { dashboardName, wallpaper, logo }
 * → create or update the Setting document
 */
router.post('/', settingsController.saveSettings);

/**
 * GET /api/settings
 * → return the Setting document
 */
router.get('/', settingsController.getSettings);

module.exports = router;
