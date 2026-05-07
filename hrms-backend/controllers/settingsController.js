// SettingController.js
const Setting = require('../models/Setting');

// Create or update settings
exports.saveSettings = async (req, res) => {
  try {
    const { companyId, dashboardName, wallpaper, logo } = req.body;

    if (!companyId) {
      return res.status(400).json({ message: 'companyId is required' });
    }

    // Find settings for the specific companyId
    let settings = await Setting.findOne({ companyId });

    if (!settings) {
      // Create new settings if none exist for this companyId
      settings = new Setting({ companyId, dashboardName, wallpaper, logo });
    } else {
      // Update existing settings
      settings.dashboardName = dashboardName;
      settings.wallpaper = wallpaper;
      settings.logo = logo;
    }

    const savedSettings = await settings.save();
    res.status(200).json(savedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get current settings
exports.getSettings = async (req, res) => {
  try {
    const { companyId } = req.query; // Expect companyId as a query parameter
    if (!companyId) {
      return res.status(400).json({ message: 'companyId is required' });
    }

    const settings = await Setting.findOne({ companyId });
    res.status(200).json(
      settings || {
        companyId,
        dashboardName: 'My Space',
        wallpaper: '',
        logo: ''
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};