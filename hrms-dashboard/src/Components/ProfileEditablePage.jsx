import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfileSettingsPage.css';
import OverviewImage from '../assets/BackWall.png';
import DefaultProfileImage from '../assets/profileicon.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const EditProfileSettingsPage = () => {
  const navigate = useNavigate();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    candidateId: '', 
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    hrmsRole: '',
    location: '',
    employmentType: '',
    designation: '',
    employeeStatus: '',
    sourceOfHire: '',
    dateOfJoining: '',
    currentExperience: '',
    totalExperience: '',
    uanNO: '',
    panNO: '',
    aadhaarNO: '',
    dob: '',
    expertise: '',
    gender: '',
    maritalStatus: '',
    aboutMe: '',
    profileImage: null,
    previewImage: DefaultProfileImage,
    mobileNo: '',
    ProbationPeriodStart: '',
    ProbationPeriodEnd: '',
    NoticePeriodStart: '',
    NoticePeriodEnd: '',
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const requiredFields = [
    'employeeId',
     'candidateId',
    'firstName',
    'lastName',
    'email',
    'mobileNo',
    'department',
    'hrmsRole',
    'location',
    'employmentType',
    'designation',
    'employeeStatus',
    'sourceOfHire',
    'dateOfJoining',
    'gender',
    'maritalStatus',
    'dob'
  ];

  // Fetch all candidates for employee ID matching
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await axios.get('/api/users');
        setCandidates(res.data);
      } catch (err) {
        console.error('Error fetching candidates:', err);
        toast.error('Failed to load candidate data', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } finally {
        setLoadingCandidates(false);
      }
    };
    fetchCandidates();
  }, []);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('/api/users/profile');

        const formatDateString = (str) => {
          if (!str) return '';
          if (typeof str === 'string' && str.length >= 10) {
            return str.slice(0, 10);
          }
          return '';
        };

        let profileImageUrl = DefaultProfileImage;
        if (data.profileImage) {
          if (typeof data.profileImage === 'string') {
            profileImageUrl = data.profileImage.startsWith('http')
              ? data.profileImage
              : `${axios.defaults.baseURL}${data.profileImage}`;
          }
        }

        setFormData(fd => ({
          ...fd,
          firstName: data.firstName || fd.firstName,
          lastName: data.lastName || fd.lastName,
          email: data.email || fd.email,
          mobileNo: data.mobileNo || fd.mobileNo,
          department: data.department || fd.department,
          designation: data.designation || fd.designation,
          aboutMe: data.aboutMe || fd.aboutMe,
          profileImage: data.profileImage || null,
          previewImage: profileImageUrl,
          hrmsRole: data.hrmsRole || fd.hrmsRole,
          location: data.location || fd.location,
          employmentType: data.employmentType || fd.employmentType,
          employeeStatus: data.employeeStatus || fd.employeeStatus,
          sourceOfHire: data.sourceOfHire || fd.sourceOfHire,
          dateOfJoining: formatDateString(data.dateOfJoining) || fd.dateOfJoining,
          currentExperience: data.currentExperience || fd.currentExperience,
          totalExperience: data.totalExperience || fd.totalExperience,
          uanNO: data.uanNO || fd.uanNO,
          panNO: data.panNO || fd.panNO,
          aadhaarNO: data.aadhaarNO || fd.aadhaarNO,
          dob: formatDateString(data.dob) || fd.dob,
          expertise: data.expertise || fd.expertise,
          gender: data.gender || fd.gender,
          maritalStatus: data.maritalStatus || fd.maritalStatus,
          ProbationPeriodStart: formatDateString(data.ProbationPeriodStart) || formatDateString(data.dateOfJoining),
          ProbationPeriodEnd: formatDateString(data.ProbationPeriodEnd),
          NoticePeriodStart: formatDateString(data.NoticePeriodStart),
          NoticePeriodEnd: formatDateString(data.NoticePeriodEnd),
          candidateId: data.candidateId || fd.candidateId,
        }));
      } catch (err) {
        console.error('Fetch profile error:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('userToken');
          toast.error('Session expired. Please login again', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          navigate('/homepage');
        } else {
          toast.error('Failed to load profile data', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (formData.previewImage && formData.previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(formData.previewImage);
      }
    };
  }, [formData.previewImage]);

  useEffect(() => {
    if (loadingProfile || loadingCandidates) return;
    const email = formData.email?.trim().toLowerCase();
    if (!email) return;

    const match = candidates.find(c => c.email.toLowerCase() === email);
    if (match) {
      const empId = match.employeeId?.trim();
      const isValidEmployeeId = empId && empId !== 'N/A';
      const candidateId = match.candidateId?.trim();
      const isValidCandidateId = candidateId && candidateId !== 'N/A';
      
      setFormData(fd => ({
        ...fd,
        employeeId: isValidEmployeeId ? empId : 'N/A',
         candidateId: isValidCandidateId ? candidateId : 'N/A',
        department: match.department || fd.department
      }));
    }
  }, [loadingProfile, loadingCandidates, formData.email, candidates]);

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'employeeId':
        if (!value) error = 'Employee ID is required';
        break;
         case 'candidateId':
        if (!value) error = 'Candidate ID is required';
        break;
      case 'firstName':
      case 'lastName':
        if (!value) error = 'This field is required';
        else if (!/^[A-Za-z\s]+$/.test(value)) error = 'Only letters and spaces allowed';
        else if (value.length > 30) error = 'Cannot exceed 30 characters';
        break;
      case 'email':
        if (!value) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        break;
      case 'mobileNo':
        if (!value) error = 'Mobile number is required';
        else if (!/^[0-9]*$/.test(value)) error = 'Only numbers are allowed';
        else if (!/^[6-9]\d{9}$/.test(value)) error = 'Must be 10 digits starting with 6-9';
        break;
      case 'department':
      case 'designation':
      case 'hrmsRole':
      case 'location':
      case 'employmentType':
      case 'employeeStatus':
      case 'sourceOfHire':
      case 'gender':
      case 'maritalStatus':
        if (!value) error = 'Please select an option';
        break;
      case 'dateOfJoining':
      case 'dob':
        if (!value) error = 'Date is required';
        break;
      case 'currentExperience':
      case 'totalExperience':
        if (value && isNaN(value)) error = 'Must be a number';
        break;
      case 'uanNO':
        if (value && !/^\d{12}$/.test(value)) error = 'Must be 12 digits';
        break;
      case 'panNO':
        if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) error = 'Invalid PAN format';
        break;
      case 'aadhaarNO':
        if (value && !/^\d{12}$/.test(value)) error = 'Must be 12 digits';
        break;
      case 'aboutMe':
        if (value && value.length > 500) error = 'Cannot exceed 500 characters';
        break;
      default:
        break;
    }

    return error;
  };

  const handleChange = e => {
    const { name, value, files } = e.target;

    if (name === 'profileImage' && files?.[0]) {
      const f = files[0];
      if (f.size > 2 * 1024 * 1024) {
        setValidationErrors(v => ({ ...v, profileImage: 'Max 2MB' }));
        toast.error('Image size should be less than 2MB', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }
      setFormData(fd => ({ ...fd, profileImage: f, previewImage: URL.createObjectURL(f) }));
      setValidationErrors(v => ({ ...v, profileImage: '' }));
      return;
    }

    if (name === 'dateOfJoining') {
      setFormData(fd => ({
        ...fd,
        dateOfJoining: value,
        ProbationPeriodStart: value,
        NoticePeriodStart: fd.NoticePeriodStart && new Date(fd.NoticePeriodStart) < new Date(value) ? '' : fd.NoticePeriodStart,
        NoticePeriodEnd: fd.NoticePeriodEnd && new Date(fd.NoticePeriodEnd) < new Date(value) ? '' : fd.NoticePeriodEnd
      }));

      const dojErr = validateField('dateOfJoining', value);
      const ppsErr = validateField('ProbationPeriodStart', value);
      setValidationErrors(v => ({
        ...v,
        dateOfJoining: dojErr,
        ProbationPeriodStart: ppsErr,
      }));
      return;
    }

    if (name === 'ProbationPeriodEnd') {
      setFormData(fd => ({
        ...fd,
        [name]: value,
        NoticePeriodStart: fd.NoticePeriodStart && new Date(fd.NoticePeriodStart) < new Date(value) ? '' : fd.NoticePeriodStart,
        NoticePeriodEnd: fd.NoticePeriodEnd && new Date(fd.NoticePeriodEnd) < new Date(value) ? '' : fd.NoticePeriodEnd
      }));

      const err = validateField(name, value);
      setValidationErrors(v => ({ ...v, [name]: err }));
      return;
    }

    const err = validateField(name, value);
    setValidationErrors(v => ({ ...v, [name]: err }));
    setFormData(fd => ({ ...fd, [name]: value }));

    if (name === 'mobileNo') {
      if (value === '' || /^[0-9]*$/.test(value)) {
        const err = validateField(name, value);
        setValidationErrors(v => ({ ...v, [name]: err }));
        setFormData(fd => ({ ...fd, [name]: value }));
      }
      return;
    }
  };

  const validateForm = () => {
    const errs = {};
    let ok = true;
    Object.entries(formData).forEach(([k, v]) => {
      if (['profileImage', 'previewImage'].includes(k)) return;
      const e = validateField(k, v);
      if (e) { errs[k] = e; ok = false; }
    });
    setValidationErrors(errs);
    return ok;
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Fix validation errors');
      toast.error('Please fix all validation errors before submitting', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }
    setShowConfirmation(true);
  };

  const handleRemoveProfileImageClick = () => {
    setShowRemoveConfirmation(true);
  };

  const handleConfirmedSubmit = () => {
    setShowConfirmation(false);
    setLoading(true);
    setError(null);
    const payload = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (k === 'previewImage') return;
      if (k === 'profileImage' && v instanceof File) payload.append('profileImage', v);
      else if (v != null) payload.append(k, v);
    });

    axios.put('/api/users/profile', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        setSuccess(true);
        toast.success('Profile updated successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        setTimeout(() => navigate('/profile-settings'), 1500);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Update failed');
        toast.error(err.response?.data?.message || 'Failed to update profile', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      })
      .finally(() => setLoading(false));
  };

  const handleConfirmRemoveProfileImage = async () => {
    setShowRemoveConfirmation(false);
    try {
      setLoading(true);
      const response = await axios.delete('/api/users/profile/image');

      if (response.status === 200) {
        setFormData(fd => ({
          ...fd,
          profileImage: null,
          previewImage: DefaultProfileImage
        }));
        setValidationErrors(v => ({ ...v, profileImage: '' }));
        setSuccess(true);
        toast.success('Profile image removed successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        setError('Failed to remove profile image');
        toast.error('Failed to remove profile image', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (err) {
      console.error('Error removing profile image:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('userToken');
        toast.error('Session expired. Please login again', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to remove profile image');
        toast.error(err.response?.data?.message || 'Failed to remove profile image', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderField = (label, name, type = 'text', opts = [], extraProps = {}) => (
    <div className="profile-info-row" key={name}>
      <label className="profile-label" htmlFor={name}>
        {label}
        {requiredFields.includes(name) && <span className="required-star">*</span>}
      </label>
      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          disabled={loading}
          className={validationErrors[name] ? 'error-border' : ''}
          {...extraProps}
        >
          <option value="">Select One</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          disabled={loading}
          className={validationErrors[name] ? 'error-border' : ''}
          {...extraProps}
        />
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          disabled={loading}
          className={validationErrors[name] ? 'error-border' : ''}
          readOnly={name === 'employeeId'}
          {...extraProps}
        />
      )}
      {validationErrors[name] && <div className="error-message-inline">{validationErrors[name]}</div>}
    </div>
  );

  return (
    <div>
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
      <nav className="profile-navbar">
        <div className="profile-nav-links">Edit Profile</div>
        <button
          className="profile-close-button"
          onClick={() => navigate('/homepage')}
          disabled={loading}
        >
          &times;
        </button>
      </nav>

      <form onSubmit={handleSubmit}>
        <div className="profile-container">
          <div
            className="profile-header-image"
            style={{ backgroundImage: `url(${OverviewImage})` }}
          />

          <div className="profile-header1">
            <div className="profile-image-container">
              <div className="profile-image-wrapper1">
                <img
                  src={formData.previewImage}
                  alt="Profile"
                  className="profile-image1"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DefaultProfileImage;
                  }}
                />

                <div className="profile-image-actions">
                  {formData.previewImage === DefaultProfileImage ? (
                    <label htmlFor="profileImageUpload" className="profile-image-action-btn">
                      <i className="fas fa-camera"></i>
                      <span className="tooltip">Choose Profile</span>
                    </label>
                  ) : (
                    <>
                      <label htmlFor="profileImageUpload" className="profile-image-action-btn">
                        <i className="fas fa-sync-alt"></i>
                        <span className="tooltip">Change</span>
                      </label>
                      <button
                        type="button"
                        className="profile-image-action-btn remove-btn"
                        onClick={handleRemoveProfileImageClick}
                        disabled={loading}
                      >
                        <i className="fas fa-trash"></i>
                        <span className="tooltip">Remove</span>
                      </button>
                    </>
                  )}

                  <input
                    type="file"
                    id="profileImageUpload"
                    className="hidden-file-input1"
                    accept="image/*"
                    name="profileImage"
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              {validationErrors.profileImage && (
                <div className="error-message-inline">{validationErrors.profileImage}</div>
              )}
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Basic Information</div>
            <div className="profile-info-grid">
              {renderField('Employee ID', 'employeeId')}
                {renderField('Candidate ID', 'candidateId')}
              {renderField('First Name', 'firstName')}
              {renderField('Last Name', 'lastName')}
              {renderField('Email Address', 'email', 'email')}
              {renderField('Mobile Number', 'mobileNo')}
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Work Information</div>
            <div className="profile-info-grid">
              {renderField('Department', 'department', 'select', ['HR', 'Development', 'Analyst', 'Testing', 'Marketing', 'Management', 'AWS Cloud',])}
              {renderField('Role', 'hrmsRole')}
              {renderField('Location', 'location')}
              {renderField('Employment Type', 'employmentType', 'select', ['Permanent', 'Contract', 'Intern'])}
              {renderField('Designation', 'designation', 'select', ['CEO', 'Manager', 'Team Lead', 'Software Developer', 'Data Analyst', 'Software Testing', 'AWS Cloud', 'Marketing', 'HR Executive', 'Intern'])}
              {renderField('Employee Status', 'employeeStatus', 'select', ['Active', 'Inactive', 'Resigned'])}
              {renderField('Source Of Hire', 'sourceOfHire', 'select', ['LinkedIn', 'Company Website', 'Employee Referral', 'Job Portal', 'Campus Recruitment', 'Walk-in', 'Naukri', 'Internal', 'Consultancy',])}
              {renderField('Date Of Joining', 'dateOfJoining', 'date')}
              {renderField('Current Experience', 'currentExperience')}
              {renderField('Total Experience', 'totalExperience')}
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Personal Details</div>
            <div className="profile-form-grid">
              {renderField('Date of Birth', 'dob', 'date')}
              {renderField('Ask Me About/Expertise', 'expertise')}
              {renderField('Gender', 'gender', 'select', ['Male', 'Female', 'Other'])}
              {renderField('Marital Status', 'maritalStatus', 'select', ['Single', 'Married', 'Divorced', 'Widowed'])}
              {renderField('About Me', 'aboutMe', 'textarea')}
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Identity Information</div>
            <div className="profile-info-grid">
              {renderField('UAN', 'uanNO')}
              {renderField('PAN', 'panNO')}
              {renderField('Aadhaar', 'aadhaarNO')}
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Dates</div>
            <div className="profile-form-grid">
              {renderField('Probation Period Start', 'ProbationPeriodStart', 'date', [], {
                readOnly: formData.ProbationPeriodStart === formData.dateOfJoining,
                className: formData.ProbationPeriodStart === formData.dateOfJoining
                  ? 'read-only-field'
                  : validationErrors['ProbationPeriodStart'] ? 'error-border' : ''
              })}

              {renderField('Probation Period End', 'ProbationPeriodEnd', 'date', [], {
                min: formData.ProbationPeriodStart,
                disabled: !formData.ProbationPeriodStart
              })}

              {renderField('Notice Period Start', 'NoticePeriodStart', 'date', [], {
                min: formData.ProbationPeriodEnd,
                disabled: !formData.ProbationPeriodEnd
              })}

              {renderField('Notice Period End', 'NoticePeriodEnd', 'date', [], {
                min: formData.NoticePeriodStart || formData.ProbationPeriodEnd,
                disabled: (!formData.NoticePeriodStart && !formData.ProbationPeriodEnd)
              })}
            </div>
          </div>

          <div className="profile-button-row">
            <button
              type="submit"
              className="profile-btn profile-btn-save"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="profile-btn profile-btn-cancel"
              onClick={() => navigate('/profile-settings')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      {showConfirmation && (
        <div className="confirmation-dialog-overlay">
          <div className="confirmation-dialog">
            <h3>Confirm Submission</h3>
            <p>Are you sure you want to submit these changes?</p>
            <div className="confirmation-buttons">
              <button
                className="profile-btn profile-btn-confirm"
                onClick={handleConfirmedSubmit}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Yes, Submit'}
              </button>
              <button
                className="profile-btn profile-btn-cancel"
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveConfirmation && (
        <div className="confirmation-dialog-overlay">
          <div className="confirmation-dialog">
            <h3>Confirm Removal</h3>
            <p>Are you sure you want to remove your profile image?</p>
            <div className="confirmation-buttons">
              <button
                className="profile-btn profile-btn-confirm"
                onClick={handleConfirmRemoveProfileImage}
                disabled={loading}
              >
                {loading ? 'Removing...' : 'Yes, Remove'}
              </button>
              <button
                className="profile-btn profile-btn-cancel"
                onClick={() => setShowRemoveConfirmation(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfileSettingsPage;