import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Login.css';
import defaultLogo from '../assets/Stoic_Logo.jpg';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8000';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    emailOrMobile: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settingsLogo, setSettingsLogo] = useState(null);
  const [touched, setTouched] = useState({
    emailOrMobile: false,
    password: false
  });

  const navigate = useNavigate();

  // Fetch company logo and settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        let logoUrl = res.data.logo || '';
        
        if (logoUrl) {
          if (logoUrl.startsWith('http') || logoUrl.startsWith('data:')) {
            setSettingsLogo(logoUrl);
          } else {
            setSettingsLogo(`${axios.defaults.baseURL.replace(/\/$/, '')}${logoUrl}`);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setSettingsLogo(null);
      }
    };

    fetchSettings();
    const handler = () => fetchSettings();
    window.addEventListener('settingsUpdated', handler);
    return () => window.removeEventListener('settingsUpdated', handler);
  }, []);

  // Load remembered credentials
  useEffect(() => {
    const savedCredentials = localStorage.getItem('rememberedCredentials');
    if (savedCredentials) {
      try {
        const { emailOrMobile, password, rememberMe } = JSON.parse(savedCredentials);
        setFormData({
          emailOrMobile: rememberMe ? emailOrMobile : '',
          password: rememberMe ? password : '',
          rememberMe
        });
        setTouched({
          emailOrMobile: rememberMe,
          password: rememberMe
        });
      } catch (error) {
        console.error('Error parsing saved credentials:', error);
        localStorage.removeItem('rememberedCredentials');
      }
    }
  }, []);

  // Validate form fields
  const validateForm = () => {
    const errors = [];
    const { emailOrMobile, password } = formData;

    if (!emailOrMobile.trim()) {
      errors.push('Email or mobile is required');
    } else if (
      !/\S+@\S+\.\S+/.test(emailOrMobile) && 
      !/^\d{10}$/.test(emailOrMobile)
    ) {
      errors.push('Please enter a valid email or 10-digit mobile number');
    }

    if (!password) {
      errors.push('Password is required');
    } else if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };
    setFormData(updatedFormData);

    // Update touched state
    if (name !== 'rememberMe') {
      setTouched(prev => ({ ...prev, [name]: true }));
    }

    // Handle remember me persistence
    if (name === 'rememberMe') {
      if (checked) {
        localStorage.setItem('rememberedCredentials', JSON.stringify(updatedFormData));
      } else {
        localStorage.removeItem('rememberedCredentials');
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) return;

    // Mark all fields as touched
    setTouched({
      emailOrMobile: true,
      password: true
    });

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => {
        toast.error(error, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/users/login', {
        email: formData.emailOrMobile,
        password: formData.password
      });

      if (!response.data.token) {
        throw new Error('No authentication token received');
      }

      // Store user data
      localStorage.setItem('userToken', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data));
      localStorage.setItem('employee', JSON.stringify({
        email: response.data.email,
        fullname: response.data.fullname,
        role: response.data.role,
      }));

      // Resume timer if clocked in
      const userId = response.data._id;
      const isClockedIn = localStorage.getItem(`isClockedIn_${userId}`) === 'true';
      if (isClockedIn) {
        const lastPausedTime = localStorage.getItem(`lastPausedTime_${userId}`);
        const accumulatedTime = parseInt(localStorage.getItem(`accumulatedTime_${userId}`) || '0', 10);

        if (lastPausedTime) {
          const now = new Date();
          const pauseTime = new Date(lastPausedTime);
          const elapsedDuringLogout = Math.floor((now - pauseTime) / 1000);
          const newAccumulated = accumulatedTime + elapsedDuringLogout;
          localStorage.setItem(`accumulatedTime_${userId}`, newAccumulated.toString());
          localStorage.removeItem(`lastPausedTime_${userId}`);
        }
      }

      // Show success and redirect
      toast.success('Login successful! Redirecting...', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        onClose: () => {
          onLogin(true);
          navigate('/homepage');
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      const backendMessage = error.response?.data?.message;

      if (backendMessage?.includes('not active')) {
        errorMessage = 'Your account is not active. Please contact your administrator.';
      } else if (backendMessage?.includes('sign up')) {
        errorMessage = (
          <span>
            {backendMessage}.
            <a href="/signup" style={{ color: 'blue', marginLeft: '5px' }}>
              Click here to sign up
            </a>
          </span>
        );
      } else if (backendMessage) {
        errorMessage = backendMessage;
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <ToastContainer />
      <div className="login-container">
        {/* Left Section - Welcome Message */}
        <div className="login-left">
          <h2>Streamline Your Workforce</h2>
          <p>Optimize your operations and focus on what matters. Sign in to get started.</p>
        </div>

        {/* Right Section - Login Form */}
        <div className="login-right">
          <form className="login-form" onSubmit={handleLogin}>
            <div className="logo-container">
              <img
                src={settingsLogo || defaultLogo}
                alt="Company Logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultLogo;
                }}
              />
            </div>
            
            <h2>Welcome Back</h2>
            <p>Please enter your credentials</p>

            <div className="login-form-group">
              <input
                type="text"
                name="emailOrMobile"
                placeholder="Email or mobile"
                value={formData.emailOrMobile}
                onChange={handleChange}
                className={`login-input ${
                  touched.emailOrMobile && !formData.emailOrMobile ? 'input-error' : ''
                }`}
              />
            </div>

            <div className="login-form-group">
              <div className="login-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`login-input ${
                    touched.password && !formData.password ? 'input-error' : ''
                  }`}
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="login-remember-me">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>
              <a
                href="/resetpassword"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/resetpassword');
                }}
                className="login-forgot-password"
              >
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="login-spinner"></span>
                  Logging In...
                </>
              ) : (
                'Log In'
              )}
            </button>

            <p className="login-signup">
              Don't have an account?{' '}
              <a href="/signup" className="login-signup-link">
                Sign Up
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;