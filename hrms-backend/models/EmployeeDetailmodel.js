const mongoose = require('mongoose');

const employeeDetailsSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: String,
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  department: { type: String, required: true },
  status: {
    type: String,
    enum: ['Completed', 'In Process', 'Rejected', 'Active', 'Inactive'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeDetails', employeeDetailsSchema);
