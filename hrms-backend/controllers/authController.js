const UserLogin = require('../models/UserLogin');
const Attendance = require('../models/Attendance');
const asyncHandler = require('express-async-handler');
const generateToken = require('../utils/generateToken');
const jwt = require('jsonwebtoken');
const { uploadMiddleware } = require('../middlewares/uploadMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'upload/images' });
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send OTP email (real implementation)
const sendOTPEmail = async (email, otp) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
      throw new Error('Email service not configured');
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Password Reset OTP - HRMS System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #3ba4ff, #191a1a);
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 20px;
              border-radius: 0 0 10px 10px;
            }
            .otp-code {
              background: #3ba4ff;
              color: white;
              padding: 15px;
              font-size: 24px;
              font-weight: bold;
              text-align: center;
              border-radius: 5px;
              margin: 20px 0;
              letter-spacing: 3px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>HRMS System</h2>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested to reset your password. Use the OTP code below to verify your identity:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p>This OTP will expire in <strong>10 minutes</strong>.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            
            <p>Best regards,<br>HRMS Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully to:', email);
    return result;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

const registerUser = async (req, res) => {
  try {
    const {
      fullname,
      email,
      password,
      mobileNo,
      role = 'Employee',
      companyName,
      department,
      startMonth,
      endMonth,
      pendingAmount,
      revisedPayment,
      candidateId
    } = req.body;

    // Validate required fields
    if (!fullname || !email || !password || !mobileNo || !companyName) {
      return res.status(400).json({
        message: 'Missing required fields: fullname, email, password, mobileNo, companyName'
      });
    }

    // Check for existing user by email or mobile
    const existingUser = await UserLogin.findOne({
      $or: [{ email: email.toLowerCase() }, { mobileNo }]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      if (existingUser.mobileNo === mobileNo) {
        return res.status(400).json({ message: 'Mobile number already exists' });
      }
    }

    // Generate or reuse companyId
    let companyId;
    const existingCompany = await UserLogin.findOne({
      companyName: { $regex: new RegExp(`^${companyName}$`, 'i') }
    });

    if (existingCompany && existingCompany.companyId) {
      companyId = existingCompany.companyId;
    } else {
      const prefix = companyName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'COMP';
      const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit random
      companyId = `${prefix}_${randomNum}`;
    }

    let systemId;
    let employeeId;

    // For Employee and Admin roles, generate proper IDs
    if (role === 'Employee' || role === 'Admin') {
      // Use candidateId if provided for systemId
      if (candidateId) {
        systemId = candidateId;
      }

      // Generate employee ID
      const existingEmployees = await UserLogin.find({
        companyId,
        role: { $in: ['Employee', 'Admin'] }
      });

      // Find the next available employee number
      let nextNumber = 1;
      const usedNumbers = [];

      existingEmployees.forEach(emp => {
        if (emp.employeeId && emp.employeeId.startsWith(companyId)) {
          const parts = emp.employeeId.split('-');
          const num = parseInt(parts[parts.length - 1]);
          if (!isNaN(num)) {
            usedNumbers.push(num);
          }
        }
      });

      if (usedNumbers.length > 0) {
        nextNumber = Math.max(...usedNumbers) + 1;
      }

      employeeId = `${companyId}-${String(nextNumber).padStart(3, '0')}`;

      // If no candidateId provided, use employeeId as systemId
      if (!candidateId) {
        systemId = employeeId;
      }
    } else {
      // For other roles (like SuperAdmin), generate unique IDs
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      employeeId = `${companyId}-${randomSuffix}`;
      systemId = candidateId || employeeId;
    }

    const user = await UserLogin.create({
      fullname: fullname.trim(),
      email: email.toLowerCase().trim(),
      password,
      mobileNo: mobileNo.trim(),
      role,
      companyName: companyName.trim(),
      companyId,
      systemId,
      employeeId,
      candidateId: candidateId || undefined,
      department: department ? department.trim() : undefined,
      companyStatus: 'active',
      startMonth: startMonth || undefined,
      endMonth: endMonth || undefined,
      pendingAmount: pendingAmount || 0,
      revisedPayment: revisedPayment || 0
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.companyName,
        systemId: user.systemId,
        employeeId: user.employeeId,
        candidateId: user.candidateId || null,
        department: user.department || null,
      },
    });
  } catch (error) {
    console.error('Signup error details:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        message: `${field} already exists`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({ message: 'Server error during signup' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email/mobile and password');
  }

  const isEmail = /\S+@\S+\.\S+/.test(email);
  const isMobile = /^\d{10}$/.test(email);
  if (!isEmail && !isMobile) {
    res.status(400);
    throw new Error('Please provide a valid email or 10-digit mobile number');
  }

  const query = isEmail ? { email } : { mobileNo: email };
  const user = await UserLogin.findOne(query).select('+password +companyStatus');

  if (!user) {
    res.status(401);
    throw new Error('User not found. Please sign up first.');
  }

  // ❌ Block if user is inactive
  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account is not active.');
  }

  // ❌ Block if company is inactive
  if (user.companyStatus === 'inactive') {
    res.status(403);
    throw new Error('Your company is inactive. Please contact SuperAdmin.');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  user.lastLogin = new Date();
  await user.save();

  res.status(200).json({
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    mobileNo: user.mobileNo,
    role: user.role,
    employeeId: user.employeeId,
    department: user.department,
    companyId: user.companyId,
    companyName: user.companyName,
    companyStatus: user.companyStatus,
    token: generateToken(user._id),
    message: 'Login successful'
  });
});

// @desc    Send OTP for password reset
// @route   POST /api/users/send-otp
// @access  Public
const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await UserLogin.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found with this email');
  }

  try {
    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    user.otpAttempts = 0;
    user.isOtpVerified = false;

    await user.save();

    // Send OTP via email
    await sendOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      email: email
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500);
    throw new Error('Failed to send OTP email. Please try again later.');
  }
});

// @desc    Verify OTP
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }

  const user = await UserLogin.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if OTP exists and is not expired
  if (!user.otp || user.otpExpires < new Date()) {
    res.status(400);
    throw new Error('OTP has expired. Please request a new one.');
  }

  // Check OTP attempts
  if (user.otpAttempts >= 5) {
    res.status(429);
    throw new Error('Too many OTP attempts. Please request a new OTP.');
  }

  // Verify OTP
  if (user.otp !== otp) {
    user.otpAttempts += 1;
    await user.save();

    res.status(400);
    throw new Error('Invalid OTP');
  }

  // OTP is valid
  user.isOtpVerified = true;
  user.otpAttempts = 0;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
    email: email
  });
});

// @desc    Resend OTP
// @route   POST /api/users/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await UserLogin.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found with this email');
  }

  try {
    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    user.otpAttempts = 0;
    user.isOtpVerified = false;

    await user.save();

    // Send new OTP via email
    await sendOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'New OTP sent to your email'
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500);
    throw new Error('Failed to resend OTP email. Please try again later.');
  }
});

// @desc    Reset password (updated to require OTP verification)
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    res.status(400);
    throw new Error('Email and new password are required');
  }

  const user = await UserLogin.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found with this email');
  }

  // Check if OTP is verified
  if (!user.isOtpVerified) {
    res.status(400);
    throw new Error('OTP verification required before password reset');
  }

  // Reset password
  user.password = newPassword;
  user.otp = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  user.isOtpVerified = false;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await UserLogin.findById(req.user.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    companyName: user.companyName,
    companyId: user.companyId,
    fullname: user.fullname,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    employeeId: user.employeeId,
    mobileNo: user.mobileNo,
    department: user.department,
    designation: user.designation,
    employeeStatus: user.employeeStatus,
    sourceOfHire: user.sourceOfHire,
    dateOfJoining: user.dateOfJoining,
    currentExperience: user.currentExperience,
    totalExperience: user.totalExperience,
    dob: user.dob,
    expertise: user.expertise,
    gender: user.gender,
    maritalStatus: user.maritalStatus,
    aboutMe: user.aboutMe,
    uanNO: user.uanNO,
    panNO: user.panNO,
    aadhaarNO: user.aadhaarNO,
    location: user.location,
    employmentType: user.employmentType,
    hrmsRole: user.hrmsRole,

    profileImage: user.profileImage,
    ProbationPeriodStart: user.ProbationPeriodStart,
    ProbationPeriodEnd: user.ProbationPeriodEnd,
    NoticePeriodStart: user.NoticePeriodStart,
    NoticePeriodEnd: user.NoticePeriodEnd,
  });
});

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await UserLogin.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (req.files?.profileImage) {
    user.profileImage = `/upload/images/${req.files.profileImage[0].filename}`;
  }

  const updates = [
    'fullname', 'email', 'firstName', 'lastName', 'department', 'designation',
    'aboutMe', 'employeeId', 'mobileNo', 'role', 'ctc', 'bod', 'hrmsRole', 'location',
    'employmentType', 'employeeStatus', 'sourceOfHire', 'dateOfJoining', 'currentExperience',
    'totalExperience', 'uanNO', 'panNO', 'aadhaarNO', 'dob', 'expertise', 'gender', 'maritalStatus',
    'ProbationPeriodStart', 'ProbationPeriodEnd', 'NoticePeriodStart', 'NoticePeriodEnd', 'companyId', 'companyName'
  ];
  updates.forEach(field => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
      if (field === 'employeeStatus') user.isActive = (req.body[field] === 'Active');
    }
  });

  const updated = await user.save();
  res.status(200).json({
    _id: updated._id,
    fullname: updated.fullname,
    email: updated.email,
    mobileNo: updated.mobileNo,
    role: updated.role,
    employeeId: updated.employeeId,
    department: updated.department,
    companyId: updated.companyId,
    companyName: updated.companyName,
    employeeStatus: updated.employeeStatus,
    message: 'Profile updated successfully'
  });
});

// @desc    Admin-only: Get all users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await UserLogin.find({}).select('-password');
  res.status(200).json(users);
});

// @desc    Admin-only: Update user by id
const updateUser = asyncHandler(async (req, res) => {
  const user = await UserLogin.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const {
    fullname, email, mobileNo, role,
    employeeId, candidateId, department, ctc, bod,
    employeeStatus, companyId, companyName
  } = req.body;

  if (fullname !== undefined) user.fullname = fullname;
  if (email !== undefined) user.email = email;
  if (mobileNo !== undefined) user.mobileNo = mobileNo;
  if (role !== undefined) user.role = role;
  if (employeeId !== undefined) user.employeeId = employeeId;
  if (candidateId !== undefined) user.candidateId = candidateId;
  if (department !== undefined) user.department = department;
  if (ctc !== undefined) user.ctc = ctc;
  if (bod !== undefined) user.bod = bod;
  if (employeeStatus !== undefined) {
    user.employeeStatus = employeeStatus;
    user.isActive = (employeeStatus === 'Active');
  }
  if (companyId !== undefined) user.companyId = companyId;
  if (companyName !== undefined) user.companyName = companyName;

  const updatedUser = await user.save();
  res.status(200).json({
    _id: updatedUser._id,
    fullname: updatedUser.fullname,
    email: updatedUser.email,
    mobileNo: updatedUser.mobileNo,
    role: updatedUser.role,
    employeeId: updatedUser.employeeId,
    candidateId: updatedUser.candidateId,
    department: updatedUser.department,
    companyId: updatedUser.companyId,
    companyName: updatedUser.companyName,
    employeeStatus: updatedUser.employeeStatus
  });
});

// @desc    Admin-only: Delete user
const deleteUser = asyncHandler(async (req, res) => {
  const user = await UserLogin.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await user.remove();
  res.status(200).json({ message: 'User removed' });
});

// Protect middleware
const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await UserLogin.findById(decoded.id).select('-password');
    if (!req.user) throw new Error();
    next();
  } catch {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

// @desc    Get all unique companies
// @route   GET /api/users/companies
// @access  Public
const getAllCompanies = asyncHandler(async (req, res) => {
  const companies = await UserLogin.aggregate([
    {
      $match: {
        companyId: { $exists: true, $ne: null },
        companyName: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: "$companyId",
        companyId: { $first: "$companyId" },
        companyName: { $first: "$companyName" },
      }
    }
  ]);
  res.status(200).json(companies);
});

module.exports = {
  registerUser,
  loginUser,
  resetPassword,
  sendOTP,
  verifyOTP,
  resendOTP,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUser,
  deleteUser,
  protect,
  getAllCompanies,
};