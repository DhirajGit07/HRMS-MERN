import React, { useState, useEffect } from 'react';
import SettingSidebarNavbar from '../pages/SettingSidebarNavbar';
import SettingSidebar from '../pages/SettingSidebar';
import { useNavigate } from 'react-router-dom';
import './LeaveSetting.css';
import { FaPlus, FaPenAlt, FaTrashAlt, FaCircle } from 'react-icons/fa';
import ArchivedLeavesType from '../Components/ArchivedLeaveType';
import LeaveGeneralSetting from '../Components/LeaveGeneralSetting';
import GeneralApplicabilityForm from '../Components/GeneralApplicabilityForm';
import axios from 'axios';
import Swal from 'sweetalert2';

const LeaveSetting = () => {
  const [activeTab, setActiveTab] = useState('LeavesTypeSettings');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [companyId, setCompanyId] = useState(''); 
  const navigate = useNavigate();

  const departments = [
    'Director & CEO', 'Project Head', 'Human Resource', 'Sales Associate', 
    'Software Developer', 'Data Analyst', 'Team Lead', 'Client Success', 
    'AWS Cloud Engineer', 'QA Engineer', 'Full Stack Developer', 
    'Database Developer', 'HR Generalist', 'Big Data Developer', 
    'Python Developer', 'Project Manager', 'Data Science Engineer', 
    'Mem Stack Developer', 'Data Analyst Intern', 'Java Full Stack Intern', 
    'Business Development Manager'
  ];

  const designations = [
    'Director & CEO', 'Project Head', 'Human Resource', 'Sales Associate', 
    'Software Developer', 'Data Analyst', 'Team Lead', 'Client Success', 
    'AWS Cloud Engineer', 'QA Engineer', 'Full Stack Developer', 
    'Database Developer', 'HR Generalist'
  ];

  const tabs = [
    { id: 'LeavesTypeSettings', label: 'Leaves Type Settings' },
    { id: 'LeavesGeneralSettings', label: 'Leaves General Settings' },
    { id: 'ArchivedLeaveType', label: 'Archived Leaves Type' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axios.get('http://localhost:8000/api/users/profile');
        if (profileRes.status === 200) {
          setCompanyId(profileRes.data.companyId || '');
        }
      } catch (err) {
        console.error('Error:', err.response || err);
      } 
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        setIsLoading(true);
        // Fetch leave types and filter by companyId
        const response = await axios.get('http://localhost:8000/api/leave-types');
        // Filter leave types to include only those matching the companyId
        const filteredLeaveTypes = response.data.filter(type => type.companyId === companyId);
        setLeaveTypes(filteredLeaveTypes);
      } catch (error) {
        console.error('Error fetching leave types:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch leave types. Please try again.',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'leave-setting-swal-popup'
          }
        });
      } finally {
        setIsLoading(false);
      }
    };
    // Only fetch leave types if companyId is available
    if (companyId) {
      fetchLeaveTypes();
    }
  }, [showAddForm, isEditingMode, activeTab, companyId]);

  const handleAddLeaveType = () => {
    setShowAddForm(true);
    setEditingLeaveType(null);
    setIsEditingMode(false);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingLeaveType(null);
    setIsEditingMode(false);
  };

  const handleSaveLeaveType = async (newLeaveType) => {
    try {
      if (editingLeaveType) {
        const response = await axios.put(`http://localhost:8000/api/leave-types/${editingLeaveType._id}`, newLeaveType);
        setLeaveTypes(leaveTypes.map(type => 
          type._id === editingLeaveType._id ? response.data : type
        ));
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Leave type updated successfully!',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'leave-setting-swal-popup'
          }
        });
      } else {
        const response = await axios.post('http://localhost:8000/api/leave-types', newLeaveType);
        setLeaveTypes([...leaveTypes, response.data]);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Leave type created successfully!',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'leave-setting-swal-popup'
          }
        });
      }
      handleCloseForm();
    } catch (error) {
      console.error('Error saving leave type:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save leave type. Please try again.',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'leave-setting-swal-popup'
        }
      });
    }
  };

  const handleEditLeaveType = (id) => {
    const leaveTypeToEdit = leaveTypes.find(type => type._id === id);
    setEditingLeaveType(leaveTypeToEdit);
    setShowAddForm(true);
    setIsEditingMode(true);
  };

  const handleDeleteLeaveType = async (id) => {
    Swal.fire({
      title: 'Archive Leave Type',
      text: 'Are you sure you want to archive this leave type?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Archive',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'leave-setting-swal-popup'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.put(`http://localhost:8000/api/leave-types/archive/${id}`);
          setLeaveTypes(leaveTypes.filter(type => type._id !== id));
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Leave type archived successfully!',
            confirmButtonText: 'OK',
            customClass: {
              popup: 'leave-setting-swal-popup'
            }
          });
        } catch (error) {
          console.error('Error archiving leave type:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to archive leave type. Please try again.',
            confirmButtonText: 'OK',
            customClass: {
              popup: 'leave-setting-swal-popup'
            }
          });
        }
      }
    });
  };

  if (showAddForm) {
    return (
      <GeneralApplicabilityForm
        onClose={handleCloseForm}
        onSave={handleSaveLeaveType}
        leaveTypeData={editingLeaveType}
        isEditing={isEditingMode}
        departments={departments}
        designations={designations}
      />
    );
  }

  return (
    <>
      <SettingSidebarNavbar />
      <div className="LS-container">
        <SettingSidebar />
        <main className="LS-main">
          <section className="LS-card">
            <div className="LS-header">
              <h2 className="LS-title">Leave Setting</h2>
              <button
                className="LS-add-btn"
                onClick={handleAddLeaveType}
              >
                <FaPlus className="LS-add-icon" />
                Add New Leave Type
              </button>
            </div>

            <div className="LS-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`LS-tab ${activeTab === tab.id ? 'LS-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'LeavesTypeSettings' && (
              isLoading ? (
                <div className="LS-loading">
                  <p>Loading leave types...</p>
                </div>
              ) : leaveTypes.length === 0 ? (
                <div className="LS-no-data">
                  <p>No leave type available</p>
                </div>
              ) : (
                <div className="LS-table-container">
                  <table className="LS-table">
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
                    <tbody className="LS-table-body">
                      {leaveTypes.map((type) => (
                        <tr key={type._id} className='LS-designations-list'>
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
                                <li key={index} className='LS-designations-list'> {index + 1}. {dept}</li>
                              ))}
                            </ul>
                          </td>
                          <td>
                            <ul>
                              {type.designations.map((desig, index) => (
                                <li key={index} className='LS-designations-list'> {index + 1}. {desig}</li>
                              ))}
                            </ul>
                          </td>
                          <td>
                            <div className='LS-action-buttons'>
                              <button
                                className="LS-edit-btn"
                                onClick={() => handleEditLeaveType(type._id)}
                              >
                                <FaPenAlt className="LS-action-icon" /> Edit
                              </button>
                              <button
                                className="LS-delete-btn"
                                onClick={() => handleDeleteLeaveType(type._id)}
                              >
                                <FaTrashAlt className="LS-action-icon" />
                                Archive
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {activeTab === 'ArchivedLeaveType' && (
              <ArchivedLeavesType />
            )}
            {activeTab === 'LeavesGeneralSettings' && (
              <LeaveGeneralSetting />
            )}
          </section>
        </main>
      </div>
    </>
  );
};

export default LeaveSetting;