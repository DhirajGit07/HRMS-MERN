const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema({
  employeeId:{type:String},
  name: { type: String, required: true },
  leaveType: { type: String, required: true },
  duration: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  teamEmail: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  approvedBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model("Leave", LeaveSchema);