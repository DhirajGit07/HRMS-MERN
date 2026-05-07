const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userLoginSchema = new mongoose.Schema({
  companyId: { type: String, trim: true },
  companyStatus: { type: String, enum: ['active', 'inactive'], default: 'active' },
  companyName: {
    type: String,
    lowercase: true,
    trim: true
  },
  isActive: { type: Boolean, default: true },

  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    required: function () {
      return this.role === 'Employee';
    },
  },
  candidateId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    
  },
  ctc: { type: Number, min: 0, default: 0 },
  bod: { type: Number, min: 0, default: 0 },
  fullname: {
    type: String,
    required: [true, 'Please provide a full name'],
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  startMonth: { type: Date },
  endMonth: { type: Date },
  pendingAmount: { type: Number, default: 0 },
  revisedPayment: { type: Number, default: 0 },

  mobileNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: (v) => /^\d{10}$/.test(v),
      message: 'Mobile number must be 10 digits',
    },
  },
  role: {
    type: String,
    enum: ['Employee', 'Admin', 'SuperAdmin'],
    default: 'Employee',
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false,
  },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // OTP fields for password reset
  otp: { type: String },
  otpExpires: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  isOtpVerified: { type: Boolean, default: false },

  // Additional profile fields
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  department: { type: String, trim: true },
  designation: { type: String, trim: true },
  aboutMe: { type: String, trim: true, maxlength: 500 },
  profileImage: { type: String },
  nickname: { type: String, trim: true },
  hrmsRole: { type: String, trim: true },
  location: { type: String, trim: true },
  employmentType: { type: String, trim: true },
  employeeStatus: { type: String, trim: true },
  sourceOfHire: { type: String, trim: true },
  dateOfJoining: { type: String, trim: true },
  currentExperience: { type: String, trim: true },
  totalExperience: { type: String, trim: true },
  uanNO: { type: String, unique: true, sparse: true, trim: true },
  panNO: { type: String, unique: true, sparse: true, trim: true },
  aadhaarNO: { type: String, unique: true, sparse: true, trim: true },
  dob: { type: String, trim: true },
  expertise: { type: String, trim: true },
  gender: { type: String, trim: true },
  maritalStatus: { type: String, trim: true },
  ProbationPeriodStart: { type: Date },
  ProbationPeriodEnd: { type: Date },
  NoticePeriodStart: { type: Date },
  NoticePeriodEnd: { type: Date },
});

// Compound index for optional unique employeeId
userLoginSchema.index({ employeeId: 1 }, { unique: true, sparse: true });

// 🔐 Hash password
userLoginSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔁 Update updatedAt
userLoginSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// 🔑 Compare password
userLoginSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🚀 Seed SuperAdmin
userLoginSchema.statics.seedSuperAdmin = async function () {
  const existing = await this.findOne({ role: 'SuperAdmin' });
  if (!existing) {
    await this.create({
      fullname: 'Super Admin',
      email: 'superadmin@hrms.com',
      password: 'supersecurepass',
      mobileNo: '9999999999',
      role: 'SuperAdmin',
      isActive: true,
    });
    console.log('✅ SuperAdmin seeded');
  }
};

module.exports = mongoose.model('UserLogin', userLoginSchema);