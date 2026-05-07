const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  client: { type: String, required: true },
  estimatedHours: { type: Number, required: true, min: 1 },
  projectCost: { type: Number, required: true, min: 0 },
  projectHead: { type: String, required: true },
  ratePerHour: { type: Number, required: true, min: 1 },
  projectManager: { type: String, required: true },
  users: { type: [String], required: true, validate: v => Array.isArray(v) && v.length > 0 },
  departments: { type: String, required: true },
  description: { type: String, required: true, minlength: 10 },
  // Optional if still used in frontend
  loggedHours: { type: Number, default: 0 },
  status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
