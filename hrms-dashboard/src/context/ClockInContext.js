// Frontend: ClockInContextProvider.jsx

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";

// Utility function to validate date strings
const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Global timer store to manage timers for all users
const timerStore = {};

// Background timer update function
const updateBackgroundTimer = (userId) => {
  const savedClockInTime = localStorage.getItem(`clockInTime_${userId}`);
  if (savedClockInTime && isValidDate(savedClockInTime)) {
    const clockInTime = new Date(savedClockInTime);
    const now = new Date();
    const elapsedSeconds = Math.floor((now - clockInTime) / 1000);
    localStorage.setItem(`timer_${userId}`, elapsedSeconds.toString());
    return elapsedSeconds;
  }
  return 0;
};

// Start background timer for a user
const startBackgroundTimer = (userId, setTimer) => {
  if (timerStore[userId]) {
    clearInterval(timerStore[userId]);
    delete timerStore[userId];
  }
  timerStore[userId] = setInterval(() => {
    const savedClockInTime = localStorage.getItem(`clockInTime_${userId}`);
    if (savedClockInTime && isValidDate(savedClockInTime)) {
      const elapsed = updateBackgroundTimer(userId);
      setTimer(elapsed);
    } else {
      clearInterval(timerStore[userId]);
      delete timerStore[userId];
    }
  }, 1000);
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
  const userId = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData"))._id : null;
  const userEmail = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")).email : null;
  const companyId = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")).companyId : null;

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
  const [isClockedIn, setIsClockedIn] = useState(() => {
    const saved = localStorage.getItem(`isClockedIn_${userId}`);
    return saved ? JSON.parse(saved) : false;
  });
  const [clockInTime, setClockInTime] = useState(() => {
    const saved = localStorage.getItem(`clockInTime_${userId}`);
    return saved && isValidDate(saved) ? new Date(saved) : null;
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
  const [canClockIn, setCanClockIn] = useState(false);

  const shiftName = shiftTiming?.shiftName;
  const startTime = shiftTiming?.shiftStartTime;
  const endTime = shiftTiming?.shiftEndTime;
  const lateMarkAfter = shiftTiming?.lateMarkAfter;
  const halfDayMarkTime = shiftTiming?.halfDayMarkTime;
  const secondHalfMarkTime = shiftTiming?.secondHalfMarkTime;
  const maxCheckIn = shiftTiming?.maxCheckIn ?? 2; // Default to 2 if undefined
  const workingDays = shiftTiming?.workingDays;
  const autoClockOutTimeSetByUser = shiftTiming?.autoClockoutTime || 30;

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

  if (endTime) {
    const [timePart, modifier] = endTime.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) {
      hours += 12;
    } else if (modifier === "AM" && hours === 12) {
      hours = 0;
    }
    END_HOUR = hours;
    END_MIN = minutes;
  }

  // Update dateTime every minute
  useEffect(() => {
    const timerId = setInterval(() => setDateTime(new Date()), 60000);
    return () => clearInterval(timerId);
  }, []);

  // Monitor userData in localStorage to detect logout and stop timer
  useEffect(() => {
    const checkUserData = () => {
      const currentUserData = localStorage.getItem("userData");
      if (!currentUserData && userId) {
        stopBackgroundTimer(userId);
        setTimer(0);
        setIsClockedIn(false);
        setClockInTime(null);
        setLateMessage(false);
        setTodaysSessions([]);
        localStorage.removeItem(`isClockedIn_${userId}`);
        localStorage.removeItem(`clockInTime_${userId}`);
        localStorage.removeItem(`timer_${userId}`);
        localStorage.removeItem(`lateMessage_${userId}`);
        localStorage.removeItem(`secondHalfAutoClockOut_${userId}`);
        localStorage.removeItem(`autoClockOut_${userId}`);
        secondHalfAutoClockOutTriggered.current = false;
        setForceRender(prev => prev + 1);
        updateCanClockIn();
      }
    };

    checkUserData();
    const interval = setInterval(checkUserData, 1000);
    return () => clearInterval(interval);
  }, [userId]);

  // Sync timer with UI rendering
  useEffect(() => {
    if (isClockedIn && clockInTime && isValidDate(clockInTime)) {
      setForceRender(prev => prev + 1);
      updateCanClockIn();
    }
  }, [isClockedIn, timer, clockInTime]);

  // Fetch active session on login and verify localStorage
  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchActiveSession = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/attendance/active', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const { activeSession } = response.data;

        // Fetch all sessions for today to reconstruct todaysSessions
        const today = new Date().toISOString().split("T")[0];
        const attendanceResponse = await axios.get(`http://localhost:8000/api/attendance?start=${today}&end=${today}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const todaysAttendance = attendanceResponse.data[0] || { sessions: [] };
        const sessions = todaysAttendance.sessions.map((session) => ({
          checkIn: { time: session.checkIn.time || "--:--", note: session.checkIn.note || "" },
          checkOut: session.checkOut?.time ? { time: session.checkOut.time, note: session.checkOut.note || "" } : { time: "" },
        }));
        setTodaysSessions(sessions);
        setMaxSessionsReached(sessions.length >= maxCheckIn);
        if (activeSession && isValidDate(activeSession.date)) {
          const clockInDateTime = new Date(activeSession.date);
          const timeParts = activeSession.checkIn.time.split(':');
          if (timeParts.length >= 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;  // Handle optional seconds
            clockInDateTime.setHours(hours, minutes, seconds, 0);

            const now = new Date();
            const elapsedSeconds = Math.floor((now - clockInDateTime) / 1000);

            setIsClockedIn(true);
            setClockInTime(clockInDateTime);
            setTimer(elapsedSeconds);
            setLateMessage(activeSession.checkIn.lateMark || false);
            localStorage.setItem(`isClockedIn_${userId}`, JSON.stringify(true));
            localStorage.setItem(`clockInTime_${userId}`, clockInDateTime.toISOString());
            localStorage.setItem(`timer_${userId}`, elapsedSeconds.toString());
            localStorage.setItem(`lateMessage_${userId}`, JSON.stringify(activeSession.checkIn.lateMark || false));
            startBackgroundTimer(userId, setTimer);

            const shiftEnd = parseTimeToDate(endTime, clockInDateTime);
            const autoThreshold = shiftEnd ? new Date(Math.max(clockInDateTime.getTime(), shiftEnd.getTime()) + autoClockOutTimeSetByUser * 60 * 1000) : null;
            setAutoClockOutTime(autoThreshold);

            setForceRender(prev => prev + 1);
            updateCanClockIn();
          } else {
            console.error("Invalid checkIn.time format:", activeSession.checkIn.time);
            setIsClockedIn(false);
            setClockInTime(null);
            setTimer(0);
            setLateMessage(false);
            localStorage.removeItem(`isClockedIn_${userId}`);
            localStorage.removeItem(`clockInTime_${userId}`);
            localStorage.removeItem(`timer_${userId}`);
            localStorage.removeItem(`lateMessage_${userId}`);
            stopBackgroundTimer(userId);
            setForceRender(prev => prev + 1);
            updateCanClockIn();
          }
        } else {
          // Only clear localStorage if no active session and no recent clock-in
          const savedClockInTime = localStorage.getItem(`clockInTime_${userId}`);
          if (!savedClockInTime || !isValidDate(savedClockInTime) || new Date(savedClockInTime).toDateString() !== new Date().toDateString()) {
            setIsClockedIn(false);
            setClockInTime(null);
            setTimer(0);
            setLateMessage(false);
            localStorage.removeItem(`isClockedIn_${userId}`);
            localStorage.removeItem(`clockInTime_${userId}`);
            localStorage.removeItem(`timer_${userId}`);
            localStorage.removeItem(`lateMessage_${userId}`);
            localStorage.removeItem(`secondHalfAutoClockOut_${userId}`);
            localStorage.removeItem(`autoClockOut_${userId}`);
            stopBackgroundTimer(userId);
            secondHalfAutoClockOutTriggered.current = false;
            setTodaysSessions([]);
            setMaxSessionsReached(false);
            setForceRender(prev => prev + 1);
            updateCanClockIn();
          }
        }
      } catch (err) {
        console.error("Failed to fetch active session:", err.response?.data || err.message);
        // Avoid clearing localStorage on error to preserve timer
        updateCanClockIn();
      }
    };

    fetchActiveSession();
  }, [userId, maxCheckIn]);

  // Clear stale localStorage if no active session
  useEffect(() => {
    if (!userId) return;

    const verifySession = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/attendance/active', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const { activeSession } = response.data;
        const savedIsClockedIn = localStorage.getItem(`isClockedIn_${userId}`);
        const savedClockInTime = localStorage.getItem(`clockInTime_${userId}`);

        if (!activeSession && savedIsClockedIn === 'true' && savedClockInTime && isValidDate(savedClockInTime)) {
          setIsClockedIn(false);
          setClockInTime(null);
          setTimer(0);
          setLateMessage(false);
          localStorage.removeItem(`isClockedIn_${userId}`);
          localStorage.removeItem(`clockInTime_${userId}`);
          localStorage.removeItem(`timer_${userId}`);
          localStorage.removeItem(`lateMessage_${userId}`);
          localStorage.removeItem(`secondHalfAutoClockOut_${userId}`);
          localStorage.removeItem(`autoClockOut_${userId}`);
        }
      } catch (error) {
        console.error("Error in verifySession:", error);
      }
    };

    verifySession();
  }, [userId]);

  // Check and reset attendance status daily
  useEffect(() => {
    if (!userId) return;

    const checkResetStatus = () => {
      const lastUpdated = localStorage.getItem(`attendanceStatusUpdated_${userId}`);
      const today = new Date().toISOString().split("T")[0];

      if (lastUpdated !== today) {
        setAttendanceStatus("");
        setTodaysSessions([]);
        setMaxSessionsReached(false);
        localStorage.removeItem(`attendanceStatus_${userId}`);
        localStorage.setItem(`attendanceStatusUpdated_${userId}`, today);
        localStorage.removeItem(`secondHalfAutoClockOut_${userId}`);
        localStorage.removeItem(`autoClockOut_${userId}`);
        secondHalfAutoClockOutTriggered.current = false;
        setForceRender(prev => prev + 1);
        updateCanClockIn();
      }
    };
    checkResetStatus();
    const interval = setInterval(checkResetStatus, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  // Fetch attendance logs and summary
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/attendance?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
        );
        setAttendanceLogs(res.data || []);
        const today = new Date().toISOString().split("T")[0];
        const todayLog = (res.data || []).find((log) => isValidDate(log.createdAt) && log.createdAt.startsWith(today));
        const sess = todayLog?.sessions || [];
        
        if (todayLog && todayLog.createdAt.startsWith(today)) {
          setTodaysSessions(sess.map(session => ({
            checkIn: { time: session.checkIn.time || "--:--", note: session.checkIn.note || "" },
            checkOut: session.checkOut?.time ? { time: session.checkOut.time, note: session.checkOut.note || "" } : { time: "" },
          })));
          setMaxSessionsReached(sess.length >= maxCheckIn);
        } else {
          setTodaysSessions([]);
          setMaxSessionsReached(false);
        }

        if (isClockedIn && sess.length >= maxCheckIn) {
          await handleAutoClockOut();
        }
      } catch (e) {
        console.error("Error fetching logs:", e);
        setAttendanceLogs([]);
        setTodaysSessions([]);
        setMaxSessionsReached(false);
      }
    };

    const fetchSummary = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/attendance?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
        );
        const attendanceLogs = res.data || [];

        let presentDays = 0;
        attendanceLogs.forEach(log => {
          const lastSession = log.sessions && log.sessions.length > 0 ? log.sessions[log.sessions.length - 1] : null;
          if (lastSession) {
            if (lastSession.attendanceType === 'present' || lastSession.attendanceType === 'late') {
              presentDays += 1;
            } else if (lastSession.attendanceType === 'firstHalf' || lastSession.attendanceType === 'secondHalf') {
              presentDays += 0.5;
            }
          }
        });

        const paidLeaveDays = countLeaveDaysInSelectedWeek(upcomingLeaves, startDate, endDate);
        const holidayDays = countHolidayDaysInSelectedWeek(holidays, startDate, endDate);
        const weekendDays = countWeekendDaysInSelectedWeek(startDate, endDate);

        let workingDaysCount = countWorkingDaysInSelectedWeek(shiftTiming.workingDays || [], startDate, endDate);
        let payableDays = workingDaysCount - holidayDays;

        setSummaryData({
          payableDays: Math.max(0, payableDays),
          presentDays: presentDays.toFixed(1),
          paidLeaveDays,
          holidayDays,
          weekendDays,
        });
      } catch (e) {
        console.error("Error fetching summary:", e);
        const paidLeaveDays = countLeaveDaysInSelectedWeek(upcomingLeaves, startDate, endDate);
        const holidayDays = countHolidayDaysInSelectedWeek(holidays, startDate, endDate);
        const weekendDays = countWeekendDaysInSelectedWeek(startDate, endDate);

        let workingDaysCount = countWorkingDaysInSelectedWeek(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], startDate, endDate);
        let payableDays = workingDaysCount - holidayDays;

        setSummaryData({
          payableDays: Math.max(0, payableDays),
          presentDays: 0,
          paidLeaveDays,
          holidayDays,
          weekendDays,
        });
      }
    };

    fetchLogs();
    fetchSummary();
  }, [startDate, endDate, isClockedIn, userId, upcomingLeaves, holidays, maxCheckIn]);

  const parseTimeToDate = (timeStr, baseDate = new Date()) => {
    if (!timeStr || !baseDate || !isValidDate(baseDate)) return null;
    const [timePart, modifier] = timeStr.split(" ");
    if (!timePart) return null;
    const parts = timePart.split(":");
    let hours = parseInt(parts[0], 10);
    let minutes = parseInt(parts[1], 10);
    let seconds = parts[2] ? parseInt(parts[2], 10) : 0;  // Handle optional seconds
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    const date = new Date(baseDate);
    date.setHours(hours, minutes, seconds, 0);
    return isValidDate(date) ? date : null;
  };

  const evaluateAttendanceStatus = (checkInTime, checkOutTime) => {
    const shiftStart = parseTimeToDate(startTime);
    const shiftEnd = parseTimeToDate(endTime);
    const halfDayMark = parseTimeToDate(halfDayMarkTime);
    const secondHalfMark = parseTimeToDate(secondHalfMarkTime);

    if (!checkInTime || !checkOutTime || !isValidDate(checkInTime) || !isValidDate(checkOutTime)) return {
      status: "",
      isLate: false,
      checkIn: "--:-- --",
      checkOut: "--:-- --",
    };

    const inTime = new Date(checkInTime);
    const outTime = new Date(checkOutTime);

    const formatTime = (date) => {
      return isValidDate(date) ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) : "--:-- --";
    };

    const checkInFormatted = formatTime(inTime);
    const checkOutFormatted = formatTime(outTime);

    const isLate = todaysSessions.length === 0 && checkLateClockIn(inTime);

    if (shiftStart && halfDayMark && shiftEnd && inTime >= shiftStart && inTime <= halfDayMark && outTime >= shiftEnd) {
      return {
        status: "present",
        isLate,
        checkIn: checkInFormatted,
        checkOut: checkOutFormatted,
      };
    }

    if (halfDayMark && outTime <= halfDayMark) {
      return {
        status: "firstHalf",
        isLate,
        checkIn: checkInFormatted,
        checkOut: checkOutFormatted,
      };
    }

    if (halfDayMark && secondHalfMark && inTime >= halfDayMark && outTime >= secondHalfMark) {
      return {
        status: "secondHalf",
        isLate: false,
        checkIn: checkInFormatted,
        checkOut: checkOutFormatted,
      };
    }

    return {
      status: "secondHalf",
      isLate: false,
      checkIn: checkInFormatted,
      checkOut: checkOutFormatted,
    };
  };

  const checkLateClockIn = (clockInTime) => {
    if (!startTime || !lateMarkAfter || !halfDayMarkTime) return false;

    const shiftStart = parseTimeToDate(startTime);
    const halfDayTime = parseTimeToDate(halfDayMarkTime);

    if (!shiftStart || !halfDayTime || !clockInTime || !isValidDate(clockInTime)) return false;

    const lateThreshold = new Date(shiftStart);
    lateThreshold.setMinutes(lateThreshold.getMinutes() + lateMarkAfter);

    const checkInTime = clockInTime instanceof Date ? clockInTime : new Date(clockInTime);

    return isValidDate(checkInTime) && isValidDate(lateThreshold) && isValidDate(halfDayTime) && checkInTime > lateThreshold && checkInTime <= halfDayTime;
  };

  const isTodayHoliday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidays.some(holiday => {
      try {
        const holidayDate = new Date(holiday.date);
        if (!isValidDate(holidayDate)) return false;
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate.getTime() === today.getTime();
      } catch (e) {
        console.error('Error parsing holiday date:', holiday.date, e);
        return false;
      }
    });
  };

  const isTodayWorkingDay = () => {
    if (isTodayHoliday()) return false;

    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const effectiveWorkingDays = workingDays?.length > 0 ? workingDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    return effectiveWorkingDays.includes(dayName);
  };

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
      if (!isValidDate(startDate) || !isValidDate(endDate)) return false;
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

  const formatDateDisplay = (date) => {
    if (!(date instanceof Date) || !isValidDate(date)) return "";
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
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return "00:00";
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
      if (!isValidDate(d)) return "--:-- --";
    } else {
      const parts = timeStr.split(":");
      const hh = parseInt(parts[0], 10);
      const mm = parseInt(parts[1], 10);
      const ss = parts[2] ? parseInt(parts[2], 10) : 0;  // Handle optional seconds (ignored in display)
      if (isNaN(hh) || isNaN(mm)) return "--:-- --";
      d = new Date();
      d.setHours(hh, mm, ss, 0);
    }
    return isValidDate(d) ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) : "--:-- --";
  };

  const days = getDaysArray(startDate, endDate).map((day) => {
    const dow = day.getDay();
    const isToday = day.toDateString() === new Date().toDateString();
    const logData = attendanceLogs.find((log) => {
      const ld = new Date(log.date);
      return isValidDate(ld) && ld.getDate() === day.getDate() && ld.getMonth() === day.getMonth() && ld.getFullYear() === day.getFullYear();
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

  const handleAutoClockOutWithoutLogin = async (userId, clockInTime) => {
    if (!userId || !clockInTime || !isValidDate(clockInTime)) return false;

    try {
      const clockInDate = new Date(clockInTime);
      const dateStr = clockInDate.toISOString().split('T')[0];
      
      const response = await axios.post('http://localhost:8000/api/attendance/auto-clockout', {
        userId,
        date: dateStr
      });
      
      return true;
    } catch (error) {
      console.error('Auto clock-out failed:', error);
      return false;
    }
  };

  const handleClockButtonClick = async () => {
    if (!isClockedIn) {
      // Clock In Logic
      const nowDt = new Date();
      const shiftStart = parseTimeToDate(startTime, nowDt);
      const halfDayMark = parseTimeToDate(halfDayMarkTime, nowDt);
      const lateThreshold = shiftStart ? new Date(shiftStart) : null;
      if (lateThreshold && lateMarkAfter) {
        lateThreshold.setMinutes(lateThreshold.getMinutes() + lateMarkAfter);
      }
      const isLate = lateThreshold && halfDayMark && nowDt > lateThreshold && nowDt <= halfDayMark && todaysSessions.length === 0;

      setLateMessage(isLate);
      localStorage.setItem(`lateMessage_${userId}`, JSON.stringify(isLate));
      if (isLate) {
          Swal.fire({
            title: 'You are late for your shift!',
            icon: 'warning',
            confirmButtonColor: 'red',
          });
      }


      const hhIn = String(nowDt.getHours()).padStart(2, "0");
      const mmIn = String(nowDt.getMinutes()).padStart(2, "0");
      const ssIn = String(nowDt.getSeconds()).padStart(2, "0");  // Include seconds

      const payload = {
        date: nowDt.toISOString(),
        checkIn: {
          time: `${hhIn}:${mmIn}:${ssIn}`,  // HH:mm:ss
          note: note || "",
          lateMark: isLate,
        },
        autoClockOutMinutes: autoClockOutTimeSetByUser
      };

      try {
        await axios.post("http://localhost:8000/api/attendance", payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setClockInTime(nowDt);
        setIsClockedIn(true);
        setTimer(0);
        localStorage.setItem(`isClockedIn_${userId}`, JSON.stringify(true));
        localStorage.setItem(`clockInTime_${userId}`, nowDt.toISOString());
        localStorage.setItem(`timer_${userId}`, "0");
        localStorage.setItem(`autoClockOut_${userId}`, 'false');
        localStorage.setItem(`secondHalfAutoClockOut_${userId}`, JSON.stringify(false));
        startBackgroundTimer(userId, setTimer);
        secondHalfAutoClockOutTriggered.current = false;
        const today = new Date().toISOString().split("T")[0];
        const clockInDateStr = nowDt.toISOString().split("T")[0];
        if (clockInDateStr === today) {
          setTodaysSessions((prev) => {
            const newSessions = [
              ...prev,
              {
                checkIn: { time: `${hhIn}:${mmIn}:${ssIn}`, note: note || "" },
                checkOut: { time: "" },
              },
            ];
            setMaxSessionsReached(newSessions.length >= maxCheckIn);
            return newSessions;
          });
        }
        setNote("");
        const shiftEnd = parseTimeToDate(endTime, nowDt);
        const autoThreshold = shiftEnd ? new Date(Math.max(nowDt.getTime(), shiftEnd.getTime()) + autoClockOutTimeSetByUser * 60 * 1000) : null;
        setAutoClockOutTime(autoThreshold);
        setForceRender(prev => prev + 1);
        updateCanClockIn();
      } catch (err) {
        console.error("Clock-in failed", err);
        alert("Clock-in failed: " + (err.response?.data?.message || "Unknown error"));
      }
    } else {
      // Clock Out Logic
      const nowDt = new Date();

      if (clockInTime && isValidDate(clockInTime) && (nowDt - clockInTime < 60000)) {
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

      if (todaysSessions.length === 0 && shiftEnd && effectiveClockOutTime > shiftEnd) {
        effectiveClockOutTime = shiftEnd;
      } else if (todaysSessions.length > 0 && secondHalfMark && effectiveClockOutTime > secondHalfMark) {
        effectiveClockOutTime = secondHalfMark;
      }

      const hhIn = clockInTime && isValidDate(clockInTime) ? String(clockInTime.getHours()).padStart(2, "0") : "--";
      const mmIn = clockInTime && isValidDate(clockInTime) ? String(clockInTime.getMinutes()).padStart(2, "0") : "--";
      const hhOut = String(effectiveClockOutTime.getHours()).padStart(2, "0");
      const mmOut = String(effectiveClockOutTime.getMinutes()).padStart(2, "0");
      const ssOut = String(effectiveClockOutTime.getSeconds()).padStart(2, "0");  // Include seconds

      const result = evaluateAttendanceStatus(clockInTime, effectiveClockOutTime);
      setAttendanceResult(result);
      setAttendanceStatus(result.status);
      localStorage.setItem(`attendanceStatus_${userId}`, result.status);

      const payload = {
        date: clockInTime && isValidDate(clockInTime) ? clockInTime.toISOString() : nowDt.toISOString(),
        checkOut: {
          time: `${hhOut}:${mmOut}:${ssOut}`,  // HH:mm:ss
          note: note || "",
        }
      };

      try {
        await axios.post("http://localhost:8000/api/attendance", payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setIsClockedIn(false);
        setClockInTime(null);
        setTimer(0);
        setNote("");
        localStorage.removeItem(`isClockedIn_${userId}`);
        localStorage.removeItem(`clockInTime_${userId}`);
        localStorage.removeItem(`timer_${userId}`);
        localStorage.removeItem(`secondHalfAutoClockOut_${userId}`);
        localStorage.removeItem(`autoClockOut_${userId}`);
        stopBackgroundTimer(userId);
        const today = new Date().toISOString().split("T")[0];
        const clockInDateStr = clockInTime && isValidDate(clockInTime) ? clockInTime.toISOString().split("T")[0] : "";
        if (clockInDateStr === today) {
          setTodaysSessions((prev) => {
            const updatedSessions = [
              ...prev.slice(0, -1),
              {
                checkIn: { time: `${hhIn}:${mmIn}`, note: prev[prev.length - 1]?.checkIn?.note || "" },
                checkOut: { time: `${hhOut}:${mmOut}:${ssOut}`, note: note || "" },
              },
            ];
            setMaxSessionsReached(updatedSessions.length >= maxCheckIn);
            return updatedSessions;
          });
        }
        secondHalfAutoClockOutTriggered.current = false;
        setCanClockIn(true);
        setForceRender(prev => prev + 1);
        updateCanClockIn();
      } catch (err) {
        console.error("Clock-out failed", err);
        alert("Clock-out failed: " + (err.response?.data?.message || "Unknown error"));
      }
    }
  };

  const fetchTodaysSessions = async () => {
    try {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = startDate;
      const response = await axios.get(`http://localhost:8000/api/attendance?start=${startDate}&end=${endDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const todaysAttendance = response.data[0] || { sessions: [] };
      const sessions = todaysAttendance.sessions.map((session) => ({
        checkIn: { time: session.checkIn.time || "--:--", note: session.checkIn.note || "" },
        checkOut: session.checkOut?.time ? { time: session.checkOut.time, note: session.checkOut.note || "" } : { time: "" },
      }));
      setTodaysSessions(sessions);
      setMaxSessionsReached(sessions.length >= maxCheckIn);
      const isActiveSession = sessions.some(s => !s.checkOut?.time);
      setIsClockedIn(isActiveSession);
      if (isActiveSession) {
        const activeSession = sessions.find(s => !s.checkOut?.time);
        const timeParts = activeSession.checkIn.time.split(':');
        if (timeParts.length >= 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
          const clockInDateTime = new Date(today);
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;  // Handle optional seconds
          clockInDateTime.setHours(hours, minutes, seconds, 0);
          setClockInTime(clockInDateTime);
          const elapsedSeconds = Math.floor((new Date() - clockInDateTime) / 1000);
          setTimer(elapsedSeconds);
          localStorage.setItem(`isClockedIn_${userId}`, JSON.stringify(true));
          localStorage.setItem(`clockInTime_${userId}`, clockInDateTime.toISOString());
          localStorage.setItem(`timer_${userId}`, elapsedSeconds.toString());
          startBackgroundTimer(userId, setTimer);

          const shiftEnd = parseTimeToDate(endTime, clockInDateTime);
          const autoThreshold = shiftEnd ? new Date(Math.max(clockInDateTime.getTime(), shiftEnd.getTime()) + autoClockOutTimeSetByUser * 60 * 1000) : null;
          setAutoClockOutTime(autoThreshold);
        } else {
          console.error("Invalid checkIn.time format in active session:", activeSession.checkIn.time);
          setClockInTime(null);
          setTimer(0);
          setIsClockedIn(false);
          localStorage.removeItem(`isClockedIn_${userId}`);
          localStorage.removeItem(`clockInTime_${userId}`);
          localStorage.removeItem(`timer_${userId}`);
          stopBackgroundTimer(userId);
        }
      } else {
        setClockInTime(null);
        setTimer(0);
        setLateMessage(false);
        localStorage.removeItem(`isClockedIn_${userId}`);
        localStorage.removeItem(`clockInTime_${userId}`);
        localStorage.removeItem(`timer_${userId}`);
        localStorage.removeItem(`lateMessage_${userId}`);
        localStorage.removeItem(`autoClockOut_${userId}`);
        localStorage.removeItem(`secondHalfAutoClockOut_${userId}`);
        stopBackgroundTimer(userId);
        secondHalfAutoClockOutTriggered.current = false;
        setForceRender(prev => prev + 1);
        updateCanClockIn();
      }
    } catch (error) {
      console.error("Error fetching today's sessions:", error);
      setTodaysSessions([]);
      setMaxSessionsReached(false);
    }
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

        const filteredHolidays = companyId
          ? holidayRes?.data?.filter(holiday => holiday?.companyId === companyId)
          : [];
        
        const normalizedHolidays = filteredHolidays.map(holiday => ({
          ...holiday,
          date: isValidDate(holiday.date) ? new Date(holiday.date).toLocaleDateString('en-CA') : null,
        })).filter(holiday => holiday.date);

        const filteredLeavesbyCompanyId = companyId ? leavesRes?.data?.filter(leave => leave?.employeeId.split("-")[0] === companyId) : [];
        
        const normalizedLeaves = filteredLeavesbyCompanyId.map(leave => ({
          ...leave,
          startDate: isValidDate(leave.startDate) ? new Date(leave.startDate).toLocaleDateString('en-CA') : null,
          endDate: isValidDate(leave.endDate) ? new Date(leave.endDate).toLocaleDateString('en-CA') : null,
        })).filter(leave => leave.startDate && leave.endDate);
        
        setShiftTiming(userAssignedSetting || {});
        setHolidays(normalizedHolidays);
        setUpcomingLeaves(normalizedLeaves);
        setAllUsers(allUsersRes.data);
        setForceRender(prev => prev + 1);
        setMaxSessionsReached(todaysSessions.length >= (userAssignedSetting?.maxCheckIn ?? 2));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setShiftTiming({});
      setHolidays([]);
      setUpcomingLeaves([]);
      setAllUsers([]);
      setMaxSessionsReached(false);
      setForceRender(prev => prev + 1);
    }
  };

  useEffect(() => {
    fetchAttendanceSettingData();
    fetchTodaysSessions();
    const interval = setInterval(fetchTodaysSessions, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (endTime && userId) {
      const [hours, minutes] = endTime.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const today = new Date();
        const autoOutTime = new Date(today);
        autoOutTime.setHours(hours, minutes + autoClockOutTimeSetByUser, 0, 0);
        setAutoClockOutTime(isValidDate(autoOutTime) ? autoOutTime : null);
      }
    }
  }, [endTime, userId, autoClockOutTimeSetByUser]);

  useEffect(() => {
    let timeoutId;
    if (isClockedIn && autoClockOutTime && isValidDate(autoClockOutTime)) {
      const timeUntilAuto = autoClockOutTime.getTime() - Date.now();
      if (timeUntilAuto > 0) {
        timeoutId = setTimeout(() => {
          handleAutoClockOut();
        }, timeUntilAuto);
      } else {
        handleAutoClockOut();
      }
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isClockedIn, autoClockOutTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const leaveStatus = isTodayOnApprovedLeave();
      if (isClockedIn && leaveStatus.isOnLeave && leaveStatus.duration === "Second Half") {
        const halfDayMark = parseTimeToDate(halfDayMarkTime);
        if (halfDayMark && now >= halfDayMark && !secondHalfAutoClockOutTriggered.current) {
          handleAutoClockOutForSecondHalf();
          secondHalfAutoClockOutTriggered.current = true;
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isClockedIn, halfDayMarkTime, upcomingLeaves]);

  const handleAutoClockOut = async () => {
    if (!clockInTime || !userId || !endTime || !secondHalfMarkTime || !isValidDate(clockInTime)) return;

    if (localStorage.getItem(`autoClockOut_${userId}`) === 'true') return;

    const now = new Date();
    const timeSinceCheckIn = (now - new Date(clockInTime)) / (1000 * 60);

    if (timeSinceCheckIn < 5) {
      return;
    }

    const shiftEnd = parseTimeToDate(endTime, clockInTime);
    const autoClockOutThreshold = shiftEnd ? new Date(Math.max(clockInTime.getTime(), shiftEnd.getTime()) + autoClockOutTimeSetByUser * 60 * 1000) : null;
    if (!autoClockOutThreshold || now < autoClockOutThreshold) {
      return;
    }

    const effectiveClockOutTime = parseTimeToDate(
      todaysSessions.length === 0 ? endTime : secondHalfMarkTime,
      clockInTime
    );

    const leaveStatus = isTodayOnApprovedLeave();
    let clockOutNote = "Auto clock-out";

    if (leaveStatus.isOnLeave && leaveStatus.duration === "Second Half") {
      const halfDayMark = parseTimeToDate(halfDayMarkTime, clockInTime);
      if (halfDayMark && now >= halfDayMark) {
        effectiveClockOutTime.setTime(halfDayMark.getTime());
        clockOutNote = "Auto clock-out due to Second Half leave";
      }
    }

    if (!effectiveClockOutTime || !isValidDate(effectiveClockOutTime)) return;

    const hhOut = String(effectiveClockOutTime.getHours()).padStart(2, "0");
    const mmOut = String(effectiveClockOutTime.getMinutes()).padStart(2, "0");
    const ssOut = "00";  // Set seconds to 00 for auto clock-out

    const result = evaluateAttendanceStatus(clockInTime, effectiveClockOutTime);
    setAttendanceResult(result);
    setAttendanceStatus(result.status);

    const payload = {
      date: clockInTime.toISOString(),
      checkOut: {
        time: `${hhOut}:${mmOut}:${ssOut}`,
        note: clockOutNote,
      },
    };

    try {
      await axios.post("http://localhost:8000/api/attendance", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setIsClockedIn(false);
      setClockInTime(null);
      setTimer(0);
      setNote("");
      localStorage.removeItem(`isClockedIn_${userId}`);
      localStorage.removeItem(`clockInTime_${userId}`);
      localStorage.removeItem(`timer_${userId}`);
      localStorage.setItem(`autoClockOut_${userId}`, 'true');
      localStorage.removeItem(`secondHalfAutoClockOut_${userId}`);
      stopBackgroundTimer(userId);
      const today = new Date().toISOString().split("T")[0];
      const clockInDateStr = clockInTime.toISOString().split("T")[0];
      if (clockInDateStr === today) {
        setTodaysSessions((prev) => {
          const updatedSessions = [...prev];
          const lastSession = updatedSessions[updatedSessions.length - 1];
          if (lastSession && !lastSession.checkOut.time) {
            lastSession.checkOut = { time: `${hhOut}:${mmOut}:${ssOut}`, note: clockOutNote };
          }
          return updatedSessions;
        });
        setMaxSessionsReached(todaysSessions.length >= maxCheckIn);
      }
      secondHalfAutoClockOutTriggered.current = false;
      setCanClockIn(true);
      setForceRender(prev => prev + 1);
      updateCanClockIn();
    } catch (err) {
      console.error("Auto clock-out failed", err);
    }
  };

  const handleAutoClockOutForSecondHalf = async () => {
    if (!clockInTime || !userId || !isValidDate(clockInTime)) return;

    const now = new Date();
    const timeSinceCheckIn = (now - new Date(clockInTime)) / (1000 * 60);

    if (timeSinceCheckIn < 5) {
      return;
    }

    const halfDayMark = parseTimeToDate(halfDayMarkTime);
    const effectiveClockOutTime = halfDayMark;

    if (!effectiveClockOutTime || !isValidDate(effectiveClockOutTime)) return;

    const hhOut = String(effectiveClockOutTime.getHours()).padStart(2, "0");
    const mmOut = String(effectiveClockOutTime.getMinutes()).padStart(2, "0");
    const ssOut = "00";  // Set seconds to 00 for auto clock-out

    const result = evaluateAttendanceStatus(clockInTime, effectiveClockOutTime);
    setAttendanceResult(result);
    setAttendanceStatus(result.status);

    const payload = {
      date: clockInTime.toISOString(),
      checkOut: {
        time: `${hhOut}:${mmOut}:${ssOut}`,
        note: "Auto clock-out due to Second Half leave",
      },
    };

    try {
      await axios.post("http://localhost:8000/api/attendance", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setIsClockedIn(false);
      setClockInTime(null);
      setTimer(0);
      setNote("");
      localStorage.removeItem(`isClockedIn_${userId}`);
      localStorage.removeItem(`clockInTime_${userId}`);
      localStorage.removeItem(`timer_${userId}`);
      localStorage.setItem(`secondHalfAutoClockOut_${userId}`, JSON.stringify(true));
      stopBackgroundTimer(userId);
      const today = new Date().toISOString().split("T")[0];
      const clockInDateStr = clockInTime.toISOString().split("T")[0];
      if (clockInDateStr === today) {
        setTodaysSessions((prev) => {
          const updatedSessions = [...prev];
          const lastSession = updatedSessions[updatedSessions.length - 1];
          if (lastSession && !lastSession.checkOut.time) {
            lastSession.checkOut = { time: `${hhOut}:${mmOut}:${ssOut}`, note: "Auto clock-out due to Second Half leave" };
          }
          return updatedSessions;
        });
        setMaxSessionsReached(todaysSessions.length >= maxCheckIn);
      }
      setCanClockIn(false);
      setClockInAvailableText("Clock-in disabled: On Second Half leave");
      setForceRender(prev => prev + 1);
    } catch (err) {
      console.error("Auto clock-out for Second Half failed", err);
    }
  };

  const countLeaveDaysInSelectedWeek = (leaves, weekStart, weekEnd) => {
    const filteredLeaves = leaves.filter(leave => {
      if (leave.status !== "Approved") return false;
      if (leave.teamEmail !== userEmail) return false;
      return true;
    });

    let totalLeaveDays = 0;
    filteredLeaves.forEach(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      
      if (!isValidDate(leaveStart) || !isValidDate(leaveEnd)) return;

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

  const countHolidayDaysInSelectedWeek = (holidays, weekStart, weekEnd) => {
    let holidayDays = 0;
    holidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      if (!isValidDate(holidayDate)) return;
      if (holidayDate >= weekStart && holidayDate <= weekEnd) {
        holidayDays += 1;
      }
    });

    return holidayDays;
  };

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

  const updateCanClockIn = () => {
    const now = new Date();
    const leaveStatus = isTodayOnApprovedLeave();
    const isHoliday = isTodayHoliday();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    let canClock = true;

    if (isHoliday) {
      canClock = false;
    } else if (leaveStatus.isOnLeave) {
      if (leaveStatus.duration === "First Half") {
        const halfDayMark = parseTimeToDate(halfDayMarkTime, now);
        canClock = halfDayMark && now >= halfDayMark;
      } else if (leaveStatus.duration === "Second Half") {
        const halfDayMark = parseTimeToDate(halfDayMarkTime, now);
        canClock = halfDayMark && now < halfDayMark && !secondHalfAutoClockOutTriggered.current;
      } else {
        canClock = false;
      }
    } else if (!isTodayWorkingDay()) {
      canClock = false;
    } else if (todaysSessions.length >= maxCheckIn) {
      canClock = false;
    } else {
      const isAfterEndTime =
        currentHours > END_HOUR || (currentHours === END_HOUR && currentMinutes >= END_MIN);
      const isAtOrAfterStartTime =
        currentHours > CLOCK_IN_HOUR || (currentHours === CLOCK_IN_HOUR && currentMinutes >= CLOCK_IN_MIN);
      canClock = isAtOrAfterStartTime && !isAfterEndTime && !isClockedIn;
    }

    setCanClockIn(canClock);

    if (isHoliday) {
      const todayHoliday = holidays.find(holiday => {
        try {
          const holidayDate = new Date(holiday.date);
          if (!isValidDate(holidayDate)) return false;
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
    } else if (todaysSessions.length >= maxCheckIn) {
      setClockInAvailableText(`Clock-in disabled: Maximum ${maxCheckIn} sessions reached`);
    } else if (!startTime || !endTime) {
      setClockInAvailableText('Your shift timings have not been assigned yet');
    } else {
      const isAfterEndTime =
        currentHours > END_HOUR || (currentHours === END_HOUR && currentMinutes >= END_MIN);
      const isNewDay = currentHours < CLOCK_IN_HOUR || (currentHours === CLOCK_IN_HOUR && currentMinutes < CLOCK_IN_MIN);    
      if (isAfterEndTime && !isNewDay) {
        setClockInAvailableText(`Clock-in available tomorrow at ${startTime}`);
      } else if (isClockedIn) {
        setClockInAvailableText('You are currently clocked in');
      } else {
        setClockInAvailableText(`Clock-in available at ${startTime}`);
      }
    }
  };

  useEffect(() => {
    updateCanClockIn();
    const interval = setInterval(updateCanClockIn, 10000); // 10 seconds interval
    return () => clearInterval(interval);
  }, [startTime, endTime, CLOCK_IN_HOUR, CLOCK_IN_MIN, END_HOUR, END_MIN, holidays, upcomingLeaves, workingDays, todaysSessions, forceRender, isClockedIn, maxCheckIn]);

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
        dateTime,
        allUsers,
      }}
    >
      {children}
    </ClockInContext.Provider>
  );
};

export const useClockInContext = () => useContext(ClockInContext);