import React, { useState, useEffect } from 'react';
import PFESICPageAdd from '../Components/PFESICPageAdd';
import './PFESICPage.css';
import PfandEsicNavbar from '../pages/PFESICNavBar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiDownload } from 'react-icons/fi';
import { BsThreeDots } from 'react-icons/bs';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

const PFESICPage = () => {
  const [activeTab, setActiveTab] = useState('PF');
  const [showAddForm, setShowAddForm] = useState(false);
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [deleteCandidateId, setDeleteCandidateId] = useState(null);

  const navigate = useNavigate();

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userRole = userData.role;
  const userEmail = userData.email;

  // Set auth token for all requests
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRes = await axios.get('http://localhost:8000/api/users/profile');
        setCompanyName(profileRes.data.companyName || '');
        setCompanyId(profileRes.data.companyId || '');

        const userRes = await axios.get('http://localhost:8000/api/users');
        setUsers(userRes.data);
      } catch (err) {
        console.error('Profile fetch error:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load data');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [activeTab, companyId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch records with companyId filter from backend
      const recordsRes = await axios.get(`/api/pfesic?type=${activeTab}&companyId=${companyId}`);
      
      // Fetch employees for the current company only
      const employeesRes = await axios.get(`http://localhost:8000/api/users?companyId=${companyId}`);

      let recordsData = recordsRes.data;
      const employeesData = employeesRes.data;

      // Filter records for employee role
      if (userRole === 'Employee') {
        recordsData = recordsData.filter(record => record.email === userEmail);
      }

      // Additional frontend filtering (redundant but safe)
      recordsData = recordsData.filter(record => 
        record.companyId === companyId || 
        (record.employeeId && record.employeeId.startsWith(companyId))
      );

      // Map records - use employeeName from PFESIC record if available, otherwise from user data
      const recordsWithEmpDetails = recordsData.map(record => {
        const matchedEmployee = employeesData.find(emp => emp.email === record.email);
        return {
          ...record,
          employeeId: matchedEmployee ? matchedEmployee.employeeId : record.employeeId,
          // Use employeeName from the record first, fallback to user data
          employeeName: record.employeeName || (matchedEmployee ? matchedEmployee.name : '')
        };
      });

      setRecords(recordsWithEmpDetails);
      setEmployees(employeesData);
    } catch (err) {
      setError('Failed to fetch records');
      console.error('Error fetching records:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record =>
    (record.employeeId && record.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (record.employeeName && record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (record.email && record.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddRecord = () => {
    setEditingRecord(null);
    setShowAddForm(true);
  };

  const handleEditRecord = (record) => {
    if (userRole === 'Employee' && record.email !== userEmail) return;
    setEditingRecord(record);
    setShowAddForm(true);
  };

  const handleBack = () => {
    setShowAddForm(false);
    setEditingRecord(null);
  };

  const handleSaveData = async () => {
    try {
      await fetchData();
      setShowAddForm(false);
    } catch (err) {
      console.error('Error after saving:', err);
    }
  };

  const handleDelete = async (id) => {
    if (userRole !== 'Admin') return;
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/pfesic/${id}`);
        await fetchData();
        Swal.fire(
          'Deleted!',
          'The record has been deleted.',
          'success'
        );
      } catch (err) {
        console.error('Error deleting record:', err);
        Swal.fire(
          'Error!',
          'Failed to delete the record.',
          'error'
        );
      }
    }
  };

  const downloadDocument = async (id, filename) => {
    try {
      // Use absolute URL in development
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8000' 
        : '';
      
      const url = `${baseUrl}/api/pfesic/${id}/download?filename=${encodeURIComponent(filename)}&companyId=${companyId}`;
      
      // Alternative approach using fetch
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }
      
      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);
      
      // Open in new tab
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Swal.fire('Error', 'Failed to open PDF document', 'error');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeMenu && !e.target.closest('.pf-action-menu-wrapper')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  useEffect(() => {
    if (!userData.token) {
      navigate('/login');
    }
  }, [navigate, userData]);

  const handleExportToExcel = () => {
    Swal.fire({
      title: 'Export Data',
      text: `Are you sure you want to export ${activeTab} records to Excel?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, export it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const dataToExport = filteredRecords.map(record => ({
          'Employee Status': record.status || '-',
          'Employee ID': record.employeeId || '-',
          'Candidate ID': record.candidateId || '-',
          'Employee Name': record.employeeName || '-',
          'Middle Name': record.middlename || '-',
          'Gender': record.gender || '-',
          'Marital Status': record.maritalstatus || '-',
          'Date Of Birth': record.dob ? new Date(record.dob).toLocaleDateString() : '-',
          'Actual DOJ': record.actualDoj ? new Date(record.actualDoj).toLocaleDateString() : '-',
          'Minority Status': record.minorityStatus || '-',
          'DOJ to EPFO': record.dojepfo ? new Date(record.dojepfo).toLocaleDateString() : '-',
          'Department': record.department || '-',
          'Designation': record.designation || '-',
          'Mobile Number': record.mobile || '-',
          'Aadhaar No.': record.aadhar || '-',
          'PAN No.': record.pan || '-',
          'Email ID': record.email || '-',
          'Date of Leaving': record.leaving ? new Date(record.leaving).toLocaleDateString() : '-',
          'Bank Name': record.bankName || '-',
          'Bank A/C No.': record.bankAcc || '-',
          'IFSC Code': record.ifsc || '-',
          'Present Address': record.presentAddress || '-',
          'Permanent Address': record.permanentAddress || '-',
          'PF Number': record.pfNumber || '-',
          'UAN Number': record.uanNumber || '-',
          'ESIC IP No.': record.esicIp || '-',
          'Nominee Name': record.nomineeName || '-',
          'Relation With Employee': record.nomineeRelation || '-',
          'Nominee Address': record.nomineeAddress || '-',
          'Remark': record.remark || '-',
          'Document': record.docPath ? 'Available' : 'Not Available',
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `${activeTab}Records`);
        XLSX.writeFile(wb, `${companyName}_${activeTab}_Records_${new Date().toISOString().slice(0, 10)}.xlsx`);

        Swal.fire('Exported!', `${activeTab} records have been exported.`, 'success');
      }
    });
  };

  return (
    <div>
      <PfandEsicNavbar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="pf-container">
        {!showAddForm && (
          <div className="pf-tabs">
            {['PF', 'ESIC'].map(tab => (
              <div
                key={tab}
                className={`pf-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => !showAddForm && setActiveTab(tab)}
                style={showAddForm && activeTab !== tab ? { pointerEvents: 'none', opacity: 0.5 } : {}}
              >
                {tab}
              </div>
            ))}
          </div>
        )}

        {error && <div className="pf-error">{error}</div>}

        {!showAddForm ? (
          <>
            <div className="pf-header">
              <div className="pf-search-container">
                <span className="pf-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by ID, name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pf-search-input"
                />
              </div>

              <div className="pf-button-group">
                <button className="pf-add-button" onClick={handleAddRecord}>
                  + Add {activeTab} Record
                </button>
                {userRole === 'Admin' && (
                  <button className="pf-export-button" onClick={handleExportToExcel}>
                    <FiDownload style={{ marginRight: '4px', fontSize: '16px' }} />
                    Export
                  </button>
                )}
              </div>
            </div>

            <div className="pf-content">
              {loading ? (
                <div className="pf-loading">Loading records...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="pf-no-records">
                  <p>No records found for {companyName}.</p>
                </div>
              ) : (
                <div className="pf-table-container">
                  <table className="pf-table">
                    <thead>
                      <tr>
                       {userRole === 'Admin' && <th>System ID</th>}
                        <th>Candidate ID</th>                  
                        <th>Employee Status</th>
                        <th>Employee Name</th>
                        <th>Middle Name</th>
                        <th>Gender</th>
                        <th>Marital Status</th>
                        <th>Date Of Birth</th>
                        <th>Actual DOJ</th>
                        <th>Minority Status</th>
                        <th>DOJ to EPFO</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th>Mobile Number</th>
                        <th>Aadhaar No.</th>
                        <th>PAN No.</th>
                        <th>Email ID</th>
                        <th>Date of Leaving</th>
                        <th>Bank Name</th>
                        <th>Bank A/C No.</th>
                        <th>IFSC Code</th>
                        <th>Present Address</th>
                        <th>Permanent Address</th>
                        <th>PF Number</th>
                        <th>UAN Number</th>
                        <th>ESIC IP No.</th>
                        <th>Nominee Name</th>
                        <th>Relation With Employee</th>
                        <th>Nominee Address</th>
                        <th>Remark</th>
                        <th>Doc (PDF)</th>
                        {userRole === 'Admin' && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map(record => (
                        <tr key={record._id}>
                          {userRole === 'Admin' && <td>{record.employeeId || '-'}</td>}
                          <td>{record.candidateId || '-'}</td>
                          <td>{record.status || '-'}</td>  
                          <td>{record.employeeName || '-'}</td>
                          <td>{record.middlename || '-'}</td>
                          <td>{record.gender || '-'}</td>
                          <td>{record.maritalstatus || '-'}</td>
                          <td>{record.dob ? new Date(record.dob).toLocaleDateString() : '-'}</td>
                          <td>{record.actualDoj ? new Date(record.actualDoj).toLocaleDateString() : '-'}</td>
                          <td>{record.minorityStatus || '-'}</td>
                          <td>{record.dojepfo ? new Date(record.dojepfo).toLocaleDateString() : '-'}</td>
                          <td>{record.department || '-'}</td>
                          <td>{record.designation || '-'}</td>
                          <td>{record.mobile || '-'}</td>
                          <td>{record.aadhar || '-'}</td>
                          <td>{record.pan || '-'}</td>
                          <td>{record.email || '-'}</td>
                          <td>{record.leaving ? new Date(record.leaving).toLocaleDateString() : '-'}</td>
                          <td>{record.bankName || '-'}</td>
                          <td>{record.bankAcc || '-'}</td>
                          <td>{record.ifsc || '-'}</td>
                          <td>{record.presentAddress || '-'}</td>
                          <td>{record.permanentAddress || '-'}</td>
                          <td>{record.pfNumber || '-'}</td>
                          <td>{record.uanNumber || '-'}</td>
                          <td>{record.esicIp || '-'}</td>
                          <td>{record.nomineeName || '-'}</td>
                          <td>{record.nomineeRelation || '-'}</td>
                          <td>{record.nomineeAddress || '-'}</td>
                          <td>{record.remark || '-'}</td>
                          <td>
                            {record.docPath ? (
                              <button
                                className="pdf-view-button"
                                onClick={() => downloadDocument(record._id, record.docPath.split('/').pop())}
                              >
                                View PDF
                              </button>
                            ) : (
                              'No Doc'
                            )}
                          </td>
                          {userRole === 'Admin' && (
                            <td>
                              <div className="pf-action-menu-wrapper">
                                <button
                                  className="pf-action-btn"
                                  onClick={() => setActiveMenu(activeMenu === record._id ? null : record._id)}
                                >
                                  <BsThreeDots />
                                </button>
                                {activeMenu === record._id && (
                                  <div className="pf-dropdown-menu">
                                    <button
                                      className="pf-dropdown-item"
                                      onClick={() => handleEditRecord(record)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="pf-dropdown-item pf-delete-item"
                                      onClick={() => handleDelete(record._id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <PFESICPageAdd
            onBack={handleBack}
            onSave={handleSaveData}
            currentTab={activeTab}
            editData={editingRecord}
            companyId={companyId}
          />
        )}
      </div>
    </div>
  );
};

export default PFESICPage;