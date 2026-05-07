import React, { useState, useEffect, useRef } from 'react';
import './InnerHR_Forms_Templates.css';
import InnerFileSaveNavbar from '../pages/InnerFileSaveNavbar';
import bot from '../assets/bot.png';
import warningIcon from '../assets/warning-icon.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { BsThreeDots } from 'react-icons/bs';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const InnerHR_Forms_Templates = () => {
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({ file: null, fileName: '', description: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);

  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [uploadedBy, setUploadedBy] = useState('');

  useEffect(() => {
    const fetchHRForms = async () => {
      try {
        const profileRes = await axios.get('http://localhost:8000/api/users/profile');
        const usersRes = await axios.get('http://localhost:8000/api/users');
        const hrFormsRes = await axios.get('http://localhost:8000/api/hr-forms');

        const profile = profileRes.data;
        const allUsers = usersRes.data;

        const match = allUsers.find(u => u.email?.toLowerCase() === profile.email?.toLowerCase());

        const name = (profile.firstName && profile.lastName) 
          ? `${profile.firstName} ${profile.lastName}`
          : match?.fullname || 'Unknown';
        const empId = match?.candidateId || match?.employeeId || 'N/A';
        const compId = profile.companyId || '';

        setEmployeeName(name);
        setEmployeeId(match?.employeeId);
        setCompanyId(compId);
        setUploadedBy(`${name} (${empId})`);

        // Filter HR forms: Only those where employeeId starts with companyId
        const filteredFiles = hrFormsRes.data.filter(f => f.employeeId?.startsWith(compId));
        setFiles(filteredFiles);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching HR forms or profile:', error);
        setIsLoading(false);
      }
    };

    fetchHRForms();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveMenuIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      // Check file size (10MB limit)
      if (selected.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 10MB.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        return;
      }
      
      // Update form data with the selected file
      setFormData({ ...formData, file: selected });
      
      // Show success toast when file is selected
      toast.success('File selected successfully!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = {};
    if (!formData.file) validationErrors.file = "File is required";
    if (!formData.fileName.trim()) validationErrors.fileName = "File name is required";
    if (!formData.description.trim()) validationErrors.description = "Description is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      await Swal.fire({
        title: 'Missing Information',
        html: Object.values(validationErrors).map(error => `<div>• ${error}</div>`).join(''),
        icon: 'error',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    const saveConfirmation = await Swal.fire({
      title: 'Save HR Form',
      text: 'Do you want to save this file?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!saveConfirmation.isConfirmed) return;

    try {
      Swal.fire({
        title: 'Saving...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const formDataToSend = new FormData();
      formDataToSend.append('file', formData.file);
      formDataToSend.append('fileName', formData.fileName);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('uploadedBy', uploadedBy);
      formDataToSend.append('employeeName', employeeName);
      formDataToSend.append('employeeId', employeeId);

      const response = await axios.post('http://localhost:8000/api/hr-forms', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await Swal.fire({
        title: 'Saved!',
        text: 'HR form has been saved successfully',
        icon: 'success',
        confirmButtonColor: '#3085d6',
      });

      setFiles([response.data, ...files]);
      setIsDrawerOpen(false);
      setFormData({ file: null, fileName: '', description: '' });
      setErrors({});
    } catch (error) {
      console.error('Error saving HR form:', error);
      await Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to save HR form',
        icon: 'error',
        confirmButtonColor: '#3085d6',
      });
    }
  };

  const handleDeleteFile = async (idx) => {
    try {
      const fileToDelete = files[idx];

      // Optimistic UI update - remove the file immediately
      setFiles(files.filter((f) => f._id !== fileToDelete._id));
      setConfirmDeleteIndex(null);
      setActiveMenuIndex(null);

      await axios.delete(`http://localhost:8000/api/hr-forms/${fileToDelete._id}`, {
        withCredentials: true
      });

      // Show success toast
      toast.success('HR Form deleted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

    } catch (err) {
      // Revert UI if deletion fails
      const hrFormsRes = await axios.get('http://localhost:8000/api/hr-forms');
      const filteredFiles = hrFormsRes.data.filter(f => f.employeeId?.startsWith(companyId));
      setFiles(filteredFiles);

      // Show error toast
      toast.error(err.response?.data?.message || 'Failed to delete HR Form', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  return (
    <div className="hrft-page-wrapper">
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

      {files.length === 0 ? (
        <div className="hrft-empty-box">
          <div className="hrft-empty-content">
            <img src={bot} alt="No HR forms" className="hrft-empty-icon" />
            <p className="hrft-empty-title">No HR Forms Added</p>
            <p className="hrft-empty-subtitle">Upload important HR forms and templates that can be shared across the organization.</p>
            <button className="hrft-upload-button" onClick={() => setIsDrawerOpen(true)}>Add HR Forms</button>
          </div>
        </div>
      ) : (
        <div className="hrft-table-wrapper">
          <div className="hrft-table-header">
            <button className="hrft-upload-button" onClick={() => setIsDrawerOpen(true)}>Add HR Forms</button>
          </div>

          <div className="hrft-scrollable-container">
            <table className="hrft-file-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Uploaded By</th>
                  <th>Description</th>
                  <th>Updated On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, index) => (
                  <tr key={file._id}>
                    <td>
                      <div className="hrft-file-name">
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/337/337946.png"
                          alt="File"
                          style={{ width: '20px', marginRight: '8px' }}
                        />
                        {file.name}
                        <div className="hrft-file-date">Created on {formatDate(file.createdAt)}</div>
                      </div>
                    </td>
                    <td>{file.employeeName}</td>
                    <td>{file.description}</td>
                    <td>{formatDate(file.updatedAt)}</td>
                    <td className="hrft-action-cell">
                      <div className="hrft-action-menu-wrapper" ref={activeMenuIndex === index ? dropdownRef : null}>
                        <button className="hrft-action-btn" onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuIndex(activeMenuIndex === index ? null : index);
                        }}>
                          …
                        </button>
                        {activeMenuIndex === index && (
                          <div className="hrft-dropdown-menu">
                            <a
                              href={`http://localhost:8000/api/hr-forms/download/${file._id}`}
                              download={file.name}
                              className="hrft-dropdown-item"
                              onClick={() => {
                                toast.info(`Downloading "${file.name}"...`, {
                                  position: "top-right",
                                  autoClose: 2000,
                                  hideProgressBar: false,
                                  closeOnClick: true,
                                  pauseOnHover: true,
                                  draggable: true,
                                });
                              }}
                            >
                              Download
                            </a>
                            <div
                              className="hrft-dropdown-item hrft-delete-red"
                              onClick={() => setConfirmDeleteIndex(index)}
                            >
                              Delete
                            </div>
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

      {isDrawerOpen && (
        <div className="hrft-drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div className="hrft-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="hrft-drawer-header">
              <h2>Add HR Form</h2>
              <button className="hrft-close-button" onClick={() => setIsDrawerOpen(false)}>×</button>
            </div>

            <div className="hrft-drawer-scrollable">
              <div className="hrft-drawer-content">
                <label>Uploaded by</label>
                <input type="text" value={uploadedBy} readOnly style={{ marginBottom: '10px' }} />

                <label className="hrft-upload-label">Upload file</label>
                <div className="hrft-upload-box" onClick={() => document.getElementById('fileInput').click()}>
                  {formData.file ? `📄 ${formData.file.name}` : '📁 Desktop / Others'}
                </div>
                <input
                  type="file"
                  id="fileInput"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  style={{ display: 'none' }}
                />

                <label className="hrft-required-field">File name</label>
                <input
                  type="text"
                  placeholder="Enter a name for the file"
                  value={formData.fileName}
                  name="fileName"
                  onChange={handleInputChange}
                  className={errors.fileName ? 'hrft-error-input' : ''}
                />
                {errors.fileName && <span className="hrft-error-text">{errors.fileName}</span>}

                <label className="hrft-required-field">Description</label>
                <textarea
                  placeholder="Enter description"
                  value={formData.description}
                  name="description"
                  onChange={handleInputChange}
                  className={errors.description ? 'hrft-error-input' : ''}
                  rows="4"
                />
                {errors.description && <span className="hrft-error-text">{errors.description}</span>}
              </div>
            </div>

            <div className="hrft-actions">
              <button className="hrft-save-btn" onClick={handleSubmit}>Save</button>
              <button className="hrft-cancel-btn" onClick={() => setIsDrawerOpen(false)}>Cancel</button>

            </div>
          </div>
        </div>
      )}

      {confirmDeleteIndex !== null && (
        <div className="hrft-modal-overlay">
          <div className="hrft-modal-content">
            <img src={warningIcon} alt="warning" className="hrft-warning-icon" />
            <h3>DELETE RECORD</h3>
            <p>Are you sure you want to delete this record?</p>
            <div className="hrft-modal-actions">
              <button
                className="hrft-cancel-btn"
                onClick={() => setConfirmDeleteIndex(null)}
              >
                Cancel
              </button>
              <button
                className="hrft-confirm-btn"
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

export default InnerHR_Forms_Templates;