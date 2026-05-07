

import React, { useState, useEffect } from 'react';
import './Setting_Sidebar.css';
import SettingSidebarNavbar from '../pages/SettingSidebarNavbar';
import defaultLogo from '../assets/Stoic_Logo.jpg';
import SettingSidebar from '../pages/SettingSidebar';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = 'http://localhost:8000/api/settings';
const BACKEND_ORIGIN = 'http://localhost:8000';

const Setting_Sidebar = () => {
  const [wallpaper, setWallpaper] = useState('');
  const [logo, setLogo] = useState('');
  const [dashboardName, setDashboardName] = useState('My Space');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // Fetch user profile to get companyId
  const fetchProfile = async () => {
    try {
      const profileRes = await axios.get('http://localhost:8000/api/users/profile');
      if (profileRes.status === 200) {
        const companyId = profileRes?.data?.companyId?.split('-')[0] || profileRes?.data?.companyId;
        setProfileData(companyId);
      }
    } catch (err) {
      console.error('Error fetching profile:', err.response || err);
      toast.error(err.response?.data?.message || 'Failed to load profile data', {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch settings for the specific companyId
  const fetchSettings = async () => {
    if (!profileData) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}?companyId=${profileData}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setDashboardName(data.dashboardName || 'My Space');

      let logoUrl = data.logo || '';
      if (!logoUrl || logoUrl === 'Logo') {
        logoUrl = '';
      } else if (logoUrl.startsWith('data:') || logoUrl.startsWith('http')) {
        // leave as is
      } else if (logoUrl.startsWith('/')) {
        logoUrl = BACKEND_ORIGIN + logoUrl;
      } else {
        logoUrl = BACKEND_ORIGIN + '/' + logoUrl;
      }

      setLogo(logoUrl);
      setWallpaper(data.wallpaper || '');
    } catch (e) {
      toast.error(e.message, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [profileData]);

  // Upload helper
  const uploadFile = async (file, type) => {
    const form = new FormData();
    form.append(type, file);

    const res = await fetch(`${API_BASE}/upload-${type}`, {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const uploadedUrl = data[`${type}Url`];
    const fullPath = uploadedUrl.startsWith('/') ? BACKEND_ORIGIN + uploadedUrl : BACKEND_ORIGIN + '/' + uploadedUrl;
    return fullPath;
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)', {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const url = await uploadFile(file, type);
      if (type === 'wallpaper') setWallpaper(url);
      else if (type === 'logo') setLogo(url);
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (e) {
      toast.error(e.message, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      const relativeLogo = logo.replace(BACKEND_ORIGIN, '');
      const relativeWallpaper = wallpaper.replace(BACKEND_ORIGIN, '');

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: profileData,
          dashboardName,
          wallpaper: relativeWallpaper,
          logo: relativeLogo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      window.dispatchEvent(new Event('settingsUpdated'));
      
      toast.success('Your settings have been saved!', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (e) {
      toast.error(`Save failed: ${e.message}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SettingSidebarNavbar />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="setting-page">
        <SettingSidebar />
        <main className="settings-container">
          <div className="settings-content">
            <div className="header-card">
              <div className="app-logo">
                <img src={logo || defaultLogo} alt="Company Logo" />
                <span className="app-name">{dashboardName || 'My Space'}</span>
              </div>
            </div>

            <div className="cards-container">
              <div className="card-row">
                <div className="settings-card">
                  <h3>Dashboard Settings</h3>
                  <div className="upload-group">
                    <label htmlFor="dashboard-name">Dashboard Name</label>
                    <input
                      placeholder='My Space'
                      id="dashboard-name"
                      type="text"
                      value={dashboardName}
                      onChange={(e) => setDashboardName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="settings-card">
                  <h3>Logo Settings</h3>
                  <div className="upload-group">
                    <label htmlFor="logo-upload">Change Logo</label>
                    {logo && (
                      <div className="image-preview">
                        <img src={logo} alt="Current Logo" />
                      </div>
                    )}
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'logo')}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="card-row">
                <div className="settings-card-3">
                  <h3>Wallpaper Settings</h3>
                  <div className="upload-group">
                    <label htmlFor="wallpaper-upload">Change Wallpaper</label>
                    {wallpaper && (
                      <div className="image-preview">
                        <img src={wallpaper} alt="Current Wallpaper" />
                      </div>
                    )}
                    <input
                      id="wallpaper-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'wallpaper')}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="save-button"
                onClick={handleSave}
                disabled={loading || !profileData}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Setting_Sidebar;