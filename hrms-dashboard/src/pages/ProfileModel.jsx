import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiBell } from 'react-icons/fi';
import OverviewProfile from '../assets/profileicon.png';
import logoImg from '../assets/Stoic_Logo.jpg';
import Swal from 'sweetalert2';
import './AllNavBar.css';
import ChangePassword from '../Components/ChangePassword';

function ProfileModel({ isOpen, onClose, onLogout, userProfile }) {
  const navigate = useNavigate();

  // Live logo state
  const [liveLogo, setLiveLogo] = useState('');
  const [companyId, setCompanyId] = useState('');

  // Local state for live employeeId
  const [employeeId, setEmployeeId] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [loadingEmpId, setLoadingEmpId] = useState(true);

  // Greeting
  const [greetingMessage, setGreetingMessage] = useState('');

  // Notifications
  const [employeesOnLeaveToday, setEmployeesOnLeaveToday] = useState([]);
  const [newHiresNotifications, setNewHiresNotifications] = useState([]);
  const [announcementNotifications, setAnnouncementNotifications] = useState([]);
  const [employeeFileNotifications, setEmployeeFileNotifications] = useState([]);
  const [organizationFileNotifications, setOrganizationFileNotifications] = useState([]);
  const [holidayNotifications, setHolidayNotifications] = useState([]);
  const [taskNotifications, setTaskNotifications] = useState([]);
  const [removedNotifications, setRemovedNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [employeeFilesError, setEmployeeFilesError] = useState('');
  const [organizationFilesError, setOrganizationFilesError] = useState('');
  const [holidaysError, setHolidaysError] = useState('');

  // Password change state
  const [showPasswordDropdown, setShowPasswordDropdown] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Fetch companyId from /api/users/profile
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      const userData = response.data;
      const extractedCompanyId = userData.companyId ? userData.companyId.split('-')[0] : '';
      setCompanyId(extractedCompanyId);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setCompanyId('');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  // Fetch live logo from settings
  const fetchSettings = async () => {
    if (!companyId) {
      console.warn('No companyId available, skipping settings fetch.');
      setLiveLogo('');
      return;
    }
    try {
      const res = await axios.get(`/api/settings?companyId=${companyId}`);
      let lg = res.data?.logo || '';
      if (lg) {
        if (!lg.startsWith('http')) {
          if (!lg.startsWith('/')) lg = '/' + lg;
          lg = axios.defaults.baseURL + lg;
        }
        const img = new Image();
        img.onload = () => setLiveLogo(lg);
        img.onerror = () => {
          console.warn('Logo image failed to load, using default.');
          setLiveLogo('');
        };
        img.src = lg;
      } else {
        setLiveLogo('');
      }
    } catch (e) {
      console.error('Error fetching settings/logo:', e);
      setLiveLogo('');
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchSettings();
    const handler = () => {
      fetchSettings();
    };
    window.addEventListener('settingsUpdated', handler);
    return () => {
      window.removeEventListener('settingsUpdated', handler);
    };
  }, [isOpen, companyId]);

  // Fetch employeeId and candidateId
  useEffect(() => {
    const fetchEmployeeIdLive = async () => {
      setLoadingEmpId(true);
      try {
        if (userProfile?.employeeId || userProfile?.candidateId) {
          if (userProfile.employeeId) setEmployeeId(userProfile.employeeId);
          if (userProfile.candidateId) setCandidateId(userProfile.candidateId);
          return;
        }

        let email = userProfile?.email;
        if (!email) {
          const res = await axios.get('/api/users/profile');
          email = res.data.email;
        }

        if (email) {
          const usersRes = await axios.get('/api/users');
          const users = Array.isArray(usersRes.data) ? usersRes.data : [];
          const matched = users.find(u =>
            u.email && u.email.toLowerCase() === email.toLowerCase()
          );

          if (matched) {
            if (matched.employeeId) {
              setEmployeeId(matched.employeeId);
            }
            if (matched.candidateId) {
              setCandidateId(matched.candidateId);
            }
          } else {
            setEmployeeId('N/A');
            setCandidateId('N/A');
          }
        } else {
          setEmployeeId('N/A');
          setCandidateId('N/A');
        }
      } catch (err) {
        console.error('Error fetching employeeId live:', err);
        setEmployeeId('N/A');
        setCandidateId('N/A');
      } finally {
        setLoadingEmpId(false);
      }
    };

    if (isOpen) {
      fetchEmployeeIdLive();
    }
  }, [isOpen, userProfile?.email, userProfile?.employeeId, userProfile?.candidateId]);

  // Greeting logic
  useEffect(() => {
    const computeGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good Morning';
      if (hour < 17) return 'Good Afternoon';
      return 'Good Evening';
    };
    setGreetingMessage(computeGreeting());
    const intervalId = setInterval(() => {
      setGreetingMessage(computeGreeting());
    }, 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Notification logic
  const saveRemovedNotifications = (ids) => {
    localStorage.setItem('removedNotifications', JSON.stringify(ids));
  };

  const addToRemovedNotifications = (id) => {
    const updated = Array.from(new Set([...removedNotifications, id]));
    setRemovedNotifications(updated);
    saveRemovedNotifications(updated);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('default', { month: 'short' });
    const time = d.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' });
    return `${day} ${month} ${time}`;
  };

  const testEmployeeFileEndpoints = async () => {
    const endpoints = [
      "/api/employeeFile/employee-files",
      "/api/employeeFile/EmpUploads",
      "/api/employeeFiles",
      "/api/files/employee"
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint);
        console.log(`✅ Success with endpoint: ${endpoint}`);
        return { endpoint, data: response.data };
      } catch (error) {
        console.log(`❌ Failed with endpoint: ${endpoint}`, error.response?.status);
      }
    }
    return null;
  };

  const testOrganizationFileEndpoints = async () => {
    const endpoints = [
      "/api/files/organization-files",
      "/api/files/uploads",
      "/api/organizationFiles"
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint);
        console.log(`✅ Success with organization endpoint: ${endpoint}`);
        return { endpoint, data: response.data };
      } catch (error) {
        console.log(`❌ Failed with organization endpoint: ${endpoint}`, error.response?.status);
      }
    }
    return null;
  };

  const fetchUserIdFromAPI = async (userData) => {
    try {
      const usersResponse = await axios.get('/api/users');
      const currentUser = usersResponse.data.find(user =>
        user.employeeId === userData.employeeId || user.email === userData.email
      );
      return currentUser ? currentUser._id : null;
    } catch (error) {
      console.error("Error fetching user ID from API:", error);
      return null;
    }
  };

  const fetchNotifications = async (removedList = removedNotifications) => {
    setLoadingNotifications(true);
    try {
      const [leavesRes, usersRes, announcementsRes, holidaysRes, profileRes, tasksRes] = await Promise.all([
        axios.get('/api/leaves'),
        axios.get('/api/candidates'),
        axios.get('/api/announcements'),
        axios.get('/api/holidays'),
        axios.get('/api/users/profile'),
        axios.get('/api/tasks'),
      ]);

      const userData = profileRes.data;
      const userObjectId = userData._id || userData.id || (await fetchUserIdFromAPI(userData)) || '';

      const leaves = Array.isArray(leavesRes.data) ? leavesRes.data : [];
      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const announcements = Array.isArray(announcementsRes.data) ? announcementsRes.data : [];
      const holidays = Array.isArray(holidaysRes.data) ? holidaysRes.data : [];
      const tasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];

      const today = new Date().toISOString().slice(0, 10);

      // Process leaves
      const leavesToday = leaves.filter(l =>
        l.status === 'Approved' &&
        l.startDate.slice(0, 10) <= today &&
        l.endDate.slice(0, 10) >= today &&
        !removedList.includes(`leave-${l._id}`)
      );
      const filterLeaveWithCompanyId = leavesToday.filter(l => l.employeeId && l.employeeId.split("-")[0] === companyId);
      setEmployeesOnLeaveToday(filterLeaveWithCompanyId);

      // Process new hires
      const newHires = users.filter(u => {
        if (!u.expectedJoiningDate) return false;
        const createdDate = new Date(u.expectedJoiningDate).toISOString().slice(0, 10);
        return (
          createdDate === today &&
          !removedList.includes(`hire-${u._id}`) &&
          u.status === 'Completed'
        );
      });
      const filterNewHiresWithCompId = newHires.filter(n => n.employeeId && n.employeeId.split("-")[0] === companyId);
      setNewHiresNotifications(filterNewHiresWithCompId);

      // Process announcements
      const recentAnnouncements = announcements.filter(a => {
        const announcementDate = new Date(a.date || a.createdAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return (
          announcementDate >= sevenDaysAgo &&
          !removedList.includes(`announcement-${a._id}`)
        );
      });
      const filterAnnouncementsWithCompId = recentAnnouncements.filter(f => f.companyId === companyId);
      setAnnouncementNotifications(filterAnnouncementsWithCompId);

      // Process holidays
      try {
        const holidaysFiltered = holidays.filter(holiday => {
          const holidayDate = new Date(holiday.date);
          const todayDate = new Date();
          const oneWeekFromNow = new Date();
          oneWeekFromNow.setDate(todayDate.getDate() + 7);
          return (
            holidayDate >= todayDate &&
            holidayDate <= oneWeekFromNow &&
            !removedList.includes(`holiday-${holiday._id}`)
          );
        });
        const filterHolidaysWithCompId = holidaysFiltered.filter(h => h.companyId === companyId);
        setHolidayNotifications(filterHolidaysWithCompId);
      } catch (error) {
        console.warn("Error processing holidays:", error);
        setHolidaysError('Cannot load holiday notifications');
      }

      // Process employee file notifications
      try {
        const result = await testEmployeeFileEndpoints();
        if (result) {
          const employeeFiles = result.data.filter(file => {
            const isNotifyFeedEnabled = file.notifyFeed === true ||
              file.notifyFeed === 'true' ||
              String(file.notifyFeed).toLowerCase() === 'true' ||
              file.notifyFeed === 1 ||
              file.notifyFeed === '1';

            if (!isNotifyFeedEnabled) return false;

            const fileDate = new Date(file.updatedAt || file.createdAt || new Date());
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const isRecent = fileDate >= oneWeekAgo;

            if (!isRecent) return false;

            let sharedWithArray = [];
            if (Array.isArray(file.sharedWith)) {
              sharedWithArray = file.sharedWith.map(item => String(item).trim());
            } else if (typeof file.sharedWith === 'string') {
              sharedWithArray = file.sharedWith.split(',').map(item => item.trim());
            }

            const isSharedWithUser = sharedWithArray.length > 0 && (
              (userObjectId && sharedWithArray.includes(userObjectId)) ||
              sharedWithArray.includes('all') ||
              sharedWithArray.some(id => id === String(userData.employeeId))
            );

            return isNotifyFeedEnabled && isRecent && isSharedWithUser && !removedList.includes(`employee-file-${file._id}`);
          });
          setEmployeeFileNotifications(employeeFiles);
        } else {
          setEmployeeFileNotifications([]);
          setEmployeeFilesError('Employee file service unavailable');
        }
      } catch (fileError) {
        console.warn("Employee files endpoint not available, continuing without them");
        setEmployeeFileNotifications([]);
        setEmployeeFilesError('Cannot load employee file notifications');
      }

      // Process organization file notifications
      try {
        const result = await testOrganizationFileEndpoints();
        if (result) {
          const organizationFiles = result.data.filter(file => {
            const isNotifyFeedEnabled = file.notifyFeed === true ||
              file.notifyFeed === 'true' ||
              String(file.notifyFeed).toLowerCase() === 'true' ||
              file.notifyFeed === 1 ||
              file.notifyFeed === '1';

            if (!isNotifyFeedEnabled) return false;

            const fileDate = new Date(file.updatedAt || file.createdAt || new Date());
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const isRecent = fileDate >= oneWeekAgo;

            if (!isRecent) return false;

            let sharedWithArray = [];
            if (Array.isArray(file.sharedWith)) {
              sharedWithArray = file.sharedWith.map(item => String(item).trim());
            } else if (typeof file.sharedWith === 'string') {
              sharedWithArray = file.sharedWith.split(',').map(item => item.trim());
            }

            const isSharedWithUser = sharedWithArray.length > 0 && (
              (userObjectId && sharedWithArray.includes(userObjectId)) ||
              sharedWithArray.includes('all') ||
              sharedWithArray.some(id => id === String(userData.employeeId))
            );

            return isNotifyFeedEnabled && isRecent && isSharedWithUser && !removedList.includes(`organization-file-${file._id}`);
          });
          setOrganizationFileNotifications(organizationFiles);
        } else {
          setOrganizationFileNotifications([]);
          setOrganizationFilesError('Organization file service unavailable');
        }
      } catch (fileError) {
        console.warn("Organization files endpoint not available, continuing without them");
        setOrganizationFileNotifications([]);
        setOrganizationFilesError('Cannot load organization file notifications');
      }

      // Process tasks
      const now = new Date();
      const highPriorityTasks = tasks.filter(task => {
        if (!task.assignedTo.includes(userObjectId)) return false;
        if (removedList.includes(`task-${task._id}`)) return false;

        const reminderDate = new Date(task.reminder);
        const isDueNowOrPast = reminderDate <= now;

        return isDueNowOrPast;
      });
      setTaskNotifications(highPriorityTasks);

    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleRemoveNotification = (id, type) => {
    addToRemovedNotifications(id);
    if (type === 'leave') {
      setEmployeesOnLeaveToday(prev => prev.filter(l => `leave-${l._id}` !== id));
    } else if (type === 'new-hire') {
      setNewHiresNotifications(prev => prev.filter(h => `hire-${h._id}` !== id));
    } else if (type === 'announcement') {
      setAnnouncementNotifications(prev => prev.filter(a => `announcement-${a._id}` !== id));
    } else if (type === 'employee-file') {
      setEmployeeFileNotifications(prev => prev.filter(f => `employee-file-${f._id}` !== id));
    } else if (type === 'organization-file') {
      setOrganizationFileNotifications(prev => prev.filter(f => `organization-file-${f._id}` !== id));
    } else if (type === 'holiday') {
      setHolidayNotifications(prev => prev.filter(h => `holiday-${h._id}` !== id));
    } else if (type === 'task') {
      setTaskNotifications(prev => prev.filter(t => `task-${t._id}` !== id));
    }
  };

  const getNotificationCount = () => {
    if (loadingNotifications) return 0;
    return employeesOnLeaveToday.length +
           newHiresNotifications.length +
           announcementNotifications.length +
           employeeFileNotifications.length +
           organizationFileNotifications.length +
           holidayNotifications.length +
           taskNotifications.length;
  };

  const getNotificationsToDisplay = () => {
    return [
      ...employeesOnLeaveToday.map(l => ({
        type: 'leave',
        id: `leave-${l._id}`,
        data: l,
      })),
      ...newHiresNotifications.map(h => ({
        type: 'new-hire',
        id: `hire-${h._id}`,
        data: h,
      })),
      ...announcementNotifications.map(a => ({
        type: 'announcement',
        id: `announcement-${a._id}`,
        data: a,
      })),
      ...employeeFileNotifications.map(f => ({
        type: 'employee-file',
        id: `employee-file-${f._id}`,
        data: f,
      })),
      ...organizationFileNotifications.map(f => ({
        type: 'organization-file',
        id: `organization-file-${f._id}`,
        data: f,
      })),
      ...holidayNotifications.map(h => ({
        type: 'holiday',
        id: `holiday-${h._id}`,
        data: h,
      })),
      ...taskNotifications.map(t => ({
        type: 'task',
        id: `task-${t._id}`,
        data: t,
      })),
    ].sort((a, b) => {
      const dateA = a.type === 'announcement' ? new Date(a.data.date || a.data.createdAt) :
                   a.type === 'leave' ? new Date(a.data.startDate) :
                   a.type === 'new-hire' ? new Date(a.data.createdAt) :
                   a.type === 'employee-file' ? new Date(a.data.updatedAt || a.data.createdAt) :
                   a.type === 'organization-file' ? new Date(a.data.updatedAt || a.data.createdAt) :
                   a.type === 'holiday' ? new Date(a.data.date) :
                   new Date(a.data.reminder);
      const dateB = b.type === 'announcement' ? new Date(b.data.date || b.data.createdAt) :
                   b.type === 'leave' ? new Date(b.data.startDate) :
                   b.type === 'new-hire' ? new Date(b.data.createdAt) :
                   b.type === 'employee-file' ? new Date(b.data.updatedAt || b.data.createdAt) :
                   b.type === 'organization-file' ? new Date(b.data.updatedAt || b.data.createdAt) :
                   b.type === 'holiday' ? new Date(b.data.date) :
                   new Date(b.data.reminder);
      return dateB - dateA;
    });
  };

  useEffect(() => {
    const initNotifications = async () => {
      const saved = localStorage.getItem('removedNotifications');
      const parsed = saved ? JSON.parse(saved) : [];
      setRemovedNotifications(parsed);
      await fetchNotifications(parsed);
    };
    if (isOpen) {
      initNotifications();
    }
  }, [isOpen]);

  // Close password dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.password-dropdown-container')) {
        setShowPasswordDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Logout handler with SweetAlert
  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, logout!',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        content: 'custom-swal-text',
        confirmButton: 'custom-swal-confirm-button',
        cancelButton: 'custom-swal-cancel-button'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        localStorage.removeItem('userToken');
        if (onLogout) onLogout();
        else navigate('/');
      }
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="Account-modal-overlay">
        <div className="Account-modal-content">
          <div className="AllNav-user-info">
            <div className="Account-inner-box">
              <div className="Account-top-actions">
                <button className="Account-close-btn" onClick={onClose}>
                  &times;
                </button>
              </div>
              
              <Link to="/profile-settings">
                <img
                  src={userProfile.profileImage}
                  alt="Profile"
                  className="AllNav-user-image"
                  onError={(e) => {
                    e.target.src = OverviewProfile;
                  }}
                />
              </Link>
              <div>
                <div className="AllNav-user-name">
                  {userProfile.firstName} {userProfile.lastName}
                </div>
                <div className="AllNav-user-role">
                  {userProfile.designation || ''}
                </div>
                <div className="AllNav-user-id">
                  {loadingEmpId
                    ? 'Loading ID…'
                    : candidateId 
                      ? `Candidate ID: ${candidateId}`
                      
                        : 'ID: N/A'}
                </div>
              </div>
              <div className="Account-action-row">
                <Link to="/profile-settings" className="Account-button">
                  My Account
                </Link>
                <button 
                  className="change-Account-button"
                  onClick={() => setShowChangePasswordModal(true)}
                >
                  Change Password
                </button>
                <div
                  className="profile-logout-container"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <FiLogOut size={18} className="profile-logout-button" />
                  <span className="profile-logout-label">LogOut</span>
                </div>
              </div>
            </div>

            {/* Greeting Section */}
            <div className="profileModel-morning-greeting">
              <img
                src={liveLogo || logoImg}
                alt="HRMS Logo"
                className="profileModel-hrms-logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = logoImg;
                }}
              />
              <div className="profileModel-greeting-text">
                <h2 className="profileModel-good-morning">
                  {greetingMessage}{' '}
                  <span className="profileModel-greeting-name">
                    {userProfile.firstName} {userProfile.lastName}
                  </span>
                </h2>
                <p className="profileModel-day-wish">Have a productive day!</p>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="Account-inner-notification">
              <div className="Account_Notification">
                <FiBell style={{ marginRight: '8px' }} />
                <span>Notifications ({getNotificationCount()})</span>
              </div>
              <div className="profileModel-notifications-container">
                {loadingNotifications ? (
                  <div className="profileModel-notification-loading">
                    Loading notifications...
                  </div>
                ) : getNotificationsToDisplay().length > 0 ? (
                  getNotificationsToDisplay().map((item) => (
                    <div
                      key={item.id}
                      className="profileModel-notification-item"
                    >
                      <div className="profileModel-notification-content">
                        {item.type === 'leave' ? (
                          <>
                            <strong className="profileModel-notification-category">
                              Leave:
                            </strong>{' '}
                            <strong>{item.data.name}</strong> is on{' '}
                            <strong>{item.data.leaveType}</strong>
                            <div className="profileModel-notification-details">
                              {new Date(item.data.startDate).toLocaleDateString()}{' '}
                              to{' '}
                              {new Date(item.data.endDate).toLocaleDateString()}
                            </div>
                          </>
                        ) : item.type === 'new-hire' ? (
                          <>
                            <strong className="profileModel-notification-category">
                              New Hire:
                            </strong>{' '}
                            <strong>
                              {item.data.firstName} {item.data.lastName}
                            </strong>{' '}
                            has joined!
                            <div className="profileModel-notification-details">
                              Department: {item.data.department || 'N/A'}
                            </div>
                          </>
                        ) : item.type === 'announcement' ? (
                          <>
                            <strong className="profileModel-notification-category">
                              Announcement:
                            </strong>{' '}
                            <div className="profileModel-notification-text">
                              {item.data.text}
                            </div>
                            <div className="profileModel-notification-details">
                              Posted: {formatDate(item.data.date || item.data.createdAt)}
                            </div>
                          </>
                        ) : item.type === 'employee-file' ? (
                          <>
                            <strong className="profileModel-notification-category">
                              Employee File:
                            </strong>{' '}
                            <strong>"{item.data.name}"</strong> has been shared with you
                            <div className="profileModel-notification-details">
                              Folder: {item.data.folder || 'General'}
                            </div>
                            <div className="profileModel-notification-details">
                              Added: {formatDate(item.data.updatedAt || item.data.createdAt)}
                            </div>
                            {item.data.enforceDeadline && (
                              <div className="profileModel-notification-details deadline-notification">
                                ⚠️ <strong>Mandatory deadline enforced</strong>
                                {item.data.ackDeadline && (
                                  <> - Due: {formatDate(item.data.ackDeadline)}</>
                                )}
                              </div>
                            )}
                          </>
                        ) : item.type === 'organization-file' ? (
                          <>
                            <strong className="profileModel-notification-category">
                              Organization File:
                            </strong>{' '}
                            <strong>"{item.data.name}"</strong> has been shared with you
                            <div className="profileModel-notification-details">
                              Folder: {item.data.folder || 'General'}
                            </div>
                            <div className="profileModel-notification-details">
                              Added: {formatDate(item.data.updatedAt || item.data.createdAt)}
                            </div>
                            {item.data.enforceDeadline && (
                              <div className="profileModel-notification-details deadline-notification">
                                ⚠️ <strong>Mandatory deadline enforced</strong>
                                {item.data.ackDeadline && (
                                  <> - Due: {formatDate(item.data.ackDeadline)}</>
                                )}
                              </div>
                            )}
                          </>
                        ) : item.type === 'holiday' ? (
                          <>
                            <strong className="profileModel-notification-category">
                              Holiday:
                            </strong>{' '}
                            <strong>{item.data.label}</strong> is coming up!
                            <div className="profileModel-notification-details">
                              Date: {new Date(item.data.date).toLocaleDateString()}
                            </div>
                          </>
                        ) : item.type === 'task' ? (
                          <>
                            <strong className="profileModel-notification-category">
                              Task Reminder:
                            </strong>{' '}
                            <strong>{item.data.taskName}</strong>
                            <div
                              style={{
                                display: item.data.priority === "High" ? "flex" : "none",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <span>Priority:</span>
                              <span
                                style={{
                                  color: "rgb(255, 255, 255)",
                                  backgroundColor: "rgb(255, 68, 68)",
                                  borderRadius: "4px",
                                  padding: "4px",
                                  fontSize: "10px"
                                }}
                              >
                                {item.data.priority}
                              </span>
                            </div> 
                            <div>
                            by {item.data.taskOwner}
                            </div>
                            <div className="profileModel-notification-details">
                              Due: {new Date(item.data.dueDate).toLocaleDateString()} | Reminder: {formatDate(item.data.reminder)}
                            </div>
                          </>
                        ) : null}
                      </div>
                      <button
                        className="profileModel-notification-remove-btn"
                        onClick={() =>
                          handleRemoveNotification(item.id, item.type)
                        }
                        title="Remove notification"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="profileModel-no-notifications">
                    No new notifications
                    {employeeFilesError && ` (Employee files: ${employeeFilesError})`}
                    {organizationFilesError && ` (Organization files: ${organizationFilesError})`}
                    {holidaysError && ` (Holidays: ${holidaysError})`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="change-password-modal-overlay">
          <div className="change-password-modal-content">
            <button 
              className="change-password-close-btn" 
              onClick={() => setShowChangePasswordModal(false)}
            >
              &times;
            </button>
            <ChangePassword 
              onClose={() => setShowChangePasswordModal(false)}
              userEmail={userProfile.email}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default ProfileModel;