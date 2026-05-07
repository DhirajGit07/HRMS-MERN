import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

import './AllNavBar.css';
import OverviewProfile from '../assets/profileicon.png';
import searchImg from '../assets/search.png';
import phoneIcon from '../assets/phoneIcon.png';
import settingIcon from '../assets/settings.png';
import notification from '../assets/Notification.png';
import { FiLogOut } from 'react-icons/fi';
import Swal from 'sweetalert2';
import ProfileModel from './ProfileModel';

axios.defaults.baseURL = 'http://localhost:8000';

function OnboardingNavbar({ onLogout }) {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const quickActionsRef = useRef(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (query) => {
    if (!query) return;
    if (location.pathname === '/homepage') {
      alert(`Searching "${query}" on Home Page`);
    } else if (location.pathname === '/dashboard') {
      alert(`Searching "${query}" on Dashboard`);
    } else {
      alert(`Search not available on this page`);
    }
  };



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
        <Link to="/homepage" className={`all-nav-links ${location.pathname === '/homepage' ? 'active' : ''}`}>
          Onboarding
        </Link>

        <div className="all-nav-icons">


          {showSearchInput && (
            <input
              type="text"
              className="all-search-input"
              placeholder="Search..."
              title='Search'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchText)}
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
            <img src={settingIcon} alt="Settings" className="all-icon-button" title='Settings' />
          </Link>

          <img
            src={userProfile.profileImage}
            alt="Profile"
            className="all-profile-pic"
            title='Profile'
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
          {showLogoutConfirm && (
            <div className="logout-confirm-overlay">


              <div className="logout-confirm-modal">
                <div className="user-info">


                  <div className='settingpageUpper'>
                    <div className="user-name1"> Hi!&nbsp;
                      {userProfile.firstName} {userProfile.lastName}
                    </div>

                  </div>
                </div>
                <h3>Are You Sure You Want To Logout?</h3>
                <div className="logout-confirm-buttons">
                  <button onClick={handleLogout} className="logout-confirm-btn">Yes</button>
                  <button onClick={() => setShowLogoutConfirm(false)} className="logout-cancel-btn">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>


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
    </>
  );
}

export default OnboardingNavbar;
