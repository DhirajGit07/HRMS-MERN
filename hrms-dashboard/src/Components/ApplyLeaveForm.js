import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ApplyLeaveForm.css';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ApplyLeaveForm = () => {
  const navigate = useNavigate();

  // Initialize formData without localStorage
  const [formData, setFormData] = useState({
    name: '',
    leaveType: '',
    duration: '',
    startDate: '',
    endDate: '',
    teamEmail: '',
    employeeId: '',
    reason: ''
  });  

  const [matchedUserData, setMatchedUserData] = useState(null); // New useState for matched user data
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [originalLeaveBalances, setOriginalLeaveBalances] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReasonError, setShowReasonError] = useState(false);

  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        setLoading(true);
        const [profileRes, usersRes, leaveTypesRes, leavesRes, pendingLeavesRes] = await Promise.all([
          axios.get('http://localhost:8000/api/users/profile'),
          axios.get('http://localhost:8000/api/users'),
          axios.get('http://localhost:8000/api/leave-types'),
          axios.get(`http://localhost:8000/api/leaves?email=${formData.teamEmail}`),
          axios.get(`http://localhost:8000/api/leaves?email=${formData.teamEmail}&status=Pending`)
        ]);

        // Find matching employee by _id
        const profileId = profileRes.data.employeeId;
        const matchedUser = usersRes.data.find(user => user.employeeId === profileId);
        setMatchedUserData(matchedUser); // Store matched user data
    

        // Set initial form data from profile response
        const { firstName, lastName, fullname, email, employeeId, companyId, designation, department, hrmsRole, gender, maritalStatus } = profileRes.data;
        const fullName = firstName && lastName ? `${firstName} ${lastName}` : fullname || '';
        setFormData(prev => ({
          ...prev,
          name: fullName,
          teamEmail: email || '',
          employeeId: matchedUser ? (matchedUser.candidateId ? `${matchedUser.candidateId}` : matchedUser.employeeId ? `${matchedUser.employeeId}` : 'N/A') : 'N/A'
        }));

        // Filter leave types by companyId
        const leaveTypesResFilterByComId = leaveTypesRes.data.filter(type => type.companyId === companyId);

        const matchedLeaveTypes = leaveTypesResFilterByComId.filter(leaveType =>
          leaveType.departments.includes(department || '') &&
          leaveType.designations.includes(designation || '') &&
          leaveType.userRole.includes(hrmsRole || '') &&
          leaveType.gender.includes(gender || '') &&
          leaveType.maritalStatus.includes(maritalStatus || '')
        );

        // Calculate booked days including only approved and pending leavesaa
        const leaveTypeMap = {};
        [...leavesRes.data.filter(leave => leave.status === 'Approved' && leave.teamEmail === email),
         ...pendingLeavesRes.data.filter(leave => leave.status === 'Pending' && leave.teamEmail === email)]
          .forEach(leave => {
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            leaveTypeMap[leave.leaveType] = (leaveTypeMap[leave.leaveType] || 0) + days;
          });

        const updatedLeaveBalances = matchedLeaveTypes.map(lt => ({
          type: lt.name,
          available: Math.max(lt.noOfLeaves - (leaveTypeMap[lt.name] || 0), 0),
          booked: leaveTypeMap[lt.name] || 0,
          icon: {
            'Casual Leave': '⚙️',
            'Paid Leave': '✅',
            'Unpaid Leave': '⏰',
            'Paternity Leave': '👶',
            'Sabbatical Leave': '📚',
            'Sick Leave': '🩺'
          }[lt.name] || '📅'
        }));

        setLeaveTypes(matchedLeaveTypes);
        setLeaveBalances(updatedLeaveBalances);
        setOriginalLeaveBalances(updatedLeaveBalances);
        setPendingLeaves(pendingLeavesRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching leave data:', err);
        setError('Failed to load leave types or balances.');
        setLoading(false);
      }
    };

    fetchLeaveData();
  }, []);

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate < startDate) return 0;
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  };

  const updateLeaveBalances = (start, end, selectedLeaveType) => {
    const days = calculateDays(start, end);
    if (days === 0) {
      setLeaveBalances(originalLeaveBalances); // Reset to original if no valid range
      return;
    }

    const selectedLeave = originalLeaveBalances.find(leave => leave.type === selectedLeaveType);
    if (selectedLeave && days > selectedLeave.available) {
      toast.warning(`You have only ${selectedLeave.available} available ${selectedLeaveType} days. Please select a shorter date range.`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setEndDate(null);
      setFormData(prev => ({ ...prev, endDate: '' }));
      setLeaveBalances(originalLeaveBalances); // Reset balances
      return;
    }

    const updatedBalances = originalLeaveBalances.map(leave => {
      if (leave.type === selectedLeaveType) {
        return { ...leave, available: Math.max(leave.available - days, 0) };
      }
      return leave;
    });

    setLeaveBalances(updatedBalances);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'leaveType' && value) {
      const selectedLeave = originalLeaveBalances.find(leave => leave.type === value);
      if (selectedLeave && selectedLeave.available === 0) {
        toast.warning(`You have no available ${value} days. Please select another leave type or contact HR.`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        setFormData(prev => ({ ...prev, leaveType: '' }));
        return;
      }
      // Check if date range exceeds available leaves
      if (startDate && endDate) {
        const days = calculateDays(startDate, endDate);
        if (selectedLeave && days > selectedLeave.available) {
          toast.warning(`You have only ${selectedLeave.available} available ${value} days. Please select a shorter date range or another leave type.`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          setFormData(prev => ({ ...prev, leaveType: '' }));
          return;
        }
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'leaveType' && value && startDate && endDate) {
      updateLeaveBalances(startDate, endDate, value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate reason field
    if (!formData.reason.trim()) {
      setShowReasonError(true);
      toast.error('Please provide a reason for your leave', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    // Validate date range against available leaves
    const selectedLeave = originalLeaveBalances.find(leave => leave.type === formData.leaveType);
    const days = calculateDays(startDate, endDate || startDate);
    if (selectedLeave && days > selectedLeave.available) {
      toast.error(`You have only ${selectedLeave.available} available ${formData.leaveType} days. Cannot submit request.`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    const formatToISO = (date) => {
      if (!date) return '';
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      return utcDate.toISOString();
    };

    const cleanStart = startDate ? formatToISO(startDate) : '';
    const cleanEnd = endDate ? formatToISO(endDate) : cleanStart;

    const payload = {
      ...formData,
      startDate: cleanStart,
      endDate: cleanEnd,
      leaveType: formData.leaveType.trim(),
      duration: formData.duration.trim(),
      reason: formData.reason.trim(),
      employeeId: matchedUserData?.employeeId || ''
    };

    try {
      const res = await fetch('http://localhost:8000/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.status === 409) {
        toast.error(data.message || 'Leave already applied for this date.', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        return;
      }

      if (res.ok) {
        toast.success(data.message || 'Leave applied successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        // Add to pendingLeaves
        setPendingLeaves(prev => [
          ...prev,
          {
            ...payload,
            status: 'Pending',
            teamEmail: formData.teamEmail
          }
        ]);
        // Update originalLeaveBalances to reflect the applied leave
        const updatedOriginalBalances = originalLeaveBalances.map(leave => {
          if (leave.type === payload.leaveType) {
            return { ...leave, available: Math.max(leave.available - days, 0), booked: (leave.booked || 0) + days };
          }
          return leave;
        });
        setOriginalLeaveBalances(updatedOriginalBalances);
        setLeaveBalances(updatedOriginalBalances);
        setTimeout(() => navigate('/leavesummary'), 2000);
      } else {
        toast.error(`Error: ${data.message || 'Something went wrong'}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit the leave request. Please try again.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const handleCancel = () => navigate('/leavesummary');

  return (
    <div className="applyleave-form-container">
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
      
      <div className="applyleave-form-header">
        <h2>Apply Leave</h2>
      </div>

      {message && (
        <div className={`applyleave-form-error-message ${messageType}`}>
          {message}
        </div>
      )}

      {error && (
        <div className="applyleave-form-error-message error">
          {error}
        </div>
      )}

      <div className="applyleave-form-form-box">
        <form className="applyleave-form" onSubmit={handleSubmit}>
          <div className="applyleave-form-section-title">Personal Details</div>
          <div className="applyleave-form-form-row">
            <div className="applyleave-form-form-group">
              <label>Name <span className="applyleave-form-required">*</span></label>
              <input
                type="text"
                className="applyleave-form-input-field"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={true}
                style={{ 
                  cursor: 'not-allowed',
                }}
              />
            </div>

            <div className="applyleave-form-form-group">
              <label>Email ID</label>
              <input
                type="email"
                className="applyleave-form-input-field"
                name="teamEmail"
                value={formData.teamEmail}
                onChange={handleChange}
                readOnly
              />
            </div>
          </div>

          <div className="applyleave-form-form-row">
            <div className="applyleave-form-form-group">
              <label>Candidate ID</label>
              <input
                type="text"
                className="applyleave-form-input-field"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                readOnly
                style={{ 
                  cursor: 'not-allowed',
                }}
              />
            </div>

            <div className="applyleave-form-form-group">
              <label>Leave Type <span className="applyleave-form-required">*</span></label>
              <select
                className="applyleave-form-input-field"
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                {leaveBalances.map((leave, index) => (
                  <option key={index} value={leave.type}>
                    {leave.type} ({leave.available} available)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="applyleave-form-section-title">Leave Details</div>
          <div className="applyleave-form-form-row">
            <div className="applyleave-form-form-group">
              <label>Duration <span className="applyleave-form-required">*</span></label>
              <select
                className="applyleave-form-input-field duration-applyleave-form-input-field"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Full Day">Full Day</option>
                <option value="Multiple">Multiple</option>
                <option value="First Half">First Half</option>
                <option value="Second Half">Second Half</option>
              </select>
            </div>
          </div>

          <div className="applyleave-form-form-row">
            <div className="applyleave-form-form-group">
              <label>Start Date <span className="applyleave-form-required">*</span></label>
              <DatePicker
                selected={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  if (endDate && date && endDate < date) {
                    setEndDate(null);
                    setFormData(prev => ({ ...prev, endDate: '' }));
                  }
                  if (formData.leaveType && date && endDate) {
                    updateLeaveBalances(date, endDate, formData.leaveType);
                  }
                }}
                className="applyleave-form-input-field"
                dateFormat="dd-MMM-yyyy"
                placeholderText="Start Date"
                minDate={new Date()}
                maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                required
              />
            </div>

            <div className="applyleave-form-form-group">
              <label>End Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  if (formData.leaveType && startDate && date) {
                    updateLeaveBalances(startDate, date, formData.leaveType);
                  }
                }}
                className="applyleave-form-input-field"
                dateFormat="dd-MMM-yyyy"
                placeholderText="End Date (optional)"
                minDate={startDate || new Date()}
                disabled={!startDate}
              />
            </div>
          </div>

          <div className="applyleave-form-form-group">
            <label>Reason for Leave <span className="applyleave-form-required">*</span></label>
            <textarea
              className={`applyleave-form-input-field ${showReasonError && !formData.reason.trim() ? 'applyleave-form-error-field' : ''}`}
              name="reason"
              value={formData.reason}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, reason: e.target.value }));
                setShowReasonError(false);
              }}
              required
            />
            {showReasonError && !formData.reason.trim() && (
              <div className="applyleave-form-error-message">
                Please provide a reason for your leave
              </div>
            )}
          </div>

          <div className="applyleave-form-form-actions applyleave-form-sticky-footer">
            <button type="submit" className="applyleave-form-btn applyleave-form-blue">Submit</button>
            <button type="button" className="applyleave-form-btn applyleave-form-gray" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeaveForm;