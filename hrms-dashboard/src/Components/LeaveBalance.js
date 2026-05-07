import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LeavePageLayout from "./LeavePageLayout";
import LeaveTrackerNavbar from "../pages/LeaveTrackerNavbar";
import "./LeaveBalance.css";
import axios from "axios";

const initialLeaveData = [
  { type: "Casual Leave", available: 0, booked: 0, icon: "🌊", color: "#e0e7ff" },
  { type: "Paid Leave", available: 0, booked: 0, icon: "⏱️", color: "#d1fae5" },
  { type: "Unpaid Leave", available: 0, booked: 0, icon: "🌅", color: "#ffe4e6" },
  { type: "Paternity Leave", available: 0, booked: 0, icon: "🍼", color: "#fef9c3" },
  { type: "Sabbatical Leave", available: 0, booked: 0, icon: "🔄", color: "#fef3c7" },
  { type: "Sick Leave", available: 0, booked: 0, icon: "🩺", color: "#ede9fe" },
];

const LeaveBalance = ({ isNested }) => {
  const navigate = useNavigate();
  const [leaveData, setLeaveData] = useState(initialLeaveData);
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [dateOfJoining, setDateOfJoining] = useState(null);
  const [lastProcessedMonth, setLastProcessedMonth] = useState(null);
  const [lastProcessedYear, setLastProcessedYear] = useState(null);

  const handleApplyLeave = () => {
    navigate("/applyleave");
  };

  useEffect(() => {
    const fetchUserData = () => {
      try {
        const stored = localStorage.getItem("userData");
        if (stored) {
          const parsed = JSON.parse(stored);
          setIsAdmin(parsed.role === "Admin");
          setUserEmail(parsed.email);
          setUserName(parsed.name);
        }
      } catch {
        setIsAdmin(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, settingsRes, leaveTypesRes] = await Promise.all([
          axios.get('http://localhost:8000/api/users/profile'),
          axios.get('http://localhost:8000/api/leave/general-settings').catch(() => null),
          axios.get('http://localhost:8000/api/leave-types'),
        ]);

        // Set companyId first to ensure it's available
        const fetchedCompanyId = profileRes.data.companyId || '';
        setCompanyId(fetchedCompanyId);

        // Filter leave types by companyId
        const leaveTypesResFilterByComId = leaveTypesRes.data.filter(type => type.companyId === fetchedCompanyId);
        console.log(leaveTypesResFilterByComId);

        setCompanyName(profileRes.data.companyName || '');
        setDesignation(profileRes.data.designation || '');
        setDepartment(profileRes.data.department || '');
        setHrmsRole(profileRes.data.hrmsRole || '');
        setGender(profileRes.data.gender || '');
        setMaritalStatus(profileRes.data.maritalStatus || '');
        setDateOfJoining(profileRes.data.dateOfJoining || null);
        setGeneralSettings(settingsRes?.data || null);
        setLeaveTypes(leaveTypesResFilterByComId || []);
      } catch (err) {
        console.error('Error:', err.response || err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update lastProcessedMonth and lastProcessedYear when necessary
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-based (0 = January, 11 = December)
    const currentYear = currentDate.getFullYear();

    if (lastProcessedMonth !== currentMonth || lastProcessedYear !== currentYear) {
      setLastProcessedMonth(currentMonth);
      setLastProcessedYear(currentYear);
    }
  }, [lastProcessedMonth, lastProcessedYear]);

  // Fetch leaves data
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        let leavesRes;
        if (isAdmin || (generalSettings && designation.toLowerCase().includes('manager'))) {
          leavesRes = await axios.get("http://localhost:8000/api/leaves");
        } else if (!generalSettings && isAdmin) {
          leavesRes = await axios.get("http://localhost:8000/api/leaves");
        } else {
          leavesRes = await axios.get(`http://localhost:8000/api/leaves?email=${userEmail}`);
        }
        setUpcomingLeaves(leavesRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching leave data", err);
        setError("Failed to fetch leave data.");
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [isAdmin, userEmail, generalSettings, designation]);

  // Compute adjusted leave data
  useEffect(() => {
    const computeLeaveData = () => {
      const leaveTypeMap = {
        "Casual Leave": 0,
        "Paid Leave": 0,
        "Sick Leave": 0,
        "Unpaid Leave": 0,
        "Paternity Leave": 0,
        "Sabbatical Leave": 0
      };

      // Match leave types with user profile
      const matchedLeaveTypes = leaveTypes.filter(leaveType => 
        leaveType.departments.includes(department) &&
        leaveType.designations.includes(designation) &&
        leaveType.userRole.includes(hrmsRole) &&
        leaveType.gender.includes(gender) &&
        leaveType.maritalStatus.includes(maritalStatus)
      );

      // Define currentMonth and currentYear
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth(); // 0-based (0 = January, 11 = December)
      const currentYear = currentDate.getFullYear();

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
          color: "#e0e7ff" // Default color for new leave types
        }));

      return [...updatedLeaveData, ...newLeaveTypes];
    };

    if (!loading) {
      setLeaveData(computeLeaveData());
    }
  }, [loading, upcomingLeaves, leaveTypes, designation, department, hrmsRole, gender, maritalStatus, generalSettings, isAdmin, userEmail, lastProcessedMonth, lastProcessedYear]);

  return (
    <div>
      {!isNested && <LeaveTrackerNavbar />}
      <LeavePageLayout>
        <div className="leavebalance-container">
          {error && <div style={{ color: "red" }}>{error}</div>}
          {leaveData.length === 0 ? (
            <div className="leavebalance-no-data">
              <p>No leave type available</p>
            </div>
          ) : (
            leaveData.map((leave, index) => (
              <div key={index} className="leavebalance-card">
                <div className="leavebalance-left">
                  <div
                    className="leavebalance-icon"
                    style={{ backgroundColor: leave.color }}
                  >
                    {leave.icon}
                  </div>
                  <div className="leavebalance-title">{leave.type}</div>
                </div>
                <div className="leavebalance-right">
                  <div className="leavebalance-stats">
                    <div className="leavebalance-stat">
                      <div className="leavebalance-label">Available</div>
                      <div className="leavebalance-value">
                        {leave.available} {leave.available === 1 ? "day" : "days"}
                      </div>
                    </div>
                    <div className="leavebalance-stat">
                      <div className="leavebalance-label">Booked</div>
                      <div className="leavebalance-value">
                        {leave.booked} {leave.booked === 1 ? "day" : "days"}
                      </div>
                    </div>
                  </div>
                  <button
                    className="leavebalance-applybtn"
                    onClick={handleApplyLeave}
                  >
                    Apply Leave
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </LeavePageLayout>
    </div>
  );
};

export default LeaveBalance;