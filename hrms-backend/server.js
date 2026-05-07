

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');

// Routes
const candidatesRoutes = require('./routes/candidates');
const leaveRoutes = require('./routes/leaveRoutes');
const authRoutes = require('./routes/authRoutes');
const tasks = require('./routes/tasks');
const exitDetailsRouter = require('./routes/exitDetails');
const fileRoutes = require('./routes/fileRoutes');
const employeeFileRoutes = require('./routes/employeefileRoutes');
const HRAddressProofRoutes = require('./routes/HRAddressProofRoutes');
const bonafideRoutes = require('./routes/BonafideRoutes');
const experienceLetterRoutes = require('./routes/ExperienceLetterRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const Project = require('./routes/projects');
const projectRoutes = require('./routes/projectRoutes');
const jobRoutes = require('./routes/jobRoutes');
const timesheetRoutes = require('./routes/timesheets');
const pfesicRoutes = require('./routes/pfesicRoutes');
const hrFormsRoutes = require('./routes/hrForms');
const settingsRoutes = require('./routes/settingRoutes');
const holidaysRouter = require('./routes/holidays');
const announcementRoutes = require('./routes/announcements');
const favoritesRouter = require('./routes/favorites');
const leadRoutes = require('./routes/leadRoutes');
const changePasswordRoute = require('./routes/changePassword'); //change password
const attendanceSettingsRouter = require('./routes/attendanceSettings');
const leaveTypeRoutes = require('./routes/leaveTypeRoutes'); // Leave Type Routes
const leaveGeneralSettingsRoutes = require('./routes/leaveGeneralSettingsRoutes');
const leaveTypeAddEditRoutes = require('./routes/leaveTypeAddEditRoutes');
const clockInRoutes = require('./routes/clockInRoutes');
const workingFromRoutes = require('./routes/workingFromRoutes');


// DB and Middleware
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');
const UserLogin = require('./models/UserLogin'); // ✅ For SuperAdmin seeding

require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 8000;

// ✅ CORS Configuration
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// ✅ Body parsing
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static file serving
app.use('/upload/images', express.static(path.join(__dirname, 'upload/images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/upload/wallpaper', express.static(path.join(__dirname, 'upload/wallpaper')));
app.use('/upload/logo', express.static(path.join(__dirname, 'upload/logo')));

// ✅ Mount all API routes
app.use('/api/candidates', candidatesRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/users', authRoutes); // Signup/Login
app.use('/api/tasks', tasks);
app.use('/api/exitdetails', exitDetailsRouter);
app.use('/api/files', fileRoutes);
app.use('/api/employeeFile', employeeFileRoutes);
app.use('/api', HRAddressProofRoutes);
app.use('/api', bonafideRoutes);
app.use('/api', experienceLetterRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/projects', Project);
app.use('/api/projects', projectRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/pfesic', pfesicRoutes);
app.use('/api/hr-forms', hrFormsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/holidays', holidaysRouter);
app.use('/api/announcements', announcementRoutes);
app.use('/api/favorites', favoritesRouter);
app.use('/api', leadRoutes);
// change password
app.use('/api', changePasswordRoute);
app.use('/api/attendance-settings', attendanceSettingsRouter);
app.use('/api/leave-types', leaveTypeRoutes);
app.use('/api/leave', leaveGeneralSettingsRoutes)
app.use('/api/leave-types-Add-Edit', leaveTypeAddEditRoutes);
app.use('/api/clockin', clockInRoutes);
app.use('/api', workingFromRoutes);


// ✅ Error Handling
app.use(notFound);
app.use(errorHandler);

// ✅ DB Connection + SuperAdmin Seed
connectDB().then(async () => {
  // Seed SuperAdmin after DB connects
  await UserLogin.seedSuperAdmin();

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});
