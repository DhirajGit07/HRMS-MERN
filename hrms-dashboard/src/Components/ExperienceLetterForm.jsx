import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ExperienceLetterForm.css';

axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ExperienceLetterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employeeId: '',
    requestDate: '',
    reasonForRequest: '',
    otherReason: '',
    dateOfJoining: '',
    designation: '',
    department: '',
    currentExperience: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/users/profile');
        const profile = res.data;
        setFormData(prev => ({
          ...prev,
          employeeId: profile.employeeId || '',
          dateOfJoining: profile.dateOfJoining?.substring(0, 10) || '',
          designation: profile.designation || '',
          department: profile.department || '',
          currentExperience: profile.currentExperience || ''
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

    if (name === 'otherReason') {
      // Allow only letters and spaces
      if (!/^[a-zA-Z\s]*$/.test(value)) return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.requestDate) errors.requestDate = 'Date of request is required.';
    if (!formData.reasonForRequest) errors.reasonForRequest = 'Reason is required.';
    if (formData.reasonForRequest === 'other' && !formData.otherReason.trim()) {
      errors.otherReason = 'Please enter a valid reason.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const cancelBtn = () => navigate('/ExperienceLetter');

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const response = await axios.post('/api/experience-letter', formData);
      alert(response.data.message || 'Experience letter submitted!');
      navigate('/ExperienceLetter');
    } catch (error) {
      console.error('Submission failed:', error);
      alert(error.response?.data?.message || 'Submission failed');
    }
  };

  if (loading) return <div className="loading-message">Loading profile...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="el-container">
      <div className="el-header">
        <h2>Add Experience Letter</h2>
      </div>

      <div className="el-form-box">
        <h3 className="el-section-title">Experience Letter Details</h3>

        <div className="el-form-row">
          <div className="el-form-group">
            <label>Employee ID <span className="el-required">*</span></label>
            <input 
              type="text" 
              name="employeeId"
              className="el-input-field" 
              value={formData.employeeId}
              disabled
            />
          </div>
          <div className="el-form-group">
            <label>Date of request <span className="el-required">*</span></label>
            <input 
              type="date" 
              name="requestDate"
              className="el-input-field"
              value={formData.requestDate}
              onChange={handleChange}
            />
            {formErrors.requestDate && <small className="el-error">{formErrors.requestDate}</small>}
          </div>
        </div>

        <div className="el-form-row">
          <div className="el-form-group">
            <label>Date of Joining</label>
            <div className="el-readonly-field">{formData.dateOfJoining || '-'}</div>
          </div>
          <div className="el-form-group">
            <label>Designation</label>
            <div className="el-readonly-field">{formData.designation || '-'}</div>
          </div>
        </div>

        <div className="el-form-row">
          <div className="el-form-group">
            <label>Department</label>
            <div className="el-readonly-field">{formData.department || '-'}</div>
          </div>
          <div className="el-form-group">
            <label>Current Experience</label>
            <div className="el-readonly-field">{formData.currentExperience || '-'}</div>
          </div>
        </div>

        <div className="el-form-row">
          <div className="el-form-group">
            <label>Reason for request <span className="el-required">*</span></label>
            <select 
              name="reasonForRequest"
              className="el-input-field"
              value={formData.reasonForRequest}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="visa_application">Visa Application</option>
              <option value="higher_studies">Higher Studies</option>
              <option value="opening_bank_account">Opening a Bank Account</option>
              <option value="other">Other</option>
            </select>
            {formErrors.reasonForRequest && <small className="el-error">{formErrors.reasonForRequest}</small>}
          </div>

          <div className="el-form-group">
            <label>Enter the Reason for request <span className="el-required">*</span></label>
            <input 
              type="text" 
              name="otherReason"
              className="el-input-field" 
              placeholder="If others is chosen" 
              value={formData.otherReason}
              onChange={handleChange}
              disabled={formData.reasonForRequest !== 'other'}
              required={formData.reasonForRequest === 'other'}
            />
            {formData.reasonForRequest === 'other' && formErrors.otherReason && (
              <small className="el-error">{formErrors.otherReason}</small>
            )}
          </div>
        </div>
      </div>

      <div className="el-form-actions el-sticky-footer">
        <button className="el-btn el-blue" onClick={handleSubmit}>Submit</button>
        {/* <button className="el-btn el-blue" disabled>Submit and New</button>
        <button className="el-btn el-gray" disabled>Save Draft</button> */}
        <button className="el-btn el-gray" onClick={cancelBtn}>Cancel</button>
      </div>
    </div>
  );
};

export default ExperienceLetterForm;
