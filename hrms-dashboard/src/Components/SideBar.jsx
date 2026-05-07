import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SideBar.css';
import defaultLogo from '../assets/Stoic_Logo.jpg';
import {
  MdHome, MdPersonAdd, MdTimeToLeave, MdListAlt,
  MdStarBorder, MdAccountBalance, MdApartment,
  MdInsertDriveFile, MdChecklist, MdMenu
} from 'react-icons/md';
import { FaUserFriends, FaUserShield, FaWrench } from 'react-icons/fa';

const API_SETTINGS = 'http://localhost:8000/api/settings';
const BACKEND_ORIGIN = 'http://localhost:8000';

export default function SideBar() {
  const [settingsLogo, setSettingsLogo] = useState('');
  const [settingsName, setSettingsName] = useState('Stoic HRMS');
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const sidebarRef = useRef(null);
  const location = useLocation();
  const currentPath = location.pathname;

  // Detect user role
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData?.role === 'Admin') setIsAdmin(true);
    else if (userData?.role === 'SuperAdmin') setIsSuperAdmin(true);
    const extractedCompanyId = userData?.companyId?.split('-')[0] || userData?.companyId;
    setCompanyId(extractedCompanyId);
  }, []);

  // Load logo and name from backend
  useEffect(() => {
    const loadSettings = async () => {
      if (!companyId) return;
      try {
        const res = await fetch(`${API_SETTINGS}?companyId=${companyId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setSettingsName(data.dashboardName || 'Stoic HRMS');

        let logoUrl = data.logo || '';
        if (!logoUrl || logoUrl === 'Logo') {
          logoUrl = '';
        } else if (logoUrl.startsWith('data:') || logoUrl.startsWith('http')) {
          // already valid
        } else if (logoUrl.startsWith('/')) {
          logoUrl = BACKEND_ORIGIN + logoUrl;
        } else {
          logoUrl = BACKEND_ORIGIN + '/' + logoUrl;
        }
        setSettingsLogo(logoUrl);
      } catch (err) {
        console.error('Sidebar load settings failed:', err);
      }
    };

    loadSettings();
    window.addEventListener('settingsUpdated', loadSettings);
    return () => window.removeEventListener('settingsUpdated', loadSettings);
  }, [companyId]);

  // ✅ Update <title>, favicon, and apple icon dynamically
  useEffect(() => {
    if (settingsName) {
      document.title = settingsName;
    }

    const favicon = document.getElementById('dynamic-favicon');
    const appleIcon = document.getElementById('dynamic-apple-icon');

    if (settingsLogo) {
      if (favicon) favicon.href = settingsLogo;
      if (appleIcon) appleIcon.href = settingsLogo;
    } else {
      // fallback to default public/logo.png
      if (favicon) favicon.href = process.env.PUBLIC_URL + '/logo.png';
      if (appleIcon) appleIcon.href = process.env.PUBLIC_URL + '/logo.png';
    }
  }, [settingsName, settingsLogo]);

  // Close sidebar on outside click (mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        if (!event.target.closest('.sidebar-hamburger-icon')) setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const routeGroups = {
    '/AddressProof': ['/AddressProof', '/BonafideLetter', '/ExperienceLetter'],
    '/MyTasks': ['/MyTasks', '/TrackTasks', '/AllTasks', '/FormView', '/AddTaskForm', '/AddExitDetails', '/ExitDetailsView'],
    '/morefile': ['/morefile', '/innerfilesave', '/inner-employee-file', '/inner-hr-forms-templates'],
    '/exitdetails': ['/exitdetails', '/add-exit-details'],
    '/homepage': ['/homepage', '/dashboard', '/profile-settings', '/edit-profile', '/settingpage'],
    '/leavesummary': ['/leavesummary', '/applyleave', '/leavebalance', '/leaverequests', '/shiftschedule'],
    '/timesheets': ['/timesheets', '/jobs', '/projects', '/logtime', '/dailylog', '/weeklylog', '/semimonthlylog', '/monthlylog'],
    '/pfesic': ['/pfesic'],
    '/attendance': ['/attendance'],
    '/onboarding': ['/onboarding'],
    '/employee': ['/employee', '/addemployee'],
    '/setting-sidebar': ['/setting-sidebar','/att-setting', '/leave-setting', '/sidebarsetting'],
    '/superadminpanel': ['/superadminpanel', '/company-view','/edit-company'],
    './changepassword': ['/changepassword']
  };

  const isActive = (path) =>
    (routeGroups[path] || [path]).some(p => currentPath.startsWith(p));

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) setIsOpen(false);
  };

  return (
    <>
      <div className="sidebar-mobile-header">
        <MdMenu
          onClick={() => setIsOpen(!isOpen)}
          className="sidebar-hamburger-icon"
        />
      </div>

      <div ref={sidebarRef} className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo-section">
          <img
            src={settingsLogo || defaultLogo}
            alt="Logo"
            className="sidebar-logo-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultLogo;
            }}
          />
          <span className="sidebar-logo-text">{settingsName}</span>
        </div>

        <nav className="sidebar-Main-links">
          <Link
            to="/homepage"
            className={`sidebar-Main-link ${isActive('/homepage') ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <MdHome /> Home
          </Link>

          {isSuperAdmin && (
            <Link
              to="/superadminpanel"
              className={`sidebar-Main-link ${isActive('/superadminpanel') ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <FaUserShield /> Super Admin
            </Link>
          )}

          {!isSuperAdmin && (
            <Link
              to="/onboarding"
              className={`sidebar-Main-link ${isActive('/onboarding') ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <MdPersonAdd /> Onboarding
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/employee"
              className={`sidebar-Main-link ${isActive('/employee') ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <FaUserFriends /> Employee
            </Link>
          )}

          {!isSuperAdmin && (
            <>
              <Link
                to="/leavesummary"
                className={`sidebar-Main-link ${isActive('/leavesummary') ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <MdTimeToLeave /> Leave Tracker
              </Link>

              <Link
                to="/attendance"
                className={`sidebar-Main-link ${isActive('/attendance') ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <MdListAlt /> Attendance
              </Link>

              <Link
                to="/AddressProof"
                className={`sidebar-Main-link ${isActive('/AddressProof') ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <MdStarBorder /> HR Letters
              </Link>

              <Link
                to="/pfesic"
                className={`sidebar-Main-link ${isActive('/pfesic') ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <MdAccountBalance /> PF/ESIC
              </Link>

              <Link
                to="/exitdetails"
                className={`sidebar-Main-link ${isActive('/exitdetails') ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <MdApartment /> Exit Process
              </Link>

              <Link
                to="/morefile"
                className={`sidebar-Main-link ${isActive('/morefile') ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <MdInsertDriveFile /> Files
              </Link>

              <Link
                to="/MyTasks"
                className={`sidebar-Main-link ${isActive('/MyTasks') ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <MdChecklist /> Tasks
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/setting-sidebar"
              className={`sidebar-Main-link ${isActive('/setting-sidebar') ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <FaWrench /> Global Settings
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}
