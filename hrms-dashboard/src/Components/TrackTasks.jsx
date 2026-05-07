import React, { useState, useEffect, useRef } from "react";
import "./TrackTasks.css";
import { useNavigate } from 'react-router-dom';
import { FaEllipsisH } from 'react-icons/fa';
import { RxCross2 } from "react-icons/rx";
import TaskNavbar from "../pages/TaskNavbar";
import warningIcon from "../assets/warning-icon.png";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TrackTasks = () => {
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
        const fetchTasks = async () => {
            if (!currentUserId || !companyId) return;

            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:8000/api/tasks', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                let filteredTasks = response.data;

                if (userRole === 'Employee') {
                    filteredTasks = filteredTasks.filter(task =>
                        task.assignedTo && task.assignedTo.includes(currentUserId)
                    );
                }

                filteredTasks = filteredTasks.filter(task =>
                    task.employeeId?.startsWith(companyId)
                );

                setTasks(filteredTasks);
            } catch (err) {
                console.error('Error fetching tasks:', err);
                setError(err.response?.data?.message || 'Failed to fetch tasks');
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [currentUserId, companyId, userRole]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownIndex(null);
                setEditModeIndex(null);
            }
            if (selectedTask && !e.target.closest('.tt-task-details-modal')) {
                setSelectedTask(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectedTask]);

    const handleTasksBtn = () => navigate("/AddTaskForm");

    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        try {
            setTasks(tasks.filter(task => task._id !== id));
            setDropdownIndex(null);
            setConfirmDeleteIndex(null);

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
        navigate('/AddTaskForm', { state: { task } });
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
            return <span className="tt-unassigned">Unassigned</span>;
        }

        if (names.length <= 3) {
            return (
                <div className="tt-assigned-members">
                    {names.map((name, index) => (
                        <div key={index} className="tt-assigned-member">
                            <span className="tt-avatar-icon">👤</span>
                            <span className="tt-assigned-name">{name}</span>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div
                className="tt-assigned-count"
                onMouseEnter={() => setHoveredTaskId(taskId)}
                onMouseLeave={() => setHoveredTaskId(null)}
            >
                {names.length} members
                {hoveredTaskId === taskId && (
                    <div className="tt-assigned-tooltip">
                        {names.map((name, index) => (
                            <div key={index} className="tt-tooltip-name">
                                <span className="tt-avatar-icon">👤</span>
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
                <div className="track-tasks-wrapper">
                    <div className="tt-loading">Loading tasks...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <TaskNavbar />
                <div className="track-tasks-wrapper">
                    <div className="tt-error">Error: {error}</div>
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
            <div className="track-tasks-wrapper">
                <div className="tt-container">
                    <div className="tt-list-wrapper">
                        <div className="tt-controls-wrapper">
                            <div className="tt-filters-wrapper">
                                <div className="tt-filter-btn">Total <strong>{tasks.length}</strong></div>
                                <div className="tt-open-btn">
                                    Open <span className="tt-open-count">{tasks.filter(t => t.status === 'Open').length}</span>
                                </div>
                                <div className="tt-filter-btn">
                                    Completed <span className="tt-completed-count">{tasks.filter(t => t.status === 'Completed').length}</span>
                                </div>
                            </div>

                            <div className="tt-actions-right">
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    className="tt-search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {userRole === 'Admin' && (
                                    <button className="tt-add-task-button" onClick={handleTasksBtn}>Add Task</button>
                                )}
                            </div>
                        </div>

                        <div className="tt-table-wrapper">
                            <div className="tt-table-container">
                                <div className="tt-header-row">
                                    <div className="tt-column tt-details-column">Task Details</div>
                                    <div className="tt-column tt-status-column">Status</div>
                                    <div className="tt-column tt-assigned-column">Assigned To</div>
                                    {userRole === 'Admin' && (
                                        <div className="tt-column tt-action-column">Actions</div>
                                    )}
                                </div>

                                <div className="tt-list-container">
                                    {filteredTasks.length === 0 ? (
                                        <div className="tt-no-tasks">
                                            {userRole === 'Admin' ? "No tasks found" : "You don't have any assigned tasks"}
                                        </div>
                                    ) : (
                                        filteredTasks.map((task, index) => (
                                            <div className="tt-item" key={task._id}>
                                                <div className="tt-column tt-details-column" onClick={() => setSelectedTask(task)}>
                                                    <span className="tt-avatar-icon">👤</span>
                                                    <div className="tt-text-wrapper">
                                                        <div className="tt-title" style={{ color: '#1A73E8' }}>{task.taskName || 'Untitled Task'}</div>
                                                        <div className="tt-desc tt-single-line">
                                                            {task.description || 'No description provided'}
                                                        </div>
                                                        <div className="tt-meta">
                                                            {task.priority && (
                                                                <span 
                                                                    className="tt-priority-badge"
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
                                                        <div className="tt-owner-info">
                                                            <br />
                                                            <div><strong>Assign BY:</strong> {task.taskOwner || 'Unknown'}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="tt-column tt-status-column">
                                                    <span className={`tt-status-badge ${task.status === 'Open' ? 'tt-open' : 'tt-completed'}`}>{task.status}</span>
                                                </div>
                                                <div className="tt-column tt-assigned-column">
                                                    {formatAssignedMembers(task.assignedTo, task._id)}
                                                </div>
                                                {userRole === 'Admin' && (
                                                    <div className="tt-column tt-action-column">
                                                        <div className="tt-action-container">
                                                            <div
                                                                className="tt-action-icon-wrapper"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDropdownIndex(dropdownIndex === index ? null : index);
                                                                    setEditModeIndex(null);
                                                                }}
                                                            >
                                                                <FaEllipsisH className="tt-action-icon" />
                                                            </div>

                                                            {dropdownIndex === index && (
                                                                <div
                                                                    className="tt-dropdown-menu"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    ref={dropdownRef}
                                                                >
                                                                    {editModeIndex === index ? (
                                                                        <>
                                                                            <div className="tt-dropdown-status" onClick={() => updateStatus(task._id, 'Open')}>Mark as Open</div>
                                                                            <div className="tt-dropdown-status" onClick={() => updateStatus(task._id, 'Completed')}>Mark as Completed</div>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <div className="tt-dropdown-option" onClick={() => navigateToEdit(task)}>Edit</div>
                                                                            <div className="tt-dropdown-option" onClick={() => handleEditClick(index)}>Status</div>
                                                                            <div className="tt-dropdown-option" style={{ color: 'red' }} onClick={() => setConfirmDeleteIndex(task._id)}>Delete</div>
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
                <div className="tt-task-modal-overlay">
                    <div className="tt-task-modal-content">
                        <img src={warningIcon} alt="warning" className="tt-task-warning-icon" />
                        <h3>DELETE RECORD</h3>
                        <p>Are you sure you want to delete this record?</p>
                        <div className="tt-task-modal-actions">
                            <button className="tt-task-cancel-btn" onClick={() => setConfirmDeleteIndex(null)}>Cancel</button>
                            <button
                                className="tt-task-confirm-btn"
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
                <div className="tt-task-modal-overlay">
                    <div className="tt-task-details-modal">
                        <button className="tt-task-close-btn" onClick={() => setSelectedTask(null)}><RxCross2 /></button>
                        <div className="tt-task-header">
                            <h2 className="tt-task-title">Task :</h2>
                            <h2 className="tt-task-title">{selectedTask.taskName}</h2>
                        </div>
                        <table className="tt-task-metadata-table">
                            <tbody>
                                <tr>
                                    <td className="tt-metadata-label">Priority :</td>
                                    <td className="tt-metadata-value">
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
                                    <td className="tt-metadata-label">Assigned To :</td>
                                    <td className="tt-metadata-value">
                                        <div className="tt-assigned-to-list">
                                            {selectedTask.assignedTo.map((id, index) => {
                                                const employee = employees.find(e => e._id === id);
                                                if (!employee) return null;
                                                return (
                                                    <div key={index} className="tt-assigned-to-item">
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
                                                            className="tt-avatar-placeholder"
                                                        />
                                                    <span>  {employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.fullname} </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="tt-metadata-label">Assigned By :</td>
                                    <td className="tt-metadata-value">
                                        <div className="tt-assigned-by">
                                            <img
                                                src={
                                                    employees.find(e => `${e.firstName} ${e.lastName}` === selectedTask.taskOwner)?.image ||
                                                    `https://ui-avatars.com/api/?name=${selectedTask.taskOwner || 'Unknown'}&background=random`
                                                }
                                                alt={selectedTask.taskOwner || 'Unknown'}
                                                className="tt-avatar-placeholder"
                                            />
                                            <div className="tt-assigned-by-info">
                                                <p>{selectedTask.taskOwner || '--'}</p>
                                                <p>{employees.find(e => `${e.firstName} ${e.lastName}` === selectedTask.taskOwner)?.department || '--'}</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="tt-metadata-label">Status :</td>
                                    <td className="tt-metadata-value">
                                        <span 
                                            className={`tt-status-badge ${selectedTask.status === 'Open' ? 'tt-open' : 'tt-completed'}`}
                                            style={{ display: 'inline-block' }}
                                        >
                                            {selectedTask.status || '--'}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="tt-metadata-label">Start Date :</td>
                                    <td className="tt-metadata-value">{selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString() : '--'}</td>
                                </tr>
                                <tr>
                                    <td className="tt-metadata-label">Due Date :</td>
                                    <td className="tt-metadata-value">{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : '--'}</td>
                                </tr>
                                <tr>
                                    <td className="tt-metadata-label">Reminder :</td>
                                    <td className="tt-metadata-value">{formatDateTime(selectedTask.reminder)}</td>
                                </tr>
                                <tr>
                                    <td className="tt-metadata-label">Task Category :</td>
                                    <td className="tt-metadata-value">{employees.find(e => `${e.firstName} ${e.lastName}` === selectedTask.taskOwner)?.department || '--'}</td>
                                </tr>
                                <tr>
                                    <td className="tt-metadata-label">Description :</td>
                                    <td className="tt-metadata-value"><pre className="tt-metadata-description">{selectedTask.description || '--'}</pre></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackTasks;