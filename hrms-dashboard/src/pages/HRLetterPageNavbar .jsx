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
import ProfileModel from './ProfileModel';
import Swal from 'sweetalert2';
axios.defaults.baseURL = 'http://localhost:8000';
const HRLetterPageNavbar = ({ onLogout }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const quickActionsRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
    if (location.pathname === '/homepage') {
      alert(`Searching "${query}" on Home Page`);
    } else if (location.pathname === '#') {
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
          navigate('/login');
        }
      }
    };
    fetchUserProfile();
  }, [navigate]);
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      // Clear all authentication-related data
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('rememberedCredentials');
      // Remove axios authorization header
      delete axios.defaults.headers.common['Authorization'];
      // Redirect to login page
      navigate('/');
      // Show success message
      // Swal.fire({
      //   title: 'Logged Out',
      //   text: 'You have been successfully logged out',
      //   icon: 'success',
      //   timer: 1500,
      //   showConfirmButton: false
      // });
    } catch (error) {
      console.error('Logout error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to logout. Please try again.',
        icon: 'error'
      });
    } finally {
      setIsLoggingOut(false);
    }
  };
  const handleSweetAlertLogout = () => {
    Swal.fire({
      title: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085D6',
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
        <Link to="/AddressProof" className={`all-nav-links ${location.pathname === '/AddressProof' ? 'active' : ''}`}>
          HR Letters
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchText);
                }
              }}
            />
          )}
          <Link to="/settingpage">
            <img src={settingIcon} alt="Settings" className="all-icon-button" title='Settings'/>
          </Link>
          <img
            src={userProfile.profileImage}
            alt="Profile"
            className="all-profile-pic"
            title='Profile'
            onClick={() => {
              setShowProfileModal(true);
              setShowNotificationModal(false);
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
        <Link to="/AddressProof" className={`all-tab ${location.pathname === '/AddressProof' ? 'active' : ''}`}>
          Address Proof
        </Link>
        <Link to="/BonafideLetter" className={`all-tab ${location.pathname === '/BonafideLetter' ? 'active' : ''}`}>
          Bonafide Letter
        </Link>
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
        <ProfileModel
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userProfile={userProfile}
        />
      </div>
    </>
  );
};
export default HRLetterPageNavbar;