
import './FileSavePage.css';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import InnerFileSaveNavbar from '../pages/InnerFileSaveNavbar';
import EmployeeFileDrawer from './EmployeeFileDrawer';
import bot from '../assets/bot.png';
import warningIcon from '../assets/warning-icon.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const InnerEmployeeFile = () => {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axios.get('http://localhost:8000/api/users/profile');
        const companyIdFromProfile = profileRes.data.companyId || '';
        setCompanyId(companyIdFromProfile);
        setCompanyName(profileRes.data.companyName || '');

        const [filesRes, usersRes] = await Promise.all([
          axios.get('http://localhost:8000/api/employeeFile/employee-files'),
          axios.get('http://localhost:8000/api/users')
        ]);

        setFiles(filesRes.data);
        setUsers(usersRes.data);
        setEmployees(usersRes.data);
        setError(null);
      } catch (err) {
        console.error('Error:', err.response || err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredFiles = files.filter(file => file.employeeId?.startsWith(companyId));

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

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = `http://localhost:8000/api/employeeFile/download/${fileId}`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success toast
      toast.success('Download started!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
    } catch (err) {
      console.error('Download error:', err);
      
      // Show error toast
      toast.error('Failed to download file', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

 const handleDeleteFile = async (idx) => {
  try {
    const fileToDelete = filteredFiles[idx];
    
    // Optimistic UI update - remove the file immediately
    setFiles(files.filter((f) => f._id !== fileToDelete._id));
    setConfirmDeleteIndex(null);
    setActiveMenuIndex(null);
    
    await axios.delete(`http://localhost:8000/api/employeeFile/${fileToDelete._id}`, {
      withCredentials: true
    });
    
    // Show success toast
    toast.success('File deleted successfully!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
  } catch (err) {
    // Revert UI if deletion fails
    const filesRes = await axios.get('http://localhost:8000/api/employeeFile/employee-files');
    setFiles(filesRes.data);
    
    // Show error toast
    toast.error(err.response?.data?.message || 'Failed to delete file', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
  }
};

  const getEmployeeNames = (ids) => {
    if (!ids) return 'All Employees (0)';
    const arr = ids.split(',').map((i) => i.trim()).filter(Boolean);
    const names = arr
      .map((id) => employees.find((e) => e._id === id))
      .filter(Boolean)
      .map((e) => e.firstName && e.lastName ? `${e.firstName} ${e.lastName}` : e.fullname);
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

  if (loading) {
    return (
      <div className="page-wrapper">
        <InnerFileSaveNavbar />
        <div className="loading-container"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <InnerFileSaveNavbar />
        <div className="error-container">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <InnerFileSaveNavbar />
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

      {filteredFiles.length === 0 ? (
        <div className="shared-box">
          <div className="shared-content">
            <img src={bot} alt="No files" className="empty-icon" />
            <p className="empty-title">No Employee File Added</p>
            <p className="empty-subtitle">Upload confidential documents for specific employees or roles.</p>
            <button className="InnerEmployeeFile-upload-button" onClick={() => setIsDrawerOpen(true)}>
              Add Employee Files
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrapper-ie">
          <div className="table-header">
            <button className="InnerEmployeeFile-upload-button" onClick={() => setIsDrawerOpen(true)}>
              Add Employee Files
            </button>
          </div>

          <div className="scrollable-table-container-ie">
            <table className="InnerEmployeeFile-file-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Uploaded By</th>
                  <th>Shared With</th>
                  <th>Folder</th>
                  <th>Updated On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file, idx) => {
                  const updatedOn = file.updatedAt
                    ? new Date(file.updatedAt).toLocaleDateString('en-US')
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
                      <td>{getEmployeeNames(file.sharedWith)}</td>
                      <td>{file.folder || '-'}</td>
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
                              <button
                                className="InnerEmployeeFile-dropdown-item"
                                onClick={() => handleDownloadFile(file._id, file.name)}
                              >
                                Download
                              </button>
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
      />

      {confirmDeleteIndex !== null && (
        <div className="file-modal-overlay">
          <div className="file-modal-content">
            <img src={warningIcon} alt="warning" className="file-warning-icon" />
            <h3>DELETE RECORD</h3>
            <p>Are you sure you want to delete this record?</p>
            <div className="file-modal-actions">
              <button className="file-cancel-btn" onClick={() => setConfirmDeleteIndex(null)}>
                Cancel
              </button>
              <button className="file-confirm-btn" onClick={() => handleDeleteFile(confirmDeleteIndex)}>
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