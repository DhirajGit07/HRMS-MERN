import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";

// Global timer store to manage timers for all users
const timerStore = {};

// Background timer update function
const updateBackgroundTimer = (userId) => {
  const savedClockInTime = localStorage.getItem(`clockInTime_${userId}`);
  if (savedClockInTime) {
    const clockInTime = new Date(savedClockInTime);
    const now = new Date();
    const elapsedSeconds = Math.floor((now - clockInTime) / 1000);
    localStorage.setItem(`timer_${userId}`, elapsedSeconds.toString());
    return elapsedSeconds;
  }
  return 0;
};

// Start background timer for a user
const startBackgroundTimer = (userId) => {
  if (!timerStore[userId]) {
    timerStore[userId] = setInterval(() => {
      updateBackgroundTimer(userId);
    }, 1000);
  }
};

// Stop background timer for a user
const stopBackgroundTimer = (userId) => {
  if (timerStore[userId]) {
    clearInterval(timerStore[userId]);
    delete timerStore[userId];
  }
};

const ClockInContext = createContext();

export const ClockInContextProvider = ({ children }) => {
  const [dateTime, setDateTime] = useState(new Date());
  const [allUsers, setAllUsers] = useState([]);
  const [shiftTiming, setShiftTiming] = useState({});
  const [lateMessage, setLateMessage] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState("");
  const [clockInAvailableText, setClockInAvailableText] = useState("");
  const [attendanceResult, setAttendanceResult] = useState({
    status: "",
    isLate: false,
    checkIn: "--:-- --",
    checkOut: "--:-- --",
  });
  const [holidays, setHolidays] = useState([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);
  const [forceRender, setForceRender] = useState(0);
  // const  [companyId, setCompanyId] = useState('')

  // console.log(holidays);
  

  useEffect(() => {
    // Update dateTime every minute
    const timerId = setInterval(() => setDateTime(new Date()), 60000);
    return () => clearInterval(timerId);
  }, []);

  const userId = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData"))._id : null;
  const userEmail = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")).email : null;
  const companyId = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")).companyId : null;

  // console.log(companyId);
  

  const shiftName = shiftTiming?.shiftName;
  const startTime = shiftTiming?.shiftStartTime || "09:30 AM";
  const endTime = shiftTiming?.shiftEndTime || "06:30 PM";
  const lateMarkAfter = shiftTiming?.lateMarkAfter || 30;
  const halfDayMarkTime = shiftTiming?.halfDayMarkTime || "01:00 PM";
  const secondHalfMarkTime = shiftTiming?.secondHalfMarkTime || "06:30 PM"; // Updated to 06:30 PM
  const maxCheckIn = shiftTiming?.maxCheckIn || 2;
  const workingDays = shiftTiming?.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Convert time string (e.g., "10:30 AM") to Date object for comparison
  const parseTimeToDate = (timeStr, baseDate = new Date()) => {
    if (!timeStr) return null;
    const [timePart, modifier] = timeStr.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const evaluateAttendanceStatus = (checkInTime, checkOutTime) => {
    const shiftStart = parseTimeToDate(startTime);
    const shiftEnd = parseTimeToDate(endTime);
    const halfDayMark = parseTimeToDate(halfDayMarkTime);
    const secondHalfMark = parseTimeToDate(secondHalfMarkTime);

    if (!checkInTime || !checkOutTime) return {
      status: "",
      isLate: false,
      checkIn: "--:-- --",
      checkOut: "--:-- --",
    };

    const inTime = new Date(checkInTime);
    const outTime = new Date(checkOutTime);

    // Format times to 12-hour format
    const formatTime = (date) => {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    const checkInFormatted = formatTime(inTime);
    const checkOutFormatted = formatTime(outTime);

    // Check for late clock-in (only for first session)
    const isLate = todaysSessions.length === 0 && checkLateClockIn(inTime);

    // Complete shift (clock-in after shift start and clock-out after shift end)
    if (inTime >= shiftStart && inTime <= halfDayMark && outTime >= shiftEnd) {
      return {
        status: "present",
        isLate,
        checkIn: checkInFormatted,
        checkOut: checkOutFormatted,
      };
    }

    // First half (clock-out at or before half day mark)
    if (outTime <= halfDayMark) {
      return {
        status: "firstHalf",
        isLate,
        checkIn: checkInFormatted,
        checkOut: checkInFormatted,
      };
    }

    // Second half (clock-in at or after second half mark)
    if (inTime >= halfDayMark && outTime >= secondHalfMark) {
      return {
        status: "secondHalf",
        isLate: false,
        checkIn: checkInFormatted,
        checkOut: checkOutFormatted,
      };
    }

    // Default case
    return {
      status: "secondHalf",
      isLate: false,
      checkIn: checkInFormatted,
      checkOut: checkOutFormatted,
    };
  };

  let CLOCK_IN_HOUR = null;
  let CLOCK_IN_MIN = null;
  let END_HOUR = null;
  let END_MIN = null;

  if (startTime) {
    const [timePart, modifier] = startTime.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) {
      hours += 12;
    } else if (modifier === "AM" && hours === 12) {
      hours = 0;
    }
    CLOCK_IN_HOUR = hours;
    CLOCK_IN_MIN = minutes;
  }

  const convertTo24HourFormat = (timeStr) => {
    if (!timeStr) return null;

    // If already in 24-hour format (HH:MM)
    if (!timeStr.includes(" ")) {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return { hours, minutes };
    }

    // Handle 12-hour format (HH:MM AM/PM)
    const [timePart, modifier] = timeStr.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) {
      hours += 12;
    } else if (modifier === "AM" && hours === 12) {
      hours = 0;
    }

    return { hours, minutes };
  };

  if (endTime) {
    const { hours, minutes } = convertTo24HourFormat(endTime);
    END_HOUR = hours;
    END_MIN = minutes;
  }

  const autoOutTriggeredRef = useRef({});

  // Helper function to count leave days in the selected week for the logged-in user
  const countLeaveDaysInSelectedWeek = (leaves, weekStart, weekEnd) => {
    // console.log(leaves);
    
    const filteredLeaves = leaves.filter(leave => {
      if (leave.status !== "Approved") return false;
      if (leave.teamEmail !== userEmail) return false;
      return true;
    });

    let totalLeaveDays = 0;
    filteredLeaves.forEach(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      
      if (isNaN(leaveStart) || isNaN(leaveEnd)) return;

      const start = leaveStart < weekStart ? weekStart : leaveStart;
      const end = leaveEnd > weekEnd ? weekEnd : leaveEnd;

      if (start <= end) {
        let days = Math.ceil((end - start + 1) / (1000 * 60 * 60 * 24));
        
        if (leave.duration === "First Half" || leave.duration === "Second Half") {
          days = Math.min(days, 0.5);
        }
        totalLeaveDays += days;
      }
    });

    return totalLeaveDays;
  };

  // Helper function to count holidays in the selected week
  const countHolidayDaysInSelectedWeek = (holidays, weekStart, weekEnd) => {
    let holidayDays = 0;
    holidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      if (isNaN(holidayDate)) return;
      if (holidayDate >= weekStart && holidayDate <= weekEnd) {
        holidayDays += 1;
      }
    });

    return holidayDays;
  };

  // Helper function to count weekend days in the selected week
  const countWeekendDaysInSelectedWeek = (weekStart, weekEnd) => {
    let weekendDays = 0;
    const current = new Date(weekStart);
    while (current <= weekEnd) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendDays += 1;
      }
      current.setDate(current.getDate() + 1);
    }
    return weekendDays;
  };

  // Helper function to count working days in the selected week
  const countWorkingDaysInSelectedWeek = (workingDays, weekStart, weekEnd) => {
    const defaultWorkingDays = workingDays.length > 0 ? workingDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    let workingDayCount = 0;
    const current = new Date(weekStart);
    while (current <= weekEnd) {
      const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
      if (defaultWorkingDays.includes(dayName)) {
        workingDayCount += 1;
      }
      current.setDate(current.getDate() + 1);
    }
    return workingDayCount;
  };

  // Check if today is a working day
  const isTodayWorkingDay = () => {
    if (isTodayHoliday()) return false;

    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const effectiveWorkingDays = workingDays.length > 0 ? workingDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    return effectiveWorkingDays.includes(dayName);
  };

  const fetchAttendanceSettingData = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/attendance-settings");
      const holidayRes = await axios.get("http://localhost:8000/api/holidays");
      const leavesRes = await axios.get("http://localhost:8000/api/leaves");
      const allUsersRes = await axios.get('http://localhost:8000/api/users');

      if (res.status === 200 && allUsersRes.status === 200 && holidayRes.status === 200 && leavesRes.status === 200) {
        const userAssignedSetting = res.data.data.find(setting => {
          const employeeIds = setting?.assignedEmployees?.map(emp => emp._id.toString()) || [];
          return employeeIds.includes(userId); 
        });

        
        
        // Filter holidays by matching companyId
        const filteredHolidays = companyId
        ? holidayRes?.data?.filter(holiday => holiday?.companyId === companyId)
        : [];
        
        const normalizedHolidays = filteredHolidays.map(holiday => ({
          ...holiday,
          date: new Date(holiday.date).toLocaleDateString('en-CA'),
        }));

        const filteredLeavesbyCompanyId = companyId ? leavesRes?.data?.filter(leave => leave?.employeeId.split("-")[0] === companyId) : []
        // console.log(filteredLeavesbyCompanyId);        
        
        const normalizedLeaves = filteredLeavesbyCompanyId.map(leave => ({
          ...leave,
          startDate: new Date(leave.startDate).toLocaleDateString('en-CA'),
          endDate: new Date(leave.endDate).toLocaleDateString('en-CA'),
        }));
        
        setShiftTiming(userAssignedSetting || {});
        setHolidays(normalizedHolidays);
        setUpcomingLeaves(normalizedLeaves);
        setAllUsers(allUsersRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setShiftTiming({});
      setHolidays([]);
      setUpcomingLeaves([]);
      setAllUsers([]);
    }
  };

  useEffect(() => {
    fetchAttendanceSettingData();
  }, [userId]);

  const checkLateClockIn = (clockInTime) => {
    if (!startTime || !lateMarkAfter || !halfDayMarkTime) return false;

    const shiftStart = parseTimeToDate(startTime);
    const halfDayTime = parseTimeToDate(halfDayMarkTime);

    const lateThreshold = new Date(shiftStart);
    lateThreshold.setMinutes(lateThreshold.getMinutes() + lateMarkAfter);

    const checkInTime = clockInTime instanceof Date ? clockInTime : new Date(clockInTime);

    return checkInTime > lateThreshold && checkInTime <= halfDayTime;
  };

  // Check if today is a holiday
  const isTodayHoliday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidays.some(holiday => {
      try {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate.getTime() === today.getTime();
      } catch (e) {
        console.error('Error parsing holiday date:', holiday.date, e);
        return false;
      }
    });
  };

  // Check if today is a weekend (Saturday or Sunday)
  const isTodayWeekend = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  // Check if today is within an approved leave with specific duration rules
  const isTodayOnApprovedLeave = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    const shiftStart = parseTimeToDate(startTime, today);
    const shiftEnd = parseTimeToDate(endTime, today);
    const halfDayMark = parseTimeToDate(halfDayMarkTime, today);

    if (!shiftStart || !shiftEnd || !halfDayMark || !userEmail) {
      return { isOnLeave: false, leaveType: null, duration: null };
    }

    const matchingLeave = upcomingLeaves.find((leave) => {
      if (leave.status !== "Approved") return false;
      if (leave.teamEmail !== userEmail) return false;
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      if (today.getTime() < startDate.getTime() || today.getTime() > endDate.getTime()) {
        return false;
      }

      if (leave.duration === "Full Day" || leave.duration === "Multiple") {
        return true;
      } else if (leave.duration === "First Half") {
        return now >= shiftStart && now <= halfDayMark;
      } else if (leave.duration === "Second Half") {
        return now >= halfDayMark && now <= shiftEnd;
      }
      return false;
    });

    return {
      isOnLeave: !!matchingLeave,
      leaveType: matchingLeave ? matchingLeave.leaveType : null,
      duration: matchingLeave ? matchingLeave.duration : null,
    };
  };

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const dayIndex = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayIndex + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [endDate, setEndDate] = useState(() => {
    const monday = new Date();
    const dayIndex = monday.getDay();
    monday.setDate(monday.getDate() - ((dayIndex + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
  });

  const [isCurrentWeek, setIsCurrentWeek] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [summaryData, setSummaryData] = useState({
    payableDays: 0,
    presentDays: 0,
    paidLeaveDays: 0,
    holidayDays: 0,
    weekendDays: 0, 
  });

  const [isClockedIn, setIsClockedIn] = useState(() => {
    const saved = localStorage.getItem(`isClockedIn_${userId}`);
    return saved ? JSON.parse(saved) : false;
  });
  const [clockInTime, setClockInTime] = useState(() => {
    const saved = localStorage.getItem(`clockInTime_${userId}`);
    return saved ? new Date(saved) : null;
  });
  const [timer, setTimer] = useState(() => {
    const saved = localStorage.getItem(`timer_${userId}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [note, setNote] = useState("");
  const [todaysSessions, setTodaysSessions] = useState([]);
  const [maxSessionsReached, setMaxSessionsReached] = useState(false);
  const [autoClockOutTime, setAutoClockOutTime] = useState(null);
  const secondHalfAutoClockOutTriggered = useRef(JSON.parse(localStorage.getItem(`secondHalfAutoClockOut_${userId}`) || 'false'));

  const formatDateDisplay = (date) => {
    if (!(date instanceof Date)) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const calculateHoursWorked = (in24, out24) => {
    if (!in24 || !out24) return "00:00";
    const [h1, m1] = in24.split(":").map(Number);
    const [h2, m2] = out24.split(":").map(Number);
    let dh = h2 - h1,
      dm = m2 - m1;
    if (dm < 0) {
      dh -= 1;
      dm += 60;
    }
    if (dh < 0) dh = 0;
    return `${dh.toString().padStart(2, "0")}:${dm.toString().padStart(2, "0")}`;
  };

  const shiftWeek = (weeks) => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + weeks * 7);
    newStart.setHours(0, 0, 0, 0);
    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + 6);
    newEnd.setHours(23, 59, 59, 999);
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  useEffect(() => {
    const today = new Date();
    const currentMonday = new Date(today);
    const dayIndex = today.getDay();
    currentMonday.setDate(today.getDate() - ((dayIndex + 6) % 7));
    currentMonday.setHours(0, 0, 0, 0);
    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentMonday.getDate() + 6);
    currentSunday.setHours(23, 59, 59, 999);

    const isCurrent = startDate.getTime() === currentMonday.getTime() && endDate.getTime() === currentSunday.getTime();
    setIsCurrentWeek(isCurrent);
  }, [startDate, endDate, shiftTiming]);

  const openModal = (day) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const getDaysArray = (start, end) => {
    const arr = [];
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    const last = new Date(end);
    last.setHours(0, 0, 0, 0);
    while (cur <= last) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  };

  const formatTo12Hour = (timeStr) => {
    if (!timeStr) return "--:-- --";
    let d;
    if (timeStr.includes("T")) {
      d = new Date(timeStr);
      if (isNaN(d)) return "--:-- --";
    } else {
      const [hh, mm] = timeStr.split(":").map(Number);
      d = new Date();
      d.setHours(hh, mm, 0, 0);
    }
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const days = getDaysArray(startDate, endDate).map((day) => {
    const dow = day.getDay();
    const isToday = day.toDateString() === new Date().toDateString();
    const logData = attendanceLogs.find((log) => {
      const ld = new Date(log.date);
      return ld.getDate() === day.getDate() && ld.getMonth() === day.getMonth() && ld.getFullYear() === day.getFullYear();
    });
    const sessions = logData?.sessions || [];
    const totalDec = sessions.reduce((tot, s) => {
      const [h, m] = calculateHoursWorked(s.checkIn?.time, s.checkOut?.time)
        .split(":")
        .map(Number);
      return tot + h + m / 60;
    }, 0);
    const hh = Math.floor(totalDec);
    const mm = Math.round((totalDec - hh) * 60);
    const hours = `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;

    return {
      date: day.getDate(),
      day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow],
      isToday,
      isWeekend: dow === 0 || dow === 6,
      fullDate: day,
      logData,
      sessions,
      hours,
    };
  });

  // Initialize and manage background timer
  useEffect(() => {
    if (userId && isClockedIn && clockInTime) {
      startBackgroundTimer(userId);
      const updateTimer = () => {
        const elapsed = updateBackgroundTimer(userId);
        setTimer(elapsed);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setTimer(0);
    }
  }, [userId, isClockedIn, clockInTime, shiftTiming]);

  // Initialize state on component mount
  useEffect(() => {
    if (!userId) return;

    const fetchInitialState = async () => {
      const savedIsClockedIn = localStorage.getItem(`isClockedIn_${userId}`);
      const savedClockInTime = localStorage.getItem(`clockInTime_${userId}`);
      const savedLateMessage = localStorage.getItem(`lateMessage_${userId}`);
      const savedSecondHalfAutoClockOut = localStorage.getItem(`secondHalfAutoClockOut_${userId}`);
      const savedAutoClockOut = localStorage.getItem(`autoClockOut_${userId}`);

      if (savedIsClockedIn && savedClockInTime && savedAutoClockOut !== 'true') {
        const clockInTime = new Date(savedClockInTime);
        const now = new Date();

        if (clockInTime.toDateString() !== now.toDateString()) {
          // Trigger auto-clockout for previous day's session
          await handleAutoClockOut();
        } else {
          setIsClockedIn(JSON.parse(savedIsClockedIn));
          setClockInTime(clockInTime);
          setTimer(Math.floor((now - clockInTime) / 1000));
          startBackgroundTimer(userId);
        }
      } else {
        // Clear stale state
        localStorage.removeItem(`isClockedIn_${userId}`);
        localStorage.removeItem(`clockInTime_${userId}`);
        localStorage.removeItem(`timer_${userId}`);
        localStorage.removeItem(`secondHalfAutoClockOut_${userId}`);
        localStorage.removeItem(`autoClockOut_${userId}`);
        setIsClockedIn(false);
        setClockInTime(null);
        setTimer(0);
        stopBackgroundTimer(userId);
        secondHalfAutoClockOutTriggered.current = false;
      }
      setLateMessage(savedLateMessage ? JSON.parse(savedLateMessage) : false);
      secondHalfAutoClockOutTriggered.current = savedSecondHalfAutoClockOut ? JSON.parse(savedSecondHalfAutoClockOut) : false;
      updateCanClockIn();
    };

    fetchInitialState();
  }, [userId, shiftTiming]);

  // Reset attendance status daily
  useEffect(() => {
    if (!userId) return;

    const checkResetStatus = () => {
      const lastUpdated = localStorage.getItem(`attendanceStatusUpdated_${userId}`);
      const today = new Date().toISOString().split("T")[0];

      if (lastUpdated !== today) {
        setAttendanceStatus("");
        localStorage.removeItem(`attendanceStatus_${userId}`);
        localStorage.setItem(`attendanceStatusUpdated_${userId}`, today);
        localStorage.removeItem(`secondHalfAutoClockOut_${userId}`);
        localStorage.removeItem(`autoClockOut_${userId}`);
        secondHalfAutoClockOutTriggered.current = false;
        updateCanClockIn();
      }
    };
    checkResetStatus();
    const interval = setInterval(checkResetStatus, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, shiftTiming]);

  // Fetch attendance logs and summary
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/attendance?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
        );
        setAttendanceLogs(res.data || []);
        const today = new Date().toISOString().split("T")[0];
        const todayLog = (res.data || []).find((log) => log.createdAt.startsWith(today));
        const sess = todayLog?.sessions || [];
        setTodaysSessions(sess);

        if (isClockedIn && sess.length >= maxCheckIn) {
          handleAutoClockOut();
        }
      } catch (e) {
        console.error(e);
        setAttendanceLogs([]);
        setTodaysSessions([]);
      }
    };

    const fetchSummary = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/attendance?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
        );
        const attendanceLogs = res.data || [];

        // Calculate presentDays based on attendanceType
        let presentDays = 0;
        attendanceLogs.forEach(log => {
          const sessions = log.sessions || [];
          sessions.forEach(session => {
            if (session.attendanceType === 'present' || session.attendanceType === 'late') {
              presentDays += 1;
            } else if (session.attendanceType === 'firstHalf' || session.attendanceType === 'secondHalf') {
              presentDays += 0.5;
            }
          });
        });

        const paidLeaveDays = countLeaveDaysInSelectedWeek(upcomingLeaves, startDate, endDate);
        const holidayDays = countHolidayDaysInSelectedWeek(holidays, startDate, endDate);
        const weekendDays = countWeekendDaysInSelectedWeek(startDate, endDate);

        // Calculate working days considering holidays
        let workingDaysCount = countWorkingDaysInSelectedWeek(shiftTiming.workingDays || [], startDate, endDate);
        let payableDays = workingDaysCount - holidayDays;

        setSummaryData({
          payableDays: Math.max(0, payableDays), // Ensure not negative
          presentDays: presentDays.toFixed(1), // Round to 1 decimal place for display
          paidLeaveDays,
          holidayDays,
          weekendDays,
        });
      } catch (e) {
        console.error("Error fetching summary:", e);
        const paidLeaveDays = countLeaveDaysInSelectedWeek(upcomingLeaves, startDate, endDate);
        const holidayDays = countHolidayDaysInSelectedWeek(holidays, startDate, endDate);
        const weekendDays = countWeekendDaysInSelectedWeek(startDate, endDate);

        // Default working days (Monday-Friday)
        let workingDaysCount = countWorkingDaysInSelectedWeek(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], startDate, endDate);
        let payableDays = workingDaysCount - holidayDays;

        setSummaryData({
          payableDays: Math.max(0, payableDays), // Ensure not negative
          presentDays: 0,
          paidLeaveDays,
          holidayDays,
          weekendDays,
        });
      }
    };

    fetchLogs();
    fetchSummary();
  }, [startDate, endDate, isClockedIn, userId, upcomingLeaves, holidays, shiftTiming]);

  useEffect(() => {
    setMaxSessionsReached(todaysSessions.length >= maxCheckIn);
  }, [todaysSessions.length, maxCheckIn, shiftTiming]);

  // Set auto-clockout time based on endTime
  useEffect(() => {
    if (endTime && userId) {
      const { hours, minutes } = convertTo24HourFormat(endTime);
      const today = new Date();
      const autoOutTime = new Date(today);
      autoOutTime.setHours(hours, minutes + 2, 0, 0); // Auto clock-out 2 minutes after endTime
      setAutoClockOutTime(autoOutTime);
    }
  }, [endTime, userId, shiftTiming]);

  // Persistent auto-clockout checker
  useEffect(() => {
    if (!userId || !isClockedIn || !clockInTime || !autoClockOutTime) return;

    const checkAutoOut = async () => {
      if (autoOutTriggeredRef.current[userId] || localStorage.getItem(`autoClockOut_${userId}`) === 'true') return;

      const now = new Date();
      if (clockInTime.toDateString() !== now.toDateString()) {
        await handleAutoClockOut();
        return;
      }

      if (now >= autoClockOutTime) {
        autoOutTriggeredRef.current[userId] = true;
        await handleAutoClockOut();
      }
    };

    const interval = setInterval(checkAutoOut, 60000);
    checkAutoOut();

    return () => clearInterval(interval);
  }, [userId, isClockedIn, clockInTime, autoClockOutTime, shiftTiming]);

  // Auto clock-out for Second Half leave at halfDayMarkTime (triggers only once)
  useEffect(() => {
    if (!userId || !isClockedIn || !clockInTime || !halfDayMarkTime) return;

    const leaveStatus = isTodayOnApprovedLeave();
    if (leaveStatus.isOnLeave && leaveStatus.duration === "Second Half" && !secondHalfAutoClockOutTriggered.current) {
      const halfDayMark = parseTimeToDate(halfDayMarkTime);
      const checkAutoOutForSecondHalf = async () => {
        const now = new Date();
        const nowTime = now.getTime();
        const halfDayTime = halfDayMark.getTime();

        // Check if current time is exactly at or just past halfDayMarkTime
        if (nowTime >= halfDayTime && clockInTime.toDateString() === now.toDateString()) {
          secondHalfAutoClockOutTriggered.current = true;
          localStorage.setItem(`secondHalfAutoClockOut_${userId}`, JSON.stringify(true));
          await handleAutoClockOutForSecondHalf();
          setCanClockIn(false); // Immediately disable clock-in
          setClockInAvailableText("Clock-in disabled: On Second Half leave");
          setForceRender(prev => prev + 1); // Force UI re-render
        }
      };

      // Check every 100ms for precise timing
      const interval = setInterval(checkAutoOutForSecondHalf, 100);
      checkAutoOutForSecondHalf();

      return () => clearInterval(interval);
    }
  }, [userId, isClockedIn, clockInTime, halfDayMarkTime, shiftTiming]);

  const handleAutoClockOut = async () => {
    if (!clockInTime || !userId) return;

    if (localStorage.getItem(`autoClockOut_${userId}`) === 'true') return;

    const now = new Date();
    const clockInDate = new Date(clockInTime);
    const effectiveClockOutTime = parseTimeToDate(
      todaysSessions.length === 0 ? endTime : secondHalfMarkTime,
      clockInDate
    );

    const leaveStatus = isTodayOnApprovedLeave();
    let clockOutNote = "Auto clock-out";

    if (leaveStatus.isOnLeave && leaveStatus.duration === "Second Half") {
      const halfDayMark = parseTimeToDate(halfDayMarkTime, clockInDate);
      if (now >= halfDayMark) {
        effectiveClockOutTime.setTime(halfDayMark.getTime());
        clockOutNote = "Auto clock-out due to Second Half leave";
      }
    }

    const hhIn = String(clockInTime.getHours()).padStart(2, "0");
    const mmIn = String(clockInTime.getMinutes()).padStart(2, "0");
    const hhOut = String(effectiveClockOutTime.getHours()).padStart(2, "0");
    const mmOut = String(effectiveClockOutTime.getMinutes()).padStart(2, "0");

    const result = evaluateAttendanceStatus(clockInTime, effectiveClockOutTime);
    setAttendanceResult(result);
    setAttendanceStatus(result.status);

    const payload = {
      date: clockInTime.toISOString(),
      checkIn: {
        time: `${hhIn}:${mmIn}`,
        note: note || "",
        lateMark: lateMessage,
      },
      checkOut: {
        time: `${hhOut}:${mmOut}`,
        note: clockOutNote,
      },
      attendanceType: result.status,
    };

    try {
      await axios.post("http://localhost:8000/api/attendance", payload);
      setIsClockedIn(false);
      setClockInTime(null);
      setTimer(0);
      setNote("");
      localStorage.removeItem(`isClockedIn_${userId}`);
      localStorage.removeItem(`clockInTime_${userId}`);
      localStorage.removeItem(`timer_${userId}`);
      localStorage.removeItem(`secondHalfAutoClockOut_${userId}`);
      localStorage.setItem(`autoClockOut_${userId}`, 'true');
      stopBackgroundTimer(userId);
      setTodaysSessions((prev) => [
        ...prev,
        {
          checkIn: { time: `${hhIn}:${mmIn}` },
          checkOut: { time: `${hhOut}:${mmOut}` },
        },
      ]);
      delete autoOutTriggeredRef.current[userId];
      secondHalfAutoClockOutTriggered.current = false;
      setCanClockIn(true);
      updateCanClockIn();
    } catch (err) {
      console.error("Auto clock-out failed", err);
    }
  };

  const handleAutoClockOutForSecondHalf = async () => {
    if (!clockInTime || !userId) return;

    const halfDayMark = parseTimeToDate(halfDayMarkTime);
    const effectiveClockOutTime = halfDayMark;

    const hhIn = String(clockInTime.getHours()).padStart(2, "0");
    const mmIn = String(clockInTime.getMinutes()).padStart(2, "0");
    const hhOut = String(effectiveClockOutTime.getHours()).padStart(2, "0");
    const mmOut = String(effectiveClockOutTime.getMinutes()).padStart(2, "0");

    const result = evaluateAttendanceStatus(clockInTime, effectiveClockOutTime);
    setAttendanceResult(result);
    setAttendanceStatus(result.status);

    const payload = {
      date: clockInTime.toISOString(),
      checkIn: {
        time: `${hhIn}:${mmIn}`,
        note: note || "",
        lateMark: lateMessage,
      },
      checkOut: {
        time: `${hhOut}:${mmOut}`,
        note: "Auto clock-out due to Second Half leave",
      },
      attendanceType: result.status,
    };

    try {
      setIsClockedIn(false);
      setClockInTime(null);
      setTimer(0);
      setNote("");
      localStorage.removeItem(`isClockedIn_${userId}`);
      localStorage.removeItem(`clockInTime_${userId}`);
      localStorage.removeItem(`timer_${userId}`);
      localStorage.setItem(`secondHalfAutoClockOut_${userId}`, JSON.stringify(true));
      stopBackgroundTimer(userId);
      setTodaysSessions((prev) => [
        ...prev,
        {
          checkIn: { time: `${hhIn}:${mmIn}` },
          checkOut: { time: `${hhOut}:${mmOut}` },
        },
      ]);
      await axios.post("http://localhost:8000/api/attendance", payload);
      setCanClockIn(false); // Ensure canClockIn is false after async
      setClockInAvailableText("Clock-in disabled: On Second Half leave");
      setForceRender(prev => prev + 1); // Force UI re-render
    } catch (err) {
      console.error("Auto clock-out for Second Half failed", err);
    }
  };

  const [canClockIn, setCanClockIn] = useState(false);

  const updateCanClockIn = () => {
    const now = new Date();
    const leaveStatus = isTodayOnApprovedLeave();
    const isHoliday = isTodayHoliday();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    let canClock = true;

    // Holiday has highest priority
    if (isHoliday) {
      canClock = false;
    } else if (leaveStatus.isOnLeave) {
      // Leave has second priority
      if (leaveStatus.duration === "First Half") {
        const halfDayMark = parseTimeToDate(halfDayMarkTime, now);
        canClock = now >= halfDayMark; // Enable clock-in after halfDayMarkTime
      } else if (leaveStatus.duration === "Second Half") {
        const halfDayMark = parseTimeToDate(halfDayMarkTime, now);
        canClock = now < halfDayMark && !secondHalfAutoClockOutTriggered.current; // Disable after halfDayMarkTime or after auto-clockout
      } else {
        canClock = false; // Disable for Full Day or Multiple
      }
    } else if (!isTodayWorkingDay()) {
      canClock = false;
    } else {
      // Only after all above checks pass, check shift timings
      const isAfterEndTime =
        currentHours > END_HOUR || (currentHours === END_HOUR && currentMinutes >= END_MIN);
      const isAtOrAfterStartTime =
        currentHours > CLOCK_IN_HOUR || (currentHours === CLOCK_IN_HOUR && currentMinutes >= CLOCK_IN_MIN);
      canClock = isAtOrAfterStartTime && !isAfterEndTime;
    }

    setCanClockIn(canClock);

    // Update clock-in available text
    if (isHoliday) {
      const todayHoliday = holidays.find(holiday => {
        try {
          const holidayDate = new Date(holiday.date);
          holidayDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return holidayDate.getTime() === today.getTime();
        } catch (e) {
          return false;
        }
      });
      setClockInAvailableText(`Clock-in disabled: Today is ${todayHoliday?.label || 'a holiday'}`);
    } else if (leaveStatus.isOnLeave) {
      const durationText = leaveStatus.duration === "First Half" ? "First Half" : leaveStatus.duration === "Second Half" ? "Second Half" : leaveStatus.leaveType ? `${leaveStatus.leaveType}` : 'approved leave';
      setClockInAvailableText(`Clock-in disabled: On ${durationText}`);
    } else if (!isTodayWorkingDay()) {
      setClockInAvailableText('Clock-in disabled: Today is not a working day');
    } else if (!startTime || !endTime) {
      setClockInAvailableText('Your shift timings have not been assigned yet');
    } else {
      const isAfterEndTime =
        currentHours > END_HOUR || (currentHours === END_HOUR && currentMinutes >= END_MIN);
      const isNewDay = currentHours < CLOCK_IN_HOUR || (currentHours === CLOCK_IN_HOUR && currentMinutes < CLOCK_IN_MIN);    
      if (isAfterEndTime && !isNewDay) {
        setClockInAvailableText(`Clock-in available tomorrow at ${startTime}`);
      } else {
        setClockInAvailableText(`Clock-in available at ${startTime}`);
      }
    }
  };

  useEffect(() => {
    updateCanClockIn();
    const interval = setInterval(updateCanClockIn, 500); // Update every 500ms for real-time
    return () => clearInterval(interval);
  }, [startTime, endTime, CLOCK_IN_HOUR, CLOCK_IN_MIN, END_HOUR, END_MIN, holidays, upcomingLeaves, workingDays, shiftTiming, todaysSessions, forceRender]);

  const handleClockButtonClick = async () => {
    if (!userId) {
      alert("User not logged in");
      return;
    }
    if (!isClockedIn) {
      if (!canClockIn) {
        alert(clockInAvailableText);
        return;
      }
      if (todaysSessions.length >= maxCheckIn) {
        alert(`Maximum ${maxCheckIn} sessions per day allowed`);
        return;
      }

      const nowDt = new Date();
      const isFirstSession = todaysSessions.length === 0;
      let isLate = false;

      if (isFirstSession) {
        isLate = checkLateClockIn(nowDt);
        if (isLate) {
          setLateMessage(true);
          localStorage.setItem(`lateMessage_${userId}`, JSON.stringify(true));
          Swal.fire({
            title: 'You are late for your shift!',
            icon: 'warning',
            confirmButtonColor: 'red',
          });
        } else {
          setLateMessage(false);
          localStorage.removeItem(`lateMessage_${userId}`);
        }
      }

      setClockInTime(nowDt);
      setIsClockedIn(true);
      setTimer(0);
      localStorage.setItem(`isClockedIn_${userId}`, true);
      localStorage.setItem(`clockInTime_${userId}`, nowDt.toISOString());
      localStorage.setItem(`timer_${userId}`, "0");
      localStorage.setItem(`autoClockOut_${userId}`, 'false'); // Reset auto-clockout flag
      startBackgroundTimer(userId);
      localStorage.setItem(`secondHalfAutoClockOut_${userId}`, JSON.stringify(false));
      secondHalfAutoClockOutTriggered.current = false;
      updateCanClockIn();
    } else {
      const nowDt = new Date();

      if (nowDt - clockInTime < 60000) {
        const proceed = await Swal.fire({
          title: "You're clocking out immediately. Are you sure?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: 'red',
          cancelButtonColor: '#2196F3',
          confirmButtonText: 'Yes, Proceed',
          cancelButtonText: 'Cancel'
        });
        if (!proceed.isConfirmed) return;
        nowDt.setMinutes(nowDt.getMinutes() + 1);
      }

      const shiftEnd = parseTimeToDate(endTime, nowDt);
      const secondHalfMark = parseTimeToDate(secondHalfMarkTime, nowDt);
      let effectiveClockOutTime = nowDt;

      // Cap clock-out time at endTime for first session or secondHalfMarkTime for subsequent sessions
      if (todaysSessions.length === 0 && effectiveClockOutTime > shiftEnd) {
        effectiveClockOutTime = shiftEnd;
      } else if (todaysSessions.length > 0 && effectiveClockOutTime > secondHalfMark) {
        effectiveClockOutTime = secondHalfMark;
      }

      const hhIn = String(clockInTime.getHours()).padStart(2, "0");
      const mmIn = String(clockInTime.getMinutes()).padStart(2, "0");
      const hhOut = String(effectiveClockOutTime.getHours()).padStart(2, "0");
      const mmOut = String(effectiveClockOutTime.getMinutes()).padStart(2, "0");

      const result = evaluateAttendanceStatus(clockInTime, effectiveClockOutTime);
      setAttendanceResult(result);
      setAttendanceStatus(result.status);
      localStorage.setItem(`attendanceStatus_${userId}`, result.status);

      const payload = {
        date: clockInTime.toISOString(),
        checkIn: {
          time: `${hhIn}:${mmIn}`,
          note: note || "",
          lateMark: lateMessage,
        },
        checkOut: {
          time: `${hhOut}:${mmOut}`,
          note: note || "",
        },
        attendanceType: result.status,
      };

      try {
        await axios.post("http://localhost:8000/api/attendance", payload);
        setIsClockedIn(false);
        setClockInTime(null);
        setTimer(0);
        setNote("");
        localStorage.removeItem(`isClockedIn_${userId}`);
        localStorage.removeItem(`clockInTime_${userId}`);
        localStorage.removeItem(`timer_${userId}`);
        localStorage.removeItem(`secondHalfAutoClockOut_${userId}`);
        localStorage.setItem(`autoClockOut_${userId}`, 'false'); // Reset auto-clockout flag
        stopBackgroundTimer(userId);
        setTodaysSessions((prev) => [
          ...prev,
          {
            checkIn: { time: `${hhIn}:${mmIn}` },
            checkOut: { time: `${hhOut}:${mmOut}` },
          },
        ]);
        secondHalfAutoClockOutTriggered.current = false;
        setCanClockIn(true);
        updateCanClockIn();
      } catch (err) {
        console.error("Clock-out failed", err);
      }
    }
  };

  return (
    <ClockInContext.Provider
      value={{
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        showCalendar,
        setShowCalendar,
        selectedDay,
        setSelectedDay,
        isModalOpen,
        setIsModalOpen,
        attendanceLogs,
        setAttendanceLogs,
        summaryData,
        setSummaryData,
        isClockedIn,
        setIsClockedIn,
        clockInTime,
        setClockInTime,
        timer,
        setTimer,
        note,
        setNote,
        todaysSessions,
        setTodaysSessions,
        maxSessionsReached,
        setMaxSessionsReached,
        formatDateDisplay,
        formatTimer,
        calculateHoursWorked,
        shiftWeek,
        openModal,
        closeModal,
        formatTo12Hour,
        days,
        handleClockButtonClick,
        canClockIn,
        isCurrentWeek,
        CLOCK_IN_HOUR,
        CLOCK_IN_MIN,
        startTime,
        endTime,
        lateMessage,
        attendanceStatus,
        shiftName,
        clockInAvailableText,
        attendanceResult,
        evaluateAttendanceStatus,
        holidays,
        upcomingLeaves,
        workingDays,
        userId,
        fetchAttendanceSettingData,
        halfDayMarkTime,
        dateTime
      }}
    >
      {children}
    </ClockInContext.Provider>
  );
};

export const useClockInContext = () => useContext(ClockInContext);