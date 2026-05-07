

const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    default: 'N/A',
    
  },
  taskOwner: {
    type: String,
    required: true
  },
  assignedTo: {
    type: [String],
    default: []
  },
  taskName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
  },
  startDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  reminder: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['High', 'Moderate', 'Low'],
    default: 'Moderate'
  },
  status: {
    type: String,
    enum: ['Open', 'Completed'],
    default: 'Open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', TaskSchema);