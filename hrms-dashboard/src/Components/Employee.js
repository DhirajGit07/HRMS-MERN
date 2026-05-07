import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Employee.css';
import EmployeeNavbar from '../pages/EmployeeNavbar';
import axios from 'axios';
import warningIcon from '../assets/warning-icon.png';
import { FiDownload } from 'react-icons/fi';
import { FaPenAlt, FaPlus } from "react-icons/fa";
import { FaTrashArrowUp } from "react-icons/fa6";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const Employee = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axios.get('http://localhost:8000/api/users/profile');
        setCompanyName(profileRes.data.companyName || '');
        setCompanyId(profileRes.data.companyId || '');

        const userRes = await axios.get('http://localhost:8000/api/users');
        
        // Fetch profile data to get updated names
        try {
          const profileDataRes = await axios.get('http://localhost:8000/api/users/profile');
          const profileData = profileDataRes.data;
          
          // Update user data with profile information if emails match
          const updatedUsers = userRes.data.map(user => {
            if (user.email && profileData.email && 
                user.email.toLowerCase() === profileData.email.toLowerCase()) {
              return {
                ...user,
                firstName: profileData.firstName || user.firstName,
                lastName: profileData.lastName || user.lastName,
                fullname: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || user.fullname
              };
            }
            return user;
          });
          
          setUsers(updatedUsers);
        } catch (profileErr) {
          console.error('Error fetching profile data:', profileErr);
          setUsers(userRes.data); // Fallback to original data if profile fetch fails
        }
      } catch (err) {
        console.error('Error:', err.response || err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper function to extract employee ID suffix
  const getEmployeeIdSuffix = (employeeId = '') => {
    if (!employeeId || !companyId) return employeeId || 'N/A';
    if (employeeId.startsWith(companyId)) {
      return employeeId.slice(companyId.length);
    }
    return employeeId;
  };

  // Filter by company and employee ID prefix
  const filteredUsers = users.filter(u =>
    u.companyId === companyId &&
    u.employeeId?.startsWith(companyId) &&
    (
      u.fullname?.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      u.employeeId?.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      u.candidateId?.toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
  );

  const handleEditClick = idx => {
    const userToEdit = filteredUsers[idx];
    navigate('/employee-edit', { state: { employee: userToEdit } });
  };

  const requestDelete = idx => setConfirmDeleteIndex(idx);
  const handleCancelDelete = () => setConfirmDeleteIndex(null);

  const handleConfirmDelete = async () => {
    if (confirmDeleteIndex === null) return;
    const user = filteredUsers[confirmDeleteIndex];
    try {
      await axios.delete(`http://localhost:8000/api/users/${user._id}`);
      setUsers(us => us.filter(u => u._id !== user._id));
      toast.success('Employee deleted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (err) {
      console.error('Failed to delete user:', err.response || err);
      toast.error(err.response?.data?.message || 'Delete failed', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setConfirmDeleteIndex(null);
    }
  };

  const handleExportToExcel = () => {
    Swal.fire({
      title: 'Export Employee Data',
      html: `You are about to export employee records to Excel.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, export it!',
      cancelButtonText: 'Cancel',
      showLoaderOnConfirm: true,
      customClass: {
        confirmButton: 'employee1-swal2-confirm-export',
        cancelButton: 'employee1-swal2-cancel-export',
        actions: 'employee1-swal2-actions'
      },
      preConfirm: () => {
        try {
          const dataToExport = filteredUsers.map(user => ({
            'System ID': getEmployeeIdSuffix(user.employeeId),
            'Candidate ID': user.candidateId || '-',
            'Full Name': user.fullname || '-',
            'Email': user.email || '-',
            'Mobile No.': user.mobileNo || '-',
            'Role': user.role || '-',
            'Department': user.department || '-',
            'Date of Birth': user.dob ? new Date(user.dob).toLocaleDateString() : '-',
            'Created At': user.createdAt ? new Date(user.createdAt).toLocaleString() : '-',
            'Last Updated': user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '-'
          }));

          const ws = XLSX.utils.json_to_sheet(dataToExport);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Employees");

          const fileName = `Employees_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
          XLSX.writeFile(wb, fileName);

          return true;
        } catch (error) {
          Swal.showValidationMessage(`Export failed: ${error.message}`);
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Export Successful!',
          text: 'Employee data has been exported to Excel.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  return (
    <div>
      <EmployeeNavbar />

      <ToastContainer position="top-right" autoClose={3000} />

      <div className="employee-container">
        <div className="employee-table-controls">
          <div className="employee-search-container">
            <span className="employee-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search Employee by name, System ID, or Candidate ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="employee-search-input"
            />
          </div>
          <button className="employee-add-button" onClick={() => navigate('/addemployee')}>
            <FaPlus style={{ marginRight: '6px' }} />
            Add Employee
          </button>
          <span className="employee-count-button">
            Total Employee: {filteredUsers.length}
          </span>
          <button className="employee-export-button" onClick={handleExportToExcel}>
            <FiDownload style={{ marginRight: '2px', fontSize: '16px' }} />
            Export
          </button>
        </div>

        <div className="employee-table-scroll-container">
          <table className="employee-table">
            <thead className="employee-table-header">
              <tr>
                <th className="employee-header-cell">System ID</th>
                <th className="employee-header-cell">Candidate ID</th>
                <th className="employee-header-cell">Full Name</th>
                <th className="employee-header-cell">Email Address</th>
                <th className="employee-header-cell">Mobile Number</th>
                <th className="employee-header-cell">Role</th>
                <th className="employee-header-cell">Department</th>
                <th className="employee-header-cell">DOB</th>
                <th className="employee-header-cell">Status</th>
                <th className="employee-header-cell employee-actions-cell" style={{ width: '100px', minWidth: '100px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="employee-table-body">
              {loading ? (
                <tr className="employee-no-records-row">
                  <td colSpan="10">
                    <div className="employee-no-records">
                      <div className="employee-no-records-image">
                        <div className="employee-image-placeholder">⏳</div>
                      </div>
                      <div className="employee-no-records-text">Loading...</div>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr className="employee-no-records-row">
                  <td colSpan="10">
                    <div className="employee-no-records">
                      <div className="employee-no-records-image">
                        <div className="employee-image-placeholder">⚠️</div>
                      </div>
                      <div className="employee-no-records-text">{error}</div>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u, idx) => (
                  <tr className="employee-table-row" key={u._id}>
                    <td className="employee-table-cell">{u.employeeId}</td>
                    <td className="employee-table-cell">{u.candidateId || 'N/A'}</td>
                    <td className="employee-table-cell">{u.fullname}</td>
                    <td className="employee-table-cell">{u.email}</td>
                    <td className="employee-table-cell">{u.mobileNo}</td>
                    <td className="employee-table-cell">{u.role}</td>
                    <td className="employee-table-cell">{u.department}</td>
                    <td className="employee-table-cell">
                      {u.dob ? new Date(u.dob).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="employee-table-cell">
                      <div className={`employee-status-badge ${(u.employeeStatus || 'Active') === 'Active'
                        ? 'employee-status-active'
                        : 'employee-status-inactive'}`}>
                        {u.employeeStatus || 'Active'}
                      </div>
                    </td>
                    <td className="employee-table-cell employee-actions-cell" style={{ width: '100px', minWidth: '100px' }}>
                      <div className="employee-action-buttons">
                        <button className="employee-edit-btn" onClick={() => handleEditClick(idx)} title="Edit">
                          <FaPenAlt style={{ fontSize: '14px' }} />
                        </button>
                        <button className="employee-delete-btn" onClick={() => requestDelete(idx)} title="Delete">
                          <FaTrashArrowUp style={{ fontSize: '16px', color: 'red' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="employee-no-records-row">
                  <td colSpan="10">
                    <div className="employee-no-records">
                      <div className="employee-no-records-image">
                        <div className="employee-image-placeholder">👥</div>
                      </div>
                      <div className="employee-no-records-text">No employees found</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDeleteIndex !== null && (
        <div className="employee-modal-overlay">
          <div className="employee-modal-content">
            <img src={warningIcon} alt="warning" className="employee-warning-icon" />
            <h3>DELETE EMPLOYEE</h3>
            <p>Are you sure you want to delete this employee?</p>
            <div className="employee-modal-actions">
              <button className="employee-cancel-btn" onClick={() => setConfirmDeleteIndex(null)}>Cancel</button>
              <button className="employee-confirm-btn" onClick={() => handleConfirmDelete(confirmDeleteIndex)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employee;