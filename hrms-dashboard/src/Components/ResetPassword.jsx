import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ResetPassword.css';
import defaultLogo from '../assets/Stoic_Logo.jpg';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8000';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateEmail = () => {
    if (!formData.email) {
      toast.error('Email is required', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Enter a valid email address', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return false;
    }
    return true;
  };

  const validateOTP = () => {
    if (!formData.otp) {
      toast.error('OTP is required', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return false;
    }
    if (!/^\d{6}$/.test(formData.otp)) {
      toast.error('OTP must be 6 digits', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    const newErrors = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
      toast.error('New password is required', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
      toast.error('Password must be at least 8 characters', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
      toast.error('Confirm your password', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      toast.error('Passwords do not match', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateEmail()) return;
    setIsSubmitting(true);

    try {
      await axios.post('/api/users/send-otp', {
        email: formData.email
      });
      
      toast.success('OTP sent to your email', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setOtpSent(true);
      setStep(2);
      setCountdown(60); // 60 seconds countdown for resend
    } catch (error) {
      console.error('Send OTP error:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!validateOTP()) return;
    setIsSubmitting(true);

    try {
      await axios.post('/api/users/verify-otp', {
        email: formData.email,
        otp: formData.otp
      });
      
      toast.success('OTP verified successfully', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setOtpVerified(true);
      setStep(3);
    } catch (error) {
      console.error('Verify OTP error:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || 'Failed to verify OTP. Please try again.';
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsSubmitting(true);
    try {
      await axios.post('/api/users/resend-otp', {
        email: formData.email
      });
      
      toast.success('New OTP sent to your email', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setCountdown(60); // Reset countdown
    } catch (error) {
      console.error('Resend OTP error:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || 'Failed to resend OTP. Please try again.';
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setIsSubmitting(true);

    try {
      await axios.post('/api/users/reset-password', {
        email: formData.email,
        newPassword: formData.newPassword
      });
      
      toast.success('Password updated successfully! Redirecting to login...', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      console.error('Reset password error:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || 'Failed to reset password. Please try again.';
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
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
    <div className="reset-auth-wrapper">
      <ToastContainer />
      <div className="reset-auth-container">
        <div className="reset-auth-left">
          <h2>Reset Your Password</h2>
          <p>Enter your details to create a new password</p>
        </div>

        <div className="reset-auth-right">
          <form className="reset-form" onSubmit={handleResetPassword}>
            <img
              src={defaultLogo}
              alt="Logo"
              className="reset-logo"
            />
            <h2>Password Reset</h2>
            
            {step === 1 && (
              <>
                <p>Please enter your email to receive an OTP</p>
                
                <div className="reset-form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                  />
                </div>

                <div className="reset-button">
                  <button 
                    type="button" 
                    onClick={handleSendOTP}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p>Enter the OTP sent to your email</p>
                
                <div className="reset-form-group">
                  <input
                    type="text"
                    name="otp"
                    placeholder="Enter 6-digit OTP"
                    value={formData.otp}
                    onChange={handleChange}
                    maxLength="6"
                    className={errors.otp ? 'error' : ''}
                  />
                </div>

                <div className="reset-button">
                  <button 
                    type="button" 
                    onClick={handleVerifyOTP}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>

                <div className="resend-otp">
                  <button 
                    type="button" 
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || isSubmitting}
                  >
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <p>Create your new password</p>
                
                <div className="reset-form-group">
                  <div className="reset-password-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      placeholder="New Password (min 8 characters)"
                      value={formData.newPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="reset-toggle-password"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="reset-form-group">
                  <div className="reset-password-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm New Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={errors.confirmPassword ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="reset-toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="reset-button">
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Reset Password'}
                  </button>
                </div>
              </>
            )}

            <p className="reset-login-link">
              Remember your password? <a href="/login">Login here</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;