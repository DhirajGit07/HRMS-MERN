import React, { useState, useEffect } from 'react';
import './ArchivedLeaveType.css';
import { MdDelete, MdOutlineSettingsBackupRestore } from 'react-icons/md';
import { FaCircle } from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';

const ArchivedLeaveType = () => {
  const [activeTab, setActiveTab] = useState('ArchivedLeaveType');
  const [archivedLeaveTypes, setArchivedLeaveTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [companyId, setCompanyId] = useState('');

  const departments = [
    'Administration',
    'Technical',
    'Sales',
    'Human Resource'
  ];
  const designations = [
    'Director & CEO',
    'Project Head',
    'Human Resource',
    'Sales Associate',
    'Software Developer',
    'Data Analyst',
    'Team Lead',
    'Client Success',
    'AWS Cloud Engineer',
    'QA Engineer',
    'Full Stack Developer',
    'Database Developer',
    'HR Generalist'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axios.get('http://localhost:8000/api/users/profile');
        if (profileRes.status === 200) {
          console.log(profileRes.data);
          setCompanyId(profileRes.data.companyId || '');
        }
      } catch (err) {
        console.error('Error:', err.response || err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchArchivedLeaveTypes = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('http://localhost:8000/api/leave-types/archived');
        // Filter archived leave types to include only those matching the companyId
        const filteredLeaveTypes = response.data.filter(type => type.companyId === companyId);
        setArchivedLeaveTypes(filteredLeaveTypes);
      } catch (error) {
        console.error('Error fetching archived leave types:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch archived leave types. Please try again.',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'archived-leave-type-swal-popup'
          }
        });
      } finally {
        setIsLoading(false);
      }
    };
    // Only fetch archived leave types if companyId is available
    if (companyId) {
      fetchArchivedLeaveTypes();
    }
  }, [companyId]);

  const handleRestore = async (id) => {
    Swal.fire({
      title: 'Restore Leave Type',
      text: 'Are you sure you want to restore this leave type?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Restore',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'archived-leave-type-swal-popup'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.put(`http://localhost:8000/api/leave-types/restore/${id}`);
          setArchivedLeaveTypes(archivedLeaveTypes.filter(type => type._id !== id));
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Leave type restored successfully!',
            confirmButtonText: 'OK',
            customClass: {
              popup: 'archived-leave-type-swal-popup'
            }
          });
        } catch (error) {
          console.error('Error restoring leave type:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to restore leave type. Please try again.',
            confirmButtonText: 'OK',
            customClass: {
              popup: 'archived-leave-type-swal-popup'
            }
          });
        }
      }
    });
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Delete Leave Type',
      text: 'Are you sure you want to permanently delete this leave type? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'archived-leave-type-swal-popup'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:8000/api/leave-types/${id}`);
          setArchivedLeaveTypes(archivedLeaveTypes.filter(type => type._id !== id));
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Leave type deleted successfully!',
            confirmButtonText: 'OK',
            customClass: {
              popup: 'archived-leave-type-swal-popup'
            }
          });
        } catch (error) {
          console.error('Error deleting leave type:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete leave type. Please try again.',
            confirmButtonText: 'OK',
            customClass: {
              popup: 'archived-leave-type-swal-popup'
            }
          });
        }
      }
    });
  };

  return (
    <div className="ArchivedLeaveType-archive-container">
      {isLoading ? (
        <div className="ArchivedLeaveType-loading">
          <p>Loading archived leave types...</p>
        </div>
      ) : archivedLeaveTypes.length === 0 ? (
        <div className="ArchivedLeaveType-no-data">
          <p>No archived leave type available</p>
        </div>
      ) : activeTab === 'ArchivedLeaveType' && (
        <table className="ArchivedLeaveType-archive-table">
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>Leave Allotment Type</th>
              <th>No of Leaves</th>
              <th>Monthly Limit</th>
              <th>Leave Paid Status</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {archivedLeaveTypes.map((type) => (
              <tr key={type._id} className='ArchivedLeaveType-designations-list'>
                <td>
                  <div className='ArchivedLeaveType-designations-list-circle'>
                    <FaCircle color={type.colorCode} />
                    {type.name}
                  </div>
                </td>
                <td>{type.allotment}</td>
                <td>{type.noOfLeaves}</td>
                <td>{type.monthlyLimit}</td>
                <td>{type.status}</td>
                <td>
                  <ul>
                    {type.departments.map((dept, index) => (
                      <li key={index} className='ArchivedLeaveType-designations-list'> {index+1}. {dept}</li>
                    ))}
                  </ul>
                </td>
                <td>
                  <ul>
                    {type.designations.map((desig, index) => (
                      <li key={index} className='ArchivedLeaveType-designations-list'> {index+1}. {desig}</li>
                    ))}
                  </ul>
                </td>
                <td>
                  <div className='ArchivedLeaveType-action-buttons'>
                    <button className="ArchivedLeaveType-restore-btn" onClick={() => handleRestore(type._id)}>
                      <MdOutlineSettingsBackupRestore size={16} /> 
                      <span> Restore </span>
                    </button>
                    <button className="ArchivedLeaveType-delete-btn" onClick={() => handleDelete(type._id)}>
                      <MdDelete size={16} />
                      <span> Delete </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ArchivedLeaveType;