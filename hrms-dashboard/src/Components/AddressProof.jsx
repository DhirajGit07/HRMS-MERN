import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddressProof.css';
import HRLetterPageNavbar from '../pages/HRLetterPageNavbar ';
import warningIcon from "../assets/warning-icon.png";
import { FaTrashArrowUp } from "react-icons/fa6";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddressProof = ({ isNested }) => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      setUserRole(userData.role);
      setUserEmail(userData.email);
    }
  }, []);

  const handleTasksBtn = () => {
    navigate("/AddressProofForm");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const profileRes = await axios.get('http://localhost:8000/api/users/profile');
        setCompanyName(profileRes.data.companyName || '');
        setCompanyId(profileRes.data.companyId || '');

        if (!userRole || !userEmail) return;

        if (userRole === 'Admin') {
          const [addressProofRes, employeesRes] = await Promise.all([
            axios.get('http://localhost:8000/api/address-proof'),
            axios.get('http://localhost:8000/api/users')
          ]);

          setEmployees(employeesRes.data);

          // Filter only records that match companyId prefix
          const filteredRecords = addressProofRes.data.filter(record =>
            record.employeeId?.startsWith(profileRes.data.companyId)
          );

          const enrichedRecords = filteredRecords.map(record => {
            const matchingEmployee = employeesRes.data.find(emp =>
              emp.email.toLowerCase() === record.employeeEmail?.toLowerCase()
            );
            return {
              ...record,
              employeeId: matchingEmployee ? matchingEmployee.employeeId : record.employeeId || '-',
              candidateId: matchingEmployee ? matchingEmployee.candidateId : record.candidateId || '-'
            };
          });

          setRecords(enrichedRecords);
        } else {
          const addressProofRes = await axios.get('http://localhost:8000/api/address-proof');
          const userRecords = addressProofRes.data.filter(
            record => record.employeeEmail?.toLowerCase() === userEmail.toLowerCase()
          );

          const enrichedRecords = userRecords.map(record => ({
            ...record,
            employeeId: record.employeeId || '-',
            candidateId: record.candidateId || '-'
          }));

          setRecords(enrichedRecords);
        }
      } catch (err) {
        console.error('Error:', err.response || err);
        setError(err.response?.data?.message || 'Failed to load data');
        if (err.response?.status === 401) {
          navigate('/');
        }
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };

    fetchData();
  }, [userRole, userEmail, navigate]);

  const filteredRecords = useMemo(() => {
  if (!initialLoadComplete) return [];

  return records.filter(record =>
    (record.candidateId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.employeeEmail?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (record.address?.addressLine1?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (record.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (record.address?.state?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (record.reasonForRequest?.toLowerCase().includes(searchTerm.toLowerCase()))
  );
}, [searchTerm, records, initialLoadComplete]);

  const sortedRecords = useMemo(() => {
    if (!sortConfig.key) return filteredRecords;

    return [...filteredRecords].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key.includes('address.')) {
        const addressKey = sortConfig.key.split('.')[1];
        aValue = a.address?.[addressKey] || '';
        bValue = b.address?.[addressKey] || '';
      } else {
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortConfig]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

 const handleDeleteFile = async (idToDelete) => {
    try {
      await axios.delete(`http://localhost:8000/api/address-proof/${idToDelete}`);
      setRecords(prev => prev.filter(record => record._id !== idToDelete));
      setConfirmDeleteId(null);
      
      // Show success toast
      toast.success('Address proof record deleted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      console.error('Failed to delete address proof record', err);
      setConfirmDeleteId(null);
      
      // Show error toast
      toast.error(err.response?.data?.message || 'Failed to delete record', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const headers = [
    ...(userRole === 'Admin' ? [{ key: 'employeeId', label: 'System ID', width: '120px' }] : []),
    { key: 'candidateId', label: 'Candidate ID', width: '120px' },
    { key: 'employeeEmail', label: 'Email', width: '200px' },
    { key: 'requestDate', label: 'Date of Request', width: '150px' },
    { key: 'hasAddressChange', label: 'Is Address Changed?', width: '150px' },
    { key: 'reasonForRequest', label: 'Reason', width: '150px' },
    { key: 'otherReason', label: 'Other Reason', width: '150px' },
    { key: 'address.addressLine1', label: 'New Present Address', width: '200px' },
    ...(userRole === 'Admin' ? [{ key: 'actions', label: 'Actions', width: '100px' }] : [])
  ];

  const getDisplayValue = (record, headerKey) => {
    if (headerKey === 'requestDate') {
      return new Date(record.requestDate).toLocaleDateString();
    }
    if (headerKey === 'hasAddressChange') {
      return record.hasAddressChange === 'yes' ? 'Yes' : 'No';
    }
    if (headerKey.includes('address.')) {
      const addressKey = headerKey.split('.')[1];
      return record.address?.[addressKey] || '-';
    }
    if (headerKey === 'employeeId') {
      return record.employeeId;
    }
    if (headerKey === 'candidateId') {
      return record.candidateId;
    }
    if (headerKey === 'address.addressLine1') {
      return record.hasAddressChange === 'yes' && record.address ?
        `${record.address.addressLine1 || ''}, ${record.address.city || ''}, ${record.address.state || ''}`.trim() :
        '-';
    }
    return record[headerKey] || '-';
  };

  return (
    <div className="address-proof-page-container">
      {!isNested && <HRLetterPageNavbar />}
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
      <div className="address-proof-main-container">
        <div className="address-proof-table-controls">
          <div className="address-proof-search-container">
            <span className="address-proof-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="address-proof-search-input"
            />
          </div>

          <button className="address-proof-add-record-btn" onClick={handleTasksBtn}>
            + Add Record
          </button>
        </div>

        <div className="address-proof-table-scroll-container">
          <table className="address-proof-table">
            <thead className="address-proof-table-header">
              <tr>
                {headers.map((header) => (
                  <th
                    className={`address-proof-header-cell ${header.key === 'actions' ? 'address-proof-actions-header' : ''}`}
                    key={header.key}
                    onClick={() => header.key !== 'actions' ? handleSort(header.key) : null}
                    style={{
                      cursor: header.key !== 'actions' ? 'pointer' : 'default',
                      width: header.width,
                      minWidth: header.width
                    }}
                  >
                    <div className="address-proof-header-content">
                      <span className="address-proof-header-text" title={header.label}>
                        {header.label}
                      </span>
                      {sortConfig.key === header.key && (
                        <span className="address-proof-sort-icon">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="address-proof-table-body">
              {loading ? (
                <tr className="address-proof-no-records-row">
                  <td colSpan={headers.length}>
                    <div className="address-proof-no-records">
                      <div className="address-proof-no-records-image">
                        <div className="address-proof-image-placeholder">⏳</div>
                      </div>
                      <div className="address-proof-no-records-text">
                        Loading records...
                      </div>
                    </div>
                  </td>
                </tr>
              ) : sortedRecords.length === 0 ? (
                <tr className="address-proof-no-records-row">
                  <td colSpan={headers.length}>
                    <div className="address-proof-no-records">
                      <div className="address-proof-no-records-image">
                        <div className="address-proof-image-placeholder">📊</div>
                      </div>
                      <div className="address-proof-no-records-text">
                        {searchTerm ? 'No matching records found' : 'No records available'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedRecords.map((record) => (
                  <tr className="address-proof-table-row" key={record._id}>
                    {headers.map((header) => {
                      if (header.key === 'actions') {
                        return (
                          <td
                            className="address-proof-table-cell address-proof-actions-cell"
                            key={header.key}
                            style={{ width: header.width, minWidth: header.width }}
                          >
                            <div className="address-proof-action-buttons">
                              <button
                                className="address-proof-delete-btn"
                                onClick={() => setConfirmDeleteId(record._id)}
                                title="Delete"
                              >
                                <FaTrashArrowUp style={{ fontSize: '16px', color: 'red' }} />
                              </button>
                            </div>
                          </td>
                        );
                      }

                      const displayValue = getDisplayValue(record, header.key);

                      return (
                        <td
                          className="address-proof-table-cell"
                          key={header.key}
                          style={{ width: header.width, minWidth: header.width }}
                          title={typeof displayValue === 'string' ? displayValue : ''}
                        >
                          <div className="address-proof-cell-content" style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {displayValue}
                          </div>
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
        <div className="address-proof-modal-overlay">
          <div className="address-proof-modal-content">
            <img src={warningIcon} alt="warning" className="address-proof-warning-icon" />
            <h3>DELETE RECORD</h3>
            <p>Are you sure you want to delete this record?</p>
            <div className="address-proof-modal-actions">
              <button className="address-proof-cancel-btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="address-proof-confirm-btn" onClick={() => handleDeleteFile(confirmDeleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressProof;