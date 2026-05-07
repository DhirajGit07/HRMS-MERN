import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BonafideLetterForm.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const BonafideLetterForm = () => {
  const [formData, setFormData] = useState({
    employeeId: '',
    candidateId: '',
    employeeEmail: '',
    requestDate: '',
    reasonForRequest: '',
    otherReason: '',
    dateOfJoining: '',
    designation: '',
    department: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/users/profile');
        const profile = res.data;
        
        let employeeId = profile.employeeId || 'N/A';
        let candidateId = profile.candidateId || 'N/A';
         
        // Set user role from profile data
        setUserRole(profile.role || '');
        try {
          // Fetch employee list to get employee ID and candidate ID
          const { data: employees } = await axios.get('/api/users');
          const match = employees.find(e =>
            e.email?.toLowerCase() === profile.email?.toLowerCase()
          );
          
          if (match) {
            if (match.employeeId?.trim() && match.employeeId.trim() !== 'N/A') {
              employeeId = match.employeeId.trim();
            }
            // If candidateId is not in profile, try to get it from employee data
            if (!candidateId || candidateId === 'N/A') {
              candidateId = match.candidateId || 'N/A';
            }
          }
        } catch (empErr) {
          console.error('Error fetching employees:', empErr);
        }

        setFormData(prev => ({
          ...prev,
          employeeId: employeeId,
          candidateId: candidateId,
          employeeEmail: profile.email || '',
          dateOfJoining: profile.dateOfJoining?.substring(0, 10) || '',
          designation: profile.designation || '',
          department: profile.department || ''
        }));
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        if (err.response?.status === 401) {
          localStorage.removeItem('userToken');
          navigate('/homepage');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If "otherReason", ensure only letters/spaces
    if (name === 'otherReason') {
      if (value !== '' && !/^[A-Za-z ]*$/.test(value)) {
        setErrors(prev => ({ ...prev, [name]: 'Only letters and spaces allowed' }));
      } else {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.requestDate) {
      newErrors.requestDate = 'Date of request is required';
    }

    if (!formData.reasonForRequest) {
      newErrors.reasonForRequest = 'Reason for request is required';
    }

    if (formData.reasonForRequest === 'other') {
      if (!formData.otherReason.trim()) {
        newErrors.otherReason = 'Please enter a reason';
      } else if (!/^[A-Za-z ]+$/.test(formData.otherReason)) {
        newErrors.otherReason = 'Only letters and spaces allowed';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const cancelBtn = () => navigate('/BonafideLetter');

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix all form errors before submitting', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    try {
      const submissionData = {
        ...formData,
        employeeEmail: formData.employeeEmail
      };

      const response = await axios.post('/api/bonafide-letter', submissionData);
      
      toast.success(response.data.message || 'Bonafide letter submitted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      setTimeout(() => navigate('/BonafideLetter'), 1500);
    } catch (error) {
      console.error('Submission failed:', error);
      toast.error(error.response?.data?.message || 'Submission failed. Please try again.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  if (loading) return <div className="loading-message">Loading profile...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="bl-container">
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
      <div className="bl-header">
        <h2>Add Bonafide Letter</h2>
      </div>

      <div className="bl-form-box">
        <h3 className="bl-section-title">Bonafide Letter Details</h3>

        <div className="bl-form-row">
          {userRole === 'Admin' && (
            <div className="bl-form-group">
              <label>System ID <span className="bl-required">*</span></label>
              <input
                type="text"
                name="employeeId"
              className="bl-input-field"
              value={formData.employeeId}
              onChange={handleChange}
              disabled
            />
          </div>
          )}
          <div className="bl-form-group">
            <label>Candidate ID <span className="bl-required">*</span></label>
            <input
              type="text"
              name="candidateId"
              className="bl-input-field"
              value={formData.candidateId}
              onChange={handleChange}
              disabled
            />
          </div>
          <div className="bl-form-group">
            <label>Email <span className="bl-required">*</span></label>
            <input
              type="email"
              name="employeeEmail"
              className="bl-input-field"
              value={formData.employeeEmail}
              onChange={handleChange}
              disabled
            />
          </div>
        </div>

        <div className="bl-form-row">
          <div className="bl-form-group">
            <label>Date of Request <span className="bl-required">*</span></label>
            <input
              type="date"
              name="requestDate"
              className="bl-input-field"
              value={formData.requestDate}
              onChange={handleChange}
            />
            {errors.requestDate && <span className="bl-error">{errors.requestDate}</span>}
          </div>
        </div>

        <div className="bl-form-row">
          <div className="bl-form-group">
            <label>Date of Joining</label>
            <input
              type="text"
              className="bl-input-field"
              value={formData.dateOfJoining}
              disabled
            />
          </div>
          <div className="bl-form-group">
            <label>Designation</label>
            <input
              type="text"
              className="bl-input-field"
              value={formData.designation}
              disabled
            />
          </div>
        </div>

        <div className="bl-form-row">
          <div className="bl-form-group">
            <label>Department</label>
            <input
              type="text"
              className="bl-input-field"
              value={formData.department}
              disabled
            />
          </div>
        </div>

        <div className="bl-form-row">
          <div className="bl-form-group">
            <label>Reason for Request <span className="bl-required">*</span></label>
            <select
              name="reasonForRequest"
              className="bl-input-field"
              value={formData.reasonForRequest}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="visa_application">Visa Application</option>
              <option value="higher_studies">Higher Studies</option>
              <option value="opening_bank_account">Opening a Bank Account</option>
              <option value="other">Other</option>
            </select>
            {errors.reasonForRequest && <span className="bl-error">{errors.reasonForRequest}</span>}
          </div>

          <div className="bl-form-group">
            <label>Enter the Reason <span className="bl-required">*</span></label>
            <input
              type="text"
              name="otherReason"
              className="bl-input-field"
              placeholder="If 'Other' is chosen"
              value={formData.otherReason}
              onChange={handleChange}
              disabled={formData.reasonForRequest !== 'other'}
              required={formData.reasonForRequest === 'other'}
            />
            {errors.otherReason && <span className="bl-error">{errors.otherReason}</span>}
          </div>
        </div>
      </div>

      <div className="bl-form-actions bl-sticky-footer">
        <button className="bl-btn bl-blue" onClick={handleSubmit}>Submit</button>
        <button className="bl-btn bl-gray" onClick={cancelBtn}>Cancel</button>
      </div>
    </div>
  );
};

export default BonafideLetterForm;