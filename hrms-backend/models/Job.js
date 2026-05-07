const mongoose = require('mongoose');


const jobSchema = new mongoose.Schema({
  jobName: { type: String, required: true },
  project: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  estimatedHours: { type: Number, required: true, min: 1 },
  users: { type: [String], required: true, validate: v => Array.isArray(v) && v.length > 0 },
  departments: { type: String, required: true },
  ratePerHour: { type: Number, required: true, min: 1 },
  description: { type: String, required: true, minlength: 10 },
  attachment: { type: String }, // Optional: can validate file types if needed
  billableStatus: { type: String, enum: ['Billable', 'Non_Billable'], required: true },
  workItem: { type: String, required: true },
  loggedHours: { type: Number, default: 0 },
  status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
}, { timestamps: true });


module.exports = mongoose.model('Job', jobSchema);
