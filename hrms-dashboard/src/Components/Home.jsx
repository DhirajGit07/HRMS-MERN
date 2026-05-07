import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import OverviewImage from '../assets/BackWall.png';
import OverviewProfile from '../assets/profileicon.png';
import DashboardNavbar from '../pages/DashboardNavbar';
import { FiBriefcase, FiSliders } from 'react-icons/fi';
import { CiLock } from 'react-icons/ci';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileSettingsPage from './ProfileSettingsPage';
import LeaveBalance from './LeaveBalance';
import Attendance from './Attendance';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useClockInContext } from '../context/ClockInContext';
import { RxCross2 } from "react-icons/rx";
import { FaClock } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { MdOutlineLogout, MdDelete } from "react-icons/md";
import { ToastContainer } from 'react-toastify';

// Utility for debouncing
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

const API_BASE = 'http://localhost:8000/api/settings';
const BACKEND_ORIGIN = 'http://localhost:8000';

// Custom hook for detecting clicks outside a ref
const useClickOutside = (ref, callback) => {
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref, callback]);
};

// Axios global config
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('userToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

function Home({ isOpen, onLogout }) {
    const navigate = useNavigate();
    const {
        isClockedIn,
        timer,
        maxSessionsReached,
        handleClockButtonClick,
        canClockIn,
        isCurrentWeek,
        clockInAvailableText,
        shiftName,
        startTime,
        endTime,
        CLOCK_IN_HOUR,
        CLOCK_IN_MIN,
        fetchAttendanceSettingData,
        userId,
        dateTime: clockout,
        allUsers
    } = useClockInContext();

    // Clock out modal state
    const [showClockOutModal, setShowClockOutModal] = useState(false);
    const [currentSession, setCurrentSession] = useState(null);
    const [clockInTime, setClockInTime] = useState(null);
    const [currentActivity, setCurrentActivity] = useState('');
    const [totalWorkedTime, setTotalWorkedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

    // Clock in pop-up state
    const [showClockInPopup, setShowClockInPopup] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedWorkingFrom, setSelectedWorkingFrom] = useState('Office');
    const [isClockingIn, setIsClockingIn] = useState(false);
    const [workingOptions, setWorkingOptions] = useState(['Home', 'Office']);
    const [companyId, setCompanyId] = useState('');
    const [loadingCandId, setLoadingCandId] = useState(false);
    const [liveLogo, setLiveLogo] = useState('');

    // New state for user role
    const [isAdmin, setIsAdmin] = useState(false);

    // Ref for timer display
    const timeDisplayRef = useRef(null);
    const timerIntervalRef = useRef(null);

    console.log(currentSession);

    // Fetch working from options from backend
    useEffect(() => {
        const fetchWorkingOptions = async () => {
            try {
                const response = await axios.get('/api/working-from-options', {
                    params: { companyId }
                });
                const fetchedOptions = response.data.options || [];
                setWorkingOptions(['Home', 'Office', ...fetchedOptions]);
            } catch (error) {
                console.error('Error fetching working from options:', error);
            }
        };
        if (companyId) {
            fetchWorkingOptions();
        }
    }, [companyId]);

    // Fetch current session data when clocked in
    useEffect(() => {
        const fetchCurrentSession = async () => {
            try {
                const response = await axios.get('/api/clockin/current-session', {
                    params: { userId }
                });
                if (response.data) {
                    setCurrentSession(response.data);
                    setClockInTime(new Date(response.data.clockIn));

                    // Calculate initial time difference
                    const now = new Date();
                    const diffMs = now - new Date(response.data.clockIn);
                    const diffSec = Math.floor(diffMs / 1000);
                    const hours = Math.floor(diffSec / 3600);
                    const minutes = Math.floor((diffSec % 3600) / 60);
                    const seconds = diffSec % 60;

                    setTotalWorkedTime({ hours, minutes, seconds });
                }
            } catch (error) {
                console.error('Error fetching current session:', error);
            }
        };

        if (isClockedIn && userId) {
            fetchCurrentSession();
        } else {
            setCurrentSession(null);
            setClockInTime(null);
            setTotalWorkedTime({ hours: 0, minutes: 0, seconds: 0 });
        }
    }, [isClockedIn, userId, showClockOutModal]);

    // Fetch all clock-in records for the user
    useEffect(() => {
        const fetchAllClockIns = async () => {
            try {
                const response = await axios.get('/api/clockin', {
                    params: { userId }
                });
                console.log('All clock-in records:', response.data.clockIns);
            } catch (error) {
                console.error('Error fetching all clock-in records:', error);
            }
        };

        if (userId) {
            fetchAllClockIns();
        }
    }, [userId, showClockInPopup, showClockOutModal]);

    useEffect(() => {
        fetchAttendanceSettingData();
    }, [userId, clockout]);

    // Timer logic for updating time display without state
    useEffect(() => {
        const updateTimeDisplay = () => {
            if (timeDisplayRef.current) {
                timeDisplayRef.current.textContent = new Date().toLocaleTimeString('en-US');
            }
        };

        updateTimeDisplay(); // Initial call
        timerIntervalRef.current = setInterval(updateTimeDisplay, 1000);

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, []);

    // --- Live wallpaper state with preload fallback to default ---
    const [wallpaper, setWallpaper] = useState('');

    // Format time for display
    const formatTime = (date) => {
        if (!date) return '';
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Format date for display
    const formatModalDate = (date) => {
        if (!date) return '';
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };
        const formattedDate = date.toLocaleDateString('en-US', options).replace(/\//g, '-');
        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
        return `${formattedDate} (${weekday})`;
    };

    // Format date and time for Clock In activity
    const formatClockInDateTime = (date) => {
        if (!date) return '--';
        const dateOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        const formattedDate = date.toLocaleDateString('en-US', dateOptions).replace(/\//g, '-');
        const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
        return `${formattedDate} ${formattedTime}`;
    };

    // Handle clock out
    const handleConfirmClockOut = async () => {
        try {
            await handleClockButtonClick();
            setShowClockOutModal(false);

            // Show success toast
            toast.success('Clock out successful!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } catch (error) {
            // Show error toast
            toast.error('Failed to clock out. Please try again.', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            console.error('Error clocking out:', error);
        }
    };

    // Handle clock in with pop-up confirmation
    const handleClockInWithPopup = () => {
        if (!isClockedIn && canClockIn && !maxSessionsReached && isCurrentWeek) {
            setShowClockInPopup(true);
        } else if (!canClockIn) {
            toast.info(clockInAvailableText, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } else if (maxSessionsReached) {
            toast.info('Maximum sessions reached for today', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } else if (!isCurrentWeek) {
            toast.info('Clock in not available for this week', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };

    // Handle delete working from option
    const handleDeleteWorkingFrom = async (option) => {
        try {
            await axios.delete('/api/working-from-options', {
                data: { companyId, option }
            });
            setWorkingOptions(prev => prev.filter(opt => opt !== option));
            if (selectedWorkingFrom === option) {
                setSelectedWorkingFrom('Office');
            }
            toast.success('Location deleted successfully!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } catch (error) {
            toast.error('Failed to delete location.', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            console.error('Error deleting working from option:', error);
        }
    };

    // Debounced clock-in handler
    const debouncedClockIn = debounce(async (customWorkingFrom) => {
        if (isClockingIn) return;
        setIsClockingIn(true);
        try {
            let workingFromToSend = selectedWorkingFrom;
            if (selectedWorkingFrom === 'Others' && customWorkingFrom) {
                workingFromToSend = customWorkingFrom;
                // Save custom working from to backend
                await axios.post('/api/working-from-options', {
                    companyId,
                    option: customWorkingFrom
                });
                // Update local options
                setWorkingOptions(prev => [...new Set([...prev, customWorkingFrom])]);
            }
            const response = await axios.post('/api/clockin', {
                userId,
                companyId,
                location: selectedLocation,
                workingFrom: workingFromToSend,
                profileInfo: {
                    firstName: userProfile.firstName,
                    lastName: userProfile.lastName,
                    designation: userProfile.designation,
                    email: userProfile.email,
                    employeeId: userProfile.employeeId,
                    profileImage: userProfile.profileImage
                }
            });
            setShowClockInPopup(false);
            setSelectedWorkingFrom(workingFromToSend);
            await handleClockButtonClick(selectedLocation, workingFromToSend);

            // Show success toast
            toast.success('Clock in successful!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } catch (error) {
            // Show error toast
            toast.error('Failed to clock in. Please try again.', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            console.error('Error clocking in:', error);
        } finally {
            setIsClockingIn(false);
        }
    }, 500);

    // Fetch wallpaper setting and preload image
    const fetchWallpaperSetting = async () => {
        if (!companyId) {
            console.warn('No companyId available, skipping wallpaper fetch.');
            setWallpaper('');
            return;
        }
        try {
            const res = await axios.get(`/api/settings?companyId=${companyId}`);
            let wp = res.data?.wallpaper || '';
            if (wp) {
                if (!wp.startsWith('http')) {
                    if (!wp.startsWith('/')) wp = '/' + wp;
                    wp = axios.defaults.baseURL + wp;
                }
                const img = new Image();
                img.onload = () => setWallpaper(wp);
                img.onerror = () => {
                    console.warn('Wallpaper image failed to load, using default.');
                    setWallpaper('');
                };
                img.src = wp;
            } else {
                setWallpaper('');
            }
        } catch (e) {
            console.error('Error fetching wallpaper setting:', e);
            setWallpaper('');
        }
    };

    useEffect(() => {
        fetchWallpaperSetting();
        const handler = () => {
            fetchWallpaperSetting();
        };
        window.addEventListener('settingsUpdated', handler);
        return () => {
            window.removeEventListener('settingsUpdated', handler);
        };
    }, [companyId]);

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

    // Fetch companyId on component mount
    useEffect(() => {
        fetchUserProfile();
    }, []);

    // Fetch logo when companyId changes
    useEffect(() => {
        fetchSettings();
        const handler = () => {
            fetchSettings();
        };
        window.addEventListener('settingsUpdated', handler);
        return () => {
            window.removeEventListener('settingsUpdated', handler);
        };
    });

    // useEffect(() => {
    //     fetchSettings();
    // }, [companyId]);

    // Original Home state (removed dateTime and customWorkingFrom)
    const [activeTab, setActiveTab] = useState('Activities');
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [greetingMessage, setGreetingMessage] = useState('');
    const [currentDay, setCurrentDay] = useState('');
    const [userProfile, setUserProfile] = useState({
        employeeId: '',
        candidateId: '',
        profileImage: OverviewProfile,
        firstName: '',
        lastName: '',
        designation: '',
        email: '',
    });
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [employeeIdLive, setEmployeeIdLive] = useState('');
    const [candidateIdLive, setCandidateIdLive] = useState('');
    const [loadingEmpId, setLoadingEmpId] = useState(true);
    const [shiftData, setShiftData] = useState([]);

    // Utility: get week dates Sunday to Saturday
    const getWeekDates = (date = new Date()) => {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay());
        let weekDates = [];
        for (let i = 0; i < 7; i++) {
            let current = new Date(start);
            current.setDate(start.getDate() + i);
            weekDates.push(current);
        }
        return weekDates;
    };
    const [weekDates, setWeekDates] = useState(getWeekDates());
    const [loadingShiftData, setLoadingShiftData] = useState(false);

    const [allCandidates, setAllCandidates] = useState([]);
    const [allCandidatesLoading, setAllCandidatesLoading] = useState(true);
    const [allCandidatesError, setAllCandidatesError] = useState(null);

    const [tabVisibility, setTabVisibility] = useState(() => {
        const storedVisibility = localStorage.getItem('tabVisibility');
        return storedVisibility ? JSON.parse(storedVisibility) : {
            Activities: true,
            Profile: true,
            Leave: true,
            Attendance: true,
        };
    });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Ref for settings dropdown click-outside
    const settingsDropdownRef = useRef(null);
    useClickOutside(settingsDropdownRef, () => {
        setShowSettingsDropdown(false);
    });

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Filtered candidates matching company
    const filteredCandidates = allCandidates.filter(
        (c) => c.companyId === companyId && c.employeeId?.startsWith(companyId)
    );

    // Filter new hires with expected joining date matching today
    const filterNewHires = allCandidates?.filter((newHires) => {
        if (!newHires?.employeeId || !newHires?.expectedJoiningDate) return false;

        const joiningDate = new Date(newHires.expectedJoiningDate);
        joiningDate.setUTCHours(0, 0, 0, 0);

        return (
            newHires.employeeId.split("-")[0] === companyId &&
            joiningDate.toDateString() === todayDate.toDateString()
        );
    });

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };


    // Add this useEffect to fetch shift data when weekDates changes
    useEffect(() => {
        const loadShiftData = async () => {
            if (weekDates.length === 0) return;

            setLoadingShiftData(true);
            try {
                const startDate = weekDates[0];
                const endDate = weekDates[6];
                const data = await fetchShiftData(startDate, endDate);
                setShiftData(data);
            } catch (error) {
                console.error("Error loading shift data:", error);
            } finally {
                setLoadingShiftData(false);
            }
        };

        loadShiftData();
    }, [weekDates]);

    // Also update the fetchShiftData function to handle the response properly
    const fetchShiftData = async (startDate, endDate) => {
        try {
            const response = await axios.get('/api/attendance', {
                params: {
                    start: startDate.toISOString().split('T')[0],
                    end: endDate.toISOString().split('T')[0],
                    userId: userId // Make sure to include userId if your API needs it
                }
            });
            return response.data.attendance || response.data || [];
        } catch (error) {
            console.error("Error fetching shift data:", error);
            return [];
        }
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoadingProfile(true);
            try {
                const response = await axios.get('/api/users/profile');
                const userData = response.data;
                console.log(userData);

                // Check user role from localStorage
                const storedUserData = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")) : null;
                setIsAdmin(storedUserData?.role === 'Admin');

                let profileImgUrl = OverviewProfile;
                if (userData.profileImage) {
                    if (userData.profileImage.startsWith('http')) {
                        profileImgUrl = userData.profileImage;
                    } else {
                        profileImgUrl = `${axios.defaults.baseURL}${userData.profileImage.startsWith('/') ? '' : '/'}${userData.profileImage}`;
                    }
                }
                setUserProfile({
                    employeeId: userData.employeeId || '',
                    profileImage: profileImgUrl,
                    firstName: userData.firstName || userData.fullname || 'User Name',
                    lastName: userData.lastName || '',
                    designation: userData.designation || userData.department || 'Team Member',
                    email: userData.email || '',
                });

                const extractedCompanyId = userData.companyId?.split('-')[0] || userData.companyId || '';
                setCompanyId(extractedCompanyId);

                // Find the companyName from allUsers based on userData.email
                const matchedUser = allUsers.find(
                    u => u.email && u.email.toLowerCase() === userData.email.toLowerCase()
                );
                setSelectedLocation(matchedUser?.companyName || 'Stoic & Salamander Global Corporation');
            } catch (error) {
                console.error('Error fetching user profile:', error);
                if (error.response?.status === 401) {
                    handleLogout();
                }
                setCompanyId('');
                setSelectedLocation('Stoic & Salamander Global Corporation');
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchUserProfile();
    }, [allUsers]);

    useEffect(() => {
        const fetchEmployeeIdLive = async () => {
            setLoadingEmpId(true);
            try {
                const email = userProfile.email;
                if (email) {
                    const usersRes = await axios.get('/api/users');
                    const users = Array.isArray(usersRes.data) ? usersRes.data : [];
                    console.log(users);

                    const matched = users.find(
                        u => u.email && u.email.toLowerCase() === email.toLowerCase()
                    );
                    setEmployeeIdLive(matched?.employeeId || 'N/A');
                } else {
                    setEmployeeIdLive('N/A');
                }
            } catch (err) {
                console.error('Error fetching live employeeId:', err);
                setEmployeeIdLive('N/A');
            } finally {
                setLoadingEmpId(false);
            }
        };
        if (!loadingProfile) {
            fetchEmployeeIdLive();
        }
    }, [loadingProfile, userProfile.email]);

    useEffect(() => {
        const fetchCandidateIdLive = async () => {
            setLoadingCandId(true);
            try {
                const email = userProfile.email;
                if (email) {
                    const usersRes = await axios.get('/api/users');
                    const users = Array.isArray(usersRes.data) ? usersRes.data : [];
                    console.log(users);

                    const matched = users.find(
                        u => u.email && u.email.toLowerCase() === email.toLowerCase()
                    );
                    setCandidateIdLive(matched?.candidateId || 'N/A');
                } else {
                    setCandidateIdLive('N/A');
                }
            } catch (err) {
                console.error('Error fetching live candidateId:', err);
                setCandidateIdLive('N/A');
            } finally {
                setLoadingCandId(false);
            }
        };
        if (!loadingProfile) {
            fetchCandidateIdLive();
        }
    }, [loadingProfile, userProfile.email]);

    useEffect(() => {
        const fetchAllCandidates = async () => {
            setAllCandidatesLoading(true);
            try {
                const response = await axios.get('/api/candidates');
                const filteredCandidates = response?.data?.filter(c => c.status === "Completed");
                setAllCandidates(filteredCandidates);
            } catch (err) {
                console.error("Failed to fetch candidates:", err);
                setAllCandidatesError("Failed to fetch candidates.");
            } finally {
                setAllCandidatesLoading(false);
            }
        };
        fetchAllCandidates();
    }, []);

    useEffect(() => {
        const updateGreeting = () => {
            const hour = new Date().getHours();
            if (hour < 12) return 'Good Morning';
            if (hour < 17) return 'Good Afternoon';
            return 'Good Evening';
        };
        const updateDay = () => {
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            return days[new Date().getDay()];
        };
        setGreetingMessage(updateGreeting());
        setCurrentDay(updateDay());
        const interval = setInterval(() => {
            setGreetingMessage(updateGreeting());
        }, 60 * 1000);
        return () => clearInterval(interval);
    }, []);



    const handleToggleChange = (tab) => {
        setTabVisibility(prev => {
            const enabledTabs = Object.keys(prev).filter(key => prev[key]);
            const isTurningOn = !prev[tab];
            let newTabVisibility;
            if (isTurningOn) {
                if (enabledTabs.length < 10) {
                    newTabVisibility = { ...prev, [tab]: true };
                } else {
                    const tabToTurnOff = enabledTabs[9];
                    newTabVisibility = { ...prev };
                    newTabVisibility[tabToTurnOff] = false;
                    newTabVisibility[tab] = true;
                }
            } else {
                newTabVisibility = { ...prev, [tab]: false };
            }
            localStorage.setItem('tabVisibility', JSON.stringify(newTabVisibility));
            return newTabVisibility;
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        localStorage.removeItem('userToken');
        if (onLogout) onLogout();
        else navigate('/');
    };

    const handleWeekNavigation = (direction) => {
        const newStartDate = new Date(weekDates[0]);
        if (direction === 'prev') {
            newStartDate.setDate(newStartDate.getDate() - 7);
        } else if (direction === 'next') {
            newStartDate.setDate(newStartDate.getDate() + 7);
        } else {
            setWeekDates(getWeekDates());
            return;
        }
        setWeekDates(getWeekDates(newStartDate));
    };

    const [isWorkingFromDropdownOpen, setIsWorkingFromDropdownOpen] = useState(false);

    // Clock Out Modal component
    const ClockOutModal = () => {
        return (
            <div className='adco-modal-overlay'>
                <div className="adco-root">
                    <div className='clockin-root-header'>
                        <h2>Attendance Details</h2>
                        <span className='clockin-cross' onClick={() => setShowClockOutModal(false)}><RxCross2 /></span>
                    </div>
                    <div className="adco-flex">
                        {/* Left Panel */}
                        <div className="adco-panel">
                            <div className="adco-date">
                                Date - {formatModalDate(new Date())}
                            </div>
                            <div className="adco-time-section">
                                <div className='adco-time-section-clockin-time'>
                                    <span>Clock In</span>
                                    <span className="adco-clockin-time">
                                        {clockInTime ? formatTime(clockInTime) : '--:-- --'}
                                    </span>
                                </div>
                                <div className="adco-circle">
                                    <div className='adco-circle-time'>
                                        <span>
                                            {totalWorkedTime.hours.toString().padStart(2, '0')}h
                                        </span>
                                        <span>
                                            {totalWorkedTime.minutes.toString().padStart(2, '0')}m
                                        </span>
                                        <span>
                                            {totalWorkedTime.seconds.toString().padStart(2, '0')}s
                                        </span>
                                    </div>
                                </div>
                                <div className="adco-current-time">
                                    {formatTime(new Date())} (Current Time)
                                </div>
                            </div>
                        </div>

                        {/* Right Panel */}
                        <div className="adco-panel">
                            <div className="adco-activity-title">Activity</div>
                            <div className="adco-activity-section">
                                <div>
                                    <span className="adco-clockin-icon">◉</span> <span className='adco-clockin-text'>Clock In</span>
                                    <span className="adco-shift-badge">{shiftName}</span>
                                    <br />
                                    <div>
                                        <div className="adco-activity-time">
                                            <span><FaClock /></span>
                                            <span>
                                                {clockInTime ? formatClockInDateTime(clockInTime) : '--'}
                                                {/* {clockInTime ? ` ${formatTime(clockInTime)}` : ' --:-- --'} */}
                                            </span>
                                        </div>
                                        <div className="adco-activity-time">
                                            <FaLocationDot />
                                            {currentSession?.companyName || 'Your Company'}
                                        </div>
                                    </div>
                                </div>
                                <div className="adco-clockout-section">
                                    <span className="adco-clockout-icon">◉</span> <span className='adco-clockin-text'> Clock Out </span>
                                    <br />
                                    <div className="adco-clockout-missing">
                                        <span><FaClock /></span>
                                        <span>
                                            Did not clock out
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom buttons */}
                    <div className="adco-buttons">
                        <button
                            className="adco-cancel-btn"
                            onClick={() => setShowClockOutModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="adco-clockout-btn"
                            onClick={handleConfirmClockOut}
                        >
                            <span><MdOutlineLogout size={24} /></span>
                            <span>
                                Clock Out
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Clock In Pop-up component
    const ClockInPopup = ({ isAdmin, companyId, workingOptions, setWorkingOptions, selectedWorkingFrom, setSelectedWorkingFrom, onClockIn }) => {
        const [workingSearch, setWorkingSearch] = useState('');
        const [customWorkingFrom, setCustomWorkingFrom] = useState('');

        // Handle save custom working from
        const handleSaveCustomWorkingFrom = async () => {
            if (!customWorkingFrom) {
                toast.error('Please enter a custom location.', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                return;
            }
            try {
                await axios.post('/api/working-from-options', {
                    companyId,
                    option: customWorkingFrom
                });
                setWorkingOptions(prev => [...new Set([...prev, customWorkingFrom])]);
                setSelectedWorkingFrom(customWorkingFrom);
                setCustomWorkingFrom('');
                toast.success('Custom location saved!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } catch (error) {
                toast.error('Failed to save custom location.', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                console.error('Error saving custom working from:', error);
            }
        };

        // Filter options based on user role
        const filteredWorkingOptions = workingOptions.filter(opt => 
            opt.toLowerCase().includes(workingSearch.toLowerCase())
        );

        return (
            <div className="clockin-modal-overlay">
                <div className="clockin-root">
                    <div className='clockin-root-header'>
                        <h2>Clock In</h2>
                        <span className='clockin-cross' onClick={() => setShowClockInPopup(false)}><RxCross2 /></span>
                    </div>
                    <div className="clockin-middle-root">
                        <div className="clockin-date-time">
                            <div className='clockin-date-time-format'>
                                <span><FaClock size={20} /></span>
                                <span>{formatModalDate(new Date())} {formatTime(new Date())}</span>
                            </div>
                            <span className='clockin-shift'>{shiftName}</span>
                        </div>
                        <div className="clockin-form">
                            <div className="clockin-field">
                                <label>Company Name</label>
                                <div className="custom-dropdown">
                                    <div className="dropdown-selected">
                                        {selectedLocation}
                                    </div>
                                </div>
                            </div>
                            <div className="clockin-field">
                                <label>Working From <span style={{ color: 'red' }}>*</span></label>
                                <div className="custom-dropdown">
                                    <div className="dropdown-selected" onClick={() => {
                                        setIsWorkingFromDropdownOpen(prev => !prev);
                                    }}>
                                        {selectedWorkingFrom}
                                        <span className="strict-timings-dropdown-arrow">{isWorkingFromDropdownOpen ? '▲' : '▼'}</span>
                                    </div>
                                    {isWorkingFromDropdownOpen && (
                                        <ul className="dropdown-options">
                                            <li>
                                                <input
                                                    type="text"
                                                    className='dropdown-options-input'
                                                    value={workingSearch}
                                                    onChange={(e) => setWorkingSearch(e.target.value)}
                                                    placeholder="Search locations..."
                                                />
                                            </li>
                                            {filteredWorkingOptions.map(opt => (
                                                <li key={opt} className="dropdown-option-item">
                                                    <span onClick={() => {
                                                        setSelectedWorkingFrom(opt);
                                                        setIsWorkingFromDropdownOpen(false);
                                                        setWorkingSearch('');
                                                        setCustomWorkingFrom('');
                                                    }}>{opt}</span>
                                                    {isAdmin && !['Home', 'Office'].includes(opt) && (
                                                        <button
                                                            className="dropdown-delete-btn"
                                                            onClick={() => handleDeleteWorkingFrom(opt)}
                                                        >
                                                            <MdDelete />
                                                        </button>
                                                    )}
                                                </li>
                                            ))}
                                            {isAdmin && (
                                                <li onClick={() => {
                                                    setSelectedWorkingFrom('Others');
                                                    setIsWorkingFromDropdownOpen(false);
                                                    setWorkingSearch('');
                                                }}>Others</li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                                {selectedWorkingFrom === 'Others' && isAdmin && (
                                    <div className="clockin-custom-input-container">
                                        <input
                                            type="text"
                                            className="clockin-custom-input"
                                            value={customWorkingFrom}
                                            onChange={(e) => setCustomWorkingFrom(e.target.value)}
                                            placeholder="Enter custom location"
                                        />
                                        <button
                                            className="clockin-save-btn"
                                            onClick={handleSaveCustomWorkingFrom}
                                            disabled={!customWorkingFrom}
                                        >
                                            Save
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="clockin-buttons">
                        <button
                            className="clockin-cancel-btn"
                            onClick={() => setShowClockInPopup(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="clockin-clockin-btn"
                            onClick={() => onClockIn(customWorkingFrom)}
                            disabled={isClockingIn || (selectedWorkingFrom === 'Others' && !customWorkingFrom)}
                        >
                            {isClockingIn ? 'Clocking In...' : 'Clock In'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <DashboardNavbar />
            <div className="home-main-container">
                <div className="home-container">
                    {/* Header with wallpaper or fallback */}
                    <div
                        className="Home-header-image"
                        style={{
                            backgroundImage: `url(${wallpaper || OverviewImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />

                    <div className="home-header-datetime">
                        {`${new Date().toLocaleDateString('en-US', { weekday: 'long' })} ${new Date()
                            .getDate()
                            .toString()
                            .padStart(2, '0')} ${new Date().toLocaleDateString('en-US', { month: 'short' })} ${new Date().getFullYear()}`}
                        <br />
                        <span ref={timeDisplayRef}></span>
                    </div>

                    <div className="left-panel">
                        <div className="Home-profile-card">
                            <img
                                src={userProfile.profileImage}
                                alt="Profile"
                                className="Home-profile-image"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = OverviewProfile;
                                }}
                            />
                            <h1 className="home-user-id">
                                <span className="home-user-name">
                                    {userProfile.firstName} {userProfile.lastName}
                                </span>
                            </h1>
                            <p className="home-user-role">{userProfile.designation}</p>
                            <div className="home-user-empid">
                                {loadingEmpId
                                    ? 'Loading ID…'
                                    : `Candidate ID: ${candidateIdLive || 'N/A'}`}
                            </div>

                            <p
                                className="home-current-day"
                                style={{ color: ['Sunday', 'Saturday'].includes(currentDay) ? 'red' : '#2196f3' }}
                            >
                                {currentDay}
                            </p>

                            <div className="home-time-display">
                                {isClockedIn ? (
                                    <>
                                        <span className="home-time-part">{Math.floor(timer / 3600).toString().padStart(2, "0")}</span>
                                        <span className="home-time-separator">:</span>
                                        <span className="home-time-part">{Math.floor((timer % 3600) / 60).toString().padStart(2, "0")}</span>
                                        <span className="home-time-separator">:</span>
                                        <span className="home-time-part">{(timer % 60).toString().padStart(2, "0")}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="home-time-part">00</span><span className="home-time-separator">:</span>
                                        <span className="home-time-part">00</span><span className="home-time-separator">:</span>
                                        <span className="home-time-part">00</span>
                                    </>
                                )}
                            </div>

                            <div className="home-clock-controls">
                                {isClockedIn ? (
                                    <button
                                        className={`home-check-out-button ${isClockedIn ? 'clocked-in' : ''}`}
                                        onClick={() => setShowClockOutModal(true)}
                                    >
                                        Clock Out
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleClockInWithPopup}
                                        disabled={!canClockIn || maxSessionsReached || !isCurrentWeek || isClockingIn}
                                        className={`home-check-in-button ${isClockedIn ? 'clocked-in' : ''} ${!canClockIn || maxSessionsReached || !isCurrentWeek || isClockingIn ? 'disabled' : ''}`}
                                    >
                                        {!canClockIn
                                            ? clockInAvailableText
                                            : maxSessionsReached
                                                ? "Max Sessions Reached"
                                                : isClockingIn
                                                    ? "Clocking In..."
                                                    : "Clock In"}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="home-reportees-card">
                            <h3 className="section-title">New Joinings</h3>
                            <ul className="home-reportee-list">
                                {allCandidatesLoading ? (<li>Loading...</li>) : allCandidatesError ? (<li>{allCandidatesError}</li>) : filterNewHires.length > 0 ? (
                                    filterNewHires.map(c => <li key={c._id} className="reportee-card"><div className="reportee-details"><strong>{c.firstName} {c.lastName}</strong><span className="reportee-role">{c.department}</span><span className="reportee-email"> 📧 {c.email}</span><span className="reportee-employeeid">{c.employeeId}</span></div></li>)
                                ) : (<li>No new joinings.</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="home-main-panel">
                        <div className='Home-navdiv'>
                            <nav className="home-nav-tabs">
                                <div className="home-tab-group">
                                    {Object.entries(tabVisibility).map(([tabName, isVisible]) =>
                                        isVisible && (
                                            <span
                                                key={tabName}
                                                className={`home-tab ${activeTab === tabName ? 'active' : ''}`}
                                                onClick={() => setActiveTab(tabName)}
                                            >
                                                {tabName}
                                            </span>
                                        )
                                    )}
                                </div>

                                <span className="home-tab home-settings-icon" onClick={() => {
                                    setShowSettingsDropdown(prev => !prev);
                                }}>
                                    <FiSliders />
                                </span>
                            </nav>

                            {showSettingsDropdown && (
                                <div className="home-settings-dropdown" ref={settingsDropdownRef}>
                                    <div className="home-dropdown-item" disabled>
                                        Activities
                                        <label className="homeswitch-disabled">
                                            <CiLock />
                                        </label>
                                    </div>
                                    {Object.keys(tabVisibility)
                                        .filter(tab => tab !== 'Activities')
                                        .map(tab => (
                                            <div className="home-dropdown-item" key={tab}>
                                                {tab}
                                                <label className="home-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={tabVisibility[tab]}
                                                        onChange={() => handleToggleChange(tab)}
                                                    />
                                                    <span className="home-slider round"></span>
                                                </label>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        <div className="home-scrollable-section">
                            {activeTab === 'Activities' && (
                                <div className="Activities-section">
                                    <div className="home-morning-greeting">
                                        <img
                                            src={liveLogo || 'https://via.placeholder.com/150'} // Fallback to placeholder image
                                            alt="HRMS Logo"
                                            className="hrms-logo"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://via.placeholder.com/150'; // Fallback placeholder
                                            }}
                                        />
                                        <div className="home-greeting-text">
                                            <h2 className="home-good-morning">
                                                {greetingMessage}{' '}
                                                <span className="home-greeting-name">
                                                    {userProfile.firstName} {userProfile.lastName}
                                                </span>
                                            </h2>
                                            <p className="home-day-wish">Have a productive day!</p>
                                        </div>
                                    </div>

                                    <div className="home-check-in-reminder">
                                        <div className="home-check-in-icon">📅</div>
                                        <div className="home-check-in-content">
                                            <p className="home-reminder-text">Check-in reminder</p>
                                            {new Date().getHours() < CLOCK_IN_HOUR || (new Date().getHours() === CLOCK_IN_HOUR && new Date().getMinutes() < CLOCK_IN_MIN) ? (
                                                <>
                                                    <p className="home-reminder-detail">Your clock-in time has not started yet</p>
                                                    <p className="home-reminder-time">
                                                        <strong>{shiftName}</strong> – Starts at {startTime}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="home-reminder-detail">{startTime === undefined ? "Your shift hasn't been assigned yet" : "Your shift has already started"}</p>
                                                    <p className="home-reminder-time">
                                                        <strong>{shiftName}</strong> – {startTime} – {endTime}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="home-work-schedule-extended">
                                        <div className="home-work-schedule-header">
                                            <FiBriefcase className="home-schedule-icon" />
                                            <div>
                                                <h3 className="home-section-title home-colored-title">Work Schedule</h3>
                                                <p className="home-schedule-dates">
                                                    {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
                                                </p>
                                            </div>
                                            <div className="home-week-navigation">
                                                <button
                                                    className="home-week-nav-btn"
                                                    onClick={() => handleWeekNavigation('prev')}
                                                >
                                                    &lt;
                                                </button>
                                                <button
                                                    className="home-week-nav-btn"
                                                    onClick={() => handleWeekNavigation('today')}
                                                    aria-label="Go to today"
                                                >
                                                    <svg
                                                        width="20"
                                                        height="20"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                                    </svg>
                                                </button>
                                                <button
                                                    className="home-week-nav-btn"
                                                    onClick={() => handleWeekNavigation('next')}
                                                >
                                                    &gt;
                                                </button>
                                            </div>
                                        </div>
                                        <div className="home-shift-box">
                                            <strong>{shiftName}</strong> <br />
                                            <span className="home-shift-time">{startTime} – {endTime}</span>
                                        </div>
                                        {loadingShiftData ? (
                                            <div className="home-loading-shift">Loading schedule...</div>
                                        ) : (
                                            <div className="home-week-timeline">
                                                {weekDates.map((date, i) => {
                                                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                                    const dayNumber = date.getDate();
                                                    const isToday = new Date().toDateString() === date.toDateString();

                                                    // Find attendance for this date
                                                    const attendance = shiftData.find(entry => {
                                                        const entryDate = new Date(entry.date).toDateString();
                                                        return entryDate === date.toDateString();
                                                    });

                                                    // Determine status
                                                    let status = "";
                                                    if (dayName === 'Sun' || dayName === 'Sat') {
                                                        status = "Weekend";
                                                    } else if (attendance) {
                                                        if (attendance.sessions && attendance.sessions.length > 0) {
                                                            status = "Present";
                                                        } else {
                                                            status = "Absent";
                                                        }
                                                    } else {
                                                        status = isToday ? "Today" : "";
                                                    }

                                                    return (
                                                        <div className="home-day-status" key={i}>
                                                            <span className="home-day-label">{dayName}</span>
                                                            <span className={`home-day-date ${isToday ? 'home-highlight-date' : ''}`}>
                                                                {dayNumber}
                                                            </span>
                                                            <span className={`home-status-label ${status.toLowerCase().replace(' ', '-')}`}>
                                                                {status}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Profile' && (
                                <div className='Profile-section'>
                                    <ProfileSettingsPage isNested={true} />
                                </div>
                            )}
                            {activeTab === 'Leave' && (
                                <div className='Profile-section'>
                                    <LeaveBalance isNested={true} />
                                </div>
                            )}
                            {activeTab === 'Attendance' && (
                                <div className='Profile-section'>
                                    <Attendance isNested={true} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Clock Out Modal */}
                {showClockOutModal && <ClockOutModal />}

                {/* Clock In Pop-up */}
                {showClockInPopup && (
                    <ClockInPopup
                        isAdmin={isAdmin}
                        companyId={companyId}
                        workingOptions={workingOptions}
                        setWorkingOptions={setWorkingOptions}
                        selectedWorkingFrom={selectedWorkingFrom}
                        setSelectedWorkingFrom={setSelectedWorkingFrom}
                        onClockIn={debouncedClockIn}
                    />
                )}

                {/* Menu modal */}
                {showMenuModal && (
                    <div className="menu-modal-overlay">
                        <div className="menu-modal-content">
                            <button onClick={() => setShowMenuModal(false)}>Close</button>
                            <button onClick={handleLogout}>Logout</button>
                        </div>
                    </div>
                )}

                {/* Logout confirmation */}
                {showLogoutConfirm && (
                    <div className="logout-confirm-overlay">
                        <div className="logout-confirm-modal">
                            <p>Are you sure you want to logout?</p>
                            <button onClick={handleLogout}>Yes</button>
                            <button onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* Toast Container */}
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </div>
        </div>
    );
}

export default Home;