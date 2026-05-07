import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddressProofForm.css';
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

const AddressProofForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employeeId: '',
    candidateId: '',
    employeeEmail: '',
    requestDate: '',
    reasonForRequest: '',
    otherReason: '',
    hasAddressChange: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    dateOfJoining: '',
    designation: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [userRole, setUserRole] = useState('');
  // On mount, fetch user profile and employee data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user profile
        const profileResponse = await axios.get('/api/users/profile');
        const profileData = profileResponse.data;

        setUserRole(profileData.role || '');

        let employeeId = 'N/A';
        let candidateId = profileData.candidateId || 'N/A';
        
        try {
          // Fetch employee list to get employee ID and candidate ID
          const employeesResponse = await axios.get('/api/users');
          const employees = employeesResponse.data;
          const match = employees.find(e =>
            e.email?.toLowerCase() === profileData.email?.toLowerCase()
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
          employeeEmail: profileData.email || '',
          dateOfJoining: profileData.dateOfJoining || '',
          designation: profileData.designation || ''
        }));
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        setError(msg);
        if (err.response?.status === 401) {
          localStorage.removeItem('userToken');
          navigate('/homepage');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = e => {
    const { name, value, type } = e.target;
    let newVal = value;
    if (type === 'text') newVal = newVal.replace(/[^a-zA-Z0-9\s]/g, '');
    setFormData(f => ({ ...f, [name]: newVal }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.employeeId.trim() || formData.employeeId === 'N/A') {
      errs.employeeId = 'Employee ID is required.';
    }
    if (!formData.candidateId.trim() || formData.candidateId === 'N/A') {
      errs.candidateId = 'Candidate ID is required.';
    }
    if (!formData.employeeEmail.trim()) {
      errs.employeeEmail = 'Email is required.';
    }
    if (!formData.requestDate.trim()) {
      errs.requestDate = 'Request date is required.';
    }
    if (!formData.reasonForRequest) {
      errs.reasonForRequest = 'Reason for request is required.';
    }
    if (formData.reasonForRequest === 'other' && !formData.otherReason.trim()) {
      errs.otherReason = 'Please specify the reason.';
    }
    if (!formData.hasAddressChange) {
      errs.hasAddressChange = 'Please select address change option.';
    }
    if (formData.hasAddressChange === 'yes') {
      if (!formData.addressLine1.trim()) {
        errs.addressLine1 = 'Address Line 1 is required.';
      }
      if (!formData.city.trim()) {
        errs.city = 'City is required.';
      }
      if (!formData.state) {
        errs.state = 'State is required.';
      }
      if (!formData.country) {
        errs.country = 'Country is required.';
      }
      if (!formData.postalCode.trim()) {
        errs.postalCode = 'Postal Code is required.';
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

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
      await axios.post('/api/address-proof', formData);
      
      toast.success('Address proof submitted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      
      setTimeout(() => navigate('/AddressProof'), 1500);
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || 'Submission failed';
      
      toast.error(errorMessage, {
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

  const handleCancel = () => navigate('/AddressProof');

  if (loading) return <div className="loading-message">Loading profile...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="ap-address-proof-container">
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
      <div className="ap-form-scroll-container">
        <div className="ap-header"><h2>Add Address Proof</h2></div>

        <div className="ap-form-box">
          <h3 className="ap-section-title">Address Proof Details</h3>

          <div className="ap-form-row">
                 {userRole === 'admin' && (
            <div className="ap-form-group">
              <label>System ID <span className="ap-required">*</span></label>
              <input 
                type="text" 
                name="employeeId" 
                className="ap-input-field" 
                value={formData.employeeId} 
                disabled 
              />
              {formErrors.employeeId && <small className="ap-error">{formErrors.employeeId}</small>}
            </div>
                    )}

            <div className="ap-form-group">
              <label>Candidate ID <span className="ap-required">*</span></label>
              <input 
                type="text" 
                name="candidateId" 
                className="ap-input-field" 
                value={formData.candidateId} 
                disabled 
              />
              {formErrors.candidateId && <small className="ap-error">{formErrors.candidateId}</small>}
            </div>
            <div className="ap-form-group">
              <label>Email <span className="ap-required">*</span></label>
              <input 
                type="email" 
                name="employeeEmail" 
                className="ap-input-field" 
                value={formData.employeeEmail} 
                disabled 
              />
              {formErrors.employeeEmail && <small className="ap-error">{formErrors.employeeEmail}</small>}
            </div>
          </div>

          <div className="ap-form-row">
            <div className="ap-form-group">
              <label>Date of request <span className="ap-required">*</span></label>
              <input 
                type="date" 
                name="requestDate" 
                className="ap-input-field" 
                value={formData.requestDate} 
                onChange={handleChange} 
              />
              {formErrors.requestDate && <small className="ap-error">{formErrors.requestDate}</small>}
            </div>
          </div>

          <div className="ap-form-row">
            <div className="ap-form-group">
              <label>Date of Joining</label>
              <input 
                type="text" 
                name="dateOfJoining" 
                className="ap-input-field" 
                value={formData.dateOfJoining} 
                disabled 
              />
            </div>
            <div className="ap-form-group">
              <label>Designation</label>
              <input 
                type="text" 
                name="designation" 
                className="ap-input-field" 
                value={formData.designation} 
                disabled 
              />
            </div>
          </div>

          <div className="ap-form-row">
            <div className="ap-form-group">
              <label>Reason for request <span className="ap-required">*</span></label>
              <select 
                name="reasonForRequest" 
                className="ap-input-field" 
                value={formData.reasonForRequest} 
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="address_change">Address Change</option>
                <option value="other">Other</option>
              </select>
              {formErrors.reasonForRequest && <small className="ap-error">{formErrors.reasonForRequest}</small>}
            </div>
            <div className="ap-form-group">
              <label>If "Other," please specify <span className="ap-required">*</span></label>
              <input 
                type="text" 
                name="otherReason" 
                className="ap-input-field" 
                placeholder="Enter reason"
                value={formData.otherReason} 
                onChange={handleChange} 
                disabled={formData.reasonForRequest !== 'other'} 
              />
              {formErrors.otherReason && <small className="ap-error">{formErrors.otherReason}</small>}
            </div>
          </div>

          <div className="ap-form-row">
            <div className="ap-form-group ap-full-width">
              <label>Is there any change in present address? <span className="ap-required">*</span></label>
              <select 
                name="hasAddressChange" 
                className="ap-input-field" 
                value={formData.hasAddressChange} 
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              {formErrors.hasAddressChange && <small className="ap-error">{formErrors.hasAddressChange}</small>}
            </div>
          </div>

          {formData.hasAddressChange === 'yes' && (
            <>
              <h4 className="ap-subsection-title">New Present Address</h4>
              <div className="ap-form-row">
                <div className="ap-form-group ap-full-width">
                  <label>Address Line 1 <span className="ap-required">*</span></label>
                  <input 
                    type="text" 
                    name="addressLine1" 
                    className="ap-input-field" 
                    value={formData.addressLine1} 
                    onChange={handleChange} 
                  />
                  {formErrors.addressLine1 && <small className="ap-error">{formErrors.addressLine1}</small>}
                </div>
              </div>
              <div className="ap-form-row">
                <div className="ap-form-group ap-full-width">
                  <label>Address Line 2</label>
                  <input 
                    type="text" 
                    name="addressLine2" 
                    className="ap-input-field" 
                    value={formData.addressLine2} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
              <div className="ap-form-row">
                <div className="ap-form-group">
                  <label>City <span className="ap-required">*</span></label>
                  <input 
                    type="text" 
                    name="city" 
                    className="ap-input-field" 
                    value={formData.city} 
                    onChange={handleChange} 
                  />
                  {formErrors.city && <small className="ap-error">{formErrors.city}</small>}
                </div>
                <div className="ap-form-group">
                  <label>State <span className="ap-required">*</span></label>
                  <select 
                    name="state" 
                    className="ap-input-field" 
                    value={formData.state} 
                    onChange={handleChange}
                  >
                    <option value="">Select State</option>
                    <option value="MH">Maharashtra</option>
                    <option value="KA">Karnataka</option>
                  </select>
                  {formErrors.state && <small className="ap-error">{formErrors.state}</small>}
                </div>
              </div>
              <div className="ap-form-row">
                <div className="ap-form-group">
                  <label>Country <span className="ap-required">*</span></label>
                  <select 
                    name="country" 
                    className="ap-input-field" 
                    value={formData.country} 
                    onChange={handleChange}
                  >
                    <option value="">Select Country</option>
                    <option value="IN">India</option>
                    <option value="US">United States</option>
                  </select>
                  {formErrors.country && <small className="ap-error">{formErrors.country}</small>}
                </div>
                <div className="ap-form-group">
                  <label>Postal Code <span className="ap-required">*</span></label>
                  <input 
                    type="text" 
                    name="postalCode" 
                    className="ap-input-field" 
                    value={formData.postalCode} 
                    onChange={handleChange} 
                  />
                  {formErrors.postalCode && <small className="ap-error">{formErrors.postalCode}</small>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="ap-form-actions">
        <button className="ap-btn ap-blue" onClick={handleSubmit}>Submit</button>
        <button className="ap-btn ap-gray" onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default AddressProofForm;