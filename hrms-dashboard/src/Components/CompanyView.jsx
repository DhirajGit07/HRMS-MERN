import React, { useState, useEffect } from 'react';
import './CompanyView.css';
import axios from 'axios';
import CompanyViewNavbar from '../pages/CompanyViewNavbar';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

const CompanyView = () => {
  const { companyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const passedCompanyName = location.state?.companyName;

  const [superAdmin, setSuperAdmin] = useState({});
  const [company, setCompany] = useState({ id: companyId, name: passedCompanyName || '' });
  const [userType, setUserType] = useState('Admin');
  const [users, setUsers] = useState([]);

  // Status helper function
  const getStatusClass = (status) => {
    const statusMap = {
      'active': 'active',
      'inactive': 'inactive',
      'pending': 'pending',
      'suspended': 'inactive',
      'terminated': 'inactive'
    };
    return statusMap[(status || 'active').toLowerCase()] || 'active';
  };

  useEffect(() => {
    const fetchSuperAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuperAdmin(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchSuperAdmin();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const filtered = data.filter(
          user => user.companyId === companyId && user.role === userType
        );

        if (filtered.length > 0 && !company.name) {
          setCompany(prev => ({ ...prev, name: filtered[0].companyName }));
        }

        setUsers(filtered);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (companyId) fetchUsers();
  }, [userType, companyId]);

  const handleExport = () => {
    Swal.fire({
      title: `Export ${userType} Data`,
      html: `You are about to export ${userType.toLowerCase()} records to Excel.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Export',
      cancelButtonText: 'Cancel',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        try {
          const dataToExport = users.map(user => ({
            'Employee ID': user.employeeId || '-',
            'Full Name': user.fullname || '-',
            'Email': user.email || '-',
            'Mobile Number': user.mobileNo || '-',
            'Department': user.department || '-',
            'Role': user.role || '-',
            'Status': user.employeeStatus || 'Active',
          }));

          const ws = XLSX.utils.json_to_sheet(dataToExport);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, `${userType}s`);

          const fileName = `${company.name}_${userType}s_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
          text: `${userType} data has been exported to Excel.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  const companyInitial = company.name ? company.name[0].toUpperCase() : '';

  return (
    <div>
      <CompanyViewNavbar />

      <div className="company-view">
        <div className="company-view-superadmin">
          <FaArrowLeft
            className="company-back-icon"
            onClick={() => navigate('/superadminpanel')}
          />

          <div className="company-initial-circle">
            {companyInitial}
          </div>

          <div className="company-info-container">
            <p className="company-view-label">COMPANY NAME</p>
            <h2 className="company-view-fullname">{company.name || 'Company Name'}</h2>
            <p className="company-id-label">COMPANY ID:</p>
            <p className="company-view-id">{company.id}</p>
          </div>
        </div>

        <div className="company-view-tabs-container">
          <div className="company-view-tabs">
            <button
              className={userType === 'Admin' ? 'active' : ''}
              onClick={() => setUserType('Admin')}
            >
              Admin
            </button>
            <button
              className={userType === 'Employee' ? 'active' : ''}
              onClick={() => setUserType('Employee')}
            >
              Employees
            </button>
          </div>
          <button className="company-export-button" onClick={handleExport}>
            <FiDownload className="export-icon" />
            Export
          </button>
        </div>

        <div className="table-container">
          <table className="company-view-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-users-found">
                    No {userType.toLowerCase()}s found
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id}>
                    <td>{user.employeeId || '-'}</td>
                    <td>{user.fullname || '-'}</td>
                    <td>{user.email || '-'}</td>
                    <td>{user.mobileNo || '-'}</td>
                    <td>{user.department || '-'}</td>
                    <td>
                      <span className={`status-${getStatusClass(user.employeeStatus)}`}>
                        {user.employeeStatus || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompanyView;