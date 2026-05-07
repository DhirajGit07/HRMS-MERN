


import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AllNavBar.css';
import OverviewProfile from '../assets/profileicon.png';
import notification from '../assets/Notification.png';
import settingIcon from '../assets/settings.png';
import { FiLogOut } from 'react-icons/fi';
import ProfileModel from './ProfileModel';
import Swal from 'sweetalert2';

axios.defaults.baseURL = 'http://localhost:8000';

function DashboardNavbar() {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [employeesOnLeaveToday, setEmployeesOnLeaveToday] = useState([]);
  const [newHiresNotifications, setNewHiresNotifications] = useState([]);
  const [announcementNotifications, setAnnouncementNotifications] = useState([]);
  const [removedNotifications, setRemovedNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [userProfile, setUserProfile] = useState({
    profileImage: OverviewProfile,
    firstName: '',
    lastName: '',
    designation: ''
  });

  const navigate = useNavigate();
  const location = useLocation();

  const formatDate = (iso) => {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('default', { month: 'short' });
    const time = d.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' });
    return `${day} ${month} ${time}`;
  };

  const saveRemovedNotifications = (ids) => {
    try {
      localStorage.setItem('removedNotifications', JSON.stringify(ids));
    } catch (error) {
      console.error('Error saving removed notifications:', error);
    }
  };

  const addToRemovedNotifications = (id) => {
    const updatedRemoved = [...new Set([...removedNotifications, id])];
    setRemovedNotifications(updatedRemoved);
    saveRemovedNotifications(updatedRemoved);
  };

  const fetchNotifications = async (removedList = removedNotifications) => {
    try {
      setLoadingNotifications(true);
      setLoadingAnnouncements(true);
      const [leavesResponse, newHiresResponse, announcementsResponse, profileRes] = await Promise.all([
        axios.get("/api/leaves"),
        axios.get("/api/candidates"),
        axios.get("/api/announcements"),
        axios.get("/api/users/profile"),
      ]);

      const userData = profileRes.data;
      const companyId = userData.companyId ? userData.companyId.split('-')[0] : '';

      const today = new Date().toISOString().split('T')[0];

      // Process leaves
      const onLeaveToday = leavesResponse.data.filter(leave =>
        leave.status === "Approved" &&
        leave.startDate.slice(0, 10) <= today &&
        leave.endDate.slice(0, 10) >= today &&
        !removedList.includes(`leave-${leave._id}`)
      );
      const filterLeaveWithCompanyId = onLeaveToday.filter(l => l.employeeId.split("-")[0] === companyId)      
      setEmployeesOnLeaveToday(filterLeaveWithCompanyId);

      // Process new hires
      const completedNewHires = newHiresResponse.data.filter(hire =>
        hire.status === "Completed" &&
        !removedList.includes(`hire-${hire._id}`)
      );
      const filterNewHiresWithCompId = completedNewHires.filter(n => n.employeeId.split("-")[0] === companyId)
      setNewHiresNotifications(filterNewHiresWithCompId);

      // Process announcements (show announcements from the last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentAnnouncements = announcementsResponse.data.filter(ann => {
        const annDate = new Date(ann.date);
        return (
          annDate >= oneWeekAgo &&
          !removedList.includes(`announcement-${ann._id}`)
        );
      });
      const filterAnnouncementssWithCompId = recentAnnouncements.filter(f => f.companyId === companyId)
      setAnnouncementNotifications(filterAnnouncementssWithCompId);

    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
      setLoadingAnnouncements(false);
    }
  };

  const handleRemoveNotification = (id, type) => {
    addToRemovedNotifications(id);
    if (type === 'leave') {
      setEmployeesOnLeaveToday(prev => prev.filter(leave => `leave-${leave._id}` !== id));
    } else if (type === 'new-hire') {
      setNewHiresNotifications(prev => prev.filter(hire => `hire-${hire._id}` !== id));
    } else if (type === 'announcement') {
      setAnnouncementNotifications(prev => prev.filter(ann => `announcement-${ann._id}` !== id));
    }
  };

  const handleClearAllNotifications = () => {
    const leaveIds = employeesOnLeaveToday.map(leave => `leave-${leave._id}`);
    const hireIds = newHiresNotifications.map(hire => `hire-${hire._id}`);
    const announcementIds = announcementNotifications.map(ann => `announcement-${ann._id}`);
    const allCurrentIds = [...leaveIds, ...hireIds, ...announcementIds];

    const updatedRemoved = [...new Set([...removedNotifications, ...allCurrentIds])];
    setRemovedNotifications(updatedRemoved);
    saveRemovedNotifications(updatedRemoved);

    setEmployeesOnLeaveToday([]);
    setNewHiresNotifications([]);
    setAnnouncementNotifications([]);
  };

  const getNotificationCount = () => {
    if (loadingNotifications || loadingAnnouncements) return 0;
    return employeesOnLeaveToday.length + newHiresNotifications.length + announcementNotifications.length;
  };

  const getNotificationsToDisplay = () => {
    const leaveNotifications = employeesOnLeaveToday.map(leave => ({
      type: 'leave',
      id: `leave-${leave._id}`,
      data: leave
    }));

    const newHireNotifications = newHiresNotifications.map(hire => ({
      type: 'new-hire',
      id: `hire-${hire._id}`,
      data: hire
    }));

    const announcementNotificationsList = announcementNotifications.map(ann => ({
      type: 'announcement',
      id: `announcement-${ann._id}`,
      data: ann
    }));

    return [...leaveNotifications, ...newHireNotifications, ...announcementNotificationsList];
  };

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const savedRemoved = localStorage.getItem('removedNotifications');
        const parsedRemoved = savedRemoved ? JSON.parse(savedRemoved) : [];
        setRemovedNotifications(parsedRemoved);
        await fetchNotifications(parsedRemoved);
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    initializeNotifications();

    const interval = setInterval(() => {
      fetchNotifications(removedNotifications);
    }, 3600000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      // localStorage.clear();
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      localStorage.removeItem('userToken');
      navigate('/');
    }, 1000);
  };

  const handleSweetAlertLogout = () => {
    Swal.fire({
      title: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'red',
      cancelButtonColor: '#2196F3',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        handleLogout();
      }
    });
  };

  const handleNotificationClick = () => {
    setShowNotificationModal(true);
    setShowProfileModal(false);
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
          My Space
        </Link>

        <div className="all-nav-icons">
          <div className="notification-icon-container" onClick={handleNotificationClick}>
            <img src={notification} alt="Notifications" className="all-icon-button" />
            {getNotificationCount() > 0 && (
              <span className="notification-badge">{getNotificationCount()}</span>
            )}
          </div>

          <Link to="/settingpage">
            <img src={settingIcon} alt="Settings" className="all-icon-button" />
          </Link>

          <img
            src={userProfile.profileImage}
            alt="Profile"
            className="all-profile-pic"
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
        <Link to="/homepage" className={`all-tab ${location.pathname === '/homepage' ? 'active' : ''}`}>
          Overview
        </Link>
        <Link to="/dashboard" className={`all-tab ${location.pathname === '/dashboard' ? 'active' : ''}`}>
          Dashboard
        </Link>
      </div>

      {showNotificationModal && (
        <div className="notificationNav-modal-overlay">
          <div className="notificationNav-modal-content">
            <div className="notification-header">
              <h2 className="notifications">Notifications</h2>
              <div className="notification-actions">
                <button
                  className="notificationNav-clear-all-btn"
                  onClick={handleClearAllNotifications}
                  disabled={getNotificationsToDisplay().length === 0}
                >
                  Clear All
                </button>
                <button
                  className="notificationNav-close-btn"
                  onClick={() => setShowNotificationModal(false)}
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="notificationNav-inner-box">
              {loadingNotifications || loadingAnnouncements ? (
                <div className="notificationNav-form-group">
                  <span>Loading notifications...</span>
                </div>
              ) : getNotificationsToDisplay().length > 0 ? (
                getNotificationsToDisplay().map((notificationItem) => (
                  <div key={notificationItem.id} className="notificationNav-form-group">
                    <div className="notification-item-content">
                      {notificationItem.type === 'leave' ? (
                        <>
                          <strong className="notification-category">Leave:</strong> <strong>{notificationItem.data.name}</strong> is on <strong>{notificationItem.data.leaveType}</strong>
                          <div className="notification-details">
                            {new Date(notificationItem.data.startDate).toLocaleDateString()} to {new Date(notificationItem.data.endDate).toLocaleDateString()}
                          </div>
                        </>
                      ) : notificationItem.type === 'new-hire' ? (
                        <>
                          <strong className="notification-category">New Hire:</strong> <strong>{`${notificationItem.data.firstName} ${notificationItem.data.lastName}`}</strong> has joined!
                          <div className="notification-details">
                            Department: {notificationItem.data.department || 'N/A'}
                          </div>
                        </>
                      ) : (
                        <>
                          <strong className="notification-category">Announcement:</strong> {notificationItem.data.text}
                          <div className="notification-details">
                            Posted: {formatDate(notificationItem.data.date)}
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      className="notification-remove-btn"
                      onClick={() => handleRemoveNotification(notificationItem.id, notificationItem.type)}
                      title="Remove notification"
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div className="notificationNav-form-group">
                  <span>No new notifications.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ProfileModel
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userProfile={userProfile}
      />
    </>
  );
}

export default DashboardNavbar;