import './FileSavePage.css';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import InnerFileSaveNavbar from '../pages/InnerFileSaveNavbar';
import OrganizationFileDrawer from './OrganizationFileDrawer';
import bot from '../assets/bot.png';
import warningIcon from '../assets/warning-icon.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const InnerOrganizationFile = () => {
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const menuRef = useRef(null);

  // ✅ Get token and set headers
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // ✅ Fetch profile (to get companyId) and employees
  useEffect(() => {
    const fetchProfileAndEmployees = async () => {
      try {
        const [profileRes, usersRes] = await Promise.all([
          axios.get('http://localhost:8000/api/users/profile'),
          axios.get('http://localhost:8000/api/users')
        ]);
        
        setCompanyId(profileRes.data.companyId || '');
        setCompanyName(profileRes.data.companyName || '');
        setEmployees(usersRes.data);
      } catch (err) {
        console.error('Profile or users fetch error:', err);
      }
    };
    fetchProfileAndEmployees();
  }, []);

  // ✅ Fetch organization files
  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('http://localhost:8000/api/files/organization-files');
      setFiles(res.data);
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Initial file fetch after profile
  useEffect(() => {
    if (companyId) {
      fetchFiles();
    }
  }, [companyId]);

  // ✅ Refetch when drawer closes
  useEffect(() => {
    if (!isDrawerOpen && companyId) {
      fetchFiles();
    }
  }, [isDrawerOpen, companyId]);

  // ✅ Filter only files matching current company
  const filteredFiles = files.filter(
    (file) => file.employeeId?.startsWith(companyId)
  );

  // ✅ Function to get employee names from IDs
  const getEmployeeNames = (ids) => {
    if (!ids || ids === 'All') return 'All Employees';
    
    const arr = ids.split(',').map((i) => i.trim()).filter(Boolean);
    const names = arr
      .map((id) => employees.find((e) => e._id === id))
      .filter(Boolean)
      .map((e) => e.firstName && e.lastName ? `${e.firstName} ${e.lastName}` : e.fullname);
    
    return names.length ? `${names.join(', ')} (${names.length})` : 'No Employees';
  };

  // ✅ Download function (same as InnerEmployeeFile)
  const handleDownloadFile = async (fileId, fileName) => {
    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = `http://localhost:8000/api/files/download/${fileId}`;
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

  const handleFileUpload = async (newFile) => {
    try {
      setFiles((prev) => [newFile, ...prev]);
      setIsDrawerOpen(false);
      await fetchFiles();
    } catch (err) {
      console.error('Upload handler error:', err);
      setFiles((prev) => prev.filter((f) => f._id !== newFile._id));
    }
  };

  const handleDeleteFile = async (idx) => {
    try {
      const fileToDelete = filteredFiles[idx];
      setFiles((prev) => prev.filter((f) => f._id !== fileToDelete._id));
      setActiveMenuIndex(null);
      setConfirmDeleteIndex(null);
      
      await axios.delete(
        `http://localhost:8000/api/files/organization-files/${fileToDelete._id}`
      );
      
      await fetchFiles();
      
      toast.success('File deleted successfully', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      console.error('Delete error:', err);
      await fetchFiles();
      toast.error('Failed to delete file', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  // ✅ Dropdown close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuIndex(null);
      }
    };
    if (activeMenuIndex !== null)
      document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuIndex]);

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
      {isLoading || !companyId ? (
        <div className="loading-indicator"></div>
      ) : filteredFiles.length === 0 ? (
        <div className="shared-box">
          <div className="shared-content">
            <img src={bot} alt="No files" className="empty-icon" />
            <p className="empty-title">No organization files found</p>
            <button
              className="InnerOrganizationFile-upload-button"
              onClick={() => setIsDrawerOpen(true)}
            >
              Add Organization Files
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrapper-or">
          <div className="table-header">
            <button
              className="InnerOrganizationFile-upload-button"
              onClick={() => setIsDrawerOpen(true)}
            >
              Add Organization Files
            </button>
          </div>

          <div className="scrollable-table-container-or">
            <table className="InnerOrganizationFile-file-table">
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
                {filteredFiles.map((file, index) => (
                  <tr key={file._id}>
                    <td>
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/337/337946.png"
                        alt="File"
                        style={{ width: '20px', marginRight: '8px' }}
                      />
                      {file.originalName || file.name}
                    </td>
                    <td>{file.employeeName || 'Unknown'}</td>
                    <td>{getEmployeeNames(file.sharedWith)}</td>
                    <td>{file.folder || '-'}</td>
                    <td>{new Date(file.updatedAt).toLocaleDateString()}</td>
                    <td className="InnerOrganizationFile-action-cell">
                      <div
                        className="InnerOrganizationFile-action-menu-wrapper"
                        ref={activeMenuIndex === index ? menuRef : null}
                      >
                        <button
                          className="InnerOrganizationFile-dots-button"
                          onClick={() =>
                            setActiveMenuIndex(
                              activeMenuIndex === index ? null : index
                            )
                          }
                        >
                          ...
                        </button>
                        {activeMenuIndex === index && (
                          <div className="InnerOrganizationFile-dropdown-menu">
                            <button
                              className="InnerOrganizationFile-dropdown-item"
                              onClick={() => handleDownloadFile(file._id, file.name)}
                            >
                              Download
                            </button>
                            <button
                              className="InnerOrganizationFile-dropdown-item"
                              style={{ color: 'red' }}
                              onClick={() => setConfirmDeleteIndex(index)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <OrganizationFileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onFileUpload={handleFileUpload}
      />

      {confirmDeleteIndex !== null && (
        <div className="file-modal-overlay">
          <div className="file-modal-content">
            <img src={warningIcon} alt="Warning" className="file-warning-icon" />
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

export default InnerOrganizationFile;