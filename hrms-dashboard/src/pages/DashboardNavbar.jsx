
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
  const [employeeFileNotifications, setEmployeeFileNotifications] = useState([]);
  const [organizationFileNotifications, setOrganizationFileNotifications] = useState([]);
  const [holidayNotifications, setHolidayNotifications] = useState([]);
  const [removedNotifications, setRemovedNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [loadingEmployeeFiles, setLoadingEmployeeFiles] = useState(true);
  const [loadingOrganizationFiles, setLoadingOrganizationFiles] = useState(true);
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [employeeFilesError, setEmployeeFilesError] = useState('');
  const [organizationFilesError, setOrganizationFilesError] = useState('');
  const [holidaysError, setHolidaysError] = useState('');
   const [taskNotifications, setTaskNotifications] = useState([]);
   

  const [userProfile, setUserProfile] = useState({
    profileImage: OverviewProfile,
    firstName: '',
    lastName: '',
    designation: ''
  });
  const [userRole, setUserRole] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [userId, setUserId] = useState('');

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

  const handleNotificationClick = () => {
    setShowNotificationModal(true);
    setShowProfileModal(false);
    fetchNotifications(removedNotifications);
  };

  const refreshNotifications = () => {
    fetchNotifications(removedNotifications);
  };

  const testEmployeeFileEndpoints = async () => {
    const endpoints = [
      "/api/employeeFile/employee-files",
      "/api/employeeFile/Empuploads",
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
      // Try to get all users and find the current user by employeeId or email
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
    try {
      setLoadingNotifications(true);
      setLoadingAnnouncements(true);
      setLoadingEmployeeFiles(true);
      setLoadingOrganizationFiles(true);
      setLoadingHolidays(true);
      setEmployeeFilesError('');
      setOrganizationFilesError('');
      setHolidaysError('');

      const [leavesResponse, newHiresResponse, announcementsResponse, holidaysResponse, profileRes, tasksResponse] = await Promise.all([
        axios.get("/api/leaves"),
        axios.get("/api/candidates"),
        axios.get("/api/announcements"),
        axios.get("/api/holidays"),
        axios.get("/api/users/profile"),
        axios.get("/api/tasks"),
      ]);      

      const userData = profileRes.data;
      const companyId = userData.companyId ? userData.companyId.split('-')[0] : '';
      setEmployeeId(userData.employeeId || '');

      // Get user ID - try multiple sources since _id might not be in profile
      let userObjectId = userData._id || userData.id || '';
      if (!userObjectId) {
        userObjectId = await fetchUserIdFromAPI(userData);
      }
      setUserId(userObjectId || '');
      const today = new Date().toISOString().split('T')[0];

      // Process leaves
      const onLeaveToday = leavesResponse.data.filter(leave =>
        leave.status === "Approved" &&
        leave.startDate.slice(0, 10) <= today &&
        leave.endDate.slice(0, 10) >= today &&
        !removedList.includes(`leave-${leave._id}`)
      );
      const filterLeaveWithCompanyId = onLeaveToday.filter(l => l.employeeId && l.employeeId.split("-")[0] === companyId);
      setEmployeesOnLeaveToday(filterLeaveWithCompanyId);

      // Process new hires
      const completedNewHires = newHiresResponse.data.filter(hire =>{
        if (!hire.expectedJoiningDate) return false;
        const createdDate = new Date(hire.expectedJoiningDate).toISOString().slice(0, 10);
        return (
          createdDate === today &&
         hire.status === 'Completed' &&
          !removedList.includes(`hire-${hire._id}`)
        );
    });
      
      const filterNewHiresWithCompId = completedNewHires.filter(n => n.employeeId && n.employeeId.split("-")[0] === companyId);
      setNewHiresNotifications(filterNewHiresWithCompId);

      // Process announcements
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const recentAnnouncements = announcementsResponse.data.filter(ann => {
        const annDate = new Date(ann.date);
        return (
          annDate >= oneWeekAgo &&
          !removedList.includes(`announcement-${ann._id}`)
        );
      });
      const filterAnnouncementssWithCompId = recentAnnouncements.filter(f => f.companyId === companyId);
      setAnnouncementNotifications(filterAnnouncementssWithCompId);

      // Process tasks
      const now = new Date();
      const userId = await fetchUserIdFromAPI(userData);      

      const highPriorityTasks = tasksResponse.data.filter(task => {
        // if (task.priority !== "High") return false;
        if (!task.assignedTo.includes(userId)) return false;
        if (removedList.includes(`task-${task._id}`)) return false;

        const reminderDate = new Date(task.reminder);

        // ✅ Match if reminder is today and time is <= current time
        const isSameDay = reminderDate.toDateString() === now.toDateString();
        const isDueNowOrPast = reminderDate <= now;

        // return isSameDay && isDueNowOrPast;
        return isDueNowOrPast;
      });

      setTaskNotifications(highPriorityTasks);


      // Process holidays
      try {
        const holidays = holidaysResponse.data.filter(holiday => {
          const holidayDate = new Date(holiday.date);
          const todayDate = new Date();
          const oneWeekFromNow = new Date();
          oneWeekFromNow.setDate(todayDate.getDate() + 7);
          
          // Show holidays that are upcoming in the next 7 days
          return (
            holidayDate >= todayDate && 
            holidayDate <= oneWeekFromNow &&
            !removedList.includes(`holiday-${holiday._id}`)
          );
        });
        
        const filterHolidaysWithCompId = holidays.filter(h => h.companyId === companyId);
        setHolidayNotifications(filterHolidaysWithCompId);
      } catch (error) {
        console.warn("Error processing holidays:", error);
        setHolidaysError('Cannot load holiday notifications');
      }

      // Fetch employee file notifications
      try {
        const result = await testEmployeeFileEndpoints();

        if (result) {
          const employeeFilesResponse = { data: result.data };

          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          const employeeFiles = employeeFilesResponse.data.filter(file => {

            // Handle notifyFeed check
            const isNotifyFeedEnabled = file.notifyFeed === true ||
              file.notifyFeed === 'true' ||
              String(file.notifyFeed).toLowerCase() === 'true' ||
              file.notifyFeed === 1 ||
              file.notifyFeed === '1';

            if (!isNotifyFeedEnabled) {
              return false;
            }

            // Date check
            const fileDate = new Date(file.updatedAt || file.createdAt || new Date());
            const isRecent = fileDate >= oneWeekAgo;

            if (!isRecent) {
              return false;
            }

            // Parse sharedWith
            let sharedWithArray = [];
            if (Array.isArray(file.sharedWith)) {
              sharedWithArray = file.sharedWith.map(item => String(item).trim());
            } else if (typeof file.sharedWith === 'string') {
              sharedWithArray = file.sharedWith.split(',').map(item => item.trim());
            }

            // Check if file is shared with this user
            const isSharedWithUser = sharedWithArray.length > 0 && (
              (userObjectId && sharedWithArray.includes(userObjectId)) || // Match by MongoDB _id
              sharedWithArray.includes('all') ||
              // Also check if any shared ID matches the user's employeeId (as fallback)
              sharedWithArray.some(id => id === String(userData.employeeId))
            );

            const notRemoved = !removedList.includes(`employee-file-${file._id}`);

            const shouldInclude = isNotifyFeedEnabled && isRecent && isSharedWithUser && notRemoved;

            return shouldInclude;
          });
          setEmployeeFileNotifications(employeeFiles);
        } else {
          console.warn("No employee file endpoints found, using empty array");
          setEmployeeFileNotifications([]);
          setEmployeeFilesError('Employee file service unavailable');
        }
      } catch (fileError) {
        console.warn("Employee files endpoint not available, continuing without them");
        setEmployeeFileNotifications([]);
        setEmployeeFilesError('Cannot load employee file notifications');
      }

      // Fetch organization file notifications
      try {
        const result = await testOrganizationFileEndpoints();

        if (result) {
          const organizationFilesResponse = { data: result.data };
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          const organizationFiles = organizationFilesResponse.data.filter(file => {
            // Handle notifyFeed check
            const isNotifyFeedEnabled = file.notifyFeed === true ||
              file.notifyFeed === 'true' ||
              String(file.notifyFeed).toLowerCase() === 'true' ||
              file.notifyFeed === 1 ||
              file.notifyFeed === '1';


            if (!isNotifyFeedEnabled) {
              return false;
            }

            // Date check
            const fileDate = new Date(file.updatedAt || file.createdAt || new Date());
            const isRecent = fileDate >= oneWeekAgo;


            if (!isRecent) {
              return false;
            }

            // Parse sharedWith
            let sharedWithArray = [];
            if (Array.isArray(file.sharedWith)) {
              sharedWithArray = file.sharedWith.map(item => String(item).trim());
            } else if (typeof file.sharedWith === 'string') {
              sharedWithArray = file.sharedWith.split(',').map(item => item.trim());
            }

            // Check if file is shared with this user
            const isSharedWithUser = sharedWithArray.length > 0 && (
              (userObjectId && sharedWithArray.includes(userObjectId)) || // Match by MongoDB _id
              sharedWithArray.includes('all') ||
              // Also check if any shared ID matches the user's employeeId (as fallback)
              sharedWithArray.some(id => id === String(userData.employeeId))
            );

            const notRemoved = !removedList.includes(`organization-file-${file._id}`);
            const shouldInclude = isNotifyFeedEnabled && isRecent && isSharedWithUser && notRemoved;
            return shouldInclude;
          });
          setOrganizationFileNotifications(organizationFiles);
        } else {
          console.warn("No organization file endpoints found, using empty array");
          setOrganizationFileNotifications([]);
          setOrganizationFilesError('Organization file service unavailable');
        }
      } catch (fileError) {
        console.warn("Organization files endpoint not available, continuing without them");
        setOrganizationFileNotifications([]);
        setOrganizationFilesError('Cannot load organization file notifications');
      }

    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
      setLoadingAnnouncements(false);
      setLoadingEmployeeFiles(false);
      setLoadingOrganizationFiles(false);
      setLoadingHolidays(false);
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
    } else if (type === 'employee-file') {
      setEmployeeFileNotifications(prev => prev.filter(file => `employee-file-${file._id}` !== id));
    } else if (type === 'organization-file') {
      setOrganizationFileNotifications(prev => prev.filter(file => `organization-file-${file._id}` !== id));
    } else if (type === 'holiday') {
      setHolidayNotifications(prev => prev.filter(holiday => `holiday-${holiday._id}` !== id));
    }else if (type === 'task') {
      setTaskNotifications(prev => prev.filter(task => `task-${task._id}` !== id));
    }
  };

  const handleClearAllNotifications = () => {
    const leaveIds = employeesOnLeaveToday.map(leave => `leave-${leave._id}`);
    const hireIds = newHiresNotifications.map(hire => `hire-${hire._id}`);
    const announcementIds = announcementNotifications.map(ann => `announcement-${ann._id}`);
    const employeeFileIds = employeeFileNotifications.map(file => `employee-file-${file._id}`);
    const organizationFileIds = organizationFileNotifications.map(file => `organization-file-${file._id}`);
    const holidayIds = holidayNotifications.map(holiday => `holiday-${holiday._id}`);
     const taskIds = taskNotifications.map(task => `task-${task._id}`);
    const allCurrentIds = [...leaveIds, ...hireIds, ...announcementIds, ...employeeFileIds, ...organizationFileIds, ...holidayIds, ...taskIds];

    const updatedRemoved = [...new Set([...removedNotifications, ...allCurrentIds])];
    setRemovedNotifications(updatedRemoved);
    saveRemovedNotifications(updatedRemoved);

    setEmployeesOnLeaveToday([]);
    setNewHiresNotifications([]);
    setAnnouncementNotifications([]);
    setEmployeeFileNotifications([]);
    setOrganizationFileNotifications([]);
    setHolidayNotifications([]);
    setTaskNotifications([]); 
  };

  const getNotificationCount = () => {
    if (loadingNotifications || loadingAnnouncements || loadingEmployeeFiles || loadingOrganizationFiles || loadingHolidays) return 0;
    return employeesOnLeaveToday.length +
      newHiresNotifications.length +
      announcementNotifications.length +
      employeeFileNotifications.length +
      organizationFileNotifications.length +
      holidayNotifications.length +
      taskNotifications.length;
  };

  const getNotificationsToDisplay = () => {
    const leaveNotifications = employeesOnLeaveToday.map(leave => ({
      type: 'leave',
      id: `leave-${leave._id}`,
      data: leave,
      timestamp: new Date(leave.updatedAt || leave.createdAt || new Date())
    }));

    const newHireNotifications = newHiresNotifications.map(hire => ({
      type: 'new-hire',
      id: `hire-${hire._id}`,
      data: hire,
      timestamp: new Date(hire.updatedAt || hire.createdAt || new Date())
    }));

    const announcementNotificationsList = announcementNotifications.map(ann => ({
      type: 'announcement',
      id: `announcement-${ann._id}`,
      data: ann,
      timestamp: new Date(ann.date || ann.updatedAt || ann.createdAt || new Date())
    }));

    const employeeFileNotificationsList = employeeFileNotifications.map(file => ({
      type: 'employee-file',
      id: `employee-file-${file._id}`,
      data: file,
      timestamp: new Date(file.updatedAt || file.createdAt || new Date())
    }));

    const organizationFileNotificationsList = organizationFileNotifications.map(file => ({
      type: 'organization-file',
      id: `organization-file-${file._id}`,
      data: file,
      timestamp: new Date(file.updatedAt || file.createdAt || new Date())
    }));

    const holidayNotificationsList = holidayNotifications.map(holiday => ({
      type: 'holiday',
      id: `holiday-${holiday._id}`,
      data: holiday,
      timestamp: new Date(holiday.date || holiday.updatedAt || holiday.createdAt || new Date())
    }));

    const taskNotificationsList = taskNotifications.map(task => ({
        type: 'task',
        id: `task-${task._id}`,
        data: task
      }));

    // Combine all notifications and sort by timestamp (newest first)
    const allNotifications = [
      ...leaveNotifications, 
      ...newHireNotifications,
      ...announcementNotificationsList, 
      ...employeeFileNotificationsList,
      ...organizationFileNotificationsList,
      ...holidayNotificationsList,
      ...taskNotificationsList
    ];

    // Sort by timestamp in descending order (newest first)
    return allNotifications.sort((a, b) => b.timestamp - a.timestamp);
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
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  }, [employeeFileNotifications]);

  useEffect(() => {
  }, [organizationFileNotifications]);

  useEffect(() => {
  }, [holidayNotifications]);

  useEffect(() => {
  }, [employeeId, userId]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      localStorage.removeItem('userToken');
      localStorage.removeItem('removedNotifications');
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
          firstName: userData.firstName || userData.fullname || 'User',
          lastName: userData.lastName || '',
          designation: userData.designation || userData.department || 'Team Member'
        });
        setUserRole(userData.role || '');
        setEmployeeId(userData.employeeId || '');

        // Try to get user ID from additional API call if not in profile
        if (!userData._id && !userData.id) {
          const fetchedUserId = await fetchUserIdFromAPI(userData);
          setUserId(fetchedUserId || '');
        } else {
          setUserId(userData._id || userData.id || '');
        }

        if ((userData.role || '').replace(/\s+/g, '').toLowerCase() === 'superadmin') {
          console.log('SuperAdmin login detected');
        } else {
          console.log('Not a SuperAdmin login');
        }
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
          Home
        </Link>

        <div className="all-nav-icons">
          <div className="notification-icon-container" onClick={handleNotificationClick}>
            <img src={notification} alt="Notifications" className="all-icon-button" title="Notifications" />
            {getNotificationCount() > 0 && (
              <span className="notification-badge">{getNotificationCount()}</span>
            )}
          </div>

          <Link to="/settingpage">
            <img src={settingIcon} alt="Settings" className="all-icon-button" title="Settings" />
          </Link>

          <img
            src={userProfile.profileImage}
            alt="Profile"
            className="all-profile-pic"
            title="Profile"
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
            size={24}
            className="all-icon-button1"
            onClick={handleSweetAlertLogout}
            title="Logout"
          />
        </div>
      </nav>

      {userRole.replace(/\s+/g, '').toLowerCase() !== 'superadmin' && (
        <div className="all-tabs">
          <Link to="/homepage" className={`all-tab ${location.pathname === '/homepage' ? 'active' : ''}`}>
            Overview
          </Link>
          <Link to="/dashboard" className={`all-tab ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            Dashboard
          </Link>
        </div>
      )}

      {showNotificationModal && (
        <div className="notificationNav-modal-overlay">
          <div className="notificationNav-modal-content">
            <div className="notification-header">
              <h2 className="notifications">Notifications</h2>
              <div className="notification-actions">
                <button
                  className="notificationNav-refresh-btn"
                  onClick={refreshNotifications}
                  title="Refresh notifications"
                  style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer',fontSize: '20px', color: '#333' }}
                >
                  ↻
                </button>
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
              {loadingNotifications || loadingAnnouncements || loadingEmployeeFiles || loadingOrganizationFiles || loadingHolidays ? (
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
                      ) : notificationItem.type === 'announcement' ? (
                        <>
                          <strong className="notification-category">Announcement:</strong> {notificationItem.data.text}
                          <div className="notification-details">
                            Posted: {formatDate(notificationItem.data.date)}
                          </div>
                        </>
                      ) : notificationItem.type === 'employee-file' ? (
                        <>
                          <strong className="notification-category">Employee File:</strong> <strong>"{notificationItem.data.name}"</strong> has been shared with you
                          <div className="notification-details">
                            Folder: {notificationItem.data.folder || 'General'}
                          </div>
                          <div className="notification-details">
                            Added: {formatDate(notificationItem.data.updatedAt || notificationItem.data.createdAt)}
                          </div>
                          {notificationItem.data.enforceDeadline && (
                            <div className="notification-details deadline-notification">
                              ⚠️ <strong>Mandatory deadline enforced</strong>
                              {notificationItem.data.ackDeadline && (
                                <> - Due: {formatDate(notificationItem.data.ackDeadline)}</>
                              )}
                            </div>
                          )}
                        </>
                      ) : notificationItem.type === 'organization-file' ? (
                        <>
                          <strong className="notification-category">Organization File:</strong> <strong>"{notificationItem.data.name}"</strong> has been shared with you
                          <div className="notification-details">
                            Folder: {notificationItem.data.folder || 'General'}
                          </div>
                          <div className="notification-details">
                            Added: {formatDate(notificationItem.data.updatedAt || notificationItem.data.createdAt)}
                          </div>
                          {notificationItem.data.enforceDeadline && (
                            <div className="notification-details deadline-notification">
                              ⚠️ <strong>Mandatory deadline enforced</strong>
                              {notificationItem.data.ackDeadline && (
                                <> - Due: {formatDate(notificationItem.data.ackDeadline)}</>
                              )}
                            </div>
                          )}
                        </>
                      ) : notificationItem.type === 'holiday' ? (
                        <>
                          <strong className="notification-category">Holiday:</strong> <strong>{notificationItem.data.label}</strong> is coming up!
                          <div className="notification-details">
                            Date: {new Date(notificationItem.data.date).toLocaleDateString()}
                          </div>
                        </>
                      ) : notificationItem.type === 'task' ? (
                        <>
                          <strong className="notification-category">Task Reminder:</strong>
                           <strong>{notificationItem.data.taskName}</strong>
                            <div
                            style={{
                              display: notificationItem.data.priority === "High" ? "flex" : "none",
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
                              {notificationItem.data.priority}
                            </span>
                          </div>
                            by {notificationItem.data.taskOwner}
                          <div className="notification-details">
                            Due: {new Date(notificationItem.data.dueDate).toLocaleDateString()} | Reminder: {formatDate(notificationItem.data.reminder)}
                          </div>
                        </>
                      ) : null}
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
                  <span>No new notifications. 
                    {employeeFilesError && ` (Employee files: ${employeeFilesError})`}
                    {organizationFilesError && ` (Organization files: ${organizationFilesError})`}
                    {holidaysError && ` (Holidays: ${holidaysError})`}
                  </span>
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