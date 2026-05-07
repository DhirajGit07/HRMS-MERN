import './FileSavePage.css';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FileSavePageNavbar from '../pages/FileSavePageNavbar';
import EmployeeFileDrawer from './EmployeeFileDrawer';
import bot from '../assets/bot.png';
import warningIcon from '../assets/warning-icon.png';
import { FiSearch } from 'react-icons/fi';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



const InnerEmployeeFile = () => {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [hrForms, setHrForms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHRForms, setShowHRForms] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const menuRef = useRef(null);

  const userData = JSON.parse(localStorage.getItem('userData'));
  const isAdmin = userData?.role === 'Admin';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const profileRes = await axios.get('http://localhost:8000/api/users/profile');
        const companyIdFromProfile = profileRes.data.companyId || '';
        setCompanyId(companyIdFromProfile);
        setCompanyName(profileRes.data.companyName || '');

        const usersRes = await axios.get('http://localhost:8000/api/users');
        setUsers(usersRes.data);
        setEmployees(usersRes.data);

        if (showHRForms) {
          const hrFormsRes = await axios.get('http://localhost:8000/api/hr-forms');
          setHrForms(hrFormsRes.data);
        } else {
          const filesRes = await axios.get('http://localhost:8000/api/employeeFile/employee-files');
          setFiles(filesRes.data);
        }

        setError(null);
      } catch (err) {
        console.error('Error:', err.response || err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showHRForms]);

  const filteredFiles = files.filter((file) =>
    file.employeeId?.startsWith(companyId) &&
    (file.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredHrForms = hrForms.filter((form) =>
    form.employeeId?.startsWith(companyId) &&
    (form.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFileUpload = async () => {
    try {
      const [filesRes, usersRes] = await Promise.all([
        axios.get('http://localhost:8000/api/employeeFile/employee-files'),
        axios.get('http://localhost:8000/api/users')
      ]);
      setFiles(filesRes.data);
      setUsers(usersRes.data);
      setEmployees(usersRes.data);
      setIsDrawerOpen(false);
    } catch (err) {
      console.error('Upload refresh failed', err);
      setIsDrawerOpen(false);
    }
  };

  const handleDeleteFile = async (idx) => {
    try {
      const fileToDelete = currentData[idx];

      // Optimistic UI update - remove the file immediately
      if (showHRForms) {
        setHrForms(prev => prev.filter(f => f._id !== fileToDelete._id));
      } else {
        setFiles(prev => prev.filter(f => f._id !== fileToDelete._id));
      }

      setConfirmDeleteIndex(null);
      setActiveMenuIndex(null);

      // Use correct endpoint based on file type
      const endpoint = showHRForms
        ? `http://localhost:8000/api/hr-forms/${fileToDelete._id}`
        : `http://localhost:8000/api/employeeFile/${fileToDelete._id}`;

      await axios.delete(endpoint, {
        withCredentials: true
      });

      // Show success toast
      toast.success(`${showHRForms ? 'HR Form' : 'File'} deleted successfully!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

    } catch (err) {
      // Revert UI if deletion fails
      try {
        if (showHRForms) {
          const hrFormsRes = await axios.get('http://localhost:8000/api/hr-forms');
          setHrForms(hrFormsRes.data.filter(f => f.employeeId?.startsWith(companyId)));
        } else {
          const filesRes = await axios.get('http://localhost:8000/api/employeeFile/employee-files');
          setFiles(filesRes.data.filter(f => f.employeeId?.startsWith(companyId)));
        }
      } catch (fetchError) {
        console.error('Error refreshing data:', fetchError);
      }

      // Show error toast
      toast.error(err.response?.data?.message || `Failed to delete ${showHRForms ? 'HR form' : 'file'}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });

      console.error('Delete error:', err);
    }
  };

  const getEmployeeNames = (ids) => {
    if (!ids) return 'All Employees (0)';
    const arr = ids.split(',').map((i) => i.trim()).filter(Boolean);
    const names = arr
      .map((id) => employees.find((e) => e._id === id))
      .filter(Boolean)
      .map((e) => e.fullname);
    return names.length ? `${names.join(', ')} (${names.length})` : 'No Employees';
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuIndex(null);
      }
    };
    if (activeMenuIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuIndex]);

  const currentData = showHRForms ? filteredHrForms : filteredFiles;

  return (
    <div className="page-wrapper">
      <FileSavePageNavbar />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="file-actions-bar">
        <div className="file-search-container">
          <FiSearch className="file-search-icon" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="file-search-input"
          />
        </div>
        <button
          className="toggle-view-button"
          onClick={() => setShowHRForms(!showHRForms)}
        >
          {showHRForms ? 'Show Employee Files' : 'Show HR Forms'}
        </button>
        {isAdmin && (
          <button className="manage-button" onClick={() => navigate('/innerfilesave')}>
            Manage
          </button>
        )}
      </div>

      {currentData.length === 0 ? (
        <div className="shared-box">
          <div className="shared-content">
            <img src={bot} alt="No files" className="empty-icon" />
            <p className="empty-title">
              {showHRForms ? 'No HR Forms Added' : 'No Employee File Added'}
            </p>
            <p className="empty-subtitle">
              {showHRForms
                ? 'Upload important HR forms and templates that can be shared across the organization.'
                : 'Upload confidential documents for specific employees or roles.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="scrollable-table-container">
            <table className="InnerEmployeeFile-file-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Uploaded By</th>
                  {!showHRForms && <th>Shared With</th>}
                  {!showHRForms && <th>Folder</th>}
                  <th>Updated On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((file, idx) => {
                  const updatedOn = file.updatedAt
                    ? new Date(file.updatedAt).toLocaleDateString('en-GB')
                    : '-';
                  return (
                    <tr key={file._id}>
                      <td>
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/337/337946.png"
                          alt="file"
                          style={{ width: 20, marginRight: 8 }}
                        />
                        {file.name}
                      </td>
                      <td>{file.employeeName || 'Unknown'}</td>
                      {!showHRForms && <td>{getEmployeeNames(file.sharedWith)}</td>}
                      {!showHRForms && <td>{file.folder || '-'}</td>}
                      <td>{updatedOn}</td>
                      <td className="InnerEmployeeFile-action-cell">
                        <div
                          className="InnerEmployeeFile-action-menu-wrapper"
                          ref={idx === activeMenuIndex ? menuRef : null}
                        >
                          <button
                            className="InnerEmployeeFile-dots-button"
                            onClick={() =>
                              setActiveMenuIndex(idx === activeMenuIndex ? null : idx)
                            }
                          >
                            …
                          </button>
                          {idx === activeMenuIndex && (
                            <div className="InnerEmployeeFile-dropdown-menu">
                              <a
                                href={
                                  showHRForms
                                    ? `http://localhost:8000/api/hr-forms/download/${file._id}`
                                    : `http://localhost:8000/api/employeeFile/download/${file._id}`
                                }
                                download={file.name}
                                className="InnerEmployeeFile-dropdown-item"
                                onClick={(e) => {
                                  // Prevent the menu from closing when clicking download
                                  e.stopPropagation();

                                  // Add a small delay to ensure the download starts before the menu closes
                                  setTimeout(() => {
                                    setActiveMenuIndex(null);
                                  }, 100);
                                }}
                              >
                                Download
                              </a>
                              <button
                                className="InnerEmployeeFile-dropdown-item"
                                style={{ color: 'red' }}
                                onClick={() => setConfirmDeleteIndex(idx)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EmployeeFileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onFileUpload={handleFileUpload}
        isHRForm={showHRForms}
      />

      {confirmDeleteIndex !== null && (
        <div className="file-modal-overlay">
          <div className="file-modal-content">
            <img src={warningIcon} alt="warning" className="file-warning-icon" />
            <h3>DELETE RECORD</h3>
            <p>Are you sure you want to delete this record?</p>
            <div className="file-modal-actions">
              <button
                className="file-cancel-btn"
                onClick={() => setConfirmDeleteIndex(null)}
              >
                Cancel
              </button>
              <button
                className="file-confirm-btn"
                onClick={() => handleDeleteFile(confirmDeleteIndex)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InnerEmployeeFile;