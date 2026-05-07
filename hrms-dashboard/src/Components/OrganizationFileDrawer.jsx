
import React, { useRef, useState, useEffect } from 'react';
import './OrganizationFileDrawer.css';
import axios from 'axios';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const OrganizationFileDrawer = ({ isOpen, onClose, onFileUpload }) => {
  const fileInputRef = useRef(null);
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Form state
  const [selectedFileName, setSelectedFileName] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [folder, setFolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isPolicy, setIsPolicy] = useState(false);
  const [noDeadline, setNoDeadline] = useState(false);
  const [enforceDeadline, setEnforceDeadline] = useState(false);
  const [ackDeadline, setAckDeadline] = useState('');
  const [downloadAccess, setDownloadAccess] = useState(false);
  const [notifyFeed, setNotifyFeed] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(false);

  // Employee selection state
  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeError, setEmployeeError] = useState('');

  // Validation state
  const [fileNameError, setFileNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [userIdentity, setUserIdentity] = useState('');
  const [folderError, setFolderError] = useState('');
  const [ackDeadlineError, setAckDeadlineError] = useState('');

  // Company state
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axios.get('http://localhost:8000/api/users/profile');
        setCompanyName(profileRes.data.companyName || '');
        setCompanyId(profileRes.data.companyId || '');

        const userRes = await axios.get('http://localhost:8000/api/users');
        setAllEmployees(userRes.data);
      } catch (err) {
        console.error('Error:', err.response || err);
      }
    };
    fetchData();
  }, []);

  // Filter employees by company ID when companyId or allEmployees changes
  useEffect(() => {
    if (companyId && allEmployees.length > 0) {
      const filtered = allEmployees.filter(employee =>
        employee.companyId === companyId
      );
      setFilteredEmployees(filtered);
    }
  }, [companyId, allEmployees]);

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        setEmployeeError('');
        const { data } = await axios.get('http://localhost:8000/api/users');
        setAllEmployees(data);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        setEmployeeError('Failed to load employees. Please try again.');
      } finally {
        setLoadingEmployees(false);
      }
    };

    if (isOpen) {
      fetchEmployees();
      fetchUserDetails();
    }
  }, [isOpen]);

  // Fetch user details
  const fetchUserDetails = async () => {
    try {
      const profileRes = await axios.get('http://localhost:8000/api/users/profile');
      const usersRes = await axios.get('http://localhost:8000/api/users');

      const profile = profileRes.data;
      const allUsers = usersRes.data;

      const match = allUsers.find(
        u => u.email?.toLowerCase() === profile.email?.toLowerCase()
      );

      const name = (profile.firstName && profile.lastName) 
        ? `${profile.firstName} ${profile.lastName}`
        : match?.fullname || 'Unknown';
      const empId = match?.candidateId || match?.employeeId || 'N/A';

      setEmployeeName(name);
      setEmployeeId(match?.employeeId);
      setUserIdentity(`${name} (${empId})`);
    } catch (err) {
      console.error('Error fetching user identity:', err);
      setUserIdentity('Unknown (N/A)');
    }
  };

  // Reset form when closing
  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  const resetForm = () => {
    setSelectedFileName('');
    setFile(null);
    setFileName('');
    setDescription('');
    setSelectedEmployees([]);
    setFolder('');
    setExpiryDate('');
    setIsPolicy(false);
    setNoDeadline(false);
    setEnforceDeadline(false);
    setAckDeadline('');
    setDownloadAccess(false);
    setNotifyFeed(false);
    setNotifyEmail(false);
    setFileNameError('');
    setDescriptionError('');
    setFolderError('');
    setAckDeadlineError('');
    setSelectAll(false);
    setDropdownOpen(false);
    setEmployeeError('');
  };

  const isAlphaOnly = (value) => /^[a-zA-Z\s]*$/.test(value);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

   const handleFileChange = (e) => {
  const selected = e.target.files[0];
  if (selected) {
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
    setSelectedFileName(selected.name);
    setFile(selected);
    
    // Optional: Show success toast when file is selected
    toast.success('File selected successfully!', {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: true,
    });
  }
};

  const toggleEmployeeSelection = (employeeId, e) => {
    if (e) e.stopPropagation();
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp._id));
    }
    setSelectAll(!selectAll);
  };

  useEffect(() => {
    if (filteredEmployees.length > 0) {
      setSelectAll(selectedEmployees.length === filteredEmployees.length);
    }
  }, [selectedEmployees, filteredEmployees]);

  const getSelectedEmployeeNames = () => {
    if (selectedEmployees.length === 0) return 'Select employees';
    if (selectedEmployees.length === 1) {
      const emp = filteredEmployees.find(e => e._id === selectedEmployees[0]);
      return emp?.fullname || 'Selected employee';
    }
    if (selectedEmployees.length === filteredEmployees.length) return 'All employees selected';
    return `${selectedEmployees.length} employees selected`;
  };

  const handleSave = async () => {
    // Reset errors
    setFileNameError('');
    setDescriptionError('');
    setFolderError('');
    setAckDeadlineError('');
    setEmployeeError('');

    // Validate inputs
    const errors = [];
    if (!file) errors.push('Please upload a file.');
    if (!fileName.trim()) errors.push('File name is required.');
    if (!isAlphaOnly(fileName)) errors.push('File name must contain only letters and spaces.');
    if (description && !isAlphaOnly(description)) errors.push('Description must contain only letters and spaces.');
    if (selectedEmployees.length === 0) errors.push('Please select at least one employee.');
    if (!folder.trim()) errors.push('Please select a folder.');
    if (enforceDeadline && !noDeadline && !ackDeadline) {
      errors.push('Acknowledgement deadline is required when "Enforce mandatory deadline" is selected.');
    }

    // Show validation errors if any
    if (errors.length > 0) {
      await Swal.fire({
        title: 'Validation Errors',
        html: errors.map(error => `<div>• ${error}</div>`).join(''),
        icon: 'error',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    // Show confirmation dialog
    const confirmResult = await Swal.fire({
      title: 'Confirm Save',
      text: 'Are you sure you want to save this organization file?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, save it!',
      cancelButtonText: 'Cancel'
    });

    // Return if user cancels
    if (!confirmResult.isConfirmed) return;

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', fileName);
    formData.append('description', description);
    formData.append('sharedWith', selectedEmployees.join(','));
    formData.append('folder', folder);
    formData.append('expiryDate', expiryDate);
    formData.append('isPolicy', isPolicy);
    formData.append('noDeadline', noDeadline);
    formData.append('enforceDeadline', enforceDeadline);
    formData.append('ackDeadline', ackDeadline);
    formData.append('downloadAccess', downloadAccess);
    formData.append('notifyFeed', notifyFeed);
    formData.append('notifyEmail', notifyEmail);
    formData.append('employeeName', employeeName);
    formData.append('employeeId', employeeId);
    formData.append('companyId', companyId);

    try {
      // Show loading indicator
      Swal.fire({
        title: 'Saving...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const response = await axios.post(
        'http://localhost:8000/api/files/uploads',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );

      // Prepare complete file data
      const completeFileData = {
        ...response.data,
        _id: response.data._id || Date.now().toString(),
        name: fileName,
        sharedWith: selectedEmployees.join(','),
        folder,
        updatedAt: new Date().toISOString(),
        filePath: response.data.filePath || 'uploads/' + selectedFileName
      };

      // Close loading and show success
      Swal.fire({
        title: 'Success!',
        text: 'Organization file saved successfully!',
        icon: 'success',
        confirmButtonColor: '#3085d6',
      });

      // Update parent and close drawer
      onFileUpload?.(completeFileData);
      onClose();
    } catch (error) {
      // Handle error
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to save organization file',
        icon: 'error',
        confirmButtonColor: '#3085d6',
      });
      console.error('Upload error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <ToastContainer />
    
    <div className="OrganizationDrawer-drawer-overlay" onClick={onClose}>
      <div className="OrganizationDrawer-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="OrganizationDrawer-drawer-header">
          <h2>Add Organization File</h2>
          <button className="OrganizationDrawer-close-button" onClick={onClose}>×</button>
        </div>

        <div className="OrganizationDrawer-drawer-scrollable">
          <div className="OrganizationDrawer-drawer-content">
            <label>Uploaded by</label>
            <input type="text" value={userIdentity} readOnly style={{ marginBottom: '10px' }} />

            <label className="OrganizationDrawer-upload-label">Upload file</label>
            <div className="OrganizationDrawer-upload-box" onClick={handleUploadClick}>
              {selectedFileName ? `📄 ${selectedFileName}` : '📁 Desktop / Others'}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              style={{ display: 'none' }}
            />

            <label className="OrganizationDrawer-required-field">File name</label>
            <input
              type="text"
              placeholder="Enter a name for the file"
              value={fileName}
              onChange={(e) => {
                const value = e.target.value;
                if (isAlphaOnly(value)) {
                  setFileName(value);
                  setFileNameError('');
                } else {
                  setFileNameError('Only letters and spaces are allowed.');
                }
              }}
            />
            {fileNameError && <span className="error-text">{fileNameError}</span>}

            <label className="OrganizationDrawer-required-field">Share with</label>
            <div className="OrganizationDrawer-multi-select">
              <div
                className="OrganizationDrawer-select-header"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {getSelectedEmployeeNames()}
                <span className="OrganizationDrawer-dropdown-arrow">
                  {dropdownOpen ? '▲' : '▼'}
                </span>
              </div>

              {dropdownOpen && (
                <div className="OrganizationDrawer-select-options">
                  {loadingEmployees ? (
                    <div className="OrganizationDrawer-loading">Loading employees...</div>
                  ) : employeeError ? (
                    <div className="OrganizationDrawer-error">{employeeError}</div>
                  ) : (
                    <>
                      {filteredEmployees.length > 0 && (
                        <div
                          className="OrganizationDrawer-option"
                          onClick={(e) => {
                            if (e.target.tagName !== 'INPUT') {
                              toggleSelectAll();
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectAll();
                            }}
                          />
                          <label>Select All</label>
                        </div>
                      )}

                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map(employee => (
                          <div
                            key={employee._id}
                            className="OrganizationDrawer-option"
                            onClick={(e) => {
                              if (e.target.tagName !== 'INPUT') {
                                toggleEmployeeSelection(employee._id);
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(employee._id)}
                              onChange={(e) => toggleEmployeeSelection(employee._id, e)}
                            />
                            <label>
                              {employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.fullname} {" "} 
                              {employee.candidateId ? `(${employee.candidateId})` : employee.employeeId && `(${employee.employeeId})`}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="OrganizationDrawer-no-employees">
                          No employees found in your company
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            {employeeError && <span className="error-text">{employeeError}</span>}

            <label>Description</label>
            <textarea
              placeholder="Enter description"
              value={description}
              onChange={(e) => {
                const value = e.target.value;
                if (isAlphaOnly(value)) {
                  setDescription(value);
                  setDescriptionError('');
                } else {
                  setDescriptionError('Only letters and spaces are allowed.');
                }
              }}
            />
            {descriptionError && <span className="error-text">{descriptionError}</span>}

            <label className="OrganizationDrawer-required-field">Folder</label>
            <select value={folder} onChange={(e) => setFolder(e.target.value)}>
              <option value="">Select</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="IT">IT</option>
            </select>
            {folderError && <span className="error-text">{folderError}</span>}


            <div className="OrganizationDrawer-checkbox-group">
              <div className="OrganizationDrawer-checkbox-row">
                <input
                  type="checkbox"
                  id="policy-checkbox"
                  checked={isPolicy}
                  onChange={() => setIsPolicy(!isPolicy)}
                />
                <label htmlFor="policy-checkbox">Mark as organization policy document</label>
              </div>
              <small>Identify as an important organization-wide policy document. Example: Company guideline document, harassment policy.</small>
            </div>
          </div>

          <div className="OrganizationDrawer-acknowledgement-content">
            <div className="OrganizationDrawer-acknowledgement-card">
              <h4>Acknowledgement</h4>
              <p>When enabled, employees will be required to manually acknowledge reading the sent documents.</p>

              <div className="OrganizationDrawer-checkbox-row">
                <input
                  type="checkbox"
                  checked={noDeadline}
                  onChange={() => {
                    setNoDeadline(!noDeadline);
                    if (!noDeadline) setEnforceDeadline(false);
                  }}
                />
                <label>No deadline</label>
              </div>

              <div className="OrganizationDrawer-checkbox-row">
                <input
                  type="checkbox"
                  checked={enforceDeadline}
                  disabled={noDeadline}
                  onChange={() => setEnforceDeadline(!enforceDeadline)}
                />
                <label>Enforce mandatory deadline</label>
              </div>

              {enforceDeadline && !noDeadline && (
                <div className="OrganizationDrawer-deadline-input">
                  <input
                    type="date"
                    value={ackDeadline}
                    onChange={(e) => setAckDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {ackDeadlineError && <span className="error-text">{ackDeadlineError}</span>}
                  <p className="OrganizationDrawer-info-message">
                    Employees must acknowledge the document before the last date. On the deadline, system actions will be restricted until they do.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="OrganizationDrawer-file-section">
            <h4>Notifications</h4>
            <p className="OrganizationDrawer-subtitle">Notify employees when files are uploaded</p>
            <div className="OrganizationDrawer-checkbox-row">
              <input
                type="checkbox"
                checked={notifyFeed}
                onChange={() => setNotifyFeed(!notifyFeed)}
              />
              <label>Send notification to employee feed</label>
            </div>
            
          </div>
        </div>

        <div className="OrganizationDrawer-actions">
          <button className="OrganizationDrawer-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="OrganizationDrawer-save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
    </>
  );
};

export default OrganizationFileDrawer;