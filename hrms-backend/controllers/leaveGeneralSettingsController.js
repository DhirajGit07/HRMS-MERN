const LeaveSettings = require('../models/leaveGeneralSettingsModel');

exports.getSettings = async (req, res) => {
  try {
    const settings = await LeaveSettings.findOne();
    if (!settings) {
      return res.status(404).json({ message: 'No settings found' });
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

exports.saveSettings = async (req, res) => {
  try {
    const { countLeavesFrom, yearStartsFrom, managerAction, companyId } = req.body;
    
    // Validate input
    if (!countLeavesFrom || !managerAction || !companyId) {
      return res.status(400).json({ message: 'countLeavesFrom, managerAction, and companyId are required' });
    }
    
    // If countLeavesFrom is not startOfYear, set yearStartsFrom to null
    const settingsData = {
      countLeavesFrom,
      yearStartsFrom: countLeavesFrom === 'startOfYear' ? yearStartsFrom : null,
      managerAction,
      companyId,
      updatedAt: new Date()
    };

    // Update or create settings (using findOneAndUpdate with upsert)
    const settings = await LeaveSettings.findOneAndUpdate(
      {}, // Match any document (we assume single settings document)
      settingsData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: 'Settings saved successfully', settings });
  } catch (error) {
    res.status(500).json({ message: 'Error saving settings', error: error.message });
  }
};