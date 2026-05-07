import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ProfileSettingsPage.css';
import OverviewImage from '../assets/BackWall.png';
import { FaUserEdit } from 'react-icons/fa';

axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ProfileSettingsPage = ({ isNested }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(location.state?.updatedUser || null);
  const [loading, setLoading] = useState(!location.state?.updatedUser);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileAndCandidates = async () => {
      try {
        // Fetch user profile
        const { data: profileData } = await axios.get('/api/users/profile');
        let employeeId = 'N/A';
        let candidateId = profileData.candidateId || 'N/A';
        
        try {
          // Fetch employee list
          const { data: employees } = await axios.get('/api/users');
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
        setUserData({ ...profileData, employeeId, candidateId });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || err.message);
        if (err.response?.status === 401) {
          localStorage.removeItem('userToken');
          navigate('/homepage');
        }
      } finally {
        setLoading(false);
      }
    };
    if (!location.state?.updatedUser) fetchProfileAndCandidates();
  }, [navigate, location.state]);

  const formatDate = (dateString) => {
    if (!dateString) return 'NA';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'NA' : date.toLocaleDateString();
    } catch {
      return 'NA';
    }
  };

  const formatValue = (value) => {
    if (!value || value === 'undefined' || value === 'null') return 'NA';
    const trimmed = value.toString().trim();
    return trimmed && trimmed !== 'undefined' && trimmed !== 'null' ? trimmed : 'NA';
  };

  const renderField = (label, value, isDate = false) => (
    <div className="profile-info-row" key={label}>
      <span className="profile-label">{label}</span>
      <span className="profile-value">{isDate ? formatDate(value) : formatValue(value)}</span>
    </div>
  );

  if (loading) return <div className="loading-message">Loading profile...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div>
      {!isNested && (
        <nav className="profile-navbar">
          <div className="profile-nav-links">Profile Settings</div>
          <button className="profile-close-button" onClick={() => navigate('/homepage')}>&times;</button>
        </nav>
      )}
      <div className="profile-container">
        {!isNested && (
          <div className="profile-header-image" style={{ backgroundImage: `url(${OverviewImage})` }} />
        )}
        {!isNested && (
          <div className="profile-header">
            <div className="profile-image-wrapper">
              <img
                src={
                  userData?.profileImage
                    ? (userData.profileImage.startsWith('http') ? userData.profileImage : `${axios.defaults.baseURL}${userData.profileImage}`)
                    : 'https://via.placeholder.com/120'
                }
                alt="Profile"
                className="profile-image"
                onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/120'; }}
              />
            </div>
            <div className="profile-name-row">
              <h2 className="profile-name">
                {userData?.firstName || userData?.fullname?.split(' ')[0] || ''}&nbsp;
                {userData?.lastName || userData?.fullname?.split(' ')[1] || ''}
              </h2>
              <button
                onClick={() => navigate('/edit-profile', { state: { currentUserData: userData } })}
                className="edit-profile-icon-btn"
                title="Edit Profile"
              >
                <FaUserEdit />
              </button>
            </div>
          </div>
        )}
        {!isNested && (
          <>
            <h2 className="profile-Email">{formatValue(userData?.email)}</h2>
            <h2 className="profile-role">{formatValue(userData?.designation)}</h2>
          </>
        )}
        <div className="profile-section-wrapper">
          {/* Basic Information */}
          <div className="profile-section">
            <div className="profile-section-title">Basic Information</div>
            <div className="profile-info-grid">
              {renderField('Employee ID', userData?.employeeId)}
              {renderField('Candidate ID', userData?.candidateId)}
              {renderField('Mobile Number', userData?.mobileNo)}
              {renderField('First Name', userData?.firstName)}
              {renderField('Last Name', userData?.lastName)}
              {renderField('Email Address', userData?.email)}
            </div>
          </div>
          {/* Work Information */}
          <div className="profile-section">
            <div className="profile-section-title">Work Information</div>
            <div className="profile-info-grid">
              {renderField('Department', userData?.department)}
              {renderField('Role', userData?.hrmsRole)}
              {renderField('Location', userData?.location)}
              {renderField('Employment Type', userData?.employmentType)}
              {renderField('Designation', userData?.designation)}
              {renderField('Employee Status', userData?.employeeStatus)}
              {renderField('Source Of Hire', userData?.sourceOfHire)}
              {renderField('Date Of Joining', userData?.dateOfJoining, true)}
              {renderField('Current Experience', userData?.currentExperience)}
              {renderField('Total Experience', userData?.totalExperience)}
            </div>
          </div>
          {/* Personal Details */}
          <div className="profile-section">
            <div className="profile-section-title">Personal Details</div>
            <div className="profile-info-grid1">
              {renderField('Date of Birth', userData?.dob, true)}
              {renderField('Expertise', userData?.expertise)}
              {renderField('Gender', userData?.gender)}
              {renderField('Marital Status', userData?.maritalStatus)}
              {renderField('About Me', userData?.aboutMe)}
            </div>
          </div>
          {/* Identity Information */}
          <div className="profile-section">
            <div className="profile-section-title">Identity Information</div>
            <div className="profile-info-grid1">
              {renderField('UAN', userData?.uanNO)}
              {renderField('PAN', userData?.panNO)}
              {renderField('Aadhaar', userData?.aadhaarNO)}
            </div>
          </div>
          {/* Dates */}
          <div className="profile-section">
            <div className="profile-section-title">Dates</div>
            <div className="profile-info-grid1">
              {renderField('Probation Period Start', userData?.ProbationPeriodStart, true)}
              {renderField('Probation Period End', userData?.ProbationPeriodEnd, true)}
              {renderField('Notice Period Start', userData?.NoticePeriodStart, true)}
              {renderField('Notice Period End', userData?.NoticePeriodEnd, true)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;