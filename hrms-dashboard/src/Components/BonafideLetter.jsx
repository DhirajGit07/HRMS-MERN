import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BonafideLetter.css';
import HRLetterPageNavbar from '../pages/HRLetterPageNavbar ';
import warningIcon from "../assets/warning-icon.png";
import { FaTrashArrowUp } from "react-icons/fa6";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const BonafideLetter = () => {
  const navigate = useNavigate();
  const [letters, setLetters] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  const handleTasksBtn = () => {
    navigate("/BonafideLetterForm");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axios.get('http://localhost:8000/api/users/profile');
        setCompanyName(profileRes.data.companyName || '');
        setCompanyId(profileRes.data.companyId || '');

        const userRes = await axios.get('http://localhost:8000/api/users');
        const filteredEmployees = userRes.data.filter(user => user?.companyId === profileRes?.data?.companyId);
        setEmployees(filteredEmployees);

        setIsLoading(true);
        const lettersRes = await axios.get('http://localhost:8000/api/bonafide-letter');
        let filteredLetters = lettersRes.data;
        
        if (userData?.role === 'Employee') {
          filteredLetters = lettersRes.data.filter(
            letter => letter.employeeEmail === userData.email
          );
        }
        
        // Only keep letters whose employeeId starts with companyId
        const validLetters = filteredLetters.filter(letter => {
          const emp = filteredEmployees.find(e => e.email === letter.employeeEmail);
          return emp && emp.employeeId?.startsWith(profileRes.data.companyId);
        });
        
        
        setLetters(validLetters);
      } catch (err) {
        console.error('Error:', err.response || err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    if (userData) fetchData();
  }, [userData]);

  const getEmployeeIdFromEmail = (email) => {
    if (!email || !employees.length) return 'N/A';
    const employee = employees.find(emp => emp.email === email);
    return employee ? employee.employeeId : 'N/A';
  };
  const getCandidateIdFromEmail = (email) => {
    if (!email || !employees.length) return 'N/A';
    const employee = employees.find(emp => emp.email === email);
    return employee ? employee.candidateId : 'N/A';
  };

const handleDeleteFile = async (idToDelete) => {
    try {
      await axios.delete(`http://localhost:8000/api/bonafide-letter/${idToDelete}`);
      const updatedLetters = letters.filter(letter => letter._id !== idToDelete);
      setLetters(updatedLetters);
      setConfirmDeleteId(null);
      
      // Show success toast
      toast.success('Bonafide letter deleted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      console.error('Failed to delete bonafide letter record', err);
      setConfirmDeleteId(null);
      
      // Show error toast
      toast.error(err.response?.data?.message || 'Failed to delete bonafide letter', {
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

  const sortedLetters = React.useMemo(() => {
    if (!sortConfig.key) return letters;

    return [...letters].sort((a, b) => {
      if (sortConfig.key === 'employeeId') {
        const aId = getEmployeeIdFromEmail(a.employeeEmail);
        const bId = getEmployeeIdFromEmail(b.employeeEmail);
        if (aId < bId) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aId > bId) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }

      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [letters, sortConfig, employees]);

  const filteredLetters = sortedLetters.filter((letter) => {
    const search = searchTerm.toLowerCase();
    const employeeId = getEmployeeIdFromEmail(letter.employeeEmail).toLowerCase();

    return (
      employeeId.includes(search) ||
      (letter.employeeEmail && letter.employeeEmail.toLowerCase().includes(search)) ||
      (letter.reasonForRequest && letter.reasonForRequest.toLowerCase().includes(search)) ||
      (letter.otherReason && letter.otherReason.toLowerCase().includes(search))
    );
  });

  const headers = [
    { key: 'employeeId', label: 'System ID', width: '120px' },
    { key: 'candidateId', label: 'Candidate ID', width: '120px' },
    { key: 'employeeEmail', label: 'Email', width: '200px' },
    { key: 'requestDate', label: 'Date of request', width: '150px' },
    { key: 'reasonForRequest', label: 'Reason for request', width: '150px' },
    { key: 'otherReason', label: 'Other Reason', width: '200px' },
    { key: 'actions', label: 'Actions', width: '100px' }
  ];

  
    const visibleHeaders = userData?.role === 'Employee'
  ? headers.filter(header => header.key !== 'actions' && header.key !== 'employeeId')
  : headers;

  return (
    <div>
      <HRLetterPageNavbar />
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
      <div className="bonafide-container">
        <div className="bonafide-table-controls">
          <div className="bonafide-search-container">
            <span className="bonafide-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bonafide-search-input"
            />
          </div>
          {userData && (
            <button className="bonafide-add-record-btn" onClick={handleTasksBtn}>
              + Add Record
            </button>
          )}
        </div>

        <div className="bonafide-table-scroll-container">
          <table className="bonafide-table">
            <thead className="bonafide-table-header">
              <tr>
                {visibleHeaders.map((header) => (
                  <th
                    className={`bonafide-header-cell ${header.key === 'actions' ? 'bonafide-actions-cell' : ''}`}
                    key={header.key}
                    onClick={() => header.key !== 'actions' ? handleSort(header.key) : null}
                    style={{ cursor: header.key !== 'actions' ? 'pointer' : 'default', width: header.width }}
                  >
                    <div className="bonafide-header-content">
                      <span className="bonafide-header-text" title={header.label}>
                        {header.label}
                      </span>
                      {sortConfig.key === header.key && (
                        <span className="bonafide-sort-icon">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

          <tbody className="bonafide-table-body">
            {isLoading ? (
              <tr className="bonafide-no-records-row">
                <td colSpan={visibleHeaders.length}>
                  <div className="bonafide-no-records">
                    <div className="bonafide-no-records-image">
                      <div className="bonafide-image-placeholder">⏳</div>
                    </div>
                    <div className="bonafide-no-records-text">Loading...</div>
                  </div>
                </td>
              </tr>
            ) : filteredLetters.length === 0 ? (
              <tr className="bonafide-no-records-row">
                <td colSpan={visibleHeaders.length}>
                  <div className="bonafide-no-records">
                    <div className="bonafide-no-records-image">
                      <div className="bonafide-image-placeholder">📊</div>
                    </div>
                    <div className="bonafide-no-records-text">
                      {searchTerm ? 'No matching records found' : 'No records available'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLetters.map((letter) => (
                <tr className="bonafide-table-row" key={letter._id}>
                  {visibleHeaders.map((header) => {
                    if (header.key === 'actions') {
                      return (
                        <td
                          className="bonafide-table-cell bonafide-actions-cell"
                          key={header.key}
                          style={{ width: header.width, minWidth: header.width }}
                        >
                          <div className="bonafide-action-buttons">
                            <button
                              className="bonafide-delete-btn"
                              onClick={() => setConfirmDeleteId(letter._id)}
                              title="Delete"
                            >
                              <FaTrashArrowUp style={{ fontSize: '16px', color: 'red' }} />
                            </button>
                          </div>
                        </td>
                      );
                    }

                    let displayValue = letter[header.key];
                    
                    if (header.key === 'employeeId') {
                      displayValue = getEmployeeIdFromEmail(letter.employeeEmail);
                    } else if (header.key === 'candidateId') {
                      displayValue = getCandidateIdFromEmail(letter.employeeEmail);
                    } else if (header.key === 'requestDate') {
                      displayValue = new Date(letter.requestDate).toLocaleDateString();
                    } else if (header.key === 'otherReason') {
                      displayValue = letter.reasonForRequest === 'other' ? letter.otherReason : '-';
                    }

                    return (
                      <td
                        className="bonafide-table-cell"
                        key={header.key}
                        style={{ width: header.width, minWidth: header.width }}
                        title={typeof displayValue === 'string' ? displayValue : ''}
                      >
                        <div className="bonafide-cell-content" style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {displayValue || '-'}
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
        <div className="bonafide-modal-overlay">
          <div className="bonafide-modal-content">
            <img src={warningIcon} alt="warning" className="bonafide-warning-icon" />
            <h3>DELETE RECORD</h3>
            <p>Are you sure you want to delete this record?</p>
            <div className="bonafide-modal-actions">
              <button className="bonafide-cancel-btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="bonafide-confirm-btn" onClick={() => handleDeleteFile(confirmDeleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonafideLetter;
