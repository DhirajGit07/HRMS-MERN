// ShiftSchedule.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./ShiftSchedule.css";
import LeavePageLayout from "./LeavePageLayout";
import LeaveTrackerNavbar from "../pages/LeaveTrackerNavbar";

// Utility: format a Date or date-string into local 'YYYY-MM-DD'
const formatToLocalDateString = (input) => {
    const d = (input instanceof Date) ? input : new Date(input);
    // Use local year/month/day
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Utility: compare two dates (Date or date-string) by local 'YYYY-MM-DD'
const isSameLocalDate = (a, b) => {
    return formatToLocalDateString(a) === formatToLocalDateString(b);
};

// Utility: compute daily attendance summary from sessions array
// sessions: [ { checkIn: { time: ISO-string }, checkOut: { time: ISO-string } }, ... ]
const getDailyAttendanceSummary = (sessions) => {
    if (!Array.isArray(sessions) || sessions.length === 0) {
        return null;
    }
    let firstClockInDate = null;
    let lastClockOutDate = null;
    let totalMilliseconds = 0;

    sessions.forEach(session => {
        const inRaw = session.checkIn?.time;
        const outRaw = session.checkOut?.time;
        if (!inRaw || !outRaw) return;
        const inDate = new Date(inRaw);
        const outDate = new Date(outRaw);
        if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) return;
        if (!firstClockInDate || inDate < firstClockInDate) {
            firstClockInDate = inDate;
        }
        if (!lastClockOutDate || outDate > lastClockOutDate) {
            lastClockOutDate = outDate;
        }
        totalMilliseconds += (outDate - inDate);
    });

    const formatTime = (dateObj) => {
        if (!dateObj) return "--:--";
        return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const totalHoursFloat = totalMilliseconds / (1000 * 60 * 60);
    const hoursPart = Math.floor(totalHoursFloat);
    const minutesPart = Math.round((totalHoursFloat - hoursPart) * 60);
    const totalHoursStr = `${String(hoursPart).padStart(2,'0')}:${String(minutesPart).padStart(2,'0')}`;

    return {
        firstClockIn: formatTime(firstClockInDate),
        lastClockOut: formatTime(lastClockOutDate),
        totalHours: totalHoursStr,
        sessionCount: sessions.length
    };
};

const ShiftSchedule = () => {
    const [showModal, setShowModal] = useState(false);
    const [isMonthlyView, setIsMonthlyView] = useState(false);
    // Initialize month and weekStartDate as desired. Example: May 2025
    const [month, setMonth] = useState(new Date(2025, 4, 1)); // May 1, 2025 local
    const [weekStartDate, setWeekStartDate] = useState(new Date(2025, 4, 11)); // a date in desired week
    const [attendanceData, setAttendanceData] = useState([]); // fetched array
    const [loading, setLoading] = useState(false);

    const openModal = () => setShowModal(true);
    const closeModal = () => setShowModal(false);

    // Toolbar labels (if you want time-grid header)
    const times = [
        "08 AM", "09 AM", "10 AM", "11 AM", "12 PM",
        "01 PM", "02 PM", "03 PM", "04 PM", "05 PM", "06 PM"
    ];

    const handleViewToggle = (view) => {
        setIsMonthlyView(view === "monthly");
    };

    // Navigate months
    const handleMonthChange = (direction) => {
        const newMonth = new Date(month);
        newMonth.setMonth(newMonth.getMonth() + direction);
        newMonth.setDate(1); // ensure first day
        setMonth(newMonth);
    };

    // Navigate weeks
    const handleWeekChange = (direction) => {
        const newWeekStart = new Date(weekStartDate);
        newWeekStart.setDate(newWeekStart.getDate() + (7 * direction));
        setWeekStartDate(newWeekStart);
    };

    // Compute local weekDates array (Sunday→Saturday) at local midnight
    const getWeekDates = () => {
        const base = new Date(weekStartDate);
        const dayIndex = base.getDay(); // 0=Sun..6=Sat
        const sunday = new Date(base);
        sunday.setDate(base.getDate() - dayIndex);
        sunday.setHours(0,0,0,0,0);
        const arr = [];
        for (let i = 0; i < 7; i++) {
            const dt = new Date(sunday);
            dt.setDate(sunday.getDate() + i);
            dt.setHours(0,0,0,0,0);
            arr.push(dt);
        }
        return arr;
    };

    // Compute local month date range
    const getMonthDateRange = () => {
        const y = month.getFullYear();
        const m = month.getMonth();
        const first = new Date(y, m, 1);
        const last = new Date(y, m + 1, 0);
        first.setHours(0,0,0,0,0);
        last.setHours(0,0,0,0,0);
        return { first, last };
    };

    // Format display date for toolbar
    const formatDateDisplay = (date) => {
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getRangeText = () => {
        if (isMonthlyView) {
            const { first, last } = getMonthDateRange();
            return `${formatDateDisplay(first)} - ${formatDateDisplay(last)}`;
        } else {
            const w = getWeekDates();
            return `${formatDateDisplay(w[0])} - ${formatDateDisplay(w[6])}`;
        }
    };

    // Fetch attendanceData whenever view or period changes
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
                // Convert to local YYYY-MM-DD
                const startStr = formatToLocalDateString(startDate);
                const endStr = formatToLocalDateString(endDate);
                // Adjust API URL & params as needed
                const response = await axios.get('http://localhost:8000/api/attendance', {
                    params: { start: startStr, end: endStr }
                });
                setAttendanceData(response.data || []);
            } catch (err) {
                console.error("Error fetching attendance data:", err);
                setAttendanceData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isMonthlyView, month, weekStartDate]);

    return (
        <div>
            <LeaveTrackerNavbar />
            <LeavePageLayout>
                <div className="schedule-container">
                    {/* Toolbar */}
                    <div className="shift-toolbar">
                        <div className="toolbar-section-left-controls">
                            {!isMonthlyView ? (
                                <button className="arrow-btn" onClick={() => handleWeekChange(-1)}>‹</button>
                            ) : (
                                <button className="arrow-btn" onClick={() => handleMonthChange(-1)}>‹</button>
                            )}
                            <button className="calendar-btn">📅</button>
                            {!isMonthlyView ? (
                                <button className="arrow-btn" onClick={() => handleWeekChange(1)}>›</button>
                            ) : (
                                <button className="arrow-btn" onClick={() => handleMonthChange(1)}>›</button>
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
                                    className={`view-btn ${!isMonthlyView ? 'active' : ''}`}
                                    onClick={() => handleViewToggle("weekly")}
                                >
                                    Weekly
                                </button>
                                <button
                                    className={`view-btn ${isMonthlyView ? 'active' : ''}`}
                                    onClick={() => handleViewToggle("monthly")}
                                >
                                    Monthly
                                </button>
                            </div>
                            <button className="assign-btn" onClick={openModal}>Assign shift</button>
                            <MoreMenu />
                        </div>
                    </div>

                    {/* Main Content */}
                    {loading ? (
                        <div className="loading-indicator">Loading...</div>
                    ) : (
                        <>
                            {isMonthlyView ? (
                                <MonthlyShiftView
                                    month={month}
                                    attendanceData={attendanceData}
                                    getDailyAttendanceSummary={getDailyAttendanceSummary}
                                />
                            ) : (
                                <WeeklyShiftView
                                    weekDates={getWeekDates()}
                                    attendanceData={attendanceData}
                                    getDailyAttendanceSummary={getDailyAttendanceSummary}
                                />
                            )}
                        </>
                    )}

                    {/* Assign Shift Modal (skeleton) */}
                    {showModal && (
                        <div className="modal-overlay" onClick={closeModal}>
                            <div className="assign-modal" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>Assign shift</h3>
                                    <button className="close-btn" onClick={closeModal}>×</button>
                                </div>
                                <div className="modal-body">
                                    <label>Shift name</label>
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
                                    <button className="cancel-btn" onClick={closeModal}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </LeavePageLayout>
        </div>
    );
};

// Weekly view component
const WeeklyShiftView = ({ weekDates, attendanceData, getDailyAttendanceSummary }) => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    // Optional: time labels header
    const times = [
        "08 AM", "09 AM", "10 AM", "11 AM", "12 PM",
        "01 PM", "02 PM", "03 PM", "04 PM", "05 PM", "06 PM"
    ];

    // Find attendance entry matching local date
    const getAttendanceForDate = (date) => {
        return attendanceData.find(entry =>
            isSameLocalDate(entry.date, date)
        );
    };

    // Today at local midnight
    const todayLocal = new Date();
    todayLocal.setHours(0,0,0,0,0);

    return (
        <div className="weekly-view-container">
            {/* Optional time labels row */}
            <div className="time-labels">
                {times.map(t => (
                    <div className="time-slot" key={t}>{t}</div>
                ))}
            </div>

            {weekDates.map((dateObj, idx) => {
                const attendance = getAttendanceForDate(dateObj);
                const isToday = todayLocal.getTime() === dateObj.getTime();
                const dailySummary = attendance
                    ? getDailyAttendanceSummary(attendance.sessions)
                    : null;

                return (
                    <div key={idx} className={`day-entry ${isToday ? "today" : ""}`}>
                        <div className="day-label">
                            <div>{dayNames[dateObj.getDay()]}</div>
                            <div className="day-number">{dateObj.getDate()}</div>
                        </div>
                        <div className="shift-box">
                            {dailySummary ? (
                                <>
                                    <div className="shift-title">Attendance</div>
                                    <div className="session-time">
                                        {dailySummary.firstClockIn} - {dailySummary.lastClockOut}
                                    </div>
                                    {dailySummary.sessionCount > 1 && (
                                        <div className="session-count">
                                            ({dailySummary.sessionCount} sessions)
                                        </div>
                                    )}
                                    <div className="total-hours">
                                        Total: {dailySummary.totalHours}
                                    </div>
                                </>
                            ) : (
                                <div className="no-attendance">--:-- - --:--</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Monthly view component
const MonthlyShiftView = ({ month, attendanceData, getDailyAttendanceSummary }) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const year = month.getFullYear();
    const monIndex = month.getMonth();

    // Index of weekday for 1st of month
    const startDayIndex = new Date(year, monIndex, 1).getDay();
    const daysInMonth = new Date(year, monIndex + 1, 0).getDate();

    // Build grid: null for empty before 1st, then day numbers
    const grid = [];
    for (let i = 0; i < startDayIndex; i++) {
        grid.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        grid.push(d);
    }

    // Today local midnight
    const todayLocal = new Date();
    todayLocal.setHours(0,0,0,0,0);

    // Find attendance for given year,monthIndex,dayNum
    const getAttendanceForDate = (dayNum) => {
        const dateObj = new Date(year, monIndex, dayNum);
        dateObj.setHours(0,0,0,0,0);
        return attendanceData.find(entry =>
            isSameLocalDate(entry.date, dateObj)
        );
    };

    return (
        <div className="monthly-view">
            <div className="calendar-header">
                {days.map(day => (
                    <div key={day} className="calendar-day-name">{day}</div>
                ))}
            </div>
            <div className="calendar-grid">
                {grid.map((dateOrNull, idx) => {
                    const dayOfWeek = idx % 7;
                    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

                    if (dateOrNull === null) {
                        return (
                            <div key={idx} className="calendar-cell empty"></div>
                        );
                    }
                    const dayNum = dateOrNull;
                    const cellDate = new Date(year, monIndex, dayNum);
                    cellDate.setHours(0,0,0,0,0);
                    const isToday = todayLocal.getTime() === cellDate.getTime();
                    const attendance = getAttendanceForDate(dayNum);
                    const dailySummary = attendance
                        ? getDailyAttendanceSummary(attendance.sessions)
                        : null;

                    return (
                        <div
                            key={idx}
                            className={`calendar-cell ${isWeekend ? "weekend" : ""} ${isToday ? "today" : ""}`}
                        >
                            <div className="date-number">{dayNum}</div>
                            {dailySummary ? (
                                <div className="monthly-attendance-info">
                                    <div className="session-time-small">
                                        {dailySummary.firstClockIn} - {dailySummary.lastClockOut}
                                    </div>
                                    <div className="total-hours-small">
                                        {dailySummary.totalHours}
                                    </div>
                                </div>
                            ) : (
                                <div className="no-attendance-small"></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// MoreMenu component
const MoreMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="more-menu" ref={menuRef}>
            <button className="more-button" onClick={() => setIsOpen(prev => !prev)}>⋮</button>
            {isOpen && (
                <div className="dropdown-menu">
                    <button onClick={() => { /* Export logic */ }}>Export</button>
                    <button onClick={() => { /* Help logic */ }}>Help</button>
                </div>
            )}
        </div>
    );
};

export default ShiftSchedule;
