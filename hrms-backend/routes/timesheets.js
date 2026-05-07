   // routes/timesheets.js
   const express = require('express');
   const router = express.Router();
   const Timesheet = require('../models/Timesheet');

   // Get all timesheets
   router.get('/', async (req, res) => {
     try {
       const timesheets = await Timesheet.find();
       res.json(timesheets);
     } catch (error) {
       res.status(500).json({ message: error.message });
     }
   });

   // Create a new timesheet
   router.post('/', async (req, res) => {
     const timesheet = new Timesheet(req.body);
     try {
       const savedTimesheet = await timesheet.save();
       res.status(201).json(savedTimesheet);
     } catch (error) {
       res.status(400).json({ message: error.message });
     }
   });

   // Delete a timesheet
   router.delete('/:id', async (req, res) => {
     try {
       const deletedTimesheet = await Timesheet.findByIdAndDelete(req.params.id);
       if (!deletedTimesheet) return res.status(404).send('Timesheet not found');
       res.status(204).send();
     } catch (error) {
       res.status(500).json({ message: error.message });
     }
   });

   module.exports = router;
   