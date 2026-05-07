import React, { useState, useEffect, useRef } from "react";
import "./AllTasks.css";
import { useNavigate } from "react-router-dom";
import { FaEllipsisH } from 'react-icons/fa';
import TaskNavbar from "../pages/TaskNavbar";
import warningIcon from "../assets/warning-icon.png";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RxCross2 } from "react-icons/rx";

const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const AllTasks = () => {
  const navigate = useNavigate();
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const [editModeIndex, setEditModeIndex] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [userRole, setUserRole] = useState('Employee');
  const [currentUserId, setCurrentUserId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [hoveredTaskId, setHoveredTaskId] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  const dropdownRef = useRef(null);

  // Custom function to format date as DD/MM/YYYY hh:mm AM/PM
  const formatDateTime = (date) => {
    if (!date) return '--';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      setUserRole(userData.role || 'Employee');
      setCurrentUserId(userData._id || '');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    const fetchInitialData = async () => {
      try {
        const [profileRes, userRes] = await Promise.all([
          axios.get('http://localhost:8000/api/users/profile'),
          axios.get('http://localhost:8000/api/users')
        ]);
        setCompanyName(profileRes.data.companyName || '');
        setCompanyId(profileRes.data.companyId || '');
        setEmployees(userRes.data);
      } catch (err) {
        console.error('Error loading profile/users:', err.response || err);
        setError(err.response?.data?.message || 'Failed to load user data');
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserId || !companyId) return;
      try {
        const token = localStorage.getItem('token');
        
        const tasksResponse = await axios.get('http://localhost:8000/api/tasks', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        let filteredTasks = tasksResponse.data;
        if (userRole === 'Employee') {
          filteredTasks = tasksResponse.data.filter(task => 
            task.assignedTo && task.assignedTo.includes(currentUserId)
          );
        }
        
        filteredTasks = filteredTasks.filter(task =>
          task.employeeId?.startsWith(companyId)
        );

        setTasks(filteredTasks);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchData();
    }
  }, [currentUserId, companyId, userRole]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownIndex(null);
        setEditModeIndex(null);
      }
      if (selectedTask && !event.target.closest('.task-details-modal')) {
        setSelectedTask(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedTask]);

  const handleTasksBtn = () => navigate("/AddTaskForm");

  const handleDelete = async (id) => {
    try {
      setTasks(tasks.filter(task => task._id !== id));
      setDropdownIndex(null);
      setConfirmDeleteIndex(null);

      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Task deleted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      try {
        const tasksResponse = await axios.get('http://localhost:8000/api/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasks(tasksResponse.data);
      } catch (fetchError) {
        console.error('Error refreshing tasks:', fetchError);
      }

      toast.error(err.response?.data?.message || 'Failed to delete task', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });

      console.error('Error deleting task:', err);
    }
  };

  const handleEditClick = (index) => {
    setEditModeIndex(index);
  };

  const navigateToEdit = (task) => {
    navigate('/AddTaskForm', { state: { task } });
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:8000/api/tasks/${id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setTasks(tasks.map(task => task._id === id ? response.data : task));
      setEditModeIndex(null);
      setDropdownIndex(null);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const getAssignedNames = (assignedTo) => {
    if (!assignedTo || !Array.isArray(assignedTo)) return [];
    
    return assignedTo.map(id => {
      const employee = employees.find(e => e._id === id);
      return employee ? (employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.fullname) : null;
    }).filter(Boolean);
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#ff4444'; // Red
      case 'medium':
      case 'moderate':
        return '#ffbb33'; // Orange
      case 'low':
        return '#00C851'; // Green
      default:
        return '#888'; // Default gray
    }
  };

  const formatAssignedMembers = (assignedTo, taskId) => {
    const names = getAssignedNames(assignedTo);
    
    if (names.length === 0) {
      return <span className="all-tasks-unassigned-label">Unassigned</span>;
    }

    if (names.length <= 3) {
      return (
        <div className="all-tasks-assigned-members">
          {names.map((name, index) => (
            <div key={index} className="all-tasks-assigned-member">
              <span className="all-tasks-emoji">👤</span>
              <span className="all-tasks-assigned-name">{name}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div 
        className="all-tasks-assigned-count"
        onMouseEnter={() => setHoveredTaskId(taskId)}
        onMouseLeave={() => setHoveredTaskId(null)}
      >
        {names.length} members
        {hoveredTaskId === taskId && (
          <div className="all-tasks-assigned-tooltip">
            {names.map((name, index) => (
              <div key={index} className="all-tasks-tooltip-name">
                <span className="all-tasks-emoji">👤</span>
                {name}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const filteredTasks = tasks.filter(task =>
    task.taskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.assignedTo && Array.isArray(task.assignedTo) && 
      task.assignedTo.some(id => {
        const employee = employees.find(e => e._id === id);
        return employee?.fullname?.toLowerCase().includes(searchTerm.toLowerCase());
      }))
  );

  if (loading) {
    return (
      <div>
        <TaskNavbar />
        <div className="all-tasks-page-wrapper">
          <div className="all-tasks-loading-message">Loading tasks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <TaskNavbar />
        <div className="all-tasks-page-wrapper">
          <div className="all-tasks-error-message">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TaskNavbar />
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
      <div className="all-tasks-page-wrapper">
        <div className="all-tasks-container">
          <div className="all-tasks-list-wrapper">
            <div className="all-tasks-controls-wrapper">
              <div className="all-tasks-filters-wrapper">
                <div className="all-tasks-filter-button">Total <strong>{tasks.length}</strong></div>
                <div className="all-tasks-open-button">
                  Open <span className="all-tasks-open-count">{tasks.filter(t => t.status === 'Open').length}</span>
                </div>
                <div className="all-tasks-filter-button">
                  Completed <span className="all-tasks-completed-count">{tasks.filter(t => t.status === 'Completed').length}</span>
                </div>
              </div>

              <div className="all-tasks-actions-right">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="all-tasks-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {userRole === 'Admin' && (
                  <button className="all-tasks-add-button" onClick={handleTasksBtn}>
                    Add Task
                  </button>
                )}
              </div>
            </div>

            <div className="all-tasks-table-wrapper">
              <div className="all-tasks-table-container">
                <div className="all-tasks-header-row">
                  <div className="all-tasks-column all-tasks-details-column">Task Details</div>
                  <div className="all-tasks-column all-tasks-status-column">Status</div>
                  <div className="all-tasks-column all-tasks-assigned-column">Assigned To</div>
                  {userRole === 'Admin' && (
                    <div className="all-tasks-column all-tasks-action-column">Actions</div>
                  )}
                </div>

                <div className="all-tasks-list-container">
                  {filteredTasks.length === 0 ? (
                    <div className="all-tasks-no-tasks-message">
                      {userRole === 'Admin' ? "No tasks found" : "You don't have any assigned tasks"}
                    </div>
                  ) : (
                    filteredTasks.map((task, index) => (
                      <div className="all-tasks-item" key={task._id}>
                        <div className="all-tasks-column all-tasks-details-column" onClick={() => setSelectedTask(task)}>
                          <span className="all-tasks-emoji">👤</span>
                          <div className="all-tasks-text-wrapper">
                            <div className="all-tasks-title" style={{ color: '#1A73E8' }}>{task.taskName || 'Untitled Task'}</div>
                            <div className="all-tasks-desc all-tasks-single-line">
                              {task.description || 'No description provided'}
                            </div>
                            <div className="all-tasks-meta">
                              {task.priority && (
                                <span 
                                  className="all-tasks-priority-badge"
                                  style={{ 
                                    backgroundColor: getPriorityColor(task.priority),
                                    color: '#fff',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    marginRight: '8px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                  }}
                                >
                                  {task.priority}
                                </span>
                              )}
                              {task.dueDate && (
                                <span style={{ color: '#E74C3C' }}>
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <div className="all-tasks-owner-info">
                              <br />
                              <div><strong>Assign BY:</strong> {task.taskOwner || 'Unknown'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="all-tasks-column all-tasks-status-column">
                          <span className={`all-tasks-status-badge ${task.status === 'Open' ? 'all-tasks-open' : 'all-tasks-completed'}`}>
                            {task.status}
                          </span>
                        </div>
                        <div className="all-tasks-column all-tasks-assigned-column">
                          {formatAssignedMembers(task.assignedTo, task._id)}
                        </div>
                        {userRole === 'Admin' && (
                          <div className="all-tasks-column all-tasks-action-column">
                            <div className="all-tasks-action-container">
                              <div
                                className="all-tasks-action-icon-wrapper"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDropdownIndex(dropdownIndex === index ? null : index);
                                  setEditModeIndex(null);
                                }}
                              >
                                <FaEllipsisH className="all-tasks-action-icon" />
                              </div>

                              {dropdownIndex === index && (
                                <div
                                  className="all-tasks-dropdown-menu"
                                  onClick={(e) => e.stopPropagation()}
                                  ref={dropdownRef}
                                >
                                  {editModeIndex === index ? (
                                    <>
                                      <div className="all-tasks-dropdown-status" onClick={() => updateStatus(task._id, 'Open')}>Mark as Open</div>
                                      <div className="all-tasks-dropdown-status" onClick={() => updateStatus(task._id, 'Completed')}>Mark as Completed</div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="all-tasks-dropdown-option" onClick={() => navigateToEdit(task)}>Edit</div>
                                      <div className="all-tasks-dropdown-option" onClick={() => handleEditClick(index)}>Status</div>
                                      <div className="all-tasks-dropdown-option" style={{ color: 'red' }} onClick={() => setConfirmDeleteIndex(task._id)}>Delete</div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmDeleteIndex !== null && (
        <div className="all-tasks-modal-overlay">
          <div className="all-tasks-modal-content">
            <img src={warningIcon} alt="warning" className="all-tasks-warning-icon" />
            <h3>DELETE RECORD</h3>
            <p>Are you sure you want to delete this record?</p>
            <div className="all-tasks-modal-actions">
              <button className="all-tasks-cancel-btn" onClick={() => setConfirmDeleteIndex(null)}>Cancel</button>
              <button
                className="all-tasks-confirm-btn"
                onClick={() => {
                  handleDelete(confirmDeleteIndex);
                  setConfirmDeleteIndex(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedTask && (
        <div className="all-tasks-modal-overlay">
          <div className="task-details-modal">
            <button className="all-tasks-close-btn" onClick={() => setSelectedTask(null)}><RxCross2 /></button>
            <div className="task-header">
              <h2 className="task-title">Task :</h2>
              <h2 className="task-title">{selectedTask.taskName}</h2>
            </div>
            <table className="task-metadata-table">
              <tbody>
                <tr>
                  <td className="metadata-label">Priority :</td>
                  <td className="metadata-value">
                    <span 
                      style={{ 
                        backgroundColor: getPriorityColor(selectedTask.priority),
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}
                    >
                      {selectedTask.priority || '--'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="metadata-label">Assigned To :</td>
                  <td className="metadata-value">
                    <div className="assigned-to-list">
                      {selectedTask.assignedTo.map((id, index) => {
                        const employee = employees.find(e => e._id === id);
                        if (!employee) return null;
                        return (
                          <div key={index} className="assigned-to-item">
                            <img
                              src={
                                employee.image || 
                                `https://ui-avatars.com/api/?name=${
                                  employee.firstName && employee.lastName 
                                    ? `${employee.firstName}+${employee.lastName}` 
                                    : employee.fullname
                                }&background=random`
                              }
                              alt={employee.fullname}
                              className="avatar-placeholder"
                            />
                            <span>  {employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.fullname} </span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="metadata-label">Assigned By :</td>
                  <td className="metadata-value">
                    <div className="assigned-by">
                      <img
                        src={
                          employees.find(e => e.fullname === selectedTask.taskOwner)?.image ||
                          `https://ui-avatars.com/api/?name=${selectedTask.taskOwner || 'Unknown'}&background=random`
                        }
                        alt={selectedTask.taskOwner || 'Unknown'}
                        className="avatar-placeholder"
                      />
                      <div className="assigned-by-info">
                        <p>{selectedTask.taskOwner || '--'}</p>
                        <p>{employees.find(e => e.fullname === selectedTask.taskOwner)?.department || '--'}</p>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="metadata-label">Status :</td>
                  <td className="metadata-value">
                    <span 
                      className={`all-tasks-status-badge ${selectedTask.status === 'Open' ? 'all-tasks-open' : 'all-tasks-completed'}`}
                      style={{ display: 'inline-block' }}
                    >
                      {selectedTask.status || '--'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="metadata-label">Start Date :</td>
                  <td className="metadata-value">{selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString() : '--'}</td>
                </tr>
                <tr>
                  <td className="metadata-label">Due Date :</td>
                  <td className="metadata-value">{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : '--'}</td>
                </tr>
                <tr>
                  <td className="metadata-label">Reminder :</td>
                  <td className="metadata-value">{formatDateTime(selectedTask.reminder)}</td>
                </tr>
                <tr>
                  <td className="metadata-label">Task Category :</td>
                  <td className="metadata-value">{employees.find(e => e.fullname === selectedTask.taskOwner)?.department || '--'}</td>
                </tr>
                <tr>
                  <td className="metadata-label">Description :</td>
                  <td className="metadata-value"><pre className="metadata-description">{selectedTask.description || '--'}</pre></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTasks;