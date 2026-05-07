import React, { useEffect, useState } from 'react';
import './AttendancePage.css';
import AttendanceNavbar from "../pages/AttendanceNavbar";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AttendancePage = () => {
  const navigate = useNavigate();
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    halfDay: 0
  });
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const toggleMonthDropdown = () => {
    setShowMonthDropdown(!showMonthDropdown);
    setShowYearDropdown(false);
  };

  const toggleYearDropdown = () => {
    setShowYearDropdown(!showYearDropdown);
    setShowMonthDropdown(false);
  };

  const selectMonth = (monthIndex) => {
    setSelectedMonth(monthIndex);
    setShowMonthDropdown(false);
  };

  const selectYear = (year) => {
    setSelectedYear(year);
    setShowYearDropdown(false);
  };

  const openEmployeeModal = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
  };

  const closeEmployeeModal = () => {
    setShowEmployeeModal(false);
    setSelectedEmployee(null);
  };

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      const userData = response.data;
      const extractedCompanyId = userData.companyId ? userData.companyId.split('-')[0] : '';
      setCompanyId(extractedCompanyId);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setCompanyId('');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        if (parsedData?.role === 'Admin') setIsAdmin(true);
      } catch (err) {
        console.error('Error parsing userData:', err);
        setError('Invalid user data. Please log in again.');
      }
    } else {
      setError('Please log in to view attendance data.');
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const userData = localStorage.getItem('userData');
        let token = '';
        let companyId = '';
        if (userData) {
          try {
            const parsedData = JSON.parse(userData);
            token = parsedData?.token || '';
            companyId = parsedData?.companyId || '';
          } catch (err) {
            console.error('Error parsing userData:', err);
            setError('Invalid user data. Please log in again.');
            return;
          }
        } else {
          setError('Please log in to view attendance data.');
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const employeesRes = await axios.get('http://localhost:8000/api/users', config);
        setEmployees(employeesRes.data.data || employeesRes.data);

        const holidayRes = await axios.get('http://localhost:8000/api/holidays');

        const filteredHolidays = companyId
        ? holidayRes.data.filter(holiday => holiday.companyId === companyId)
        : [];
        
        setHolidays(filteredHolidays);

        const leavesRes = await axios.get('http://localhost:8000/api/leaves');
        setUpcomingLeaves(leavesRes.data);

        const startDate = new Date(selectedYear, selectedMonth, 1);
        const endDate = new Date(selectedYear, selectedMonth + 1, 0);
        const attendanceRes = await axios.get(
          `http://localhost:8000/api/attendance/all?start=${startDate.toISOString()}&end=${endDate.toISOString()}`, config
        );
        setAttendanceData(attendanceRes.data);

        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        let leaveCount = 0;
        let halfDayCount = 0;

        attendanceRes.data.forEach(record => {
          record.sessions.forEach(session => {
            if (session.attendanceType === 'present') presentCount++;
            else if (session.attendanceType === 'absent') absentCount++;
            else if (session.attendanceType === 'late') lateCount++;
            else if (session.attendanceType === 'leave') leaveCount++;
            else if (session.attendanceType === 'firstHalf' || session.attendanceType === 'secondHalf') halfDayCount++;
          });
        });

        setSummary({
          present: presentCount,
          absent: absentCount > 0 ? absentCount : 0,
          late: lateCount,
          leave: leaveCount,
          halfDay: halfDayCount
        });

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch attendance data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear]);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Calculate days to include based on current date
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  let daysToInclude;
  if (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)) {
    daysToInclude = daysInMonth;
  } else if (selectedYear === currentYear && selectedMonth === currentMonth) {
    daysToInclude = currentDay;
  } else {
    daysToInclude = 0;
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = searchTerm
      ? emp.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesCompany = companyId ? emp.employeeId?.startsWith(companyId) : true;
    return matchesSearch && matchesCompany;
  });

  const mergedData = isAdmin
    ? filteredEmployees.map(emp => {
        const empAttendance = attendanceData.filter(a => a?.user?._id === emp._id);
        const empLeaves = upcomingLeaves.filter(l => l.teamEmail === emp.email && l.status === 'Approved');
        const attendanceStatus = Array(daysInMonth).fill('absent');

        holidays.forEach(holiday => {
          const holidayDate = new Date(holiday.date);
          const holidayDay = holidayDate.getDate();
          const holidayMonth = holidayDate.getMonth();
          const holidayYear = holidayDate.getFullYear();
          if (
            holidayYear === selectedYear &&
            holidayMonth === selectedMonth &&
            holidayDay >= 1 &&
            holidayDay <= daysInMonth
          ) {
            attendanceStatus[holidayDay - 1] = 'holiday';
          }
        });

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(selectedYear, selectedMonth, day);
          if (date.getDay() === 0 || date.getDay() === 6) {
            attendanceStatus[day - 1] = 'holiday';
          }
        }

        empLeaves.forEach(leave => {
          const startDate = new Date(leave.startDate);
          const endDate = new Date(leave.endDate);
          const startDay = startDate.getDate();
          const startMonth = startDate.getMonth();
          const startYear = startDate.getFullYear();
          const endDay = endDate.getDate();
          const endMonth = endDate.getMonth();
          const endYear = endDate.getFullYear();
          if (
            (startYear < selectedYear || (startYear === selectedYear && startMonth <= selectedMonth)) &&
            (endYear > selectedYear || (endYear === selectedYear && endMonth >= selectedMonth))
          ) {
            const start = startYear === selectedYear && startMonth === selectedMonth ? startDay : 1;
            const end = endYear === selectedYear && endMonth === selectedMonth ? Math.min(endDay, daysInMonth) : daysInMonth;
            for (let day = start; day <= end; day++) {
              if (attendanceStatus[day - 1] !== 'holiday') {
                if (leave.leaveType === 'Unpaid Leave') {
                  attendanceStatus[day - 1] = 'unpaidLeave';
                } else if (leave.duration === 'First Half') {
                  attendanceStatus[day - 1] = `${leave.leaveType.toLowerCase().replace(/\s+/g, '-')}-firstHalf`;
                } else if (leave.duration === 'Second Half') {
                  attendanceStatus[day - 1] = `${leave.leaveType.toLowerCase().replace(/\s+/g, '-')}-secondHalf`;
                } else {
                  attendanceStatus[day - 1] = `${leave.leaveType.toLowerCase().replace(/\s+/g, '-')}`;
                }
              }
            }
          }
        });

        empAttendance.forEach(record => {
          const day = new Date(record.date).getDate();
          if (day >= 1 && day <= daysInMonth) {
            const sessions = record.sessions || [];
            if (sessions.length > 0) {
              let status = sessions[0].attendanceType || 'present';
              if (sessions[0].checkIn?.lateMark && sessions[0].attendanceType === "present") {
                status = 'late';
              }
              if (sessions[0].checkIn?.lateMark && sessions[0].attendanceType === "firstHalf") {
                status = 'late-firstHalf';
              }
              if (sessions[0].checkIn?.lateMark && sessions[0].attendanceType === "secondHalf") {
                status = 'late-secondHalf';
              }
              if (
                attendanceStatus[day - 1] !== 'holiday' &&
                !attendanceStatus[day - 1].startsWith('leave-') &&
                attendanceStatus[day - 1] !== 'unpaidLeave'
              ) {
                attendanceStatus[day - 1] = status;
              }
            }
          }
        });

        return {
          ...emp,
          attendanceStatus
        };
      })
    : filteredEmployees
        .filter(emp => {
          const userData = JSON.parse(localStorage.getItem('userData'));
          return emp._id === userData?._id && emp.role === 'Employee';
        })
        .map(emp => {
          const empAttendance = attendanceData.filter(a => a?.user?._id === emp._id);
          const empLeaves = upcomingLeaves.filter(l => l.teamEmail === emp.email && l.status === 'Approved');

          console.log(empLeaves);

          const attendanceStatus = Array(daysInMonth).fill('absent');

          holidays.forEach(holiday => {
            const holidayDate = new Date(holiday.date);
            const holidayDay = holidayDate.getDate();
            const holidayMonth = holidayDate.getMonth();
            const holidayYear = holidayDate.getFullYear();
            if (
              holidayYear === selectedYear &&
              holidayMonth === selectedMonth &&
              holidayDay >= 1 &&
              holidayDay <= daysInMonth
            ) {
              attendanceStatus[holidayDay - 1] = 'holiday';
            }
          });

          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(selectedYear, selectedMonth, day);
            if (date.getDay() === 0 || date.getDay() === 6) {
              attendanceStatus[day - 1] = 'holiday';
            }
          }

          empLeaves.forEach(leave => {
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            const startDay = startDate.getDate();
            const startMonth = startDate.getMonth();
            const startYear = startDate.getFullYear();
            const endDay = endDate.getDate();
            const endMonth = endDate.getMonth();
            const endYear = endDate.getFullYear();
            if (
              (startYear < selectedYear || (startYear === selectedYear && startMonth <= selectedMonth)) &&
              (endYear > selectedYear || (endYear === selectedYear && endMonth >= selectedMonth))
            ) {
              const start = startYear === selectedYear && startMonth === selectedMonth ? startDay : 1;
              const end = endYear === selectedYear && endMonth === selectedMonth ? Math.min(endDay, daysInMonth) : daysInMonth;
              for (let day = start; day <= end; day++) {
                if (attendanceStatus[day - 1] !== 'holiday') {
                  if (leave.leaveType === 'Unpaid Leave') {
                    attendanceStatus[day - 1] = 'unpaidLeave';
                  } else if (leave.duration === 'First Half') {
                    attendanceStatus[day - 1] = `${leave.leaveType.toLowerCase().replace(/\s+/g, '-')}-firstHalf`;
                  } else if (leave.duration === 'Second Half') {
                    attendanceStatus[day - 1] = `${leave.leaveType.toLowerCase().replace(/\s+/g, '-')}-secondHalf`;
                  } else {
                    attendanceStatus[day - 1] = `${leave.leaveType.toLowerCase().replace(/\s+/g, '-')}`;
                  }
                }
              }
            }
          });

          empAttendance.forEach(record => {
            const day = new Date(record.date).getDate();
            if (day >= 1 && day <= daysInMonth) {
              const sessions = record.sessions || [];
              if (sessions.length > 0) {
                let status = sessions[0].attendanceType || 'present';
                if (sessions[0].checkIn?.lateMark && sessions[0].attendanceType === "present") {
                  status = 'late';
                }
                if (sessions[0].checkIn?.lateMark && sessions[0].attendanceType === "firstHalf") {
                  status = 'late-firstHalf';
                }
                if (sessions[0].checkIn?.lateMark && sessions[0].attendanceType === "secondHalf") {
                  status = 'late-secondHalf';
                }
                if (
                  attendanceStatus[day - 1] !== 'holiday' &&
                  !attendanceStatus[day - 1].startsWith('leave-') &&
                  attendanceStatus[day - 1] !== 'unpaidLeave'
                ) {
                  attendanceStatus[day - 1] = status;
                }
              }
            }
          });

          return {
            ...emp,
            attendanceStatus
          };
        });

  const getStatusIcon = (status) => {
    if (status === 'present') return '✔';
    if (status === 'absent') return '✕';
    if (status === 'holiday') return '★';
    if (
      status === 'firstHalf' ||
      status === 'secondHalf' ||
      status.includes('leave-') && (status.includes('firstHalf') || status.includes('secondHalf'))
    ) return '½';
    if (
      status === 'late' ||
      status === 'late-firstHalf' ||
      status === 'late-secondHalf'
    ) return '!';
    if (
      status.startsWith('sick-leave') ||
      status.startsWith('casual-leave') ||
      status.startsWith('paid-leave') ||
      status.startsWith('paternity-leave') ||
      status.startsWith('sabbatical-leave') ||
      status === 'unpaidLeave'
    ) return '≉';
    return '✕';
  };

  const countStatuses = (attendanceStatus) => {
    const counts = {
      present: 0,
      absent: 0,
      holiday: 0,
      halfDay: 0,
      late: 0,
      sickLeave: 0,
      casualLeave: 0,
      paidLeave: 0,
      paternityLeave: 0,
      sabbaticalLeave: 0,
      unpaidLeave: 0
    };

    attendanceStatus.forEach((status, index) => {
      const day = index + 1;
      const record = attendanceData.find(a => {
        const date = new Date(a.date);
        return (
          date.getFullYear() === selectedYear &&
          date.getMonth() === selectedMonth &&
          date.getDate() === day &&
          a.user?._id === (selectedEmployee ? selectedEmployee._id : null)
        );
      });

      if (status === 'present') {
        counts.present++;
      } else if (status === 'absent') {
        counts.absent++;
      } else if (status === 'holiday') {
        counts.holiday++;
      } else if (
        status === 'firstHalf' ||
        status === 'secondHalf' ||
        status === 'late-firstHalf' ||
        status === 'late-secondHalf'
      ) {
        counts.halfDay++;
        if (status === 'late-firstHalf' || status === 'late-secondHalf') {
          counts.late++;
        }
      } else if (status === 'late') {
        counts.late++;
        if (record && record.sessions?.length > 0 && record.sessions[0].attendanceType === 'present') {
          counts.present++;
        }
      } else if (status === 'unpaidLeave') {
        counts.unpaidLeave++;
        if (record && record.sessions?.length > 0) {
          const attendanceType = record.sessions[0].attendanceType;
          if (attendanceType === 'firstHalf' || attendanceType === 'secondHalf') {
            counts.halfDay++;
          }
        }
      } else if (status.startsWith('sick-leave')) {
        counts.sickLeave++;
        if (status.includes('firstHalf') || status.includes('secondHalf')) {
          counts.halfDay++;
        }
      } else if (status.startsWith('casual-leave')) {
        counts.casualLeave++;
        if (status.includes('firstHalf') || status.includes('secondHalf')) {
          counts.halfDay++;
        }
      } else if (status.startsWith('paid-leave')) {
        counts.paidLeave++;
        if (status.includes('firstHalf') || status.includes('secondHalf')) {
          counts.halfDay++;
        }
      } else if (status.startsWith('paternity-leave')) {
        counts.paternityLeave++;
        if (status.includes('firstHalf') || status.includes('secondHalf')) {
          counts.halfDay++;
        }
      } else if (status.startsWith('sabbatical-leave')) {
        counts.sabbaticalLeave++;
        if (status.includes('firstHalf') || status.includes('secondHalf')) {
          counts.halfDay++;
        }
      }
    });

    counts.leave =
      counts.sickLeave +
      counts.casualLeave +
      counts.paidLeave +
      counts.paternityLeave +
      counts.sabbaticalLeave +
      counts.unpaidLeave;

    return counts;
  };

  const formatStatusForTooltip = (status) => {
    if (status === 'unpaidLeave') {
      return 'Unpaid Leave';
    }
    if (status.startsWith('leave-')) {
      const leaveType = status.replace('leave-', '').replace(/-/g, ' ');
      return leaveType
        .split(' ')
        .map(word => {
          if (word === 'firsthalf') return 'First Half';
          if (word === 'secondhalf') return 'Second Half';
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
    }
    return status
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => {
        if (word === 'firsthalf') return 'First Half';
        if (word === 'secondhalf') return 'Second Half';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  // Add this to your component's useEffect
useEffect(() => {
  const handleResize = () => {
    // Force re-render on orientation change
    setShowMonthDropdown(false);
    setShowYearDropdown(false);
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
  };
}, []);
  return (
    <div className="attendance-page-app">
      <AttendanceNavbar />
      <div className="attendance-page-container">
        <div className="attendance-page-header">
          <div className={isAdmin ? "attendance-page-controls" : "attendance-page-controls-emp"}>
            {isAdmin && (
              <div className="attendance-page-search-container">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="attendance-page-search-input"
                />
                <svg className="attendance-page-search-icon" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </div>
            )}
            <div className="attendance-page-date-selectors">
              <div className="attendance-page-dropdown-container">
                <button className="attendance-page-dropdown-button" onClick={toggleMonthDropdown}>
                  {months[selectedMonth]}
                  <svg className="attendance-page-dropdown-icon" viewBox="0 0 24 24">
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </button>
                {showMonthDropdown && (
                  <div className="attendance-page-dropdown-menu">
                    {months.map((month, index) => (
                      <div
                        key={month}
                        className="attendance-page-dropdown-item"
                        onClick={() => selectMonth(index)}
                      >
                        {month}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="attendance-page-dropdown-container">
                <button className="attendance-page-dropdown-button" onClick={toggleYearDropdown}>
                  {selectedYear}
                  <svg className="attendance-page-dropdown-icon" viewBox="0 0 24 24">
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </button>
                {showYearDropdown && (
                  <div className="attendance-page-dropdown-menu">
                    {years.map(year => (
                      <div
                        key={year}
                        className="attendance-page-dropdown-item"
                        onClick={() => selectYear(year)}
                      >
                        {year}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="attendance-page-summary-cards">
            <div className="attendance-page-summary-card attendance-page-present-card">
              <div className="attendance-page-card-icon">✔</div>
              <div className="attendance-page-card-info">
                <span className="attendance-page-card-count">
                  {mergedData.reduce((count, emp) => {
                    const today = new Date().getDate();
                    const status = emp.attendanceStatus[today - 1];
                    const record = attendanceData.find(a => {
                      const date = new Date(a.date);
                      return (
                        date.getFullYear() === selectedYear &&
                        date.getMonth() === selectedMonth &&
                        date.getDate() === today &&
                        a.user?._id === emp._id
                      );
                    });
                    return count + ((status === 'present' || (status === 'late' && record && record.sessions?.length > 0 && record.sessions[0].attendanceType === 'present')) ? 1 : 0);
                  }, 0)}
                </span>
                <span className="attendance-page-card-title">Present</span>
              </div>
            </div>
            <div className="attendance-page-summary-card attendance-page-absent-card">
              <div className="attendance-page-card-icon">✕</div>
              <div className="attendance-page-card-info">
                <span className="attendance-page-card-count">
                  {mergedData.reduce((count, emp) => {
                    const today = new Date().getDate();
                    const status = emp.attendanceStatus[today - 1];
                    return count + (status === 'absent' ? 1 : 0);
                  }, 0)}
                </span>
                <span className="attendance-page-card-title">Absent</span>
              </div>
            </div>
            <div className="attendance-page-summary-card attendance-page-late-card">
              <div className="attendance-page-card-icon">!</div>
              <div className="attendance-page-card-info">
                <span className="attendance-page-card-count">
                  {mergedData.reduce((count, emp) => {
                    const today = new Date().getDate();
                    const status = emp.attendanceStatus[today - 1];
                    return count + (status === 'late' || status === 'late-firstHalf' || status === 'late-secondHalf' ? 1 : 0);
                  }, 0)}
                </span>
                <span className="attendance-page-card-title">Late</span>
              </div>
            </div>
            <div className="attendance-page-summary-card attendance-page-leave-card">
              <div className="attendance-page-card-icon">≉</div>
              <div className="attendance-page-card-info">
                <span className="attendance-page-card-count">
                  {mergedData.reduce((count, emp) => {
                    const today = new Date().getDate();
                    const status = emp.attendanceStatus[today - 1];
                    return count + (
                      status === 'sick-leave' ||
                      status === 'casual-leave' ||
                      status === 'paid-leave' ||
                      status === 'paternity-leave' ||
                      status === 'sabbatical-leave' ||
                      status === 'sick-leave-firstHalf' ||
                      status === 'sick-leave-secondHalf' ||
                      status === 'casual-leave-firstHalf' ||
                      status === 'casual-leave-secondHalf' ||
                      status === 'paid-leave-firstHalf' ||
                      status === 'paid-leave-secondHalf' ||
                      status === 'paternity-leave-firstHalf' ||
                      status === 'paternity-leave-secondHalf' ||
                      status === 'sabbatical-leave-firstHalf' ||
                      status === 'sabbatical-leave-secondHalf' ||
                      status === 'unpaidLeave' ? 1 : 0
                    );
                  }, 0)}
                </span>
                <span className="attendance-page-card-title">Leave</span>
              </div>
            </div>
            <div className="attendance-page-summary-card attendance-page-halfday-card">
              <div className="attendance-page-card-icon">½</div>
              <div className="attendance-page-card-info">
                <span className="attendance-page-card-count">
                  {mergedData.reduce((count, emp) => {
                    const today = new Date().getDate();
                    const status = emp.attendanceStatus[today - 1];
                    if (
                      status === 'firstHalf' ||
                      status === 'secondHalf' ||
                      status === 'late-firstHalf' ||
                      status === 'late-secondHalf' ||
                      status === 'sick-leave-firstHalf' ||
                      status === 'sick-leave-secondHalf' ||
                      status === 'casual-leave-firstHalf' ||
                      status === 'casual-leave-secondHalf' ||
                      status === 'paid-leave-firstHalf' ||
                      status === 'paid-leave-secondHalf' ||
                      status === 'paternity-leave-firstHalf' ||
                      status === 'paternity-leave-secondHalf' ||
                      status === 'sabbatical-leave-firstHalf' ||
                      status === 'sabbatical-leave-secondHalf'
                    ) {
                      return count + 1;
                    }
                    if (status === 'unpaidLeave') {
                      const record = attendanceData.find(a => {
                        const date = new Date(a.date);
                        return (
                          date.getFullYear() === selectedYear &&
                          date.getMonth() === selectedMonth &&
                          date.getDate() === today &&
                          a.user?._id === emp._id
                        );
                      });
                      if (record && record.sessions?.length > 0) {
                        const attendanceType = record.sessions[0].attendanceType;
                        if (attendanceType === 'firstHalf' || attendanceType === 'secondHalf') {
                          return count + 1;
                        }
                      }
                    }
                    return count;
                  }, 0)}
                </span>
                <span className="attendance-page-card-title">Half Day</span>
              </div>
            </div>
          </div>
        )}
        <div className="attendance-page-legend">
          <div className="attendance-page-legend-item">
            <span className="attendance-page-legend-icon attendance-page-present">✔</span>
            <span className="attendance-page-legend-label">Present</span>
          </div>
          <div className="attendance-page-legend-item">
            <span className="attendance-page-legend-icon attendance-page-absent">✕</span>
            <span className="attendance-page-legend-label">Absent</span>
          </div>
          <div className="attendance-page-legend-item">
            <span className="attendance-page-legend-icon attendance-page-holiday">★</span>
            <span className="attendance-page-legend-label">Holiday/Weekend</span>
          </div>
          <div className="attendance-page-legend-item">
            <span className="attendance-page-legend-icon attendance-page-halfday">½</span>
            <span className="attendance-page-legend-label">Half Day</span>
          </div>
          <div className="attendance-page-legend-item">
            <span className="attendance-page-legend-icon attendance-page-late">!</span>
            <span className="attendance-page-legend-label">Late</span>
          </div>
          <div className="attendance-page-legend-item">
            <span className="attendance-page-legend-icon attendance-page-leave">≉</span>
            <span className="attendance-page-legend-label">Leave</span>
          </div>
        </div>
        <div className="attendance-page-table-container">
          <div className="attendance-page-table-scroll-wrapper">
            <table className="attendance-page-table">
              <thead>
                <tr>
                  <th className="attendance-page-employee-col">Employee</th>
                  {daysArray.map(day => {
                    const date = new Date(selectedYear, selectedMonth, day);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    return (
                      <th
                        key={day}
                        className={`attendance-page-day-col ${isWeekend ? 'attendance-page-weekend' : ''}`}
                      >
                        <div className="attendance-page-day-number">{day}</div>
                        <div className="attendance-page-day-name">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </th>
                    );
                  })}
                  <th className="attendance-page-total-col">Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={daysArray.length + 2} className="attendance-page-loading">
                      Loading attendance data...
                    </td>
                  </tr>
                ) : mergedData.length > 0 ? (
                  mergedData.map(employee => {
                    // Get employee's creation date
                    const createdAt = new Date(employee.createdAt);
                    const createdYear = createdAt.getFullYear();
                    const createdMonth = createdAt.getMonth();
                    const createdDay = createdAt.getDate();

                    // Determine the start and end days for counting
                    let startDay, endDay;
                    const today = new Date();
                    const currentYear = today.getFullYear();
                    const currentMonth = today.getMonth();
                    const currentDay = today.getDate();

                    // If employee was created today, set presentCount based on attendanceType
                    if (
                      createdYear === currentYear &&
                      createdMonth === currentMonth &&
                      createdDay === currentDay
                    ) {
                      const relevantAttendance = employee.attendanceStatus.slice(currentDay - 1, currentDay);
                      const presentCount = relevantAttendance.reduce((count, status) => {
                        if (
                          status.startsWith('sick-leave') ||
                          status.startsWith('casual-leave') ||
                          status.startsWith('paid-leave') ||
                          status.startsWith('paternity-leave') ||
                          status.startsWith('sabbatical-leave')
                        ) {
                          if (status.includes('firstHalf') || status.includes('secondHalf')) {
                            return count + 0.5;
                          }
                          return count + 1;
                        }
                        if (status === 'unpaidLeave') {
                          const record = attendanceData.find(a => {
                            const date = new Date(a.date);
                            return (
                              date.getFullYear() === selectedYear &&
                              date.getMonth() === selectedMonth &&
                              date.getDate() === currentDay &&
                              a.user?._id === employee._id
                            );
                          });
                          if (record && record.sessions?.length > 0) {
                            const attendanceType = record.sessions[0].attendanceType;
                            if (attendanceType === 'firstHalf' || attendanceType === 'secondHalf') {
                              return count + 0.5;
                            }
                          }
                          return count;
                        }
                        if (
                          status === 'present' ||
                          status === 'late' ||
                          status === 'firstHalf' ||
                          status === 'secondHalf' ||
                          status === 'late-firstHalf' ||
                          status === 'late-secondHalf'
                        ) {
                          return count + (status.includes('firstHalf') || status.includes('secondHalf') ? 0.5 : 1);
                        }
                        return count;
                      }, 0).toFixed(1);

                      return (
                        <tr key={employee._id}>
                          <td className="attendance-page-employee-cell" onClick={() => openEmployeeModal(employee)}>
                            <div className="attendance-page-employee-info">
                              <img
                                src={
  employee.image || 
  `https://ui-avatars.com/api/?name=${
    employee.firstName && employee.lastName 
      ? `${employee.firstName}+${employee.lastName}` 
      : employee.fullname
  }&background=random`
}
                                alt={employee.fullname}
                                className="attendance-page-employee-avatar"
                              />
                              <div className="attendance-page-employee-details">
                              <div className="attendance-page-employee-name">
                              {employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.fullname}
                              </div>
                              <div className="attendance-page-employee-id">
                              {employee.candidateId ? `${employee.candidateId}` : employee.employeeId ? `${employee.employeeId}` : 'No ID'}
                              </div>
                                <div className="attendance-page-employee-department">{employee.department}</div>
                              </div>
                            </div>
                          </td>
                          {employee.attendanceStatus.map((status, index) => (
                            <td
                              key={index}
                              className={`attendance-page-status-cell attendance-page-${status}`}
                              title={formatStatusForTooltip(status)}
                            >
                              {getStatusIcon(status)}
                            </td>
                          ))}
                          <td className="attendance-page-total-cell">
                            <span className="attendance-page-total-count">{presentCount === "0.0" ? "0" : presentCount}</span>
                            <span className="attendance-page-total-days">/{daysInMonth}</span>
                          </td>
                        </tr>
                      );
                    }

                    // If selected month/year is before employee's creation, set presentCount to 0
                    if (
                      selectedYear < createdYear ||
                      (selectedYear === createdYear && selectedMonth < createdMonth)
                    ) {
                      return (
                        <tr key={employee._id}>
                          <td className="attendance-page-employee-cell" onClick={() => openEmployeeModal(employee)}>
                            <div className="attendance-page-employee-info">
                              <img
                                src={
  employee.image || 
  `https://ui-avatars.com/api/?name=${
    employee.firstName && employee.lastName 
      ? `${employee.firstName}+${employee.lastName}` 
      : employee.fullname
  }&background=random`
}
                                alt={employee.fullname}
                                className="attendance-page-employee-avatar"
                              />
                              <div className="attendance-page-employee-details">
                              <div className="attendance-page-employee-name">
                                {employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.fullname}
                              </div>
                              <div className="attendance-page-employee-id">
                                {employee.candidateId ? `${employee.candidateId}` : employee.employeeId ? `${employee.employeeId}` : 'No ID'}
                              </div>
                                <div className="attendance-page-employee-department">{employee.department}</div>
                              </div>
                            </div>
                          </td>
                          {employee.attendanceStatus.map((status, index) => (
                            <td
                              key={index}
                              className={`attendance-page-status-cell attendance-page-${status}`}
                              title={formatStatusForTooltip(status)}
                            >
                              {getStatusIcon(status)}
                            </td>
                          ))}
                          <td className="attendance-page-total-cell">
                            <span className="attendance-page-total-count">0</span>
                            <span className="attendance-page-total-days">/{daysInMonth}</span>
                          </td>
                        </tr>
                      );
                    }

                    // If selected month/year is in the future, set presentCount to 0
                    if (
                      selectedYear > currentYear ||
                      (selectedYear === currentYear && selectedMonth > currentMonth)
                    ) {
                      return (
                        <tr key={employee._id}>
                          <td className="attendance-page-employee-cell" onClick={() => openEmployeeModal(employee)}>
                            <div className="attendance-page-employee-info">
                              <img
                                src={
  employee.image || 
  `https://ui-avatars.com/api/?name=${
    employee.firstName && employee.lastName 
      ? `${employee.firstName}+${employee.lastName}` 
      : employee.fullname
  }&background=random`
}
                                alt={employee.fullname}
                                className="attendance-page-employee-avatar"
                              />
                              <div className="attendance-page-employee-details">
                              <div className="attendance-page-employee-name">
                                {employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.fullname}
                              </div>
                              <div className="attendance-page-employee-id">
                                {employee.candidateId ? `${employee.candidateId}` : employee.employeeId ? `${employee.employeeId}` : 'No ID'}
                              </div>
                                <div className="attendance-page-employee-department">{employee.department}</div>
                              </div>
                            </div>
                          </td>
                          {employee.attendanceStatus.map((status, index) => (
                            <td
                              key={index}
                              className={`attendance-page-status-cell attendance-page-${status}`}
                              title={formatStatusForTooltip(status)}
                            >
                              {getStatusIcon(status)}
                            </td>
                          ))}
                          <td className="attendance-page-total-cell">
                            <span className="attendance-page-total-count">0</span>
                            <span className="attendance-page-total-days">/{daysInMonth}</span>
                          </td>
                        </tr>
                      );
                    }

                    // Calculate start and end days
                    if (selectedYear === createdYear && selectedMonth === createdMonth) {
                      startDay = createdDay;
                    } else {
                      startDay = 1;
                    }

                    if (
                      selectedYear === currentYear &&
                      selectedMonth === currentMonth
                    ) {
                      endDay = currentDay;
                    } else {
                      endDay = daysInMonth;
                    }

                    // Slice attendanceStatus to include only relevant days for total count
                    const relevantAttendance = employee.attendanceStatus.slice(startDay - 1, endDay);
                    const presentCount = relevantAttendance.reduce((count, status, index) => {
                      const day = startDay + index;
                      const date = new Date(selectedYear, selectedMonth, day);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const isHoliday = holidays.some(holiday => {
                        const holidayDate = new Date(holiday.date);
                        return (
                          holidayDate.getFullYear() === selectedYear &&
                          holidayDate.getMonth() === selectedMonth &&
                          holidayDate.getDate() === day
                        );
                      });

                      if (status === 'unpaidLeave') {
                        const record = attendanceData.find(a => {
                          const date = new Date(a.date);
                          return (
                            date.getFullYear() === selectedYear &&
                            date.getMonth() === selectedMonth &&
                            date.getDate() === day &&
                            a.user?._id === employee._id
                          );
                        });
                        if (record && record.sessions?.length > 0) {
                          const attendanceType = record.sessions[0].attendanceType;
                          if (attendanceType === 'firstHalf' || attendanceType === 'secondHalf') {
                            return count + 0.5;
                          }
                        }
                        return count;
                      }

                      if (
                        status.startsWith('sick-leave') ||
                        status.startsWith('casual-leave') ||
                        status.startsWith('paid-leave') ||
                        status.startsWith('paternity-leave') ||
                        status.startsWith('sabbatical-leave')
                      ) {
                        if (status.includes('firstHalf') || status.includes('secondHalf')) {
                          return count + 0.5;
                        }
                        return count + 1;
                      }

                      if (status === 'present' || status === 'late' || status === 'holiday' || isWeekend || isHoliday) {
                        return count + 1;
                      } else if (
                        status === 'firstHalf' ||
                        status === 'secondHalf' ||
                        status === 'late-firstHalf' ||
                        status === 'late-secondHalf'
                      ) {
                        return count + 0.5;
                      }
                      return count;
                    }, 0).toFixed(1);

                    return (
                      <tr key={employee._id}>
                        <td className="attendance-page-employee-cell" onClick={() => openEmployeeModal(employee)}>
                          <div className="attendance-page-employee-info">
                            <img
                              src={
  employee.image || 
  `https://ui-avatars.com/api/?name=${
    employee.firstName && employee.lastName 
      ? `${employee.firstName}+${employee.lastName}` 
      : employee.fullname
  }&background=random`
}
                              alt={employee.fullname}
                              className="attendance-page-employee-avatar"
                            />
                            <div className="attendance-page-employee-details">
                            <div className="attendance-page-employee-name">
                              {employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.fullname}
                            </div>
                            <div className="attendance-page-employee-id">
                              {employee.candidateId ? `${employee.candidateId}` : employee.employeeId ? `${employee.employeeId}` : 'No ID'}
                            </div>
                              <div className="attendance-page-employee-department">{employee.department}</div>
                            </div>
                          </div>
                        </td>
                        {employee.attendanceStatus.map((status, index) => (
                          <td
                            key={index}
                            className={`attendance-page-status-cell attendance-page-${status}`}
                            title={formatStatusForTooltip(status)}
                          >
                            {getStatusIcon(status)}
                          </td>
                        ))}
                        <td className="attendance-page-total-cell">
                          <span className="attendance-page-total-count">{presentCount === "0.0" ? "0" : presentCount}</span>
                          <span className="attendance-page-total-days">/{daysInMonth}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={daysArray.length + 2} className="attendance-page-no-data">
                      No employee data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showEmployeeModal && selectedEmployee && (
        <div className="attendance-page-modal-overlay" onClick={closeEmployeeModal}>
          <div className="attendance-page-modal" onClick={e => e.stopPropagation()}>
            <div className="attendance-page-modal-header">
              <h3>Employee Attendance Details</h3>
              <button className="attendance-page-modal-close" onClick={closeEmployeeModal}>
                ×
              </button>
            </div>
            <div className="attendance-page-modal-content">
              <div className="attendance-page-modal-employee-info">
                <img
                 src={
                      selectedEmployee.image || 
                      `https://ui-avatars.com/api/?name=${
                        selectedEmployee.firstName && selectedEmployee.lastName 
                          ? `${selectedEmployee.firstName}+${selectedEmployee.lastName}` 
                          : selectedEmployee.fullname
                      }&background=random`
                    }
                  alt={selectedEmployee.fullname}
                  className="attendance-page-modal-avatar"
                />
                <div className="attendance-page-modal-employee-details">
                <h4>{selectedEmployee.firstName && selectedEmployee.lastName ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : selectedEmployee.fullname}</h4>
                <p>
                  ID: {selectedEmployee.candidateId ? `${selectedEmployee.candidateId}` : selectedEmployee.employeeId ? `${selectedEmployee.employeeId}` : 'No ID'}
                </p>
                  <p>Department: {selectedEmployee.department}</p>
                </div>
              </div>
              
              <div className="attendance-page-modal-summary">
                <h4>Attendance Summary for {months[selectedMonth]} {selectedYear}</h4>
                <div className="attendance-page-modal-summary-grid">
                  <div className="attendance-page-modal-summary-item">
                    <span className="attendance-page-modal-summary-icon attendance-page-present">✔</span>
                    <span className="attendance-page-modal-summary-label">Present:</span>
                    <span className="attendance-page-modal-summary-value">
                      {countStatuses(selectedEmployee.attendanceStatus).present}
                    </span>
                  </div>
                  <div className="attendance-page-modal-summary-item">
                    <span className="attendance-page-modal-summary-icon attendance-page-absent">✕</span>
                    <span className="attendance-page-modal-summary-label">Absent:</span>
                    <span className="attendance-page-modal-summary-value">
                      {countStatuses(selectedEmployee.attendanceStatus).absent}
                    </span>
                  </div>
                  <div className="attendance-page-modal-summary-item">
                    <span className="attendance-page-modal-summary-icon attendance-page-holiday">★</span>
                    <span className="attendance-page-modal-summary-label">Holidays:</span>
                    <span className="attendance-page-modal-summary-value">
                      {countStatuses(selectedEmployee.attendanceStatus).holiday}
                    </span>
                  </div>
                  <div className="attendance-page-modal-summary-item">
                    <span className="attendance-page-modal-summary-icon attendance-page-halfday">½</span>
                    <span className="attendance-page-modal-summary-label">Half Days:</span>
                    <span className="attendance-page-modal-summary-value">
                      {countStatuses(selectedEmployee.attendanceStatus).halfDay}
                    </span>
                  </div>
                  <div className="attendance-page-modal-summary-item">
                    <span className="attendance-page-modal-summary-icon attendance-page-late">!</span>
                    <span className="attendance-page-modal-summary-label">Late:</span>
                    <span className="attendance-page-modal-summary-value">
                      {countStatuses(selectedEmployee.attendanceStatus).late}
                    </span>
                  </div>
                  <div className="attendance-page-modal-summary-item">
                    <span className="attendance-page-modal-summary-icon attendance-page-leave">≉</span>
                    <span className="attendance-page-modal-summary-label">Sick Leave:</span>
                    <span className="attendance-page-modal-summary-value">
                      {countStatuses(selectedEmployee.attendanceStatus).sickLeave}
                    </span>
                  </div>
                  <div className="attendance-page-modal-summary-item">
                    <span className="attendance-page-modal-summary-icon attendance-page-leave">≉</span>
                    <span className="attendance-page-modal-summary-label">Casual Leave:</span>
                    <span className="attendance-page-modal-summary-value">
                      {countStatuses(selectedEmployee.attendanceStatus).casualLeave}
                    </span>
                  </div>
                  <div className="attendance-page-modal-summary-item">
                    <span className="attendance-page-modal-summary-icon attendance-page-leave">≉</span>
                    <span className="attendance-page-modal-summary-label">Paid Leave:</span>
                    <span className="attendance-page-modal-summary-value">
                      {countStatuses(selectedEmployee.attendanceStatus).paidLeave}
                    </span>
                  </div>
                  <div className="attendance-page-modal-summary-item">
                    <span className="attendance-page-modal-summary-icon attendance-page-leave">≉</span>
                    <span className="attendance-page-modal-summary-label">Paternity Leave:</span>
                    <span className="attendance-page-modal-summary-value">
                      {countStatuses(selectedEmployee.attendanceStatus).paternityLeave}
                    </span>
                  </div>
                  <div className="attendance-page-modal-summary-item">
                    <span className="attendance-page-modal-summary-icon attendance-page-leave">≉</span>
                    <span className="attendance-page-modal-summary-label">Sabbatical Leave:</span>
                    <span className="attendance-page-modal-summary-value">
                      {countStatuses(selectedEmployee.attendanceStatus).sabbaticalLeave}
                    </span>
                  </div>
                  <div className="attendance-page-modal-summary-item">
                    <span className="attendance-page-modal-summary-icon attendance-page-leave">≉</span>
                    <span className="attendance-page-modal-summary-label">Unpaid Leave:</span>
                    <span className="attendance-page-modal-summary-value">
                      {countStatuses(selectedEmployee.attendanceStatus).unpaidLeave}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="attendance-page-modal-days">
                <h4>Daily Attendance</h4>
                <div className="attendance-page-modal-days-grid">
                  {selectedEmployee.attendanceStatus.map((status, index) => {
                    const day = index + 1;
                    const date = new Date(selectedYear, selectedMonth, day);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    
                    return (
                      <div
                        key={day}
                        className={`attendance-page-modal-day attendance-page-${status}`}
                        title={`${dayName}, ${months[selectedMonth]} ${day} - ${formatStatusForTooltip(status)}`}
                      >
                        <span className="attendance-page-modal-day-number">{day}</span>
                        <span className="attendance-page-modal-day-status">{getStatusIcon(status)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;