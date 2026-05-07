const mongoose = require('mongoose');

const addressProofSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeEmail: { type: String},
  requestDate: { type: Date, required: true },
  dateOfJoining: { type: Date },
  designation: { type: String },
  reasonForRequest: { type: String, required: true },
  otherReason: { type: String },
  hasAddressChange: { type: String, required: true },
  address: {
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postalCode: { type: String }
  }
}, { timestamps: true });

// ✅ Fixed typo in variable name
module.exports = mongoose.model('HRAddressProof', addressProofSchema);
