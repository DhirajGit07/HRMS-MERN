     // models/Timesheet.js
     const mongoose = require('mongoose');

     const timesheetSchema = new mongoose.Schema({
       period: { type: String, required: true },
       client: { type: String, required: true },
       project: { type: String, required: true },
       job: { type: String, required: true },
       billableStatus: { type: String, required: true },
       createdAt: { type: Date, default: Date.now },
     });

     module.exports = mongoose.model('Timesheet', timesheetSchema);
     