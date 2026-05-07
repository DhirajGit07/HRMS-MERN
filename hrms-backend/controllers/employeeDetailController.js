const EmployeeDetails = require('../models/EmployeeDetailmodel');

// GET all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await EmployeeDetails.find();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

// UPDATE employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await EmployeeDetails.findByIdAndUpdate(id, req.body, {
      new: true, runValidators: true
    });
    if (!updated) return res.status(404).json({ error: 'Employee not found' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

// DELETE employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await EmployeeDetails.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Employee not found' });
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};
