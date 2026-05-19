
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddEmployee.css';
import EmployeeNavbar from '../pages/EmployeeNavbar';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddEmployee = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState([]);
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [candidateId, setCandidateId] = useState(''); // New state for candidate ID

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: me } = await axios.get('http://localhost:8000/api/users/profile');
        setIsSuperAdmin(me.role === 'SuperAdmin');

        if (me.role === 'SuperAdmin') {
          const { data: companyList } = await axios.get('http://localhost:8000/api/users/companies');
          setCompanies(companyList);
        } else {
          setCompanyName(me.companyName || '');
          setCompanyId(me.companyId || '');
        }
      } catch (err) {
        console.error('Error loading:', err);
        setError('Failed to load company info');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const validateMobileNumber = (number) => {
    if (!number) return 'Mobile number is required';
    if (!/^[6-9]\d{9}$/.test(number)) {
      return 'Mobile number must be 10 digits and start with 6, 7, 8, or 9';
    }
    return '';
  };

  const handleMobileChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 10) {
      setMobileNo(value);
      setMobileError(validateMobileNumber(value));
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const mobileValidation = validateMobileNumber(mobileNo);
  if (mobileValidation) {
    setMobileError(mobileValidation);
    toast.error(mobileValidation, {
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

  if (password !== confirmPassword) {
    toast.error('Passwords do not match', {
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
    const payload = {
      companyName,
      companyId,
      fullname,
      email,
      mobileNo,
      department,
      password,
      confirmPassword,
      role: 'Employee',
    };

    // Only add candidateId if it's provided and not empty
    if (candidateId && candidateId.trim() !== '') {
      payload.candidateId = candidateId.trim();
    }

    await axios.post('http://localhost:8000/api/users/signup', payload);
    
    toast.success('Employee added successfully!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    
    setTimeout(() => navigate('/employee'), 1500);
  } catch (err) {
    console.error('Error adding employee', err);
    // Enhanced error logging
    console.error('Server response:', err.response?.data);
    
    const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Failed to add employee';
    
    toast.error(errorMessage, {
      position: "top-right",
      autoClose: 5000, // Longer timeout to read the error
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  }
};

  if (loading) return <div>Loading company info...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <EmployeeNavbar />
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
      <div className="add-employee-container">
        <div className="add-employee-form scrollable-form">
          <h2 className="add-employee-title">Add Employee</h2>
          <form className="add-employee-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Company Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name</label>
                  {isSuperAdmin ? (
                    <select value={companyName} onChange={e => {
                      const selected = companies.find(c => c.companyName === e.target.value);
                      setCompanyName(selected.companyName);
                      setCompanyId(selected.companyId);
                    }} required>
                      <option value="">Select company</option>
                      {companies.map(c => (
                        <option key={c.companyId} value={c.companyName}>{c.companyName}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={companyName} readOnly />
                  )}
                </div>
                <div className="form-group">
                  <label>Company ID</label>
                  <input type="text" value={companyId} readOnly />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Employee Information</h3>
              <div className="form-row">
                 <div className="form-group">
                  <label>Candiadte ID </label>
                  <input
                    type="text"
                    value={candidateId}
                    onChange={e => setCandidateId(e.target.value)}
                    placeholder="Enter Employee ID (any format)"
                  />
                </div>
                <div className="form-group">

                  <label>Full Name <span>*</span></label>
                  <input
                    type="text"
                    value={fullname}
                    onChange={e => setFullname(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email <span>*</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Mobile No. <span>*</span></label>
                  <input
                    type="tel"
                    value={mobileNo}
                    onChange={handleMobileChange}
                    required
                    pattern="[6-9]{1}[0-9]{9}"
                    maxLength="10"
                    className={mobileError ? 'error-border' : ''}
                  />
                  {mobileError && <div className="error-message-employee">{mobileError}</div>}
                </div>
                <div className="form-group-dropdown">
                  <label>Department <span>*</span></label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Software Developer">Software Developer</option>
                    <option value="Data Analyst">Data Analyst</option>
                    <option value="Software Testing">Software Testing</option>
                    <option value="AWS Cloud">AWS Cloud</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                {/* <div className="form-group">
                  <label>Employee ID </label>
                  <input
                    type="text"
                    value={candidateId}
                    onChange={e => setCandidateId(e.target.value)}
                    placeholder="Enter candidate ID (any format)"
                  />
                </div> */}
                <div className="form-group">
                  {/* Empty space to maintain layout */}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Credentials</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Password <span>*</span></label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength="8"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm Password <span>*</span></label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength="8"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => navigate('/employee')}>Cancel</button>
              <button type="submit" className="btn-submit">Add Employee</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;