import React, { useEffect, useState } from "react";
import AttendanceNavbar from "../pages/AttendanceNavbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Attendance.css";
import { useClockInContext } from "../context/ClockInContext";

const Attendance = ({ isNested }) => {
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    showCalendar,
    setShowCalendar,
    summaryData,
    isClockedIn,
    timer,
    todaysSessions,
    maxSessionsReached,
    formatDateDisplay,
    openModal,
    calculateHoursWorked,
    formatTimer,
    shiftWeek,
    canClockIn,
    isCurrentWeek,
    clockInAvailableText,
    startTime,
    endTime,
    shiftName,
    days,
    handleClockButtonClick,
    formatTo12Hour,
    holidays,
    upcomingLeaves,
    fetchAttendanceSettingData,
    userId,
    halfDayMarkTime,
    dateTime
  } = useClockInContext();

  useEffect(() => {
    fetchAttendanceSettingData();
  }, [userId, dateTime]);

  const userEmail = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")).email : null;

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

  const getHolidayLabel = (entryDate) => {
    const entryDateObj = new Date(entryDate);
    const entryDateStr = `${entryDateObj.getFullYear()}-${String(entryDateObj.getMonth() + 1).padStart(2, '0')}-${String(entryDateObj.getDate()).padStart(2, '0')}`;

    const holiday = holidays.find((h) => {
      const holidayDateObj = new Date(h.date);
      const holidayDateStr = `${holidayDateObj.getFullYear()}-${String(holidayDateObj.getMonth() + 1).padStart(2, '0')}-${String(holidayDateObj.getDate()).padStart(2, '0')}`;
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

  // Filter unique sessions for today's sessions
  const getUniqueTodaySessions = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const uniqueSessions = [];
    const seenTimes = new Set();

    // Assuming todaysSessions are tied to the current day, filter by date and unique times
    const todayEntry = days.find((entry) => {
      const entryDateObj = new Date(entry.fullDate);
      const entryDateStr = `${entryDateObj.getFullYear()}-${String(entryDateObj.getMonth() + 1).padStart(2, '0')}-${String(entryDateObj.getDate()).padStart(2, '0')}`;
      return entryDateStr === todayStr;
    });

    if (todayEntry && todayEntry.sessions) {
      for (let i = todayEntry.sessions.length - 1; i >= 0; i--) {
        const session = todayEntry.sessions[i];
        const timeKey = `${session.checkIn?.time}-${session.checkOut?.time}`;
        if (!seenTimes.has(timeKey)) {
          seenTimes.add(timeKey);
          uniqueSessions.unshift(session);
        }
      }
    }

    return uniqueSessions;
  };

  const uniqueTodaySessions = getUniqueTodaySessions();

  return (
    <div className="attendance-page-wrapper">
      {!isNested && <AttendanceNavbar />}
      <div className="attendance-container">
        {/* Week navigation */}
        {!isNested && (
          <div className="attendance-date-range-container">
            <button className="attendance-nav-arrow" onClick={() => shiftWeek(-1)}>
              {"<"}
            </button>
            <div
              className="attendance-date-range clickable"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <i className="fa fa-calendar" style={{ marginRight: 8 }} />
              {formatDateDisplay(startDate)} – {formatDateDisplay(endDate)}
            </div>
            <button className="attendance-nav-arrow" onClick={() => shiftWeek(1)}>
              {">"}
            </button>
            {showCalendar && (
              <div className="attendance-calendar-popover">
                <DatePicker
                  selected={startDate}
                  inline
                  onChange={(d) => {
                    const ns = new Date(d);
                    ns.setHours(0, 0, 0, 0);
                    const ne = new Date(ns);
                    ne.setDate(ns.getDate() + 6);
                    ne.setHours(23, 59, 59, 999);
                    setStartDate(ns);
                    setEndDate(ne);
                    setShowCalendar(false);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Clock In / Out */}
        {!isNested && (
          <div className="attendance-controls">
            <div className="shift-info">{shiftName} [ {startTime} – {endTime} ]</div>
            <div>
              {isClockedIn ? (
                <div className={!isClockedIn ? "attendance-checkout-box-hide" : "attendance-checkout-box"}>
                  Clocked In<br />
                  {formatTimer(timer)}
                  <br />
                  {/* <button onClick={handleClockButtonClick}>Clock Out</button> */}
                </div>
              ) : (
                <>
                  <span
                    // onClick={handleClockButtonClick}
                    disabled={!canClockIn || maxSessionsReached || !isCurrentWeek}
                    className={!canClockIn || maxSessionsReached || !isCurrentWeek ? "disabled-button" : ""}
                  >
                    {!canClockIn
                      ? clockInAvailableText
                      : maxSessionsReached
                      ? "Max Sessions Reached"
                      : ""}
                  </span>
                  {uniqueTodaySessions.length > 0 && (
                    <div style={{ marginTop: 8 }} className="attendance-checkout-box" >
                      <strong>Today's Sessions:</strong>
                      {uniqueTodaySessions.map((session, i) => (
                        <div key={i}>
                          {formatTo12Hour(session.checkIn?.time)} -{" "}
                          {formatTo12Hour(session.checkOut?.time)}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Weekly records */}
        <div className="attendance-week-records">
          {days.map((entry, idx) => {            
            const holidayLabel = getHolidayLabel(entry.fullDate);
            const leaveLabel = getLeaveLabel(entry.fullDate);

            // Filter unique sessions based on checkIn and checkOut times
            const uniqueSessions = [];
            const seenTimes = new Set();
            for (let i = entry.sessions.length - 1; i >= 0; i--) {
              const session = entry.sessions[i];
              const timeKey = `${session.checkIn?.time}-${session.checkOut?.time}`;
              if (!seenTimes.has(timeKey)) {
                seenTimes.add(timeKey);
                uniqueSessions.unshift(session);
              }
            }

            // Calculate total hours from unique sessions
            const totalDec = uniqueSessions.reduce((tot, s) => {
              const [h, m] = calculateHoursWorked(s.checkIn?.time, s.checkOut?.time)
                .split(":")
                .map(Number);
              return tot + h + m / 60;
            }, 0);
            const hh = Math.floor(totalDec);
            const mm = Math.round((totalDec - hh) * 60);
            const totalHours = `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;

            // Check if there is an open session (clocked in but not clocked out)
            const hasOpenSession = entry.isToday && isClockedIn && uniqueSessions.some(s => s.checkIn?.time && !s.checkOut?.time);

            return (
              <div
                key={idx}
                className={`attendance-day-row clickable ${entry.isToday ? "current-day" : ""}`}
                onClick={() => openModal(entry)}
              >
                <div className="attendance-day-label">
                  <div
                    className={`attendance-day-circle ${entry.isToday ? "current-day-circle" : ""}`}
                  >
                    {entry.date}
                  </div>
                  <div>{entry.day}</div>
                </div>
                <div className="attendance-dot-track">
                  <span className="attendance-dot" />
                  <span className="attendance-dot" />
                </div>
                <div className="attendance-time-info">
                  {holidayLabel ? (
                    <span className="attendance-cyan">{holidayLabel}</span>
                  ) : leaveLabel ? (
                    <span className="attendance-yellow">{leaveLabel}</span>
                  ) : hasOpenSession ? (
                    <span className="attendance-green">Clocked In</span>
                  ) : uniqueSessions.length > 0 ? (
                    <span className="attendance-green">Attendance</span>
                  ) : (
                    <span className="attendance-gray">Not Clocked In</span>
                  )}
                  <br />
                  <div className="attendance-sessions">
                    {uniqueSessions.map((s, i) => (
                      s.checkIn?.time && s.checkOut?.time && (
                        <div key={i} className="attendance-session-with-late">
                          <div className="attendance-session">
                            {formatTo12Hour(s.checkIn?.time)} --{" "}
                            {formatTo12Hour(s.checkOut?.time)}
                            <span className="attendance-session-hours">
                              ({calculateHoursWorked(s.checkIn?.time, s.checkOut?.time)})
                            </span>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
                <div className="attendance-hours-info">Total: {totalHours}</div>
              </div>
            );
          })}
        </div>

        {/* Summary footer */}
        <div className="attendance-footer-summary">
          <div>
            Working Days <span className="attendance-blue">{summaryData.payableDays} Days</span>
          </div>
          <div>
            Present <span className="attendance-green">{summaryData.presentDays === "0.0" ? "0" : summaryData.presentDays} Days</span>
          </div>
          <div>
            Leave
            <span className="attendance-yellow"> {summaryData.paidLeaveDays} Days</span>
          </div>
          <div>
            Holidays <span className="attendance-cyan">{summaryData.holidayDays} Days</span>
          </div>
          <div>
            Weekend <span className="attendance-gray">{summaryData.weekendDays} Days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;