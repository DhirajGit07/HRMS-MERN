const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLogin',
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true,
    set: function(date) {
      // Normalize date to start of day
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  },
  sessions: [{
    checkIn: {
      time: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/
      },
      note: {
        type: String,
        default: '',
        trim: true
      },
      lateMark: {
        type: Boolean,
        default: false
      }
    },
    checkOut: {
      time: {
        type: String,
        match: /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/
      },
      note: {
        type: String,
        default: '',
        trim: true
      }
    },
    attendanceType: {
      type: String,
      enum: ['present', 'firstHalf', 'secondHalf', 'absent'],
      default: 'present'
    },
    autoClockOut: {
      enabled: {
        type: Boolean,
        default: false
      },
      durationMinutes: {
        type: Number,
        default: 0
      },
      scheduledTime: {
        type: Date,
        default: null
      }
    },
    _id: false
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret._id;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret._id;
      return ret;
    }
  }
});

// Virtual for formatted date (YYYY-MM-DD)
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Virtual for total hours per session (formatted as HH:mm)
attendanceSchema.virtual('sessions.sessionHours').get(function() {
  return this.sessions.map(session => {
    if (!session.checkIn.time || !session.checkOut.time) return '00:00';
    
    const inParts = session.checkIn.time.split(':').map(Number);
    const outParts = session.checkOut.time.split(':').map(Number);
    
    const inH = inParts[0], inM = inParts[1], inS = inParts[2] || 0;
    const outH = outParts[0], outM = outParts[1], outS = outParts[2] || 0;
    
    let totalSeconds = (outH * 3600 + outM * 60 + outS) - (inH * 3600 + inM * 60 + inS);
    
    if (totalSeconds < 0) {
      totalSeconds = 0; // Prevent negative hours
    }
    
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });
});

// Virtual for total hours per day (formatted as HH:mm)
attendanceSchema.virtual('totalHoursFormatted').get(function() {
  if (!this.sessions || this.sessions.length === 0) return '00:00';
  
  const totalSeconds = this.sessions.reduce((sum, session) => {
    if (!session.checkIn.time || !session.checkOut.time) return sum;
    
    const inParts = session.checkIn.time.split(':').map(Number);
    const outParts = session.checkOut.time.split(':').map(Number);
    
    const inH = inParts[0], inM = inParts[1], inS = inParts[2] || 0;
    const outH = outParts[0], outM = outParts[1], outS = outParts[2] || 0;
    
    let sessionSeconds = (outH * 3600 + outM * 60 + outS) - (inH * 3600 + inM * 60 + inS);
    
    if (sessionSeconds < 0) {
      sessionSeconds = 0; // Prevent negative hours
    }
    
    return sum + sessionSeconds;
  }, 0);
  
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

// Virtual for total hours per day (in decimal)
attendanceSchema.virtual('totalHours').get(function() {
  if (!this.sessions || this.sessions.length === 0) return 0;
  
  const totalSeconds = this.sessions.reduce((sum, session) => {
    if (!session.checkIn.time || !session.checkOut.time) return sum;
    
    const inParts = session.checkIn.time.split(':').map(Number);
    const outParts = session.checkOut.time.split(':').map(Number);
    
    const inH = inParts[0], inM = inParts[1], inS = inParts[2] || 0;
    const outH = outParts[0], outM = outParts[1], outS = outParts[2] || 0;
    
    let sessionSeconds = (outH * 3600 + outM * 60 + outS) - (inH * 3600 + inM * 60 + inS);
    
    if (sessionSeconds < 0) {
      sessionSeconds = 0; // Prevent negative hours
    }
    
    return sum + sessionSeconds;
  }, 0);
  
  return parseFloat((totalSeconds / 3600).toFixed(2));
});

// Middleware to update updatedAt timestamp
attendanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware to validate session times
attendanceSchema.pre('save', function(next) {
  if (this.isModified('sessions')) {
    for (const session of this.sessions) {
      if (session.checkOut.time) {
        const inParts = session.checkIn.time.split(':').map(Number);
        const outParts = session.checkOut.time.split(':').map(Number);
        
        const inH = inParts[0], inM = inParts[1], inS = inParts[2] || 0;
        const outH = outParts[0], outM = outParts[1], outS = outParts[2] || 0;
        
        const inTime = inH * 3600 + inM * 60 + inS;
        const outTime = outH * 3600 + outM * 60 + outS;
        
        if (outTime <= inTime) {
          throw new Error(`Check-out time (${session.checkOut.time}) must be after check-in time (${session.checkIn.time})`);
        }
      }
    }
  }
  next();
});

// Compound index to ensure one record per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Index for faster date-based queries
attendanceSchema.index({ date: 1 });

// Index for faster user-based queries
attendanceSchema.index({ user: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);