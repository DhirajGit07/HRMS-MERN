import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExperienceLetter.css';
import HRLetterPageNavbar from '../pages/HRLetterPageNavbar ';
import warningIcon from "../assets/warning-icon.png";

const ExperienceLetter = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleTasksBtn = () => {
    navigate("/ExperienceLetterForm");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/experience-letter');
        const data = await response.json();
        setRecords(data);
      } catch (error) {
        console.error('Error fetching records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId) return;
    try {
      const response = await fetch(`http://localhost:8000/api/experience-letter/${confirmDeleteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRecords(prev => prev.filter(record => record._id !== confirmDeleteId));
        setConfirmDeleteId(null);
      } else {
        throw new Error('Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      setConfirmDeleteId(null);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRecords = React.useMemo(() => {
    if (!sortConfig.key) return records;

    return [...records].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [records, sortConfig]);

  const filteredRecords = sortedRecords.filter(record =>
    record.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.reasonForRequest?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.otherReason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const headers = [
    { key: 'employeeId', label: 'EmployeeID', width: '150px' },
    { key: 'requestDate', label: 'Date of request', width: '150px' },
    { key: 'reasonForRequest', label: 'Reason for request', width: '200px' },
    { key: 'otherReason', label: 'Other Reason', width: '200px' },
    { key: 'actions', label: 'Actions', width: '100px' }
  ];

  return (
    <div>
      <HRLetterPageNavbar />

      <div className="experience-letter-container">
        <div className="experience-letter-table-controls">
          <div className="experience-letter-search-container">
            <span className="experience-letter-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="experience-letter-search-input"
            />
          </div>
          <button className="experience-letter-add-record-btn" onClick={handleTasksBtn}>
            + Add Record
          </button>
        </div>

        <div className="experience-letter-table-scroll-container">
          <table className="experience-letter-table">
            <thead className="experience-letter-table-header">
              <tr>
                {headers.map((header) => (
                  <th
                    className={`experience-letter-header-cell ${header.key === 'actions' ? 'experience-letter-actions-cell' : ''}`}
                    key={header.key}
                    onClick={() => header.key !== 'actions' ? handleSort(header.key) : null}
                    style={{
                      cursor: header.key !== 'actions' ? 'pointer' : 'default',
                      width: header.width,
                      minWidth: header.width
                    }}
                  >
                    <div className="experience-letter-header-content">
                      <span className="experience-letter-header-text" title={header.label}>
                        {header.label}
                      </span>
                      {sortConfig.key === header.key && (
                        <span className="experience-letter-sort-icon">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="experience-letter-table-body">
              {loading ? (
                <tr className="experience-letter-no-records-row">
                  <td colSpan={headers.length}>
                    <div className="experience-letter-no-records">
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr className="experience-letter-no-records-row">
                  <td colSpan={headers.length}>
                    <div className="experience-letter-no-records">
                      <div className="experience-letter-no-records-image">
                        <div className="experience-letter-image-placeholder">📊</div>
                      </div>
                      <div className="experience-letter-no-records-text">
                        {searchTerm ? 'No matching records found' : 'No records available'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr className="experience-letter-table-row" key={record._id}>
                    {headers.map((header) => {
                      if (header.key === 'actions') {
                        return (
                          <td
                            className="experience-letter-table-cell experience-letter-actions-cell"
                            key={header.key}
                            style={{ width: header.width, minWidth: header.width }}
                          >
                            <div className="experience-letter-action-buttons">
                              <button
                                className="experience-letter-delete-btn"
                                onClick={() => setConfirmDeleteId(record._id)}
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        );
                      }

                      let displayValue = record[header.key];

                      if (header.key === 'requestDate') {
                        displayValue = new Date(record.requestDate).toLocaleDateString();
                      } else if (header.key === 'otherReason') {
                        displayValue = record.reasonForRequest === 'other' ? record.otherReason : '-';
                      }

                      return (
                        <td
                          className="experience-letter-table-cell"
                          key={header.key}
                          style={{ width: header.width, minWidth: header.width }}
                          title={typeof displayValue === 'string' ? displayValue : ''}
                        >
                          <div className="experience-letter-cell-content" style={{
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
        <div className="experience-letter-modal-overlay">
          <div className="experience-letter-modal-content">
            <img src={warningIcon} alt="warning" className="experience-letter-warning-icon" />
            <h3>DELETE RECORD</h3>

            <p>Are you sure you want to delete this record?</p>
            <div className="experience-letter-modal-actions">

              <button className="experience-letter-cancel-btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="experience-letter-confirm-btn" onClick={() => handleDeleteConfirmed(confirmDeleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperienceLetter;