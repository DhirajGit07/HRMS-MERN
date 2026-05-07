import React, { useState, useEffect, useRef } from "react";
import "./FormView.css";
import { useNavigate } from 'react-router-dom';
import { FaEllipsisH } from 'react-icons/fa';
import TaskNavbar from "../pages/TaskNavbar";
import warningIcon from "../assets/warning-icon.png";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FormView = () => {
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
    const [companyId, setCompanyId] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData) {
            setUserRole(userData.role || 'Employee');
            setCurrentUserId(userData._id || '');
        }
    }, []);

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:8000/api/users/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setCompanyId(res.data.companyId || '');
            } catch (err) {
                console.error('Error fetching company ID:', err);
                setError(err.response?.data?.message || 'Failed to fetch company ID');
            }
        };

        fetchCompany();
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

                // Filter: Employee assigned
                if (userRole === 'Employee') {
                    filteredTasks = filteredTasks.filter(task =>
                        task.assignedTo && task.assignedTo.includes(currentUserId)
                    );
                }

                // Filter: Company-specific
                filteredTasks = filteredTasks.filter(task =>
                    task.employeeId?.startsWith(companyId)
                );

                setTasks(filteredTasks);
            } catch (err) {
                console.error('Error fetching tasks:', err);
                setError(err.response?.data?.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUserId, companyId, userRole]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownIndex(null);
                setEditModeIndex(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleTasksBtn = () => navigate("/AddTaskForm");

    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        try {
            // Optimistic UI update - remove the task immediately
            setTasks(tasks.filter(task => task._id !== id));
            setDropdownIndex(null);
            setConfirmDeleteIndex(null);

            await axios.delete(`http://localhost:8000/api/tasks/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Show success toast
            toast.success('Task deleted successfully!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } catch (err) {
            // Revert UI if deletion fails
            try {
                const tasksResponse = await axios.get('http://localhost:8000/api/tasks', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTasks(tasksResponse.data);
            } catch (fetchError) {
                console.error('Error refreshing tasks:', fetchError);
            }

            // Show error toast
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

    const filteredTasks = tasks.filter(task =>
        task.taskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div>
                <TaskNavbar />
                <div className="form-view-wrapper">Loading tasks...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <TaskNavbar />
                <div className="form-view-wrapper">Error: {error}</div>
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
            <div className="form-view-wrapper">
                <div className="form-view-container">
                    <div className="form-controls">
                        <div className="search-box-container">
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                className="task-search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="action-buttons">
                            {userRole === 'Admin' && (
                                <button className="form-add-task-btn" onClick={handleTasksBtn}>
                                    Add Task
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="form-table-container">
                        <table className="form-task-table">
                            <thead>
                                <tr>
                                    <th className="form-th">Task name</th>
                                    <th className="form-th">Due Date</th>
                                    <th className="form-th">Priority</th>
                                    <th className="form-th">Status</th>
                                    <th className="form-th">Task Owner</th>
                                    {userRole === 'Admin' && <th className="form-th">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="form-table-body">
                                {filteredTasks.length === 0 ? (
                                    <tr className="form-tr">
                                        <td colSpan={userRole === 'Admin' ? 6 : 5} className="form-td form-no-tasks">
                                            {userRole === 'Admin' ? "No tasks found" : "You don't have any assigned tasks"}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTasks.map((task, index) => (
                                        <tr className="form-tr" key={task._id}>
                                            <td className="form-td">{task.taskName}</td>
                                            <td className="form-td">{task.dueDate && new Date(task.dueDate).toLocaleDateString()}</td>
                                            <td className={`form-td form-priority-${(task.priority || '').toLowerCase()}`}>
                                                {task.priority || 'Moderate'}
                                            </td>
                                            <td className={`form-td form-status-${(task.status || '').toLowerCase()}`}>
                                                {task.status}
                                            </td>
                                            <td className="form-td">{task.taskOwner || 'Unknown'}</td>
                                            {userRole === 'Admin' && (
                                                <td className="form-td form-action-column">
                                                    <div className="form-action-container">
                                                        <div
                                                            className="form-action-icon-wrapper"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDropdownIndex(dropdownIndex === index ? null : index);
                                                                setEditModeIndex(null);
                                                            }}
                                                        >
                                                            <FaEllipsisH className="form-action-icon" />
                                                        </div>

                                                        {dropdownIndex === index && (
                                                            <div
                                                                className="form-dropdown-menu"
                                                                onClick={(e) => e.stopPropagation()}
                                                                ref={dropdownRef}
                                                            >
                                                                {editModeIndex === index ? (
                                                                    <>
                                                                        <div
                                                                            className="form-dropdown-status"
                                                                            onClick={() => updateStatus(task._id, 'Open')}
                                                                        >
                                                                            Mark as Open
                                                                        </div>
                                                                        <div
                                                                            className="form-dropdown-status"
                                                                            onClick={() => updateStatus(task._id, 'Completed')}
                                                                        >
                                                                            Mark as Completed
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div
                                                                            className="form-dropdown-option"
                                                                            onClick={() => navigateToEdit(task)}
                                                                        >
                                                                            Edit
                                                                        </div>
                                                                        <div
                                                                            className="form-dropdown-option"
                                                                            onClick={() => handleEditClick(index)}
                                                                        >
                                                                            Status
                                                                        </div>
                                                                        <div
                                                                            className="form-dropdown-option"
                                                                            style={{ color: 'red' }}
                                                                            onClick={() => setConfirmDeleteIndex(task._id)}
                                                                        >
                                                                            Delete
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="form-task-footer">
                        <span className="form-total-records">
                            Total Record Count: <span className="form-record-count">{filteredTasks.length}</span>
                        </span>
                    </div>
                </div>
            </div>

            {confirmDeleteIndex !== null && (
                <div className="form-view-modal-overlay">
                    <div className="form-view-modal-content">
                        <img src={warningIcon} alt="warning" className="form-view-warning-icon" />
                        <h3>DELETE RECORD</h3>
                        <p>Are you sure you want to delete this record?</p>
                        <div className="form-view-modal-actions">
                            <button className="form-view-cancel-btn" onClick={() => setConfirmDeleteIndex(null)}>Cancel</button>
                            <button
                                className="form-view-confirm-btn"
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
        </div>
    );
};

export default FormView;