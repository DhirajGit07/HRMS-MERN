// DashboardNavbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

import './AllNavBar.css';
import userlogo from '../assets/user logo.jpg';
import OverviewProfile from '../assets/profileicon.png';
import searchImg from '../assets/search.png';
import phoneIcon from '../assets/phoneIcon.png';
import settingIcon from '../assets/settings.png';
import notification from '../assets/Notification.png';
import { FiLogOut } from 'react-icons/fi';
import Swal from 'sweetalert2';
import ProfileModel from './ProfileModel';
// ✅ Set base URL for image resolution
axios.defaults.baseURL = 'http://localhost:8000'; // Change this as per your backend

const TimeTrackerNavbar = ({ onLogout }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const quickActionsRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState({
    profileImage: OverviewProfile,
    firstName: '',
    lastName: '',
    designation: ''

  });
  useEffect(() => {
    function handleClickOutside(event) {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target)) {
        setShowQuickActions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (query) => {
    console.log("Searching for:", query);

    // Add specific logic for searching in different routes
    if (location.pathname === '/homepage') {
      alert(`Searching "${query}" on Home Page`);
      // Implement actual search logic here
    } else if (location.pathname === '#') {
      alert(`Searching "${query}" on Dashboard`);
      // Implement actual search logic here
    } else {
      alert(`Search not available on this page`);
    }
  };
  // ✅ Fetch user profile info and image
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('/api/users/profile');
        const userData = response.data;

        const resolvedImageUrl = userData.profileImage
          ? userData.profileImage.startsWith('http')
            ? userData.profileImage
            : `${axios.defaults.baseURL}${userData.profileImage}`
          : OverviewProfile;

        console.log('Fetched profile image URL:', resolvedImageUrl);

        setUserProfile({
          profileImage: resolvedImageUrl,
          firstName: userData.firstName || 'User',
          lastName: userData.lastName || '',
          designation: userData.designation || 'Team Member'

        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        if (error.response?.status === 401) {
          navigate('/');
        }
        // } finally {
        //   setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleLogout = () => {
    setIsLoggingOut(true); // show loading or fadeout

    setTimeout(() => {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      localStorage.removeItem('userToken');
      navigate('/');
    }, 400); // wait 0.5 seconds before redirect
  };
  const handleSweetAlertLogout = () => {
    Swal.fire({
      title: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        handleLogout();
      }
    });
  };
  return (
    <>
      {isLoggingOut && (
        <div className="logout-overlay">
          <div className="spinner" />
          <div className="logout-text">Logging out...</div>
        </div>
      )}
      <nav className="all-navbar">
        <Link to="/timelogs" className={`all-nav-links ${location.pathname === '/timelogs' ? 'active' : ''}`}>
          Time Tracker
        </Link>

        <div className="all-nav-icons">

          {/* <img
                        src={searchImg}
                        alt="Search Icon"
                        className="all-icon-button"
                        onClick={() => setShowSearchInput(!showSearchInput)}
                    /> */}

          {showSearchInput && (
            <input
              type="text"
              className="all-search-input"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchText);
                }
              }}
            />
          )}

          {/* <img
            src={notification}
            alt="Notifications"
            className="all-icon-button"
            onClick={() => {
              setShowNotificationModal(true);
              setShowProfileModal(false); // Close profile if open
            }}
          /> */}

          <Link to="/settingpage">
            <img src={settingIcon} alt="Settings" className="all-icon-button" />
          </Link>

          <img
            src={userProfile.profileImage}
            alt="Profile"
            className="all-profile-pic"
            onClick={() => {
              setShowProfileModal(true);
              setShowNotificationModal(false); // Close notification if open
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = OverviewProfile;
            }}
          />

          <FiLogOut
            size={1}
            className="all-icon-button1"
            onClick={handleSweetAlertLogout}
            title="Logout"
          />
        </div>
      </nav>

      <div className="all-tabs">
        {/* <Link to="/timelogs" className={`all-tab ${location.pathname === '/timelogs' ? 'active' : ''}`}>
          Time Logs
        </Link> */}
        <Link to="/timesheets" className={`all-tab ${location.pathname === '/timesheets' ? 'active' : ''}`}>Timesheets
        </Link>
        <Link to="/jobs" className={`all-tab ${location.pathname === '/jobs' ? 'active' : ''}`}>Jobs
        </Link>
        <Link to="/projects" className={`all-tab ${location.pathname === '/projects' ? 'active' : ''}`}>Projects
        </Link>
        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="notificationNav-modal-overlay">
            <div className="notificationNav-modal-content">
              <button className="notificationNav-close-btn" onClick={() => setShowNotificationModal(false)}>
                &times;
              </button>
              <h2 className="notifications">Notifications</h2>
              <div className="notificationNav-inner-box">
                <div className="notificationNav-form-group">
                  <span>No Notification</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Drawer */}
        <ProfileModel
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userProfile={userProfile}
        />
      </div>
    </>
  );
};

export default TimeTrackerNavbar;
