// const mongoose = require('mongoose');

// const bonafideLetterSchema = new mongoose.Schema({
//   employeeId: {
//     type: String,
//     required: true
//   },
//   requestDate: {
//     type: Date,
//     required: true
//   },
//   dateOfJoining: {
//     type: Date
//   },
//   designation: {
//     type: String
//   },
//   department: {
//     type: String
//   },
//   reasonForRequest: {
//     type: String,
//     required: true,
//     enum: [
//       'visa_application',
//       'higher_studies',
//       'opening_bank_account',
//       'other'
//     ]
//   },
//   otherReason: {
//     type: String
//   }
// }, {
//   timestamps: true // adds createdAt and updatedAt
// });

// module.exports = mongoose.model('BonafideLetter', bonafideLetterSchema);


const mongoose = require('mongoose');

const bonafideLetterSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true
  },
  candidateId: {  // Add this field
    type: String,
    required: true
  },
  employeeEmail: {  // Add this field
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  requestDate: {
    type: Date,
    required: true
  },
  dateOfJoining: {
    type: Date
  },
  designation: {
    type: String
  },
  department: {
    type: String
  },
  reasonForRequest: {
    type: String,
    required: true,
    enum: [
      'visa_application',
      'higher_studies',
      'opening_bank_account',
      'other'
    ]
  },
  otherReason: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BonafideLetter', bonafideLetterSchema);