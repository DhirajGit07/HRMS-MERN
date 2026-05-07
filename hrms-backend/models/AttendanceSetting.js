const mongoose = require('mongoose');

const AttendanceSettingSchema = new mongoose.Schema({
  shiftName: {
    type: String,
    required: [true, 'Shift name is required'],
    trim: true,
    enum: ['General Shift', 'Afternoon Shift', 'Night Shift', 'Other'],
    // unique: true
  },
  companyId: {
    type: String,
    required: [true, 'Company ID is required'],
    trim: true
  },
  assignedEmployees: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserLogin' }],
    // required: [true, 'At least one employee must be assigned'],
    // validate: [
    //   {
    //     validator: async function (employeeIds) {
    //       if (employeeIds.length === 0) return false;
    //       
    //       const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
    //       if (!employeeIds.every(isValidObjectId)) {
    //         return false;
    //       }
    //       
    //       const users = await mongoose.model('UserLogin').find({ _id: { $in: employeeIds } });
    //       return users.length === employeeIds.length;
    //     },
    //     message: 'One or more assigned employee IDs are invalid or do not exist'
    //   },
    //   {
    //     validator: function (employeeIds) {
    //       return new Set(employeeIds).size === employeeIds.length;
    //     },
    //     message: 'Duplicate employee IDs are not allowed in assigned shift'
    //   }
    // ]
  },
  shiftStartTime: {
    type: String,
    required: [true, 'Shift start time is required'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] [AP]M$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM AM/PM)`
    }
  },
  shiftEndTime: {
    type: String,
    required: [true, 'Shift end time is required'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] [AP]M$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM AM/PM)`
    }
  },
  halfDayMarkTime: {
    type: String,
    required: [true, 'Half day mark time is required'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] [AP]M$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM AM/PM)`
    }
  },
  secondHalfMarkTime: {
    type: String,
    required: [true, 'Second half mark time is required'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] [AP]M$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM AM/PM)`
    }
  },
  lateMarkAfter: {
    type: Number,
    required: [true, 'Late mark after minutes is required'],
    min: [0, 'Late mark minutes cannot be negative']
  },
  maxCheckIn: {
    type: Number,
    required: [true, 'Max check-ins is required'],
    min: [1, 'At least one check-in must be allowed']
  },
  autoClockoutTime: {
    type: Number,
    required: [true, 'Auto clockout time is required'],
    min: [0, 'Auto clockout time cannot be negative']
  },
  workingDays: {
    type: [String],
    required: [true, 'Working days are required'],
    validate: {
      validator: function (days) {
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days.length > 0 && days.every(day => validDays.includes(day));
      },
      message: 'At least one working day must be selected from valid weekdays'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

AttendanceSettingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AttendanceSetting', AttendanceSettingSchema);