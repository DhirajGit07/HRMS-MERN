import React, { useState, useEffect } from "react";
import "./ShiftSchedule.css";
import axios from "axios";
import AttendanceNavbar from "../pages/AttendanceNavbar";
import { useClockInContext } from "../context/ClockInContext";

// Utility: format a Date or ISO/date-string into local 'YYYY-MM-DD'
const formatToLocalDateString = (input) => {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// Utility: compare two dates (Date or string) by local 'YYYY-MM-DD'
const isSameLocalDate = (a, b) => {
    if (!a || !b) return false;
    return formatToLocalDateString(a) === formatToLocalDateString(b);
};

// Helper: format a time string which may be "HH:mm" or ISO datetime into local "HH:mm"
const formatToLocalTime = (timeStr, dateObj = null) => {
    if (!timeStr) return "--:--";
    if (timeStr.includes("T")) {
        const d = new Date(timeStr);
        if (!isNaN(d.getTime())) {
            return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
        }
    }
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
        const hh = parseInt(parts[0], 10);
        const mm = parseInt(parts[1], 10);
        if (!isNaN(hh) && !isNaN(mm)) {
            const d = new Date(dateObj || new Date());
            d.setHours(hh, mm, 0, 0);
            return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
        }
    }
    return timeStr;
};

// Compute summary for a given date and its sessions
const getFirstAndThirdSummary = (sessions, dateObj) => {
    if (!Array.isArray(sessions) || sessions.length === 0 || !dateObj) return null;

    const parseTimeToDate = (timeStr, dateObj) => {
        if (!timeStr) return null;
        if (timeStr.includes("T")) {
            const d = new Date(timeStr);
            if (!isNaN(d.getTime())) return d;
        }
        const parts = timeStr.split(":");
        if (parts.length >= 2) {
            const hh = parseInt(parts[0], 10);
            const mm = parseInt(parts[1], 10);
            if (!isNaN(hh) && !isNaN(mm)) {
                return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), hh, mm, 0, 0);
            }
        }
        return null;
    };

    // Filter unique sessions based on checkIn and checkOut times
    const uniqueSessions = [];
    const seenTimes = new Set();
    for (let i = sessions.length - 1; i >= 0; i--) {
        const session = sessions[i];
        const timeKey = `${session.checkIn?.time}-${session.checkOut?.time}`;
        if (!seenTimes.has(timeKey)) {
            seenTimes.add(timeKey);
            uniqueSessions.unshift(session);
        }
    }

    const firstInRaw = uniqueSessions[0]?.checkIn?.time;
    const firstInDate = parseTimeToDate(firstInRaw, dateObj);
    const firstClockIn = firstInDate
        ? firstInDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
        : "--:--";

    let outDate = null;
    if (uniqueSessions.length >= 3) {
        const raw = uniqueSessions[2]?.checkOut?.time;
        outDate = parseTimeToDate(raw, dateObj);
    }
    if (!outDate) {
        const raw = uniqueSessions[uniqueSessions.length - 1]?.checkOut?.time;
        outDate = parseTimeToDate(raw, dateObj);
    }
    const thirdClockOut = outDate
        ? outDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
        : "--:--";

    let totalMs = 0;
    uniqueSessions.forEach((session) => {
        const inRaw = session.checkIn?.time;
        const outRaw = session.checkOut?.time;
        const inDate = parseTimeToDate(inRaw, dateObj);
        const outDate2 = parseTimeToDate(outRaw, dateObj);
        if (inDate && outDate2 && !isNaN(inDate.getTime()) && !isNaN(outDate2.getTime())) {
            totalMs += outDate2 - inDate;
        }
    });
    const totalH = totalMs / (1000 * 60 * 60);
    const hPart = Math.floor(totalH);
    const mPart = Math.round((totalH - hPart) * 60);
    const totalHoursStr = `${String(hPart).padStart(2, "0")}:${String(mPart).padStart(2, "0")}`;

    return {
        firstClockIn,
        thirdClockOut,
        totalHours: totalHoursStr,
        sessionCount: uniqueSessions.length,
    };
};

const AttendanceShift = () => {
    const { holidays, upcomingLeaves, userId, halfDayMarkTime, startTime, workingDays } =
        useClockInContext();

    const userEmail = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")).email : null;    

    const [showModal, setShowModal] = useState(false);
    const [isMonthlyView, setIsMonthlyView] = useState(false);
    const [month, setMonth] = useState(new Date());
    const [weekStartDate, setWeekStartDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [sessionFilter, setSessionFilter] = useState("all");
    const [summaryData, setSummaryData] = useState({
        workingDays: 0,
        presentDays: 0,
        leaveDays: 0,
        holidayDays: 0,
    });
    

    const closeModal = () => {
        setShowModal(false);
        setSelectedDay(null);
        setSessionFilter("all");
    };

    const handleViewToggle = (view) => {
        setIsMonthlyView(view === "monthly");
    };

    const handleMonthChange = (direction) => {
        const newMonth = new Date(month);
        newMonth.setMonth(newMonth.getMonth() + direction);
        newMonth.setDate(1);
        setMonth(newMonth);
    };

    const handleWeekChange = (direction) => {
        const newWeekStart = new Date(weekStartDate);
        newWeekStart.setDate(newWeekStart.getDate() + 7 * direction);
        setWeekStartDate(newWeekStart);
    };

    const getWeekDates = () => {
        const base = new Date(weekStartDate);
        const dayIndex = base.getDay();
        const sunday = new Date(base);
        sunday.setDate(base.getDate() - dayIndex);
        sunday.setHours(0, 0, 0, 0);
        const arr = [];
        for (let i = 0; i < 7; i++) {
            const dt = new Date(sunday);
            dt.setDate(sunday.getDate() + i);
            dt.setHours(0, 0, 0, 0);
            arr.push(dt);
        }
        return arr;
    };

    const getMonthDateRange = () => {
        const y = month.getFullYear();
        const m = month.getMonth();
        const first = new Date(y, m, 1);
        const last = new Date(y, m + 1, 0);
        first.setHours(0, 0, 0, 0);
        last.setHours(0, 0, 0, 0);
        return { first, last };
    };

    const formatDate = (date) => {
        return date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getRangeText = () => {
        if (isMonthlyView) {
            const { first, last } = getMonthDateRange();
            return `${formatDate(first)} - ${formatDate(last)}`;
        } else {
            const w = getWeekDates();
            return `${formatDate(w[0])} - ${formatDate(w[6])}`;
        }
    };

    const parseTimeToDate = (timeStr, baseDate = new Date()) => {
        if (!timeStr) return null;
        const [timePart, modifier] = timeStr.includes(" ") ? timeStr.split(" ") : [timeStr, ""];
        let [hours, minutes] = timePart.split(":").map(Number);
        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
        const date = new Date(baseDate);
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    const getHolidayLabel = (entryDate) => {
        const entryDateObj = new Date(entryDate);
        const entryDateStr = formatToLocalDateString(entryDateObj);

        const holiday = holidays.find((h) => {
            const holidayDateObj = new Date(h.date);
            const holidayDateStr = formatToLocalDateString(holidayDateObj);
            return holidayDateStr === entryDateStr;
        });

        return holiday ? `Holiday: ${holiday.label}` : null;
    };

    const getLeaveLabel = (entryDate) => {
        const entryDateObj = new Date(entryDate);
        if (isNaN(entryDateObj)) return null;
        const entryDateStr = `${entryDateObj.getFullYear()}-${String(entryDateObj.getMonth() + 1).padStart(2, '0')}-${String(entryDateObj.getDate()).padStart(2, '0')}`;
        
        const isToday = entryDateObj.toDateString() === new Date().toDateString();
        const now = new Date();
        const halfDayMark = parseTimeToDate(halfDayMarkTime, now);
        
        const leave = upcomingLeaves.find((leave) => {
            if (leave.status !== "Approved" || leave.teamEmail !== userEmail) return false;
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);
            if (isNaN(leaveStart) || isNaN(leaveEnd)) return false;
            const leaveStartStr = `${leaveStart.getFullYear()}-${String(leaveStart.getMonth() + 1).padStart(2, '0')}-${String(leaveStart.getDate()).padStart(2, '0')}`;
            const leaveEndStr = `${leaveEnd.getFullYear()}-${String(leaveEnd.getMonth() + 1).padStart(2, '0')}-${String(leaveEnd.getDate()).padStart(2, '0')}`;
            return entryDateStr >= leaveStartStr && entryDateStr <= leaveEndStr;
        });
        
        if (!leave) return null;
        
        if (isToday) {
            if (leave.duration === "First Half" && halfDayMark && now >= halfDayMark) {
                return null; 
            }
            if (leave.duration === "Second Half" && halfDayMark && now <= halfDayMark) {
                return null; 
            }
        }
        return `${leave.duration}: ${leave.leaveType}`;
    };

    const countWorkingDays = (start, end) => {
        const effectiveWorkingDays = workingDays.length > 0 ? workingDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        let count = 0;
        const current = new Date(start);
        while (current <= end) {
            const dayName = current.toLocaleDateString("en-US", { weekday: "long" });
            if (effectiveWorkingDays.includes(dayName)) count++;
            current.setDate(current.getDate() + 1);
        }
        return count;
    };

    const countHolidayDays = (start, end) => {
        let count = 0;
        holidays.forEach((holiday) => {
            const holidayDate = new Date(holiday.date);
            if (holidayDate >= start && holidayDate <= end) count++;
        });
        return count;
    };

    const countLeaveDays = (start, end) => {
        let totalLeaveDays = 0;

        upcomingLeaves.forEach((leave) => {
            if (leave.status !== "Approved" || leave.teamEmail !== userEmail) return;
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);
            if (isNaN(leaveStart) || isNaN(leaveEnd)) return;

            const startBound = leaveStart <= start ? start : leaveStart;
            const endBound = leaveEnd >= end ? end : leaveEnd;

            if (startBound <= endBound) {
                const startDate = new Date(startBound.setHours(0, 0, 0, 0));
                const endDate = new Date(endBound.setHours(0, 0, 0, 0));

                let days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                if (leave.duration === "First Half" || leave.duration === "Second Half") {
                    days = Math.min(days, 0.5);
                }
                totalLeaveDays += days;
            }
        });
        return totalLeaveDays;
    };

    const countPresentDays = (attendanceData) => {
        let presentDays = 0;
        attendanceData.forEach((log) => {
            const sessions = log.sessions || [];
            // Filter unique sessions based on checkIn and checkOut times
            const uniqueSessions = [];
            const seenTimes = new Set();
            for (let i = sessions.length - 1; i >= 0; i--) {
                const session = sessions[i];
                const timeKey = `${session.checkIn?.time}-${session.checkOut?.time}`;
                if (!seenTimes.has(timeKey)) {
                    seenTimes.add(timeKey);
                    uniqueSessions.unshift(session);
                }
            }
            // Count present days based on the last unique session
            const lastSession = uniqueSessions[uniqueSessions.length - 1];
            if (lastSession) {
                if (lastSession.attendanceType === "present" || lastSession.attendanceType === "late") {
                    presentDays += 1;
                } else if (lastSession.attendanceType === "firstHalf" || lastSession.attendanceType === "secondHalf") {
                    presentDays += 0.5;
                }
            }
        });
        return presentDays.toFixed(1);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let startDate, endDate;
                if (isMonthlyView) {
                    const { first, last } = getMonthDateRange();
                    startDate = first;
                    endDate = last;
                } else {
                    const w = getWeekDates();
                    startDate = w[0];
                    endDate = w[6];
                }
                const startStr = formatToLocalDateString(startDate);
                const endStr = formatToLocalDateString(endDate);
                const response = await axios.get("http://localhost:8000/api/attendance", {
                    params: { start: startStr, end: endStr, userId },
                });
                setAttendanceData(response.data || []);

                // Calculate summary data
                const workingDaysCount = countWorkingDays(startDate, endDate);
                const holidayDays = countHolidayDays(startDate, endDate);
                const leaveDays = countLeaveDays(startDate, endDate);
                const presentDays = countPresentDays(response.data || []);

                setSummaryData({
                    workingDays: workingDaysCount - holidayDays,
                    presentDays,
                    leaveDays,
                    holidayDays,
                });
            } catch (err) {
                console.error("Error fetching attendance data:", err);
                setAttendanceData([]);
                setSummaryData({
                    workingDays: 0,
                    presentDays: 0,
                    leaveDays: 0,
                    holidayDays: 0,
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isMonthlyView, month, weekStartDate, holidays, upcomingLeaves, userId, workingDays]);

    const openSessionModal = (dateObj, sessions) => {
        setSelectedDay({ date: dateObj, sessions });
        setShowModal(true);
    };

    return (
        <div>
            <AttendanceNavbar />
            <div className="schedule-container">
                {/* Toolbar */}
                <div className="shift-toolbar">
                    <div className="toolbar-section-left-controls">
                        {!isMonthlyView ? (
                            <button className="arrow-btn" onClick={() => handleWeekChange(-1)}>
                                ‹
                            </button>
                        ) : (
                            <button className="arrow-btn" onClick={() => handleMonthChange(-1)}>
                                ‹
                            </button>
                        )}
                        <button className="calendar-btn">📅</button>
                        {!isMonthlyView ? (
                            <button className="arrow-btn" onClick={() => handleWeekChange(1)}>
                                ›
                            </button>
                        ) : (
                            <button className="arrow-btn" onClick={() => handleMonthChange(1)}>
                                ›
                            </button>
                        )}
                    </div>
                    <div className="toolbar-section center-range">
                        <button className="date-picker-btn">
                            <i className="fa fa-calendar"></i>
                            <span className="date-text">{getRangeText()}</span>
                        </button>
                    </div>
                    <div className="toolbar-section right-controls">
                        <div className="view-toggle">
                            <button
                                className={`view-btn ${!isMonthlyView ? "active" : ""}`}
                                onClick={() => handleViewToggle("weekly")}
                            >
                                Weekly
                            </button>
                            <button
                                className={`view-btn ${isMonthlyView ? "active" : ""}`}
                                onClick={() => handleViewToggle("monthly")}
                            >
                                Monthly
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-indicator">
                        <div className="spinner"></div>Loading...
                    </div>
                ) : (
                    <>
                        {isMonthlyView ? (
                            <MonthlyShiftView
                                month={month}
                                attendanceData={attendanceData}
                                getHolidayLabel={getHolidayLabel}
                                getLeaveLabel={getLeaveLabel}
                                openSessionModal={openSessionModal}
                            />
                        ) : (
                            <WeeklyShiftView
                                weekDates={getWeekDates()}
                                attendanceData={attendanceData}
                                getHolidayLabel={getHolidayLabel}
                                getLeaveLabel={getLeaveLabel}
                                openSessionModal={openSessionModal}
                            />
                        )}
                        <div className="attendance-footer-summary">
                            <div>
                                Working Days{" "}
                                <span className="attendance-blue">{summaryData.workingDays} Days</span>
                            </div>
                            <div>
                                Present{" "}
                                <span className="attendance-green">
                                    {summaryData.presentDays === "0.0" ? "0" : summaryData.presentDays} Days
                                </span>
                            </div>
                            <div>
                                Leave{" "}
                                <span className="attendance-yellow">{summaryData.leaveDays} Days</span>
                            </div>
                            <div>
                                Holidays{" "}
                                <span className="attendance-cyan">{summaryData.holidayDays} Days</span>
                            </div>
                        </div>
                    </>
                )}

                {showModal && !selectedDay && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="assign-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Assign Shift</h3>
                                <button className="close-btn" onClick={closeModal}>
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                <label>Shift Name</label>
                                <select>
                                    <option>Select</option>
                                    <option>9:00 AM - 6:00 PM</option>
                                </select>
                                <label>Dates</label>
                                <div className="date-inputs">
                                    <input type="date" placeholder="dd-MMM-yyyy" />
                                    <input type="date" placeholder="dd-MMM-yyyy" />
                                </div>
                                <label>Reason</label>
                                <input type="text" placeholder="Reason" />
                            </div>
                            <div className="modal-footer">
                                <button className="submit-btn">Submit</button>
                                <button className="cancel-btn" onClick={closeModal}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const WeeklyShiftView = ({ weekDates, attendanceData, getHolidayLabel, getLeaveLabel, openSessionModal }) => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const times = ["08 AM", "09 AM", "10 AM", "11 AM", "12 PM", "01 PM", "02 PM", "03 PM", "04 PM", "05 PM", "06 PM"];

    const getAttendanceForDate = (dateObj) => {
        return attendanceData.find((entry) => isSameLocalDate(entry.date, dateObj));
    };

    const todayLocal = new Date();
    todayLocal.setHours(0, 0, 0, 0);

    return (
        <div className="weekly-view-container">
            <div className="time-labels">
                {times.map((t) => (
                    <div className="time-slot" key={t}>
                        {t}
                    </div>
                ))}
            </div>

            {weekDates.map((dateObj, idx) => {
                const attendance = getAttendanceForDate(dateObj);
                const isToday = todayLocal.getTime() === dateObj.getTime();
                const summary = attendance ? getFirstAndThirdSummary(attendance.sessions, dateObj) : null;
                const holidayLabel = getHolidayLabel(dateObj);
                const leaveLabel = getLeaveLabel(dateObj);
                const hasActiveSession = attendance?.sessions.some(
                    (session) => session.checkIn?.time && !session.checkOut?.time
                );

                return (
                    <div
                        key={idx}
                        className={`day-entry ${isToday ? "today" : ""}`}
                        onClick={() => attendance && openSessionModal(dateObj, attendance.sessions)}
                    >
                        <div className="day-label">
                            <div>{dayNames[dateObj.getDay()]}</div>
                            <div className="day-number">{dateObj.getDate()}</div>
                        </div>
                        <div className="shift-box">
                            {attendance?.sessions.length > 0 ? (
                                hasActiveSession ? (
                                    <div className="no-attendance attendance-green">
                                        Clocked In
                                    </div>
                                ) : (
                                    <>
                                        <div className="shift-title">Attendance</div>
                                        <div className="session-time summary-time">
                                            <div className="clock-labels">
                                                <span className="clock-in-label">Clock In:</span>
                                                <span className="clock-in-time">{summary.firstClockIn}</span>
                                                <span className="clock-out-label">Clock Out:</span>
                                                <span className="clock-out-time">{summary.thirdClockOut}</span>
                                            </div>
                                        </div>
                                        <div className="weekly-total-hours">
                                            Total Worked Hours: {summary.totalHours}
                                        </div>
                                    </>
                                )
                            ) : holidayLabel ? (
                                <div className="no-attendance attendance-cyan" title={holidayLabel}>
                                    {holidayLabel}
                                </div>
                            ) : leaveLabel ? (
                                <div className="no-attendance attendance-yellow" title={leaveLabel}>
                                    {leaveLabel}
                                </div>
                            ) : (
                                <div className="no-attendance attendance-gray">--:-- - --:--</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const MonthlyShiftView = ({ month, attendanceData, getHolidayLabel, getLeaveLabel, openSessionModal }) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const year = month.getFullYear();
    const monIndex = month.getMonth();

    const startDayIndex = new Date(year, monIndex, 1).getDay();
    const daysInMonth = new Date(year, monIndex + 1, 0).getDate();
    const grid = [];

    for (let i = 0; i < startDayIndex; i++) {
        grid.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, monIndex, d);
        dt.setHours(0, 0, 0, 0);
        grid.push(dt);
    }

    const todayLocal = new Date();
    todayLocal.setHours(0, 0, 0, 0);

    const getAttendanceForDate = (dateObj) => {
        return attendanceData.find((entry) => isSameLocalDate(entry.date, dateObj));
    };

    return (
        <div className="monthly-view">
            <div className="calendar-header">
                {days.map((day) => (
                    <div key={day} className="calendar-day-name">
                        {day}
                    </div>
                ))}
            </div>
            <div className="shift-calendar-grid">
                {grid.map((dateObj, idx) => {
                    const dayOfWeek = idx % 7;
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    if (dateObj === null) {
                        return <div key={idx} className="calendar-cell empty"></div>;
                    }
                    const isToday = todayLocal.getTime() === dateObj.getTime();
                    const attendance = getAttendanceForDate(dateObj);
                    const summary = attendance ? getFirstAndThirdSummary(attendance.sessions, dateObj) : null;
                    const holidayLabel = getHolidayLabel(dateObj);
                    const leaveLabel = getLeaveLabel(dateObj);
                    const hasActiveSession = attendance?.sessions.some(
                        (session) => session.checkIn?.time && !session.checkOut?.time
                    );

                    return (
                        <div
                            key={idx}
                            className={`calendar-cell ${isWeekend ? "weekend" : ""} ${isToday ? "today" : ""}`}
                            onClick={() => attendance && openSessionModal(dateObj, attendance.sessions)}
                        >
                            <div className="date-number">{dateObj.getDate()}</div>
                            {attendance?.sessions.length > 0 ? (
                                hasActiveSession ? (
                                    <div className="no-attendance-small attendance-green">
                                        Clocked In
                                    </div>
                                ) : (
                                    <div className="shift-box-m">
                                        <div className="shift-title">
                                            <span className="clock-in-label">Clock In:</span>
                                            <span className="clock-in-time">{summary.firstClockIn}</span>
                                            <br />
                                            <span className="clock-out-label">Clock Out:</span>
                                            <span className="clock-out-time">{summary.thirdClockOut}</span>
                                        </div>
                                        <br />
                                        <div className="total-hours-small">
                                            Total Worked Hours: {summary.totalHours}
                                        </div>
                                    </div>
                                )
                            ) : holidayLabel ? (
                                <div className="no-attendance-small attendance-cyan" title={holidayLabel}>
                                    {holidayLabel}
                                </div>
                            ) : leaveLabel ? (
                                <div className="no-attendance-small attendance-yellow" title={leaveLabel}>
                                    {leaveLabel}
                                </div>
                            ) : (
                                <div className="no-attendance-small attendance-gray"></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AttendanceShift;