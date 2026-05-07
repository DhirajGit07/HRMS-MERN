import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SignUp.css';
import defaultLogo from '../assets/Stoic_Logo.jpg';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8000';

const SETTINGS_API = '/api/settings';

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    mobileNo: '',
    password: '',
    confirmPassword: '',
    role: 'Admin',
    companyName: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [settingsLogo, setSettingsLogo] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(SETTINGS_API);
        let logoUrl = res.data.logo || '';
        if (logoUrl.startsWith('http') || logoUrl.startsWith('data:')) {
          setSettingsLogo(logoUrl);
        } else {
          const base = axios.defaults.baseURL.replace(/\/$/, '');
          setSettingsLogo(base + logoUrl);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobileNo') {
      const numericValue = value.replace(/\D/g, '');
      const truncatedValue = numericValue.slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: truncatedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required';
      toast.error('Full name is required');
    } else if (formData.fullname.length < 2) {
      newErrors.fullname = 'Full name must be at least 2 characters';
      toast.error('Full name must be at least 2 characters');
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      toast.error('Email is required');
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
      toast.error('Enter a valid email address');
    }

    if (!formData.mobileNo.trim()) {
      newErrors.mobileNo = 'Mobile number is required';
      toast.error('Mobile number is required');
    } else if (!/^\d{10}$/.test(formData.mobileNo)) {
      newErrors.mobileNo = 'Mobile number must be 10 digits';
      toast.error('Mobile number must be 10 digits');
    } else if (!/^[6-9]/.test(formData.mobileNo)) {
      newErrors.mobileNo = 'Must start with 6, 7, 8, or 9';
      toast.error('Mobile number must start with 6, 7, 8, or 9');
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      toast.error('Password is required');
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must be 8+ chars, include letter, number & special char';
      toast.error('Password must be 8+ characters with letter, number & special character');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
      toast.error('Please confirm your password');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      toast.error('Passwords do not match');
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
      toast.error('Company name is required');
    } else if (formData.companyName.length < 2) {
      newErrors.companyName = 'Company name must be at least 2 characters';
      toast.error('Company name must be at least 2 characters');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    const payload = {
      fullname: formData.fullname.trim(),
      email: formData.email.trim(),
      mobileNo: formData.mobileNo,
      password: formData.password,
      role: formData.role,
      companyName: formData.companyName.trim()
    };

    try {
      const response = await axios.post('/api/users/signup', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        validateStatus: (status) => status < 500
      });

      if (response.status === 201) {
        setShowSuccessPopup(true);
        setTimeout(() => navigate('/login'), 2000);
      } else if (response.status === 400) {
        if (response.data.errors) {
          const backendErrors = {};
          response.data.errors.forEach(err => {
            backendErrors[err.param] = err.msg;
            toast.error(err.msg);
          });
          setErrors(backendErrors);
        } else {
          const errorMsg = response.data.message || 'Validation failed';
          setErrors({ submit: errorMsg });
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      let errorMsg = 'Registration failed. Please try again.';
      
      if (error.response) {
        if (error.response.data.errors) {
          error.response.data.errors.forEach(err => {
            toast.error(err.msg);
          });
        } else {
          errorMsg = error.response.data.message || errorMsg;
          toast.error(errorMsg);
        }
      } else {
        toast.error(errorMsg);
      }
      
      setErrors({ submit: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-wrapper">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="signup-container">
        <div className="signup-left">
          <h2>Join Us for an Elevated Business Experience!</h2>
          <p>
            Stay connected with us by logging in with your personal details.  
            Begin your journey towards smarter workforce management and business growth.
          </p>
        </div>

        <div className="signup-right">
          <form onSubmit={handleSignUp} className="signup-form" noValidate>
            <img
              src={settingsLogo || defaultLogo}
              alt="Logo"
              className="logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultLogo;
              }}
            />
            <h2>Create Admin Account</h2>
            <p>Please fill in the details to register your company</p>

            {errors.submit && (
              <div className="error-message">
                {errors.submit}
              </div>
            )}

            <input type="hidden" name="role" value="Admin" />

            <div className="form-grid">
              <div className="form-group">
                <input
                  type="text"
                  name="companyName"
                  placeholder="Company Name *"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={errors.companyName ? 'error' : ''}
                  required
                />
                
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="fullname"
                  placeholder="Full Name *"
                  value={formData.fullname}
                  onChange={handleChange}
                  className={errors.fullname ? 'error' : ''}
                  required
                />
                
              </div>

              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  required
                />
                {/* {errors.email && (
                  <span className="error-text">{errors.email}</span>
                )} */}
              </div>

              <div className="form-group">
                <input
                  type="tel"
                  name="mobileNo"
                  placeholder="Mobile Number *"
                  value={formData.mobileNo}
                  onChange={handleChange}
                  className={errors.mobileNo ? 'error' : ''}
                  pattern="[0-9]{10}"
                  maxLength="10"
                  required
                />
                {/* {errors.mobileNo && (
                  <span className="error-text">{errors.mobileNo}</span>
                )} */}
              </div>

              <div className="form-group password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password *"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                {/* {errors.password && (
                  <span className="error-text">{errors.password}</span>
                )} */}
              </div>

              <div className="form-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password *"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  required
                />
                {/* {errors.confirmPassword && (
                  <span className="error-text">{errors.confirmPassword}</span>
                )} */}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={isSubmitting ? 'submitting' : ''}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <p className="login-link">
              Already have an account? <a href="/login">Login</a>
            </p>
          </form>
        </div>
      </div>

      {showSuccessPopup && (
        <div className="success-popup">
          <div className="popup-content">
            <span className="popup-icon">✓</span>
            <p>Registration successful! Redirecting to login...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUp;