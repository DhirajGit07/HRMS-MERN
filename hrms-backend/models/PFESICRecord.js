const mongoose = require('mongoose');

const PFESICRecordSchema = new mongoose.Schema({
  status: { type: String, required: true },
  employeeId: { type: String, required: true },
  candidateId: { type: String, required: true },
  recordType: { type: String, enum: ['PF', 'ESIC'], required: true },

  employeeName:    { type: String, required: true },
  middlename:      { type: String, required: true },
  gender:          { type: String, required: true },
  maritalstatus:   { type: String, required: true },
  dob:             { type: Date,   required: true },
  actualDoj:       { type: Date,   required: true },
  minorityStatus:  { type: String, required: true },
  dojepfo:         { type: Date,   required: true },
  department:      { type: String, required: true },
  designation:     { type: String, required: true },
  mobile:          { type: String, required: true },
  aadhar:          { type: String, required: true },
  pan:             { type: String, required: true },
  email:           { type: String            },
  leaving:         { type: Date, },
  bankName:        { type: String, required: true },
  bankAcc:         { type: String, required: true },
  ifsc:            { type: String, required: true },
  presentAddress:  { type: String, required: true },
  permanentAddress:{ type: String, required: true },
  pfNumber:        { type: String            },
  uanNumber:       { type: String            },
  esicIp:          { type: String            },
  nomineeName:     { type: String            },
  nomineeRelation: { type: String            },
  nomineeAddress:  { type: String            },
  remark:          { type: String            },
  docPath:         { type: String            }
}, { timestamps: true });

// Composite unique index: allow one PF and one ESIC record per employee
PFESICRecordSchema.index(
  { employeeId: 1, recordType: 1 },
  { unique: true, name: 'unique_empid_recordtype' }
);

module.exports = mongoose.model('PFESICRecord', PFESICRecordSchema);