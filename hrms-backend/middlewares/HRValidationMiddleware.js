exports.validateAddressProof = (req, res, next) => {
  const {
    employeeId, requestDate, reasonForRequest, hasAddressChange,designation,dateOfJoining,
    addressLine1, city, state, country, postalCode
  } = req.body;

  if (!employeeId || !requestDate || !reasonForRequest || !hasAddressChange) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  if (hasAddressChange === 'yes') {
    if (!addressLine1 || !city || !state || !country || !postalCode) {
      return res.status(400).json({ message: 'All address fields are required for address change' });
    }
  }

  next();
};
