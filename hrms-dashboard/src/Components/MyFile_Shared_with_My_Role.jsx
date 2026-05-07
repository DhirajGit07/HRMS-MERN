
import './FileSavePage.css'; // Make sure to create this CSS file
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation,useNavigate } from 'react-router-dom';

// import './AllNavBar.css';
import userlogo from '../assets/user logo.jpg';
import OverviewProfile from '../assets/OverviewProfile.jpg';
import searchImg from '../assets/search.png';
import phoneIcon from '../assets/phoneIcon.png';
import settingIcon from '../assets/settings.png';
import notification from '../assets/Notification.png';
import FileSavePageNavbar from './FileSavePageNavbar';
const FileSavePage = () => {
   const navigate = useNavigate();


  return (
    <div className="page-wrapper">
      <FileSavePageNavbar/>
      

      
<div className="file-actions-bar">
        <button className="manage-button" onClick={() => navigate('/inner-employee-file')}>Manage</button>
        <button className="icon-button">
          <img src={require('../assets/listIcon.png')} alt="List View" />
        </button>
        <button className="icon-button">
          <img src={require('../assets/folderIcon.png')} alt="Folder View" />
        </button>
        <button className="icon-button">
          <img src={require('../assets/filterIcon.png')} alt="Filter" />
        </button>
      </div>
      <div className="shared-box">
        <div className="shared-content">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
            alt="No files"
            className="empty-icon"
          />
          <p className="empty-title">No shared files to display</p>
          <p className="empty-subtitle">
            Files shared to you by other employees will be listed here
          </p>
        </div>
      </div>
      
    </div>
  );

};

export default FileSavePage;
