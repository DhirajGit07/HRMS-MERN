import React, { useState, useEffect, useRef } from 'react';
import './AddTaskForm.css';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddTaskForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { task } = location.state || {};
  const isEdit = !!task;
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    taskOwner: '',
    assignedTo: [],
    taskName: '',
    description: '',
    startDate: '',
    dueDate: '',
    reminder: '',
    priority: 'Moderate',
    status: 'Open'
  });

  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeePrefix, setEmployeePrefix] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const id = res.data.employeeId;
        setEmployeeId(id);
        const fullName = `${res.data.firstName || ''} ${res.data.lastName || ''}`.trim();
        setEmployeeName(fullName);

        const prefix = id?.split('-')[0];
        setEmployeePrefix(prefix);

        setFormData(prev => ({
          ...prev,
          taskOwner: fullName,
          employeeId: id
        }));
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to fetch user profile');
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployees(response.data);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Failed to load employee list');
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (task) {
      // Format dates for input fields, ensuring local timezone for reminder
      const formatDateTimeLocal = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const offset = d.getTimezoneOffset();
        const adjustedDate = new Date(d.getTime() - offset * 60 * 1000); // Adjust to local time
        return adjustedDate.toISOString().slice(0, 16); // Format as YYYY-MM-DDThh:mm
      };

      setFormData({
        employeeId: task.employeeId || '',
        taskOwner: task.taskOwner || '',
        assignedTo: task.assignedTo || [],
        taskName: task.taskName || '',
        description: task.description || '',
        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        reminder: formatDateTimeLocal(task.reminder),
        priority: task.priority || 'Moderate',
        status: task.status || 'Open'
      });
    }
  }, [task]);

  const handleCancel = () => navigate("/MyTasks");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleEmployeeSelection = (employeeId) => {
    setFormData(prev => {
      const newAssignedTo = [...prev.assignedTo];
      if (newAssignedTo.includes(employeeId)) {
        return {
          ...prev,
          assignedTo: newAssignedTo.filter(id => id !== employeeId)
        };
      } else {
        return {
          ...prev,
          assignedTo: [...newAssignedTo, employeeId]
        };
      }
    });
  };

  const toggleSelectAll = () => {
    if (formData.assignedTo.length === filteredEmployees.length) {
      setFormData(prev => ({ ...prev, assignedTo: [] }));
    } else {
      setFormData(prev => ({
        ...prev,
        assignedTo: filteredEmployees.map(emp => emp._id)
      }));
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.employeeId?.startsWith(employeePrefix) &&
    (emp.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSelectedEmployeeNames = () => {
    if (formData.assignedTo.length === 0) return 'Select employees...';
    if (formData.assignedTo.length === employees.length) return 'All employees selected';
    if (formData.assignedTo.length > 3) return `${formData.assignedTo.length} employees selected`;

    return formData.assignedTo
      .map(id => {
        const emp = employees.find(e => e._id === id);
        return emp 
          ? (emp.firstName && emp.lastName 
              ? `${emp.firstName} ${emp.lastName}${emp.candidateId ? ` (${emp.candidateId})` : emp.employeeId ? ` (${emp.employeeId})` : ''}` 
              : `${emp.fullname}${emp.candidateId ? ` (${emp.candidateId})` : emp.employeeId ? ` (${emp.employeeId})` : ''}`)
          : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.taskName) {
      toast.error('Task name is a required field', {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    if (formData.assignedTo.length === 0) {
      toast.error('Please select at least one employee', {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        reminder: formData.reminder ? new Date(formData.reminder).toISOString() : null
      };

      let response;
      if (isEdit) {
        response = await axios.put(`http://localhost:8000/api/tasks/${task._id}`, payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        toast.success('Task updated successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        response = await axios.post('http://localhost:8000/api/tasks', payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        toast.success('Task created successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
      }

      setTimeout(() => navigate("/MyTasks"), 1500);
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err.response?.data?.message || (isEdit ? 'Failed to update task' : 'Failed to create task');
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ds-task-form-container">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="ds-task-form-header">
        <h2 className="ds-task-form-title">{isEdit ? 'Edit Task' : 'Add Task'}</h2>
      </div>

      <div className="ds-task-form-content">
        <div className="ds-task-form-box">
          <h3 className="ds-task-form-section-title">Task Details</h3>
          {error && <div className="ds-form-error">{error}</div>}

          <form className="ds-task-form" onSubmit={handleSubmit}>
            {/* Employee ID */}
            <div className="ds-form-row">
              <label className="ds-form-label">System ID</label>
              <div className="ds-form-input-container">
                <input
                  type="text"
                  className="ds-form-input"
                  value={formData.employeeId}
                  readOnly
                />
              </div>
            </div>

            {/* Task Owner */}
            <div className="ds-form-row">
              <label className="ds-form-label">Task Owner</label>
              <div className="ds-form-input-container">
                <input
                  type="text"
                  className="ds-form-input"
                  name="taskOwner"
                  value={formData.taskOwner}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Assigned To */}
            <div className="ds-form-row" ref={dropdownRef}>
              <label className="ds-form-label">Assigned to</label>
              <div className="ds-form-input-container ds-employee-dropdown-container">
                <div
                  className="ds-employee-dropdown-toggle"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {getSelectedEmployeeNames()}
                  <span className="ds-dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                </div>

                {isDropdownOpen && (
                  <div className="ds-employee-dropdown-menu">
                    <div className="ds-employee-search-container">
                      <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ds-employee-search-input"
                      />
                    </div>

                    <div className="ds-employee-checkbox-container">
                      <label className="ds-employee-checkbox-item select-all">
                        <input
                          type="checkbox"
                          checked={formData.assignedTo.length === filteredEmployees.length && filteredEmployees.length > 0}
                          onChange={toggleSelectAll}
                        />
                        <span style={{marginLeft:"6px"}}>Select All</span>
                      </label>

                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map(employee => (
                          <label key={employee._id} className="ds-employee-checkbox-item">
                            <input
                              type="checkbox"
                              checked={formData.assignedTo.includes(employee._id)}
                              onChange={() => toggleEmployeeSelection(employee._id)}
                            />
                            <span style={{marginLeft:"6px"}}>
                              {employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.fullname}{" "} 
                              {employee.candidateId ? `(${employee.candidateId})` : employee.employeeId && `(${employee.employeeId})`}
                            </span>
                          </label>
                        ))
                      ) : (
                        <div className="ds-no-employees-found">No employees found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Task Name */}
            <div className="ds-form-row">
              <label className="ds-form-label">Task Name <span className="ds-required-marker">*</span></label>
              <div className="ds-form-input-container">
                <input
                  type="text"
                  className="ds-form-input"
                  name="taskName"
                  value={formData.taskName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="ds-form-row">
              <label className="ds-form-label">Description</label>
              <div className="ds-form-input-container">
                <textarea
                  rows="3"
                  className="ds-form-input ds-form-textarea"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            {/* Dates */}
            <div className="ds-form-row">
              <label className="ds-form-label">Start Date</label>
              <div className="ds-form-input-container">
                <input
                  type="date"
                  className="ds-form-input"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="ds-form-row">
              <label className="ds-form-label">Due Date</label>
              <div className="ds-form-input-container">
                <input
                  type="date"
                  className="ds-form-input"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="ds-form-row">
              <label className="ds-form-label">Reminder</label>
              <div className="ds-form-input-container">
                <input
                  type="datetime-local"
                  className="ds-form-input"
                  name="reminder"
                  value={formData.reminder}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Priority */}
            <div className="ds-form-row">
              <label className="ds-form-label">Priority</label>
              <div className="ds-form-input-container">
                <select
                  className="ds-form-input ds-form-select"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="High">High</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div className="ds-form-row">
              <label className="ds-form-label">Status</label>
              <div className="ds-form-input-container">
                <select
                  className="ds-form-input ds-form-select"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="select">Select</option>
                  <option value="Open">Open</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="ds-form-footer">
        <div className="ds-form-actions">
          <button
            type="submit"
            className="ds-btn ds-btn-primary"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Submitting...' : isEdit ? 'Update' : 'Submit'}
          </button>
          <button
            type="button"
            className="ds-btn ds-btn-outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskForm;