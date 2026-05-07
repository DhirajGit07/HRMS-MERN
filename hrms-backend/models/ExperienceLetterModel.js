// models/ExperienceLetterModel.js
const mongoose = require('mongoose');

const experienceLetterSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  requestDate: { type: Date, required: true },
  reasonForRequest: { type: String, required: true },
  otherReason: { type: String },
  dateOfJoining: { type: Date },
  designation: { type: String },
  department: { type: String },
  currentExperience: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ExperienceLetter', experienceLetterSchema);
