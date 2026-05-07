import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaTachometerAlt, FaClock, FaCalendarAlt } from 'react-icons/fa';
import "./SettingSidebar.css";

function SettingSidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const toggle = () => setOpen(!open);
  const close = () => setOpen(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="setting-sidebar-toggle"
        onClick={toggle}
        aria-label="Open settings menu"
      >
        ⋮
      </button>

      {/* Backdrop */}
      {open && <div className="setting-sidebar-backdrop" onClick={close} />}

      <nav className={`setting-sidebar${open ? " open" : ""}`}>
        <ul>
          <li>
            <Link
              to="/setting-sidebar"
              className={isActive("/setting-sidebar") ? "active" : ""}
              onClick={close}
            >
              <FaTachometerAlt className="sidebar-icon" /> Dashboard Configuration
            </Link>
          </li>
          <li>
            <Link
              to="/att-setting"
              className={isActive("/att-setting") ? "active" : ""}
              onClick={close}
            >
              <FaClock className="sidebar-icon" /> Attendance Configuration
            </Link>
          </li>
          <li>
            <Link
              to="/leave-setting"
              className={isActive("/leave-setting") ? "active" : ""}
              onClick={close}
            >
              <FaCalendarAlt className="sidebar-icon" /> Leave Configuration
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default SettingSidebar;
