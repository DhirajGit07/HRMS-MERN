import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChangePassword.css';

axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ChangePassword = () => {
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch user email on component mount
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const response = await axios.get('/api/users/profile');
        setEmail(response.data.email || '');
      } catch (error) {
        console.error('Error fetching user email:', error);
        setMessage({ 
          text: 'Failed to load user email. Please refresh the page.', 
          type: 'error' 
        });
      }
    };

    fetchUserEmail();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match!', type: 'error' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ text: 'Password must be at least 8 characters', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await axios.post('/api/users/change-password', {
        email,
        oldPassword,
        newPassword
      });

      setMessage({ 
        text: response.data.message || 'Password changed successfully!', 
        type: 'success' 
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password change error:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Failed to update password', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="changepassword-container">
      <form className="changepassword-form" onSubmit={handleSubmit}>
        <h2 className="changepassword-title">Change Password</h2>

        <label className="changepassword-label">Email ID</label>
        <input
          type="email"
          className="changepassword-input"
          value={email}
          readOnly
          disabled
        />

        <label className="changepassword-label">Old Password</label>
        <div className="changepassword-password-wrapper">
          <input
            type={showOld ? 'text' : 'password'}
            className="changepassword-input"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            minLength="8"
          />
          <button
            type="button"
            className="changepassword-toggle"
            onClick={() => setShowOld(!showOld)}
            aria-label={showOld ? 'Hide password' : 'Show password'}
          >
            {showOld ? 'Hide' : 'Show'}
          </button>
        </div>

        <label className="changepassword-label">New Password</label>
        <div className="changepassword-password-wrapper">
          <input
            type={showNew ? 'text' : 'password'}
            className="changepassword-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength="8"
          />
          <button
            type="button"
            className="changepassword-toggle"
            onClick={() => setShowNew(!showNew)}
            aria-label={showNew ? 'Hide password' : 'Show password'}
          >
            {showNew ? 'Hide' : 'Show'}
          </button>
        </div>

        <label className="changepassword-label">Confirm Password</label>
        <div className="changepassword-password-wrapper">
          <input
            type={showConfirm ? 'text' : 'password'}
            className="changepassword-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength="8"
          />
          <button
            type="button"
            className="changepassword-toggle"
            onClick={() => setShowConfirm(!showConfirm)}
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? 'Hide' : 'Show'}
          </button>
        </div>

        <button
          type="submit"
          className="changepassword-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="changepassword-spinner"></span>
              Processing...
            </>
          ) : (
            'Submit'
          )}
        </button>

        {message.text && (
          <div className={`changepassword-message ${message.type}`}>
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
};

export default ChangePassword;