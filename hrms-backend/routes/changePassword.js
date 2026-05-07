const express = require('express');
const bcrypt = require('bcryptjs');
const UserLogin = require('../models/UserLogin');

const router = express.Router();

router.post('/change-password', async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Email, old password, and new password are required.' });
  }

  try {
    const user = await UserLogin.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Old password is incorrect.' });
    }

    user.password = newPassword; // pre-save hook to hash
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
