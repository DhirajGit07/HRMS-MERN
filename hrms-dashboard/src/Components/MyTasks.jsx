import React, { useState, useEffect, useRef } from "react";
import "./MyTasks.css";
import { useNavigate } from "react-router-dom";
import TaskNavbar from "../pages/TaskNavbar";
import warningIcon from "../assets/warning-icon.png";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RxCross2 } from "react-icons/rx";
import { FaEllipsisH } from 'react-icons/fa';

const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const MyTasks = () => {
  const navigate = useNavigate();
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const [editModeIndex, setEditModeIndex] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [userRole, setUserRole] = useState('Employee');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [hoveredTaskId, setHoveredTaskId] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  const dropdownRef = useRef(null);

  console.log(tasks);
  

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      setUserRole(userData.role || 'Employee');
      setCurrentUserEmail(userData.email || '');
      setCurrentUserId(userData._id || '');
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axios.get('http://localhost:8000/api/users/profile');
        setCompanyName(profileRes.data.companyName || '');
        setCompanyId(profileRes.data.companyId || '');

        const userRes = await axios.get('http://localhost:8000/api/users');
        setEmployees(userRes.data);
      } catch (err) {
        console.error('Error:', err.response || err);
        setError(err.response?.data?.message || 'Failed to load data');
      }
      if (!currentUserId || !companyId) return;
      try {
        const token = localStorage.getItem('token');
        const tasksResponse = await axios.get('http://localhost:8000/api/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const employeesResponse = await axios.get('http://localhost:8000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });

        let filteredTasks = tasksResponse.data;

        if (userRole === 'Employee') {
          filteredTasks = filteredTasks.filter(task =>
            task.assignedTo && task.assignedTo.includes(currentUserId)
          );
        }

        if (companyId) {
          filteredTasks = filteredTasks.filter(task =>
            task.employeeId?.startsWith(companyId)
          );
        }

        setTasks(filteredTasks);
        setEmployees(employeesResponse.data);
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
        const token = localStorage.getItem('token');
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

  const navigateToEdit = (task) => {
    navigate("/AddTaskForm", { state: { task } });
    setDropdownIndex(null);
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
      return <span className="my-tasks-unassigned-label">Unassigned</span>;
    }

    if (names.length <= 3) {
      return (
        <div className="my-tasks-assigned-members">
          {names.map((name, index) => (
            <div key={index} className="my-tasks-assigned-member">
              <span className="my-tasks-emoji">👤</span>
              <span className="my-tasks-assigned-name">{name}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        className="my-tasks-assigned-count"
        onMouseEnter={() => setHoveredTaskId(taskId)}
        onMouseLeave={() => setHoveredTaskId(null)}
      >
        {names.length} members
        {hoveredTaskId === taskId && (
          <div className="my-tasks-assigned-tooltip">
            {names.map((name, index) => (
              <div key={index} className="my-tasks-tooltip-name">
                <span className="my-tasks-emoji">👤</span>
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
    (task.assignedTo && task.assignedTo.some(id => {
      const employee = employees.find(e => e._id === id);
      return employee?.fullname?.toLowerCase().includes(searchTerm.toLowerCase());
    }))
  );

  // Function to format date as dd/mm/yyyy and date-time as dd/mm/yyyy hh:mm AM/PM
  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = true; // Use 12-hour format with AM/PM
    }
    return date.toLocaleString('en-GB', options).replace(',', '');
  };

  if (loading) {
    return (
      <div>
        <TaskNavbar />
        <div className="my-tasks-page-wrapper-v2">
          <div className="my-tasks-loading">Loading tasks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <TaskNavbar />
        <div className="my-tasks-page-wrapper-v2">
          <div className="my-tasks-error">Error: {error}</div>
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
      <div className="my-tasks-page-wrapper-v2">
        <div className="my-tasks-container-v2">
          <div className="my-tasks-list-wrapper-v2">
            <div className="my-tasks-controls-wrapper-v2">
              <div className="my-tasks-filters-wrapper-v2">
                <div className="my-tasks-filter-button-v2">Total <strong>{tasks.length}</strong></div>
                <div className="my-tasks-open-button-v2">Open <span className="my-tasks-open-count-v2">{tasks.filter(t => t.status === 'Open').length}</span></div>
                <div className="my-tasks-filter-button-v2">Completed <span className="my-tasks-completed-count-v2">{tasks.filter(t => t.status === 'Completed').length}</span></div>
              </div>
              <div className="my-tasks-actions-right-v2">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="my-tasks-search-input-v2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {userRole === 'Admin' && (
                  <button className="my-tasks-add-task-button-v2" onClick={handleTasksBtn}>Add Task</button>
                )}
              </div>
            </div>
            <div className="my-tasks-table-wrapper-v2">
              <div className="my-tasks-table-container-v2">
                <div className="my-tasks-header-row-v2">
                  <div className="my-tasks-column-v2 my-tasks-details-column-v2">Task Details</div>
                  <div className="my-tasks-column-v2 my-tasks-status-column-v2">Status</div>
                  <div className="my-tasks-column-v2 my-tasks-assigned-column-v2">Assigned To</div>
                  {userRole === 'Admin' && (
                    <div className="my-tasks-column-v2 my-tasks-action-column-v2">Actions</div>
                  )}
                </div>
                <div className="my-tasks-list-container-v2">
                  {filteredTasks.length === 0 ? (
                    <div className="my-tasks-no-tasks">
                      {userRole === 'Admin' ? "No tasks found" : "You don't have any assigned tasks"}
                    </div>
                  ) : (
                    filteredTasks.map((task, index) => (
                      <div className="my-tasks-task-item-v2" key={task._id}>
                        <div className="my-tasks-column-v2 my-tasks-details-column-v2" onClick={() => setSelectedTask(task)}>
                          <span className="my-tasks-emoji-v2">👤</span>
                          <div className="my-tasks-text-wrapper-v2">
                            <div className="my-tasks-title-v2" style={{ color: '#1A73E8' }}>{task.taskName || 'Untitled Task'}</div>
                            <div className="my-tasks-desc-v2 my-tasks-single-line-v2">{task.description || 'No description provided'}</div>
                            <div className="my-tasks-meta-v2">
                              {task.priority && (
                                <span 
                                  className="my-tasks-priority-badge"
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
                                  Due: {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                            <div className="my-tasks-owner-info">
                              <br />
                              <div><strong>Assign BY:</strong> {task.taskOwner || '--'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="my-tasks-column-v2 my-tasks-status-column-v2">
                          <span className={`my-tasks-status-badge-v2 ${task.status === 'Open' ? 'my-tasks-open-v2' : 'my-tasks-completed-v2'}`}>
                            {task.status}
                          </span>
                        </div>
                        <div className="my-tasks-column-v2 my-tasks-assigned-column-v2">
                          {formatAssignedMembers(task.assignedTo, task._id)}
                        </div>
                        {userRole === 'Admin' && (
                          <div className="my-tasks-column-v2 my-tasks-action-column-v2">
                            <div className="my-tasks-action-container">
                              <div className="my-tasks-action-icon-wrapper" onClick={(e) => {
                                e.stopPropagation();
                                setDropdownIndex(dropdownIndex === index ? null : index);
                                setEditModeIndex(null);
                              }}>
                                <FaEllipsisH className="my-tasks-action-icon" />
                              </div>
                              {dropdownIndex === index && (
                                <div className="my-tasks-dropdown-menu" onClick={(e) => e.stopPropagation()} ref={dropdownRef}>
                                  {editModeIndex === index ? (
                                    <>
                                      <div className="my-tasks-dropdown-status" onClick={() => updateStatus(task._id, 'Open')}>Mark as Open</div>
                                      <div className="my-tasks-dropdown-status" onClick={() => updateStatus(task._id, 'Completed')}>Mark as Completed</div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="my-tasks-dropdown-option" onClick={() => navigateToEdit(task)}>Edit</div>
                                      <div className="my-tasks-dropdown-option" onClick={() => handleEditClick(index)}>Status</div>
                                      <div className="my-tasks-dropdown-option" style={{ color: 'red' }} onClick={() => setConfirmDeleteIndex(task._id)}>Delete</div>
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
        <div className="my-tasks-modal-overlay">
          <div className="my-tasks-modal-content">
            <img src={warningIcon} alt="warning" className="my-tasks-warning-icon" />
            <h3>DELETE RECORD</h3>
            <p>Are you sure you want to delete this record?</p>
            <div className="my-tasks-modal-actions">
              <button className="my-tasks-cancel-btn" onClick={() => setConfirmDeleteIndex(null)}>Cancel</button>
              <button className="my-tasks-confirm-btn" onClick={() => {
                handleDelete(confirmDeleteIndex);
                setConfirmDeleteIndex(null);
              }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedTask && (
        <div className="my-tasks-modal-overlay">
          <div className="task-details-modal">
            <button className="my-tasks-close-btn" onClick={() => setSelectedTask(null)}><RxCross2 /></button>
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
                          employees.find(e => `${e.firstName} ${e.lastName}` === selectedTask.taskOwner)?.image ||
                          `https://ui-avatars.com/api/?name=${selectedTask.taskOwner || 'Unknown'}&background=random`
                        }
                        alt={selectedTask.taskOwner || 'Unknown'}
                        className="avatar-placeholder"
                      />
                      <div className="assigned-by-info">
                        <p>{selectedTask.taskOwner || '--'}</p>
                        <p>{employees.find(e => `${e.firstName} ${e.lastName}` === selectedTask.taskOwner)?.department || '--'}</p>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="metadata-label">Status :</td>
                  <td className="metadata-value">
                    <span 
                      className={`my-tasks-status-badge-v2 ${selectedTask.status === 'Open' ? 'my-tasks-open-v2' : 'my-tasks-completed-v2'}`}
                      style={{ display: 'inline-block' }}
                    >
                      {selectedTask.status || '--'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="metadata-label">Start Date :</td>
                  <td className="metadata-value">{formatDate(selectedTask.startDate)}</td>
                </tr>
                <tr>
                  <td className="metadata-label">Due Date :</td>
                  <td className="metadata-value">{formatDate(selectedTask.dueDate)}</td>
                </tr>
                <tr>
                  <td className="metadata-label">Reminder :</td>
                  <td className="metadata-value">{formatDate(selectedTask.reminder, true)}</td>
                </tr>
                <tr>
                  <td className="metadata-label">Task Category :</td>
                  <td className="metadata-value">{employees.find(e => `${e.firstName} ${e.lastName}` === selectedTask.taskOwner)?.department || '--'}</td>
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

export default MyTasks;