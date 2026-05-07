const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const favoriteUpload = require('../middlewares/favoriteUpload');
const path = require('path');

// Get all favorites
router.get('/', async (req, res) => {
  try {
    const favorites = await Favorite.find();
    res.json(favorites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Add a new favorite
router.post('/', favoriteUpload.single('photo'), async (req, res) => {
  try {
    const { companyId, name, phone } = req.body;
    const photo = req.file ? path.join('favorites', req.file.filename) : null;

    const newFavorite = new Favorite({
      companyId,
      name,
      phone,
      photo
      // Removed user field since we're not using authentication
    });

    const favorite = await newFavorite.save();
    res.json(favorite);
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Server Error',
      error: error.message 
    });
  }
});

// Update a favorite
router.put('/:id', favoriteUpload.single('photo'), async (req, res) => {
  try {
    const {companyId, name, phone } = req.body;
    let updateData = {companyId, name, phone };

    if (req.file) {
      updateData.photo = path.join('favorites', req.file.filename);
    }

    const favorite = await Favorite.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json(favorite);
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Server Error',
      error: error.message 
    });
  }
});

// Delete a favorite
router.delete('/:id', async (req, res) => {
  try {
    const favorite = await Favorite.findByIdAndDelete(req.params.id);

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Favorite removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;