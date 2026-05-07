import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaUserTie, FaUmbrellaBeach, FaCalendarCheck, FaUsers,
    FaStopwatch, FaFolderOpen, FaStar, FaTasks, FaBuilding,
    FaUserCog, FaFileInvoice, FaCog
} from "react-icons/fa";
import OverviewProfile from '../assets/profileicon.png';
import "./SettingPage.css";
import SettingPageNavbar from '../pages/SeetingPageNavbar';
import logoImg from '../assets/Stoic_Logo.jpg';

// Ensure axios baseURL is set globally
axios.defaults.baseURL = 'http://localhost:8000';

const services = [
    { name: "Onboarding", icon: <FaUserTie />, color: "#F59E0B", route: "/onboarding", adminOnly: false },
    { name: "Leave Tracker", icon: <FaUmbrellaBeach />, color: "#3B82F6", route: "/leavesummary", adminOnly: false },
    { name: "Attendance", icon: <FaCalendarCheck />, color: "#EF4444", route: "/attendance", adminOnly: false },
    { name: "Shifts", icon: <FaUsers />, color: "#3B82F6", route: "/attendanceshift", adminOnly: false },
    // { name: "Time Tracker", icon: <FaStopwatch />, color: "#FBBF24", route: "/timelogs", adminOnly: false },
    { name: "Files", icon: <FaFolderOpen />, color: "#3B82F6", route: "/morefile", adminOnly: false },
    { name: "HR Letters", icon: <FaStar />, color: "#F87171", route: "/AddressProof", adminOnly: false },
    { name: "Tasks", icon: <FaTasks />, color: "#F97316", route: "/MyTasks", adminOnly: false },
    { name: "Exit Process", icon: <FaBuilding />, color: "#F59E0B", route: "/exitdetails", adminOnly: false },
    { name: "Employee", icon: <FaUserCog />, color: "#10B981", route: "/employee", adminOnly: true },
    { name: "PF/ESIC", icon: <FaFileInvoice />, color: "#6366F1", route: "/pfesic", adminOnly: false },
    { name: "Global Settings", icon: <FaCog />, color: "#0EA5E9", route: "/setting-sidebar", adminOnly: true }
];

const SettingPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [userRole, setUserRole] = useState('Employee'); // Default to Employee
    const [userEmail, setUserEmail] = useState('');

    // User profile state
    const [userProfile, setUserProfile] = useState({
        profileImage: OverviewProfile,
        firstName: '',
        lastName: '',
        designation: ''
    });

    // Live settings: logo and dashboardName
    const [liveLogo, setLiveLogo] = useState('');
    const [dashboardName, setDashboardName] = useState('');

    // Fetch settings (logo and dashboardName) from backend
    const fetchSettings = async () => {
        if (!companyId) {
            console.warn('No companyId available, skipping settings fetch.');
            setLiveLogo('');
            setDashboardName('');
            return;
        }
        try {
            const res = await axios.get(`/api/settings?companyId=${companyId}`);
            // Logo
            let lg = res.data.logo || '';
            if (lg) {
                if (!lg.startsWith('http')) {
                    if (!lg.startsWith('/')) lg = '/' + lg;
                    lg = axios.defaults.baseURL + lg;
                }
            }
            setLiveLogo(lg);
            // Dashboard name
            const dn = res.data.dashboardName || '';
            setDashboardName(dn);
        } catch (err) {
            console.error('Error fetching settings:', err);
            setLiveLogo('');
            setDashboardName('');
        }
    };

    useEffect(() => {
        // On mount: fetch user profile & settings
        const fetchUserProfile = async () => {
            try {
                const response = await axios.get('/api/users/profile');
                const userData = response.data;
                const resolvedImageUrl = userData.profileImage
                    ? userData.profileImage.startsWith('http')
                        ? userData.profileImage
                        : `${axios.defaults.baseURL}${userData.profileImage.startsWith('/') ? '' : '/'}${userData.profileImage}`
                    : OverviewProfile;
                setUserProfile({
                    profileImage: resolvedImageUrl,
                    firstName: userData.firstName || 'User',
                    lastName: userData.lastName || '',
                    designation: userData.designation || 'Team Member'
                });
                const extractedCompanyId = userData.companyId?.split('-')[0] || userData.companyId || '';
                setCompanyId(extractedCompanyId);

                // Set user role and email from localStorage or API response
                const storedUser = localStorage.getItem("userData");
                if (storedUser) {
                    const { role, email } = JSON.parse(storedUser);
                    setUserRole(role || "Employee");
                    setUserEmail(email || "");
                } else {
                    setUserRole(userData.role || "Employee");
                    setUserEmail(userData.email || "");
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
                if (error.response?.status === 401) {
                    navigate('/login');
                }
                setCompanyId('');
            }
        };

        fetchUserProfile();
        fetchSettings();

        // Listen for settingsUpdated to re-fetch live logo/name
        const handler = () => fetchSettings();
        window.addEventListener('settingsUpdated', handler);
        return () => {
            window.removeEventListener('settingsUpdated', handler);
        };
    }, [navigate, companyId]);

    // Filter services based on search query and user role
    const filteredServices = services.filter(service => {
        if (service.adminOnly && userRole !== "Admin") return false;
        return service.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div>
            <SettingPageNavbar />
            <div className='setting-user-profile-main-container'>
                {/* User Header */}
                <div className="setting-user-profile">
                    <div className="hrms-branding">
                        <img
                            src={liveLogo || logoImg}
                            alt="HRMS Logo"
                            className="sidebar-logo-img"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = logoImg;
                            }}
                        />
                        {/* Display live dashboardName if available, else fallback static */}
                        <span className="Settingpage-hrms-logo">
                            {dashboardName || 'Stoic HRMS'}
                        </span>
                    </div>
                    <div className="user-info">
                        <Link to="/profile-settings">
                            <img
                                src={userProfile.profileImage}
                                alt="Profile"
                                className="setting-user-image"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = OverviewProfile;
                                }}
                            />
                        </Link>
                        <div className='settingpageUpper'>
                            <div className="user-name">
                                {userProfile.firstName} {userProfile.lastName}
                            </div>
                            <div className="user-role">{userProfile.designation}</div>
                        </div>
                    </div>
                </div>

                {/* Services Grid */}
                <div className="setting-container">
                    <div className="setting-header-row">
                        <h2 className="setting-title">Services</h2>
                    </div>

                    <div className="setting-grid-wrapper">
                        <div className="setting-grid">
                            {filteredServices.map((item, index) => (
                                <Link to={item.route} key={index} style={{ textDecoration: 'none' }}>
                                    <div className="setting-card">
                                        <div className="setting-icon" style={{ color: item.color }}>
                                            {item.icon}
                                        </div>
                                        <div className="setting-name">{item.name}</div>
                                    </div>
                                </Link>
                            ))}
                            {filteredServices.length === 0 && (
                                <div className="no-services-found">No services found.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingPage;