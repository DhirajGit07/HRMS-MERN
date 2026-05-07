const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { uploadMiddleware } = require('../middlewares/uploadMiddleware1');
const multer = require('multer');
const upload = multer({ dest: 'upload/images' });
const User = require('../models/UserLogin');
const path = require('path');
const fs = require('fs');


router.put('/company-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await User.updateMany({ companyId: req.params.id }, { companyStatus: status });
    res.json({ message: "Company status updated", companyStatus: status }); // ✅ include status in response
  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
});


// ✅ Signup route
router.post(
  '/signup',
  [
    check('fullname', 'Full name is required').notEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 8+ characters').isLength({ min: 8 }),
    check('mobileNo', 'Mobile number must be 10 digits').isLength({ min: 10, max: 10 }),
    check('role', 'Role is required').isIn(['Employee', 'Admin']),
    check('companyName', 'Company is required').notEmpty(),
    // check('department', 'Department is required').notEmpty(),
  ],
  validate,
  authController.registerUser
);

// ✅ Login route
router.post(
  '/login',
  [
    check('email', 'Please include a valid email or mobile number')
      .custom((value) => {
        const isEmail = /\S+@\S+\.\S+/.test(value);
        const isMobile = /^\d{10}$/.test(value);
        return isEmail || isMobile;
      }),
    check('password', 'Password is required').exists()
  ],
  validate,
  authController.loginUser
);

// ✅ Send OTP route
router.post(
  '/send-otp',
  [
    check('email', 'Please include a valid email').isEmail()
  ],
  validate,
  authController.sendOTP
);

// ✅ Verify OTP route
router.post(
  '/verify-otp',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('otp', 'OTP is required').notEmpty()
  ],
  validate,
  authController.verifyOTP
);

// ✅ Resend OTP route
router.post(
  '/resend-otp',
  [
    check('email', 'Please include a valid email').isEmail()
  ],
  validate,
  authController.resendOTP
);

// ✅ Reset password route (updated to require OTP verification)
router.post(
  '/reset-password',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('newPassword', 'Password must be 8+ characters').isLength({ min: 8 })
  ],
  validate,
  authController.resetPassword
);

// ✅ Profile routes
router.get('/profile', authController.protect, authController.getUserProfile);

router.put(
  '/profile',
  authController.protect,
  uploadMiddleware,
  [
    check('email', 'Please include a valid email').optional().isEmail(),
    check('fullname', 'Full name must be at least 2 characters').optional().isLength({ min: 2 })
  ],
  validate,
  authController.updateUserProfile
);

// In your authRoutes.js
router.delete(
  '/profile/image', 
  authController.protect,  // Make sure this middleware is added
  uploadMiddleware, 
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // If there's an existing image, delete it from storage
      if (user.profileImage) {
        const imagePath = path.join(__dirname, '..', 'uploads', user.profileImage);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      // Update the user record
      user.profileImage = null;
      await user.save();
      
      res.status(200).json({ message: 'Profile image removed successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ✅ User management routes
router.route('/')
  .get(authController.protect, authController.getAllUsers);

router.route('/:id')
  .put(authController.protect, authController.updateUser)
  .delete(authController.protect, authController.deleteUser);

// ✅ Get unique companies
router.get('/companies', async (req, res) => {
  try {
    const companies = await User.aggregate([
      {
        $match: {
          companyId: { $exists: true, $ne: null },
          companyName: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$companyId',
          companyId: { $first: '$companyId' },
          companyName: { $first: '$companyName' },
          companyStatus: { $first: "$companyStatus" }
        },
      },
    ]);
    res.status(200).json(companies);
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
});

// ✅ Change password
router.post('/change-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required.' });
  }
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist.' });
    }
    user.password = newPassword; // triggers pre-save hash
    await user.save();
    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/company-update/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      companyName,
      companyStatus,
      startMonth,
      endMonth,
      pendingAmount,
      revisedPayment
    } = req.body;

    if (!companyName) {
      return res.status(400).json({ message: 'companyName is required' });
    }

    const updateFields = {
      companyName,
      companyStatus,
      startMonth,
      endMonth,
      pendingAmount,
      revisedPayment
    };

    const result = await User.updateMany(
      { companyId },
      updateFields
    );

    res.json({
      message: `Company data updated`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Error updating company:', err);
    res.status(500).json({ message: 'Failed to update company data' });
  }
});

// ✅ Get single company by MongoDB _id
router.get('/company/:id', async (req, res) => {
  try {
    const company = await User.findOne({ companyId: req.params.id }); // ✅ correct

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE company route
router.delete('/delete-company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;

    const existingCompany = await User.findOne({ companyId });
    if (!existingCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const result = await User.deleteMany({ companyId });

    res.status(200).json({
      message: `Company and all associated users deleted`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting company:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;