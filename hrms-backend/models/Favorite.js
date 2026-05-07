const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  companyId: {
    type: String,
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  photo: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Favorite', favoriteSchema);