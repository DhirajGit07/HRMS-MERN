import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExitDetailsView.css';
import ExitDetailsNavbar from '../pages/ExitDetailsNavbar';
import warningIcon from "../assets/warning-icon.png";
import { FiDownload } from 'react-icons/fi';
import { FaPenAlt } from "react-icons/fa";
import { FaTrashArrowUp } from "react-icons/fa6";
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const ExitDetailsView = () => {
  const navigate = useNavigate();
  const [exitDetails, setExitDetails] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [editingStatus, setEditingStatus] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      setUserRole(userData.role);
      setUserEmail(userData.email);
      setCompanyId(userData.companyId || '');
      setCompanyName(userData.companyName || '');
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('userToken');

        const [exitRes, userRes] = await Promise.all([
          fetch('http://localhost:8000/api/exitdetails', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('http://localhost:8000/api/users', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        if (!exitRes.ok || !userRes.ok) throw new Error('Failed to fetch data');

        const exitData = await exitRes.json();
        const usersData = await userRes.json();

        const enhancedExitData = exitData.map(exit => {
          const matchingUser = usersData.find(user => user.email === exit.employeeEmail);
          return {
            ...exit,
            employeeId: matchingUser ? matchingUser.employeeId : exit.employeeId || 'N/A',
            employeeCompanyId: matchingUser ? matchingUser.companyId : 'N/A',
            status: exit.status || 'pending' // Ensure status has a default value
          };
        });

        setExitDetails(enhancedExitData);
        setUsers(usersData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const headers = [
    ...(userRole === 'Admin' ? [{ key: 'employeeId', label: 'System ID', width: '120px' }] : []),
    { key: 'candidateId', label: 'Candidate ID', width: '120px' },
    { key: 'employeeEmail', label: 'Employee Email', width: '200px' },
    { key: 'separationDate', label: 'Separation Date', width: '120px' },
    { key: 'fullAndFinalSettlement', label: 'Full & Final Settlement', width: '180px' },
    { key: 'reasonForLeaving', label: 'Reason for Leaving', width: '150px' },
    { key: 'rejoinOrganization', label: 'Rejoin Org', width: '100px' },
    { key: 'likedMost', label: 'Liked Most', width: '150px' },
    { key: 'improveStaffWelfare', label: 'Improvement Suggestions', width: '200px' },
    { key: 'additionalComments', label: 'Comments', width: '150px' },
    { key: 'checklist.companyVehicle', label: 'Vehicle', width: '80px' },
    { key: 'checklist.equipments', label: 'Equipments', width: '100px' },
    { key: 'checklist.libraryBooks', label: 'Books', width: '80px' },
    { key: 'checklist.security', label: 'Security', width: '90px' },
    { key: 'checklist.exitInterview', label: 'Interview', width: '100px' },
    { key: 'checklist.noticePeriod', label: 'Notice Period', width: '120px' },
    { key: 'checklist.resignationLetter', label: 'Resign Letter', width: '120px' },
    { key: 'checklist.managerClearance', label: 'Manager Clearance', width: '150px' },
    { key: 'status', label: 'Status', width: '120px' },
    ...(userRole === 'Admin' ? [{ key: 'actions', label: 'Actions', width: '100px', minWidth: '100px' }] : [])
  ];

  const getStatusColor = (status, isAdmin) => {
    if (isAdmin) {
      switch (status) {
        case 'pending': return { bg: '#fff3cd', text: '#856404' };
        case 'accepted': return { bg: '#d4edda', text: '#155724' };
        case 'rejected': return { bg: '#f8d7da', text: '#721c24' };
        default: return { bg: '#e2e3e5', text: '#383d41' };
      }
    } else {
      switch (status) {
        case 'pending': return { bg: '#e3f2fd', text: '#0d47a1' };
        case 'accepted': return { bg: '#e8f5e9', text: '#2e7d32' };
        case 'rejected': return { bg: '#ffebee', text: '#c62828' };
        default: return { bg: '#f5f5f5', text: '#424242' };
      }
    }
  };

  const handleAddRecord = () => {
    if (userRole === 'Admin' || userRole === 'Employee') {
      navigate('/add-exit-details');
    }
  };

   const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('userToken');
      const res = await fetch(`http://localhost:8000/api/exitdetails/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      
      setExitDetails(prev => prev.filter(detail => detail._id !== id));
      setConfirmDeleteId(null);
      
      // Show success toast
      toast.success('Exit record deleted successfully', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      setError(err.message);
      setConfirmDeleteId(null);
      
      // Show error toast
      toast.error(err.message || 'Failed to delete exit record', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  const handleEdit = (id) => {
    if (userRole === 'Admin') {
      navigate(`/add-exit-details/${id}`);
    }
  };
  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('userToken');
      const res = await fetch(`http://localhost:8000/api/exitdetails/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update status');

      const updatedExitDetails = exitDetails.map(detail => {
        if (detail._id === id) {
          return { ...detail, status: newStatus };
        }
        return detail;
      });

      setExitDetails(updatedExitDetails);
      setEditingId(null);
      setEditingStatus(null);
      
      // Show success toast
      toast.success(`Status updated to ${newStatus}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      setError(err.message);
      
      // Show error toast
      toast.error(err.message || 'Failed to update status', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  const handleExportToExcel = () => {
    Swal.fire({
      title: 'Export to Excel',
      text: `Are you sure you want to export records?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, export it!',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'exit-swal2-confirm-export',
        cancelButton: 'exit-swal2-cancel-export',
        actions: 'exit-swal2-actions'
      },
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          const dataToExport = visibleExitDetails.map(detail => {
            const exportItem = {};
            headers.forEach(header => {
              if (header.key === 'actions') return;
              const keyParts = header.key.split('.');
              let value = detail;
              for (const part of keyParts) value = value?.[part];
              if (header.key === 'separationDate' && value) {
                exportItem[header.label] = new Date(value).toLocaleDateString();
              } else {
                exportItem[header.label] = value || '-';
              }
            });
            return exportItem;
          });

          const ws = XLSX.utils.json_to_sheet(dataToExport);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "ExitDetails");
          const fileName = `Exit_Details_${new Date().toISOString().slice(0, 10)}.xlsx`;
          XLSX.writeFile(wb, fileName);
          
          // Show success toast
          toast.success('Data exported to Excel successfully', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } catch (err) {
          // Show error toast
          toast.error('Failed to export data to Excel', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
          });
        }
      }
    });
  };


  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedExitDetails = React.useMemo(() => {
    if (!sortConfig.key) return exitDetails;
    return [...exitDetails].sort((a, b) => {
      const keyParts = sortConfig.key.split('.');
      let valueA = a, valueB = b;
      for (const part of keyParts) {
        valueA = valueA?.[part];
        valueB = valueB?.[part];
      }
      if (valueA < valueB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [exitDetails, sortConfig]);

  const filteredExitDetails = sortedExitDetails.filter(detail => {
    const searchLower = searchTerm.toLowerCase();
    return (
      detail.employeeId?.toLowerCase().includes(searchLower) ||
      detail.employeeEmail?.toLowerCase().includes(searchLower) ||
      detail.fullAndFinalSettlement?.toLowerCase?.().includes(searchLower) ||
      detail.reasonForLeaving?.toLowerCase().includes(searchLower)
    );
  });

  const visibleExitDetails = userRole === 'Admin'
    ? filteredExitDetails.filter(detail => detail.employeeId?.startsWith(companyId))
    : filteredExitDetails.filter(detail => detail.employeeEmail === userEmail);

  if (loading) return <div className="exitview-loading-container">Loading exit details...</div>;
  if (error) return <div className="exitview-error-container">{error}</div>;

  return (
    <div>
      <ExitDetailsNavbar />
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
      <div className="exitview-container">
       
        <div className="exitview-table-controls">
          <div className="exitview-search-container">
            <span className="exitview-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by ID, Email or Reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="exitview-search-input"
            />
          </div>
          {(userRole === 'Admin' || userRole === 'Employee') && (
            <button className="exitview-add-record-btn" onClick={handleAddRecord}>
              + Add New Record
            </button>
          )}
          {userRole === 'Admin' && (
            <button className="exitview-export-btn" onClick={handleExportToExcel}>
              <FiDownload style={{ marginRight: '2px', fontSize: '16px' }} /> Export
            </button>
          )}
        </div>

        <div className="exitview-table-scroll-container">
          <table className="exitview-table">
            <thead className="exitview-table-header">
              <tr>
                {headers.map(header => (
                  <th
                    key={header.key}
                    onClick={() => header.key !== 'actions' && handleSort(header.key)}
                    className={`exitview-header-cell ${header.key === 'actions' ? 'exitview-actions-cell' : ''}`}
                    style={{ width: header.width, minWidth: header.minWidth }}
                  >
                    <div className="exitview-header-content">
                      {header.label}
                      {sortConfig.key === header.key && (
                        <span className="exitview-sort-icon">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="exitview-table-body">
              {visibleExitDetails.length === 0 ? (
                <tr className="exitview-no-records-row">
                  <td colSpan={headers.length}>
                    <div className="exitview-no-records">
                      <div className="exitview-no-records-image">📊</div>
                      <div className="exitview-no-records-text">
                        {searchTerm ? 'No matching records found' : 'No exit details available'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleExitDetails.map(detail => (
                  <tr className="exitview-table-row" key={detail._id}>
                    {headers.map(header => {
                      if (header.key === 'actions') {
                        return (
                          <td key={header.key} className="exitview-table-cell exitview-actions-cell" style={{ width: header.width, minWidth: header.minWidth }}>
                            <div className="exitview-action-buttons">
                              <button className="exitview-edit-btn" onClick={() => handleEdit(detail._id)} title="Edit">
                                <FaPenAlt style={{ fontSize: '14px' }} />
                              </button>
                              <button className="exitview-delete-btn" onClick={() => setConfirmDeleteId(detail._id)} title="Delete">
                                <FaTrashArrowUp style={{ fontSize: '16px', color: 'red' }} />
                              </button>
                            </div>
                          </td>
                        );
                      } else if (header.key === 'status') {
                        const isAdmin = userRole === 'Admin';
                        const statusColors = getStatusColor(detail.status || 'pending', isAdmin);
                        
                       return (
                          <td key={header.key} className="exitview-table-cell">
                            {isAdmin && editingId === detail._id ? (
                              <select
                                value={editingStatus || detail.status || 'pending'}
                                onChange={(e) => setEditingStatus(e.target.value)}
                                onBlur={() => handleStatusChange(detail._id, editingStatus || detail.status || 'pending')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleStatusChange(detail._id, editingStatus || detail.status || 'pending');
                                  }
                                }}
                                autoFocus
                                className="exitview-status-select"
                              >
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            ) : (
                              <div
                                onClick={() => isAdmin && setEditingId(detail._id)}
                                style={{
                                  backgroundColor: statusColors.bg,
                                  color: statusColors.text,
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: isAdmin ? 'pointer' : 'default',
                                  textTransform: 'capitalize',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                {detail.status || 'Pending'}
                                {isAdmin && (
                                  <svg
                                    width="40"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      
                      }
                      const keyParts = header.key.split('.');
                      let value = detail;
                      for (const part of keyParts) value = value?.[part];
                      let displayValue = value || '-';
                      if ((header.key === 'separationDate' || header.key === 'fullAndFinalSettlement') && value) {
                        displayValue = new Date(value).toLocaleDateString();
                      } else if (typeof value === 'string' && value.length > 20) {
                        displayValue = `${value.substring(0, 20)}...`;
                      }
                      return (
                        <td key={header.key} title={value} className="exitview-table-cell">
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {confirmDeleteId !== null && (
        <div className="exitview-modal-overlay">
          <div className="exitview-modal-content">
            <img src={warningIcon} alt="warning" className="exitview-warning-icon" />
            <h3>DELETE RECORD</h3>
            <p>Are you sure you want to delete this record?</p>
            <div className="exitview-modal-actions">
              <button className="exitview-cancel-btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="exitview-confirm-btn" onClick={() => handleDelete(confirmDeleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExitDetailsView;