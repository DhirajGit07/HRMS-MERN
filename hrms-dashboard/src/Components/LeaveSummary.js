import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LeavePageLayout from "./LeavePageLayout";
import "./LeaveSummary.css";
import axios from "axios";
import LeaveTrackerNavbar from "../pages/LeaveTrackerNavbar";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEllipsisH } from "react-icons/fa";
import warningIcon from "../assets/warning-icon.png";

const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
const initialLeaveData = [
  { type: "Casual Leave", available: 0, booked: 0, icon: "🏖️" }, // Beach umbrella for casual leave
  { type: "Paid Leave", available: 0, booked: 0, icon: "💰" }, // Money bag for paid leave
  { type: "Unpaid Leave", available: 0, booked: 0, icon: "⌛" }, // Hourglass for unpaid leave
  { type: "Paternity Leave", available: 0, booked: 0, icon: "👨‍🍼" }, // Man with baby for paternity leave
  { type: "Sabbatical Leave", available: 0, booked: 0, icon: "🌍" }, // Globe for sabbatical
  { type: "Sick Leave", available: 0, booked: 0, icon: "🤒" }, // Sick face for sick leave
];

const LeaveSummary = () => {
  const navigate = useNavigate();
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);
  const [bookedCount, setBookedCount] = useState(0);
  const [absentMonths, setAbsentMonths] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [hrmsRole, setHrmsRole] = useState('');
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [generalSettings, setGeneralSettings] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [dateOfJoining, setDateOfJoining] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [confirmDeleteLeaveId, setConfirmDeleteLeaveId] = useState(null);
  const [lastProcessedMonth, setLastProcessedMonth] = useState(null);
  const [lastProcessedYear, setLastProcessedYear] = useState(null);
  const [employeeData, setEmployeeData] = useState({}); // New state for employee data
  const [currentUserName, setCurrentUserName] = useState('');
  const dropdownRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data from localStorage
        const stored = localStorage.getItem("userData");
        let userData = { role: "", email: "", name: "" };
        if (stored) {
          userData = JSON.parse(stored);
          setIsAdmin(userData.role === "Admin");
          setUserEmail(userData.email);
          setUserName(userData.name);
        } else {
          console.log('No userData found in localStorage');
        }

        // Fetch profile, settings, leave types, and users
        const [profileRes, settingsRes, leaveTypesRes, usersRes] = await Promise.all([
          axios.get('http://localhost:8000/api/users/profile'),
          axios.get('http://localhost:8000/api/leave/general-settings').catch(() => null),
          axios.get('http://localhost:8000/api/leave-types'),
          axios.get('http://localhost:8000/api/users')
        ]);

        // Set companyId first to ensure it's available
        const fetchedCompanyId = profileRes.data.companyId || '';
        setCompanyId(fetchedCompanyId);

        // Create a map of employee data by employeeId
        const employeeMap = {};
        usersRes.data.forEach(user => {
          employeeMap[user.employeeId] = user;
        });
        setEmployeeData(employeeMap);

        const userFirstName = profileRes.data.firstName;
        const userLastName = profileRes.data.lastName;
        const userFullname = profileRes.data.fullname;
        setCurrentUserName(userFirstName && userLastName ? `${userFirstName} ${userLastName}` : userFullname);

        // Filter leave types by companyId
        const leaveTypesResFilterByComId = leaveTypesRes.data.filter(l => l.companyId === fetchedCompanyId);
        console.log(leaveTypesResFilterByComId);

        setDesignation(profileRes.data.designation || '');
        setDepartment(profileRes.data.department || '');
        setHrmsRole(profileRes.data.hrmsRole || '');
        setGender(profileRes.data.gender || '');
        setMaritalStatus(profileRes.data.maritalStatus || '');
        setCompanyName(profileRes.data.companyName || '');
        setDateOfJoining(profileRes.data.dateOfJoining || null);
        setGeneralSettings(settingsRes?.data || null);
        setLeaveTypes(leaveTypesResFilterByComId || []);

        // Determine if Actions column should be shown
        let shouldShowActions = isAdmin;
        const isManager = (profileRes.data.designation || '').toLowerCase().includes('manager');
        if (isManager && settingsRes?.data?.managerAction === 'Approved') {
          const { countLeavesFrom, yearStartsFrom } = settingsRes?.data || {};
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
      } catch (err) {
        console.error('Error:', err.response || err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownIndex(null);
        setEditIndex(null);
      }
      if (confirmDeleteLeaveId !== null && modalRef.current && !modalRef.current.contains(e.target)) {
        setConfirmDeleteLeaveId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [confirmDeleteLeaveId]);

  // Update lastProcessedMonth and lastProcessedYear when necessary
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-based (0 = January, 11 = December)
    const currentYear = currentDate.getFullYear();

    if (lastProcessedMonth !== currentMonth || lastProcessedYear !== currentYear) {
      setLastProcessedMonth(currentMonth);
      setLastProcessedYear(currentYear);
    }
  }, [lastProcessedMonth, lastProcessedYear, leaveTypes, upcomingLeaves]);

  const handleApplyLeave = () => {
    navigate("/applyleave");
  };

  const handleEdit = (index, e) => {
    e.stopPropagation();
    setEditIndex(editIndex === index ? null : index);
  };

  const updateStatus = async (leaveId, newStatus) => {
    try {
      await axios.put(`http://localhost:8000/api/leaves/${leaveId}`, { status: newStatus, approvedBy: currentUserName });
      const updated = upcomingLeaves.map((leave) =>
        leave._id === leaveId ? { ...leave, status: newStatus, approvedBy: currentUserName } : leave
      );
      setUpcomingLeaves(updated);
      setEditIndex(null);
      setDropdownIndex(null);
      
      // Show success toast
      toast.success(`Leave status updated to ${newStatus}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      console.error('Update failed:', err);
      // Show error toast
      toast.error(err.response?.data?.message || 'Failed to update leave status', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  // Delete leave with toast notification
  const performDelete = async (leaveId) => {
    try {
      await axios.delete(`http://localhost:8000/api/leaves/${leaveId}`);
      setUpcomingLeaves((prev) => prev.filter((leave) => leave._id !== leaveId));
      
      // Show success toast
      toast.success('Leave deleted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    } catch (err) {
      console.error('Delete failed:', err);
      // Show error toast
      toast.error(err.response?.data?.message || 'Failed to delete leave', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (confirmDeleteLeaveId) {
      await performDelete(confirmDeleteLeaveId);
      setConfirmDeleteLeaveId(null);
      setDropdownIndex(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteLeaveId(null);
  };

  const handleDeleteRequest = (leaveId, e) => {
    e.stopPropagation();
    setConfirmDeleteLeaveId(leaveId);
  };

  const computeLeaveData = () => {
    const leaveTypeMap = {
      "Casual Leave": 0,
      "Paid Leave": 0,
      "Sick Leave": 0,
      "Unpaid Leave": 0,
      "Paternity Leave": 0,
      "Sabbatical Leave": 0
    };

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-based (0 = January, 11 = December)
    const currentYear = currentDate.getFullYear();

    // Match leave types with user profile
    const matchedLeaveTypes = leaveTypes.filter(leaveType => 
      leaveType.departments.includes(department) &&
      leaveType.designations.includes(designation) &&
      leaveType.userRole.includes(hrmsRole) &&
      leaveType.gender.includes(gender) &&
      leaveType.maritalStatus.includes(maritalStatus)
    );

    // Reset booked counts based on allotment
    Object.keys(leaveTypeMap).forEach((type) => {
      const matchedType = matchedLeaveTypes.find(lt => lt.name === type);
      if (matchedType) {
        if (matchedType.allotment === "Monthly" && lastProcessedMonth !== null && lastProcessedMonth !== currentMonth) {
          leaveTypeMap[type] = 0; // Reset for monthly allotment if month changed
        } else if (matchedType.allotment === "Yearly" && lastProcessedYear !== null && lastProcessedYear !== currentYear) {
          leaveTypeMap[type] = 0; // Reset for yearly allotment if year changed
        }
      }
    });

    // Filter leaves based on user role and settings
    let filteredLeaves = upcomingLeaves;
    if (generalSettings) {
      filteredLeaves = isAdmin || designation.toLowerCase().includes('manager')
        ? upcomingLeaves
        : upcomingLeaves.filter(leave => leave.teamEmail === userEmail);
    } else if (isAdmin) {
      filteredLeaves = upcomingLeaves;
    } else {
      filteredLeaves = upcomingLeaves.filter(leave => leave.teamEmail === userEmail);
    }

    filteredLeaves.forEach((leave) => {
      if (["Approved"].includes(leave.status) && leave.teamEmail === userEmail) {
        if (leaveTypeMap.hasOwnProperty(leave.leaveType)) {
          const startDate = new Date(leave.startDate);
          const endDate = new Date(leave.endDate);
          const timeDiff = endDate - startDate;
          const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; 
          leaveTypeMap[leave.leaveType] += days;
        }
      }
    });

    let lwpOverflow = 0;
    ["Casual Leave", "Paid Leave", "Sick Leave"].forEach((type) => {
      if (leaveTypeMap[type] > 12) {
        lwpOverflow += leaveTypeMap[type] - 12;
        leaveTypeMap[type] = 12;
      }
    });

    leaveTypeMap["Unpaid Leave"] += lwpOverflow;

    // Update initialLeaveData with noOfLeaves from matched leave types
    let updatedLeaveData = initialLeaveData.map((leaveType) => {
      const matchedType = matchedLeaveTypes.find(lt => lt.name === leaveType.type);
      const booked = leaveTypeMap[leaveType.type] || 0;
      const available = matchedType ? matchedType.noOfLeaves : leaveType.available;
      return {
        ...leaveType,
        booked,
        available: Math.max(available - booked, 0),
      };
    });

    // Add new leave types that don't exist in initialLeaveData
    const newLeaveTypes = matchedLeaveTypes
      .filter(lt => !initialLeaveData.some(ild => ild.type === lt.name))
      .map(lt => ({
        type: lt.name,
        available: Math.max(lt.noOfLeaves - (leaveTypeMap[lt.name] || 0), 0),
        booked: leaveTypeMap[lt.name] || 0,
        icon: "📅", // Default icon for new leave types
      }));

    return [...updatedLeaveData, ...newLeaveTypes];
  };

  const fetchData = async () => {
    try {
      let leavesRes;
      if (isAdmin || (generalSettings && designation.toLowerCase().includes('manager'))) {
        leavesRes = await axios.get("http://localhost:8000/api/leaves");
      } else if (!generalSettings && isAdmin) {
        leavesRes = await axios.get("http://localhost:8000/api/leaves");
      } else {
        leavesRes = await axios.get(`http://localhost:8000/api/leaves?email=${userEmail}`);
      }

      const [bookedRes, monthlyRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/leaves/booked/count?email=${isAdmin ? '' : userEmail}`),
        axios.get(`http://localhost:8000/api/leaves/monthly/count?email=${isAdmin ? '' : userEmail}`),
      ]);

      const allLeaves = leavesRes.data;
      const filtered = allLeaves.filter(l => {
        if (!l.employeeId || !companyId) return false;
        return l.employeeId.startsWith(companyId);
      });

      setUpcomingLeaves(filtered);
      setBookedCount(bookedRes.data.count);
      setAbsentMonths(monthlyRes.data.count);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch leave data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [isAdmin, userEmail, companyId, generalSettings, designation]);

  const updatedLeaveData = computeLeaveData();

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return { color: "#f59e0b" };
      case "Approved": return { color: "#10b981" };
      case "Rejected": return { color: "#ef4444" };
      default: return { color: "#6b7280" };
    }
  };

  const handleActionClick = (index, e) => {
    e.stopPropagation();
    e.preventDefault();
    const buttonRect = e.currentTarget.getBoundingClientRect();
    console.log('Action clicked, index:', index, 'Position:', {
      top: buttonRect.bottom + window.scrollY,
      left: buttonRect.left + window.scrollX - 100,
    });
    setDropdownPosition({
      top: buttonRect.bottom + window.scrollY - 110,
      left: buttonRect.left + window.scrollX - 100,
    });
    setDropdownIndex(dropdownIndex === index ? null : index);
    setEditIndex(null);
  };

  return (
    <div className="leave-summary-container">
      <LeaveTrackerNavbar />
       <ToastContainer position="top-right" autoClose={3000} />
      <LeavePageLayout>
        <div className="leave-summary-content-wrapper">
          <div className={ !isAdmin ? "leave-summary-toolbar-ifAdmin" : "leave-summary-toolbar"}>
            {isAdmin && (
              <div className="leave-summary-toolbar-left">
                <span>Leave booked this year: {bookedCount}</span>
                <span>Absent Months: {absentMonths}</span>
              </div>
            )}
            <div className="leave-summary-toolbar-right">
              <button className="leave-summary-apply-btn" onClick={handleApplyLeave}>
                + Apply Leave
              </button>
            </div>
          </div>

          <div className="leave-summary-cards-container">
            {updatedLeaveData.map((item, index) => (
              <div key={index} className="leave-summary-card">
                <div className="leave-summary-card-icon">{item.icon}</div>
                <div className="leave-summary-card-title">{item.type}</div>
                <div className="leave-summary-card-info">
                  <div><span className="leave-summary-label">Available </span><span className="leave-summary-value">{item.available}</span></div>
                  <div><span className="leave-summary-label">Booked </span><span className="leave-summary-value">{item.booked}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="leave-summary-table-section">
            <h3>{isAdmin || designation.toLowerCase().includes('manager') ? "All Employees' Leaves" : "My Leaves"}</h3>
            {loading ? (
              <div className="leave-summary-no-records">
                <div className="leave-summary-no-records-image">
                  <div className="leave-summary-image-placeholder">⏳</div>
                </div>
                <div className="leave-summary-no-records-text">Loading...</div>
              </div>
            ) : error ? (
              <div className="leave-summary-no-records">
                <div className="leave-summary-no-records-image">
                  <div className="leave-summary-image-placeholder">⚠️</div>
                </div>
                <div className="leave-summary-no-records-text">{error}</div>
              </div>
            ) : upcomingLeaves.length > 0 ? (
              <div className="leave-summary-table-scroll-container">
                <table className="leave-summary-table">
                  <thead className="leave-summary-table-header">
                    <tr>
                      {isAdmin && <th className="leave-summary-header-cell">System ID</th>}
                      <th className="leave-summary-header-cell">Candidate ID</th>
                      <th className="leave-summary-header-cell">Name</th>
                      <th className="leave-summary-header-cell">Leave Type</th>
                      <th className="leave-summary-header-cell">Duration</th>
                      <th className="leave-summary-header-cell">Start Date</th>
                      <th className="leave-summary-header-cell">End Date</th>
                      <th className="leave-summary-header-cell">Email Address</th>
                      <th className="leave-summary-header-cell">Reason</th>
                      <th className="leave-summary-header-cell">Status</th>
                      <th className="leave-summary-header-cell">Approved By</th>
                      {(showActions || isAdmin) && <th className="leave-summary-header-cell leave-summary-actions-cell">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="leave-summary-table-body">
                    {upcomingLeaves
                      .filter(leave => !generalSettings && isAdmin ? true : (generalSettings ? (isAdmin || designation.toLowerCase().includes('manager') || leave.teamEmail === userEmail) : leave.teamEmail === userEmail))
                      .map((leave, index) => {
                        const employee = employeeData[leave.employeeId] || {};
                        return (
                          <tr className="leave-summary-table-row" key={leave._id || index}>
                            {isAdmin && (
                              <td className="leave-summary-table-cell">
                                <div className="leave-summary-cell-content" title={employee.employeeId}>
                                  {employee.employeeId}
                                </div>
                              </td>
                            )}
                            <td className="leave-summary-table-cell">
                              <div className="leave-summary-cell-content" title={employee.candidateId || employee.employeeId}>
                                {employee.candidateId ? `${employee.candidateId}` : employee.employeeId ? `${employee.employeeId}` : 'N/A'}
                              </div>
                            </td>
                            <td className="leave-summary-table-cell">
                              <div className="leave-summary-cell-content" title={leave.name}>
                                {leave.name}
                              </div>
                            </td>
                            <td className="leave-summary-table-cell">
                              <div className="leave-summary-cell-content" title={leave.leaveType}>
                                {leave.leaveType}
                              </div>
                            </td>
                            <td className="leave-summary-table-cell">
                              <div className="leave-summary-cell-content" title={leave.duration}>
                                {leave.duration}
                              </div>
                            </td>
                            <td className="leave-summary-table-cell">
                              <div className="leave-summary-cell-content" title={new Date(leave.startDate).toLocaleDateString()}>
                                {new Date(leave.startDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="leave-summary-table-cell">
                              <div className="leave-summary-cell-content" title={new Date(leave.endDate).toLocaleDateString()}>
                                {new Date(leave.endDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="leave-summary-table-cell">
                              <div className="leave-summary-cell-content" title={leave.teamEmail}>
                                {leave.teamEmail}
                              </div>
                            </td>
                            <td className="leave-summary-table-cell">
                              <div className="leave-summary-cell-content" title={leave.reason}>
                                {leave.reason}
                              </div>
                            </td>
                            <td className="leave-summary-table-cell">
                              <span className="leave-summary-status-badge" style={getStatusColor(leave.status)}>
                                {leave.status}
                              </span>
                            </td>
                            <td className="leave-summary-table-cell">
                              <div className="leave-summary-cell-content" title={leave.approvedBy || 'Awaiting Approval'}>
                                {leave.status === 'Pending' ? 'Awaiting Approval' : leave.approvedBy || 'Awaiting Approval'}
                              </div>
                            </td>
                            {(showActions || isAdmin) && (
                              <td className="leave-summary-table-cell leave-summary-actions-cell">
                                <div className="leave-summary-action-buttons">
                                  <button
                                    className="leave-summary-action-btn"
                                    onClick={(e) => handleActionClick(index, e)}
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
              </div>
            ) : (
              <div className="leave-summary-no-records">
                <div className="leave-summary-no-records-image">
                  <div className="leave-summary-image-placeholder">👥</div>
                </div>
                <div className="leave-summary-no-records-text">No upcoming leaves</div>
              </div>
            )}
          </div>

          {(showActions || isAdmin) && dropdownIndex !== null && (
            <div
              className="leave-summary-floating-action-dropdown"
              style={{ position: "absolute", top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
              ref={dropdownRef}
            >
              <div className="leave-summary-action-option" onClick={(e) => handleEdit(dropdownIndex, e)}>Edit</div>
              {editIndex === dropdownIndex && (
                <div className="leave-summary-floating-edit-status-options">
                  {["Pending", "Approved", "Rejected"].map((status) => (
                    <div 
                      key={status} 
                      className="leave-summary-status-option" 
                      style={{ color: status === "Pending" ? "#f59e0b" : status === "Approved" ? "#10b981" : "#ef4444" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(upcomingLeaves[dropdownIndex]._id, status);
                      }}
                    >
                      {status}
                    </div>
                  ))}
                </div>
              )}
              <div className="leave-summary-action-option leave-summary-delete-option" onClick={(e) => handleDeleteRequest(upcomingLeaves[dropdownIndex]._id, e)}>
                Delete
              </div>
            </div>
          )}

          {confirmDeleteLeaveId && (
            <div className="leave-summary-modal-overlay">
              <div className="leave-summary-modal-content" ref={modalRef}>
                <img src={warningIcon} alt="warning" className="leave-summary-warning-icon" />
                <h3>DELETE CONFIRMATION</h3>
                <p>Are you sure you want to delete?</p>
                <div className="leave-summary-modal-actions">
                  <button className="leave-summary-cancel-btn" onClick={handleCancelDelete}>Cancel</button>
                  <button className="leave-summary-confirm-btn" onClick={handleConfirmDelete}>Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </LeavePageLayout>
    </div>
  );
};

export default LeaveSummary;