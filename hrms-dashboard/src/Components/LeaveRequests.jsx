import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEllipsisH } from 'react-icons/fa';
import './LeaveRequests.css';
import LeavePageLayout from './LeavePageLayout';
import LeaveTrackerNavbar from "../pages/LeaveTrackerNavbar";
import axios from 'axios';
import warningIcon from "../assets/warning-icon.png";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LeaveRequests = () => {
  const navigate = useNavigate();
  const [leaveData, setLeaveData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const [editModeIndex, setEditModeIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const modalRef = useRef(null);
  const [showActions, setShowActions] = useState(false);
  const [dateOfJoining, setDateOfJoining] = useState(null);
  const [generalSettings, setGeneralSettings] = useState(null);
  const [employeeData, setEmployeeData] = useState({}); // New state for employee data
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');

  // Set auth token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Fetch user data from localStorage
    const stored = localStorage.getItem("userData");
    let userData = { role: "", email: "", name: "" };
    if (stored) {
      userData = JSON.parse(stored);
      setIsAdmin(userData.role === "Admin");
    } else {
      console.log('No userData found in localStorage');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user data from localStorage
        const stored = localStorage.getItem('userData');
        let userData = { role: "", email: "" };
        if (stored) {
          userData = JSON.parse(stored);
          if (isMounted) {
            setUserRole(userData.role || 'Employee');
            setUserEmail(userData.email || '');
          }
        }

        // Fetch profile, settings, and users in parallel
        const [profileRes, settingsRes, usersRes] = await Promise.all([
          axios.get('http://localhost:8000/api/users/profile'),
          axios.get('http://localhost:8000/api/leave/general-settings').catch(() => ({ data: null })),
          axios.get('http://localhost:8000/api/users')
        ]);

        if (!isMounted) return;

        setCompanyName(profileRes.data.companyName || '');
        setCompanyId(profileRes.data.companyId || '');
        setDateOfJoining(profileRes.data.dateOfJoining || null);
        setGeneralSettings(settingsRes.data || null);

        const userFirstName = profileRes.data.firstName;
        const userLastName = profileRes.data.lastName;
        const userFullname = profileRes.data.fullname;
        setCurrentUserName(userFirstName && userLastName ? `${userFirstName} ${userLastName}` : userFullname);

        // Create a map of employee data by employeeId
        const employeeMap = {};
        usersRes.data.forEach(user => {
          employeeMap[user.employeeId] = user;
        });
        setEmployeeData(employeeMap);

        // Determine if Actions column should be shown
        const isManager = profileRes.data.designation?.toLowerCase().includes('manager');
        let shouldShowActions = userData.role === "Admin";

        if (isManager && settingsRes.data?.managerAction === 'Approved') {
          const { countLeavesFrom, yearStartsFrom } = settingsRes.data || {};
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth();

          const monthMap = {
            'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
            'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
          };

          if (countLeavesFrom === 'joiningDate' && profileRes.data.dateOfJoining) {
            const joiningDate = new Date(profileRes.data.dateOfJoining);
            const joiningMonth = joiningDate.getMonth();
            if (currentMonth >= joiningMonth) {
              shouldShowActions = true;
            }
          } else if (countLeavesFrom === 'startOfYear' && yearStartsFrom) {
            const startMonth = monthMap[yearStartsFrom.toLowerCase()];
            if (startMonth !== undefined && currentMonth >= startMonth) {
              shouldShowActions = true;
            }
          }
        }

        setShowActions(shouldShowActions);

        // Now fetch leave data with all the necessary filters
        const leavesRes = await axios.get('http://localhost:8000/api/leaves');
        if (isMounted) {
          setLeaveData(leavesRes.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownIndex(null);
        setEditModeIndex(null);
      }
      if (confirmDeleteIndex !== null && modalRef.current && !modalRef.current.contains(e.target)) {
        setConfirmDeleteIndex(null);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [confirmDeleteIndex]);

  const handleAddRequestClick = () => navigate('/applyleave');

  const handleEdit = (index, e) => {
    e.stopPropagation();
    setEditModeIndex(editModeIndex === index ? null : index);
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:8000/api/leaves/${id}`, { status, approvedBy: currentUserName });
      setLeaveData(prev => prev.map(l => l._id === id ? { ...l, status, approvedBy: currentUserName } : l));
      setEditModeIndex(null);
      setDropdownIndex(null);

      toast.success(`Leave status updated to ${status}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      console.error('Update failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update leave status', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/leaves/${id}`);
      setLeaveData(prev => prev.filter(l => l._id !== id));

      toast.success('Leave deleted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error(err.response?.data?.message || 'Failed to delete leave', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    } finally {
      setConfirmDeleteIndex(null);
      setDropdownIndex(null);
    }
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteIndex !== null && leaveData) {
      const leaveId = filteredLeaves[confirmDeleteIndex]._id;
      handleDelete(leaveId);
    }
  };

  const filteredLeaves = leaveData ? leaveData.filter(leave => {
    // First filter by company ID to ensure we only show data from the same company
    if (!leave.employeeId?.startsWith(companyId)) return false;

    // Then filter by user role/email if not admin
    if (userRole !== 'Admin' && leave.teamEmail !== userEmail) return false;

    // Finally apply search filter if any
    if (searchTerm) {
      return [leave.name, leave.email, leave.teamEmail, leave.leaveType, leave.status]
        .some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return true;
  }) : [];

  const getStatusStyle = status => {
    switch (status) {
      case 'Pending': return { color: '#f59e0b' };
      case 'Approved': return { color: '#10b981' };
      case 'Rejected': return { color: '#ef4444' };
      default: return { color: '#6b7280' };
    }
  };

  const handleActionClick = (index, e) => {
    e.stopPropagation();
    const buttonRect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = dropdownRef.current?.offsetHeight ?? 150;

    setDropdownPosition({
      top: buttonRect.top + window.scrollY + 8,
      left: buttonRect.left + window.scrollX - 100,
    });

    setDropdownIndex(dropdownIndex === index ? null : index);
    setEditModeIndex(null);
  };

  return (
    <div>
      <LeaveTrackerNavbar />
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
      <LeavePageLayout>
        <div className="leave-request-container">
          <div className="leave-request-header-controls">
            <div className="leave-request-search-container">
              <span className="leave-request-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="leave-request-input-search"
              />
            </div>
            <button className="leave-request-btn-add" onClick={handleAddRequestClick}>
              + Add Request
            </button>
          </div>

          <h3 className="leave-request-section-title">
            {userRole === 'Admin' ? 'All Leave Requests' : 'My Leave Requests'}
          </h3>

          <div className="leave-request-table-scroll-container">
            {loading ? (
              <div className="leave-request-no-records">
                <div className="leave-request-no-records-image">
                  <div className="leave-request-image-placeholder">⏳</div>
                </div>
                <div className="leave-request-no-records-text">Loading...</div>
              </div>
            ) : error ? (
              <div className="leave-request-no-records">
                <div className="leave-request-no-records-image">
                  <div className="leave-request-image-placeholder">⚠️</div>
                </div>
                <div className="leave-request-no-records-text">{error}</div>
              </div>
            ) : leaveData && filteredLeaves.length > 0 ? (
              <table className="leave-request-table">
                <thead className="leave-request-table-header">
                  <tr>
                    {isAdmin && <th className="leave-summary-header-cell">System ID</th>}
                    <th className="leave-request-header-cell">Candidate ID</th>
                    <th className="leave-request-header-cell">Name</th>
                    <th className="leave-request-header-cell">Leave Type</th>
                    <th className="leave-request-header-cell">Duration</th>
                    <th className="leave-request-header-cell">Start Date</th>
                    <th className="leave-request-header-cell">End Date</th>
                    <th className="leave-request-header-cell">Email Address</th>
                    <th className="leave-request-header-cell">Reason</th>
                    <th className="leave-request-header-cell">Status</th>
                    <th className="leave-request-header-cell">Approved By</th>
                    {showActions && (
                      <th className="leave-request-header-cell leave-request-actions-cell">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="leave-request-table-body">
                  {filteredLeaves.map((leave, idx) => {
                    const employee = employeeData[leave.employeeId] || {};
                    return (
                      <tr className="leave-request-table-row" key={leave._id || idx}>
                        {isAdmin && (
                          <td className="leave-summary-table-cell">
                            <div className="leave-summary-cell-content" title={employee.employeeId}>
                              {employee.employeeId}
                            </div>
                          </td>
                        )}
                        <td className="leave-request-table-cell">
                          <div className="leave-request-cell-content" title={employee.candidateId || employee.employeeId}>
                            {employee.candidateId ? `${employee.candidateId}` : employee.employeeId ? `${employee.employeeId}` : 'N/A'}
                          </div>
                        </td>
                        <td className="leave-request-table-cell">
                          <div className="leave-request-cell-content" title={leave.name}>
                            {leave.name}
                          </div>
                        </td>
                        <td className="leave-request-table-cell">
                          <div className="leave-request-cell-content" title={leave.leaveType}>
                            {leave.leaveType}
                          </div>
                        </td>
                        <td className="leave-request-table-cell">
                          <div className="leave-request-cell-content" title={leave.duration}>
                            {leave.duration}
                          </div>
                        </td>
                        <td className="leave-request-table-cell">
                          <div className="leave-request-cell-content">
                            {new Date(leave.startDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="leave-request-table-cell">
                          <div className="leave-request-cell-content">
                            {new Date(leave.endDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="leave-request-table-cell">
                          <div className="leave-request-cell-content" title={leave.teamEmail}>
                            {leave.teamEmail}
                          </div>
                        </td>
                        <td className="leave-request-table-cell">
                          <div className="leave-request-cell-content" title={leave.reason}>
                            {leave.reason}
                          </div>
                        </td>
                        <td className="leave-request-table-cell">
                          <span
                            className="leave-request-status-badge"
                            style={getStatusStyle(leave.status)}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td className="leave-request-table-cell">
                          <div className="leave-request-cell-content" title={leave.approvedBy || 'Awaiting Approval'}>
                            {leave.status === 'Pending' ? 'Awaiting Approval' : leave.approvedBy || 'Awaiting Approval'}
                          </div>
                        </td>
                        {showActions && (
                          <td className="leave-request-table-cell leave-request-actions-cell">
                            <div className="leave-request-action-buttons">
                              <button
                                className="leave-request-action-btn"
                                onClick={(e) => handleActionClick(idx, e)}
                                title="Actions"
                              >
                                <FaEllipsisH />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="leave-request-no-records">
                <div className="leave-request-no-records-image">
                  <div className="leave-request-image-placeholder">📋</div>
                </div>
                <div className="leave-request-no-records-text">
                  {userRole === 'Admin' ? 'No matching requests' : 'You have no leave requests'}
                </div>
              </div>
            )}
          </div>

          {showActions && dropdownIndex !== null && (
            <div
              className="leave-request-floating-action-dropdown"
              style={{ position: "absolute", top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
              ref={dropdownRef}
            >
              <div className="leave-request-action-option" onClick={(e) => handleEdit(dropdownIndex, e)}>Edit</div>

              {editModeIndex === dropdownIndex && (
                <div className="leave-request-floating-edit-status-options">
                  {["Pending", "Approved", "Rejected"].map((status) => (
                    <div
                      key={status}
                      className="leave-request-status-option"
                      style={getStatusStyle(status)}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(filteredLeaves[dropdownIndex]._id, status);
                      }}
                    >
                      {status}
                    </div>
                  ))}
                </div>
              )}

              <div className="leave-request-action-option leave-request-delete-option" onClick={(e) => {
                e.stopPropagation();
                setConfirmDeleteIndex(dropdownIndex);
              }}>
                Delete
              </div>
            </div>
          )}

          {confirmDeleteIndex !== null && (
            <div className="leave-request-modal-overlay">
              <div className="leave-request-modal-content" ref={modalRef}>
                <img src={warningIcon} alt="warning" className="leave-request-warning-icon" />
                <h3>DELETE CONFIRMATION</h3>
                <p>Are you sure you want to delete?</p>
                <div className="leave-request-modal-actions">
                  <button className="leave-request-cancel-btn" onClick={() => setConfirmDeleteIndex(null)}>Cancel</button>
                  <button className="leave-request-confirm-btn" onClick={handleConfirmDelete}>Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </LeavePageLayout>
    </div>
  );
};

export default LeaveRequests;