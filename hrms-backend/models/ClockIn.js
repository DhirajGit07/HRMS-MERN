const mongoose = require('mongoose');

const clockInSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true 
  },
  companyId: { 
    type: String, 
    required: true 
  },
  companyName: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String, 
    required: true 
  },
  // workingFrom: { 
  //   type: String, 
  //   required: true,
  //   enum: ['Home', 'Office', 'Other']
  // },
  workingFrom: { type: String, required: true },
  clockInTime: { 
    type: Date, 
    default: Date.now 
  },
  clockOutTime: { 
    type: Date 
  },
  profileInfo: {
    type: {
      firstName: { type: String },
      lastName: { type: String },
      designation: { type: String },
      email: { type: String },
      employeeId: { type: String }, // Added employeeId to profileInfo
      profileImage: { type: String }
    },
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ClockIn', clockInSchema);