// models/Lead.js
const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  salutation: String,
  name: { type: String, required: true },
  email: String,
  leadOwner: String,
  dealName: { type: String, required: true },
  
  dealStage: { type: String, required: true },
  dealValue: Number,
  closeDate: Date,
  product: String,
  dealWatcher: String,

  companyName: String,
  website: String,
  mobile: String,
  officePhone: String,
  country: String,
  state: String,
  city: String,
  postalCode: String,
  address: String
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
