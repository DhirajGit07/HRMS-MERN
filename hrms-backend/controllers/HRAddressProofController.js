const HRAddressProof = require('../models/HRAddressProofModel');

exports.createAddressProof = async (req, res) => {
  try {
    const data = req.body;

    // Prepare address object only if address change is "yes"
    const address = data.hasAddressChange === 'yes' ? {
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || '',
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode
    } : undefined; // This avoids saving an empty object

    const newProof = new HRAddressProof({
      employeeId: data.employeeId,
      employeeEmail: data.employeeEmail || '', // Ensure email is always a string
      requestDate: data.requestDate,
      dateOfJoining: data.dateOfJoining || null,
      designation: data.designation || '',
      reasonForRequest: data.reasonForRequest,
      otherReason: data.otherReason || '',
      hasAddressChange: data.hasAddressChange,
      ...(address && { address }) // Include address only if it's defined
    });

    const saved = await newProof.save();
    res.status(201).json({ message: 'Address proof saved', data: saved });
  } catch (error) {
    console.error('Error saving address proof:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to save address proof' });
  }
};
