import React, { useState, useEffect, useRef } from 'react';
import './AttendanceSetting.css';
import SettingSidebarNavbar from '../pages/SettingSidebarNavbar';
import SettingSidebar from '../pages/SettingSidebar';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';

function AttendanceSetting() {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeeError, setEmployeeError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allShifts, setAllShifts] = useState([]);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const shiftSelectorRef = useRef(null);
  const [isShiftSelectorOpen, setIsShiftSelectorOpen] = useState(false);
  const [isShiftNameDropdownOpen, setIsShiftNameDropdownOpen] = useState(false);
  const shiftNameDropdownRef = useRef(null);

  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');

  const [formData, setFormData] = useState({
    shiftName: '',
    assignedEmployees: [],
    shiftStartTime: '',
    shiftEndTime: '',
    halfDayMarkTime: '',
    secondHalfMarkTime: '',
    lateMarkAfter: '',
    maxCheckIn: '',
    autoClockoutTime: '',
    workingDays: []
  });

  const shiftOptions = [
    { value: 'General Shift', label: 'General Shift' },
    { value: 'Afternoon Shift', label: 'Afternoon Shift' },
    { value: 'Night Shift', label: 'Night Shift' },
    { value: 'Other', label: 'Other' }
  ];

  const shiftConfigurations = {
    'General Shift': {
      shiftStartTime: '09:30 AM',
      shiftEndTime: '06:30 PM',
      halfDayMarkTime: '01:00 PM',
      secondHalfMarkTime: '06:30 PM',
      lateMarkAfter: '30',
      maxCheckIn: '3',
      autoClockoutTime: '60',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    'Afternoon Shift': {
      shiftStartTime: '01:00 PM',
      shiftEndTime: '09:00 PM',
      halfDayMarkTime: '05:30 PM',
      secondHalfMarkTime: '09:00 PM',
      lateMarkAfter: '30',
      maxCheckIn: '3',
      autoClockoutTime: '60',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    'Night Shift': {
      shiftStartTime: '09:30 PM',
      shiftEndTime: '06:30 AM',
      halfDayMarkTime: '01:30 AM',
      secondHalfMarkTime: '06:30 AM',
      lateMarkAfter: '30',
      maxCheckIn: '3',
      autoClockoutTime: '60',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    'Other': {
      shiftStartTime: '',
      shiftEndTime: '',
      halfDayMarkTime: '',
      secondHalfMarkTime: '',
      lateMarkAfter: '',
      maxCheckIn: '',
      autoClockoutTime: '',
      workingDays: []
    }
  };

  const validateTimeFormat = (time) => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM|am|pm)$/i;
    return timeRegex.test(time.trim());
  };

  const formatTimeToUpperCase = (time) => {
    if (!time) return time;
    const [timePart, meridian] = time.trim().split(/\s+/);
    return `${timePart} ${meridian.toUpperCase()}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'shiftName') {
      const config = shiftConfigurations[value] || shiftConfigurations['Other'];
      setFormData(prev => ({
        ...prev,
        [name]: value,
        ...config
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (shiftSelectorRef.current && !shiftSelectorRef.current.contains(event.target)) {
        setIsShiftSelectorOpen(false);
      }
      if (shiftNameDropdownRef.current && !shiftNameDropdownRef.current.contains(event.target)) {
        setIsShiftNameDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axios.get('http://localhost:8000/api/users/profile');
        const currentCompanyId = profileRes.data.companyId || '';
        setCompanyName(profileRes.data.companyName || '');
        setCompanyId(currentCompanyId);

        const token = localStorage.getItem('token');

        const [shiftsResponse, employeesResponse] = await Promise.all([
          axios.get(`http://localhost:8000/api/attendance-settings?companyId=${currentCompanyId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:8000/api/users', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const filteredShifts = shiftsResponse.data.data.filter(shift =>
          shift.companyId === currentCompanyId ||
          shift.assignedEmployees.some(emp => emp.employeeId?.startsWith(currentCompanyId))
        );

        setAllShifts(filteredShifts || []);
        setUsers(employeesResponse.data);

        try {
          const unassignedResponse = await axios.get(
            'http://localhost:8000/api/attendance-settings/unassigned',
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const companyEmployees = (unassignedResponse.data.data || employeesResponse.data)
            .filter(emp => currentCompanyId ? emp.employeeId?.startsWith(currentCompanyId) : true);

          setAvailableEmployees(companyEmployees);
        } catch (unassignedError) {
          console.error('Error fetching unassigned employees:', unassignedError);
          setAvailableEmployees(
            employeesResponse.data.filter(emp =>
              currentCompanyId ? emp.employeeId?.startsWith(currentCompanyId) : true
            )
          );
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setEmployeeError('Failed to load data');
        toast.error('Failed to load data. Please try again.', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } finally {
        setLoading(false);
        setLoadingEmployees(false);
      }
    };

    fetchData();
  }, []);

  const handleShiftSelect = (shiftId) => {
    if (!shiftId) {
      resetForm();
      setIsEditMode(false);
      setCurrentShiftId(null);
      setIsShiftSelectorOpen(false);
      return;
    }

    const selectedShift = allShifts.find(shift => shift._id === shiftId);
    if (selectedShift) {
      setFormData({
        shiftName: selectedShift.shiftName,
        assignedEmployees: selectedShift.assignedEmployees.map(emp => emp._id),
        shiftStartTime: selectedShift.shiftStartTime,
        shiftEndTime: selectedShift.shiftEndTime,
        halfDayMarkTime: selectedShift.halfDayMarkTime,
        secondHalfMarkTime: selectedShift.secondHalfMarkTime,
        lateMarkAfter: selectedShift.lateMarkAfter.toString(),
        maxCheckIn: selectedShift.maxCheckIn.toString(),
        autoClockoutTime: selectedShift.autoClockoutTime?.toString() || '',
        workingDays: selectedShift.workingDays
      });
      setCurrentShiftId(shiftId);
      setIsEditMode(true);
      setIsShiftSelectorOpen(false);
      toast.info(`Editing ${selectedShift.shiftName} shift`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const handleDeleteShift = (shiftId, shiftName) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${shiftName}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        confirmDeleteShift(shiftId);
      }
    });
  };

  const confirmDeleteShift = async (shiftId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/attendance-settings/${shiftId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const shiftsResponse = await axios.get(`http://localhost:8000/api/attendance-settings?companyId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const filteredShifts = shiftsResponse.data.data.filter(shift =>
        shift.companyId === companyId ||
        shift.assignedEmployees.some(emp => emp.employeeId?.startsWith(companyId))
      );

      setAllShifts(filteredShifts || []);
      resetForm();
      
      toast.success('Shift deleted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error('Failed to delete shift. Please try again.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const handleShiftNameSelect = (value) => {
    const config = shiftConfigurations[value] || shiftConfigurations['Other'];
    setFormData(prev => ({
      ...prev,
      shiftName: value,
      ...config
    }));
    setIsShiftNameDropdownOpen(false);
  };

  const handleCheckboxChange = (day) => {
    setFormData(prev => {
      if (prev.workingDays.includes(day)) {
        return {
          ...prev,
          workingDays: prev.workingDays.filter(d => d !== day)
        };
      } else {
        return {
          ...prev,
          workingDays: [...prev.workingDays, day]
        };
      }
    });
  };

  const toggleEmployeeSelection = async (employeeId) => {
    const isCurrentlySelected = formData.assignedEmployees.includes(employeeId);

    if (!isCurrentlySelected) {
      const selectedShift = allShifts.find(shift => 
        shift.shiftName.toLowerCase() === formData.shiftName.toLowerCase() &&
        (shift.companyId === companyId ||
         shift.assignedEmployees.some(emp => emp.employeeId?.startsWith(companyId)))
      );

      if (selectedShift && selectedShift.assignedEmployees.some(emp => emp._id === employeeId)) {
        Swal.fire({
          title: 'Employee Already Assigned',
          text: `This employee is already assigned to ${formData.shiftName}.`,
          icon: 'warning',
          confirmButtonText: 'OK'
        });
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const shiftsWithEmployee = allShifts.filter(shift =>
          (isEditMode ? shift._id !== currentShiftId : true) &&
          shift.assignedEmployees.some(emp => emp._id === employeeId)
        );

        for (const shift of shiftsWithEmployee) {
          await axios.put(
            `http://localhost:8000/api/attendance-settings/${shift._id}`,
            {
              ...shift,
              assignedEmployees: shift.assignedEmployees.filter(emp => emp._id !== employeeId)
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }

        const shiftsResponse = await axios.get(`http://localhost:8000/api/attendance-settings?companyId=${companyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const filteredShifts = shiftsResponse.data.data.filter(shift =>
          shift.companyId === companyId ||
          shift.assignedEmployees.some(emp => emp.employeeId?.startsWith(companyId))
        );

        setAllShifts(filteredShifts || []);
      } catch (error) {
        console.error('Error removing employee from previous shifts:', error);
        toast.error('Failed to update employee assignments', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        return;
      }
    }

    setFormData(prev => {
      const newAssigned = [...prev.assignedEmployees];
      if (newAssigned.includes(employeeId)) {
        return {
          ...prev,
          assignedEmployees: newAssigned.filter(id => id !== employeeId)
        };
      } else {
        return {
          ...prev,
          assignedEmployees: [...newAssigned, employeeId]
        };
      }
    });
  };

  const toggleSelectAll = async () => {
    if (formData.assignedEmployees.length === filteredEmployees.length) {
      // Deselect all employees
      setFormData(prev => ({
        ...prev,
        assignedEmployees: []
      }));
    } else {
      try {
        const token = localStorage.getItem('token');
        const employeesToAdd = filteredEmployees.map(emp => emp._id);

        // Find the selected shift (if it exists)
        const selectedShift = allShifts.find(shift => 
          shift.shiftName.toLowerCase() === formData.shiftName.toLowerCase() &&
          (shift.companyId === companyId ||
           shift.assignedEmployees.some(emp => emp.employeeId?.startsWith(companyId)))
        );

        // Remove employees from other shifts
        for (const shift of allShifts) {
          if (isEditMode && shift._id === currentShiftId) continue;
          if (selectedShift && shift._id === selectedShift._id) continue;
          
          if (shift.assignedEmployees.length > 0) {
            const updatedEmployees = shift.assignedEmployees.filter(emp => 
              !employeesToAdd.includes(emp._id)
            );
            if (updatedEmployees.length !== shift.assignedEmployees.length) {
              await axios.put(
                `http://localhost:8000/api/attendance-settings/${shift._id}`,
                {
                  ...shift,
                  assignedEmployees: updatedEmployees
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
            }
          }
        }

        // Update the local state with all employees
        setFormData(prev => ({
          ...prev,
          assignedEmployees: [...new Set([...prev.assignedEmployees, ...employeesToAdd])]
        }));

        // Refresh the shifts list
        const shiftsResponse = await axios.get(`http://localhost:8000/api/attendance-settings?companyId=${companyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const filteredShifts = shiftsResponse.data.data.filter(shift =>
          shift.companyId === companyId ||
          shift.assignedEmployees.some(emp => emp.employeeId?.startsWith(companyId))
        );

        setAllShifts(filteredShifts || []);

        // Update the backend for the current shift if it exists
        if (selectedShift && isEditMode) {
          await axios.put(
            `http://localhost:8000/api/attendance-settings/${selectedShift._id}`,
            {
              ...selectedShift,
              assignedEmployees: [...new Set([...selectedShift.assignedEmployees.map(emp => emp._id), ...employeesToAdd])]
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          toast.success('All employees assigned to the shift successfully!', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        }
      } catch (error) {
        console.error('Error updating employee assignments:', error);
        toast.error('Failed to update employee assignments', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    }
  };

  const filteredEmployees = availableEmployees.filter(emp => {
    if (!emp) return false;

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      emp.fullname?.toLowerCase().includes(searchLower) ||
      emp.employeeId?.toLowerCase().includes(searchLower);

    const matchesCompany = !companyId || emp.employeeId?.startsWith(companyId);

    return matchesSearch && matchesCompany;
  });

  console.log(filteredEmployees);
  

  const getSelectedEmployeeNames = () => {
    if (formData.assignedEmployees.length === 0) return 'Select employees...';
    if (formData.assignedEmployees.length > 3) return `${formData.assignedEmployees.length} employees selected`;

    return formData.assignedEmployees
      .map(id => {
        const emp = availableEmployees.find(e => e._id === id);
        return emp ? `${emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : emp.fullname}${emp.candidateId ? ` (${emp.candidateId})` : emp.employeeId ? ` (${emp.employeeId})` : ''}` : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  const getSelectedShiftName = () => {
    if (!currentShiftId) return 'Create New Shift';
    const selectedShift = allShifts.find(shift => shift._id === currentShiftId);
    return selectedShift ? `${selectedShift.shiftName} (${selectedShift.assignedEmployees.length} employees)` : 'Create New Shift';
  };

  const getSelectedShiftNameDisplay = () => {
    return formData.shiftName || 'Select Shift';
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.shiftName.trim()) newErrors.shiftName = "Shift name is required";
    if (formData.assignedEmployees.length === 0) newErrors.assignedEmployees = "At least one employee must be assigned";
    if (!formData.shiftStartTime.trim()) {
      newErrors.shiftStartTime = "Start time is required";
    } else if (!validateTimeFormat(formData.shiftStartTime)) {
      newErrors.shiftStartTime = "Invalid time format (e.g. 09:30 AM)";
    }
    if (!formData.shiftEndTime.trim()) {
      newErrors.shiftEndTime = "End time is required";
    } else if (!validateTimeFormat(formData.shiftEndTime)) {
      newErrors.shiftEndTime = "Invalid time format (e.g. 09:30 AM)";
    }
    if (!formData.halfDayMarkTime.trim()) {
      newErrors.halfDayMarkTime = "First-half mark time is required";
    } else if (!validateTimeFormat(formData.halfDayMarkTime)) {
      newErrors.halfDayMarkTime = "Invalid time format (e.g. 01:00 PM)";
    }
    if (!formData.secondHalfMarkTime.trim()) {
      newErrors.secondHalfMarkTime = "Second-half mark time is required";
    } else if (!validateTimeFormat(formData.secondHalfMarkTime)) {
      newErrors.secondHalfMarkTime = "Invalid time format (e.g. 05:00 PM)";
    }
    if (!formData.lateMarkAfter.trim()) newErrors.lateMarkAfter = "Late mark minutes is required";
    if (!formData.maxCheckIn.trim()) newErrors.maxCheckIn = "Max check-ins is required";
    if (!formData.autoClockoutTime.trim()) newErrors.autoClockoutTime = "Auto clockout time is required";
    if (formData.workingDays.length === 0) newErrors.workingDays = "At least one working day is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      shiftName: '',
      assignedEmployees: [],
      shiftStartTime: '',
      shiftEndTime: '',
      halfDayMarkTime: '',
      secondHalfMarkTime: '',
      lateMarkAfter: '',
      maxCheckIn: '',
      autoClockoutTime: '',
      workingDays: []
    });
    setCurrentShiftId(null);
    setIsEditMode(false);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      shiftName: formData.shiftName,
      companyId: companyId,
      assignedEmployees: [...new Set(formData.assignedEmployees)],
      shiftStartTime: formatTimeToUpperCase(formData.shiftStartTime),
      shiftEndTime: formatTimeToUpperCase(formData.shiftEndTime),
      halfDayMarkTime: formatTimeToUpperCase(formData.halfDayMarkTime),
      secondHalfMarkTime: formatTimeToUpperCase(formData.secondHalfMarkTime),
      lateMarkAfter: parseInt(formData.lateMarkAfter),
      maxCheckIn: parseInt(formData.maxCheckIn),
      autoClockoutTime: parseInt(formData.autoClockoutTime),
      workingDays: formData.workingDays
    };

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const existingShift = allShifts.find(shift => 
        shift.shiftName.toLowerCase() === formData.shiftName.toLowerCase() &&
        (shift.companyId === companyId ||
         shift.assignedEmployees.some(emp => emp.employeeId?.startsWith(companyId)))
      );

      let response;
      if (existingShift && !isEditMode) {
        // Update existing shift
        response = await axios.put(
          `http://localhost:8000/api/attendance-settings/${existingShift._id}`,
          {
            ...payload,
            assignedEmployees: [...new Set([...existingShift.assignedEmployees.map(emp => emp._id), ...payload.assignedEmployees])]
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        setCurrentShiftId(existingShift._id);
        setIsEditMode(true);
      } else if (isEditMode) {
        // Update current shift
        response = await axios.put(
          `http://localhost:8000/api/attendance-settings/${currentShiftId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Create new shift
        response = await axios.post(
          'http://localhost:8000/api/attendance-settings',
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        setCurrentShiftId(response.data.data._id);
        setIsEditMode(true);
      }

      // Refresh shifts
      const shiftsResponse = await axios.get(`http://localhost:8000/api/attendance-settings?companyId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const filteredShifts = shiftsResponse.data.data.filter(shift =>
        shift.companyId === companyId ||
        shift.assignedEmployees.some(emp => emp.employeeId?.startsWith(companyId))
      );

      setAllShifts(filteredShifts || []);

      toast.success(`Shift ${existingShift || isEditMode ? 'updated' : 'created'} successfully!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      resetForm();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      if (error.response && error.response.data.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.path] = err.msg;
        });
        setErrors(backendErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || loadingEmployees) {
    return (
      <>
        <SettingSidebarNavbar />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="attendance-setting">
          <SettingSidebar />
          <main className="attendance-setting-container">
            <div className="employee-no-records">
              <div className="employee-no-records-image">
                <div className="employee-image-placeholder">⏳</div>
              </div>
              <div className="employee-no-records-text">Loading...</div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <SettingSidebarNavbar />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <div className="attendance-setting">
        <SettingSidebar />
        <main className="attendance-setting-container">
          <section className="attendance-setting-card">
            <h2>Attendance Setting</h2>
            <div className="strict-timings-header">
              <div className="strict-timings-employee-dropdown-container" ref={shiftSelectorRef}>
                <div
                  className="strict-timings-employee-dropdown-toggle shift-selector1"
                  onClick={() => setIsShiftSelectorOpen(!isShiftSelectorOpen)}
                >
                  {getSelectedShiftName()}
                  <span className="strict-timings-dropdown-arrow">{isShiftSelectorOpen ? '▲' : '▼'}</span>
                </div>
                {isShiftSelectorOpen && (
                  <div className="strict-timings-employee-dropdown-menu">
                    <div
                      className="strict-timings-employee-checkbox-item"
                      onClick={() => handleShiftSelect('')}
                    >
                      Create New Shift
                    </div>
                    {allShifts.map(shift => (
                      <div
                        key={shift._id}
                        className="strict-timings-employee-checkbox-item shift-item"
                      >
                        <span
                          className="shift-name"
                          onClick={() => handleShiftSelect(shift._id)}
                        >
                          {shift.shiftName} ({shift.assignedEmployees.length} employees)
                        </span>
                        <FaTrash
                          className="shift-delete-icon"
                          onClick={() => handleDeleteShift(shift._id, shift.shiftName)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="strict-timings-form-box">
              <form onSubmit={handleSubmit}>
                <div className="strict-timings-form-row">
                  <div className="strict-timings-form-group">
                    <label>Shift Name <span className="strict-timings-required">*</span></label>
                    <div className="strict-timings-employee-dropdown-container" ref={shiftNameDropdownRef}>
                      <div
                        className={`strict-timings-employee-dropdown-toggle ${isEditMode ? 'strict-timings-input-disable' : ''} ${errors.shiftName ? 'strict-timings-error-field' : ''}`}
                        onClick={() => !isEditMode && setIsShiftNameDropdownOpen(!isShiftNameDropdownOpen)}
                      >
                        {getSelectedShiftNameDisplay()}
                        <span className="strict-timings-dropdown-arrow">{isShiftNameDropdownOpen ? '▲' : '▼'}</span>
                      </div>
                      {isShiftNameDropdownOpen && !isEditMode && (
                        <div className="strict-timings-employee-dropdown-menu">
                          <div
                            className="strict-timings-employee-checkbox-item"
                            onClick={() => handleShiftNameSelect('')}
                          >
                            Select Shift
                          </div>
                          {shiftOptions.map(option => (
                            <div
                              key={option.value}
                              className="strict-timings-employee-checkbox-item"
                              onClick={() => handleShiftNameSelect(option.value)}
                            >
                              {option.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.shiftName && <div className="strict-timings-error-message">{errors.shiftName}</div>}
                  </div>
                </div>

                <div className="strict-timings-form-row">
                  <div className="strict-timings-form-group">
                    <label>Assigned Employees <span className="strict-timings-required">*</span></label>
                    <div className="strict-timings-employee-dropdown-container" ref={dropdownRef}>
                      <div
                        className="strict-timings-employee-dropdown-toggle"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        {getSelectedEmployeeNames()}
                        <span className="strict-timings-dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                      </div>

                      {isDropdownOpen && (
                        <div className="strict-timings-employee-dropdown-menu">
                          <div className="strict-timings-employee-search-container">
                            <input
                              type="text"
                              placeholder="Search employees..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="strict-timings-employee-search-input"
                            />
                          </div>

                          <div className="strict-timings-employee-checkbox-container">
                            <label className="strict-timings-employee-checkbox-item strict-timings-select-all">
                              <input
                                type="checkbox"
                                checked={formData.assignedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                                onChange={toggleSelectAll}
                              />
                              <span>Select All</span>
                            </label>

                            {filteredEmployees.length > 0 ? (
                              filteredEmployees.map(employee => (
                                <label key={employee._id} className="strict-timings-employee-checkbox-item">
                                  <input
                                    type="checkbox"
                                    checked={formData.assignedEmployees.includes(employee._id)}
                                    onChange={() => toggleEmployeeSelection(employee._id)}
                                  />
                                  <span>
                                  {employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.fullname} 
                                  {employee.candidateId ? ` (${employee.candidateId})` : employee.employeeId ? ` (${employee.employeeId})` : ''}
                                  </span>
                                </label>
                              ))
                            ) : (
                              <div className="strict-timings-no-employees-found">No employees found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.assignedEmployees && <div className="strict-timings-error-message">{errors.assignedEmployees}</div>}
                  </div>
                </div>

                <h3 className="strict-timings-section-title">Shift Timings</h3>

                <div className="strict-timings-form-row">
                  <div className="strict-timings-form-group">
                    <label>Shift Start Time <span className="strict-timings-required">*</span></label>
                    <input
                      type="text"
                      name="shiftStartTime"
                      value={formData.shiftStartTime}
                      onChange={handleChange}
                      placeholder="e.g. 09:00 AM"
                      className={`strict-timings-input-field ${errors.shiftStartTime ? 'strict-timings-error-field' : ''}`}
                    />
                    {errors.shiftStartTime && <div className="strict-timings-error-message">{errors.shiftStartTime}</div>}
                  </div>
                  <div className="strict-timings-form-group">
                    <label>Shift End Time <span className="strict-timings-required">*</span></label>
                    <input
                      type="text"
                      name="shiftEndTime"
                      value={formData.shiftEndTime}
                      onChange={handleChange}
                      placeholder="e.g. 05:00 PM"
                      className={`strict-timings-input-field ${errors.shiftEndTime ? 'strict-timings-error-field' : ''}`}
                    />
                    {errors.shiftEndTime && <div className="strict-timings-error-message">{errors.shiftEndTime}</div>}
                  </div>
                </div>

                <h3 className="strict-timings-section-title">Half Day Configuration</h3>

                <div className="strict-timings-form-row">
                  <div className="strict-timings-form-group">
                    <label>First-Half Mark Time <span className="strict-timings-required">*</span></label>
                    <input
                      type="text"
                      name="halfDayMarkTime"
                      value={formData.halfDayMarkTime}
                      onChange={handleChange}
                      placeholder="e.g. 01:00 PM"
                      className={`strict-timings-input-field ${errors.halfDayMarkTime ? 'strict-timings-error-field' : ''}`}
                    />
                    {errors.halfDayMarkTime && <div className="strict-timings-error-message">{errors.halfDayMarkTime}</div>}
                  </div>
                  <div className="strict-timings-form-group">
                    <label>Second-Half Mark Time <span className="strict-timings-required">*</span></label>
                    <input
                      type="text"
                      name="secondHalfMarkTime"
                      value={formData.secondHalfMarkTime}
                      onChange={handleChange}
                      placeholder="e.g. 05:00 PM"
                      className={`strict-timings-input-field ${errors.secondHalfMarkTime ? 'strict-timings-error-field' : ''}`}
                    />
                    {errors.secondHalfMarkTime && <div className="strict-timings-error-message">{errors.secondHalfMarkTime}</div>}
                  </div>
                </div>

                <h3 className="strict-timings-section-title">Attendance Rules</h3>

                <div className="strict-timings-form-row">
                  <div className="strict-timings-form-group">
                    <label>Late mark after (minutes) <span className="strict-timings-required">*</span></label>
                    <input
                      type="number"
                      name="lateMarkAfter"
                      value={formData.lateMarkAfter}
                      onChange={handleChange}
                      placeholder="e.g. 30"
                      className={`strict-timings-input-field ${errors.lateMarkAfter ? 'strict-timings-error-field' : ''}`}
                      min="0"
                    />
                    {errors.lateMarkAfter && <div className="strict-timings-error-message">{errors.lateMarkAfter}</div>}
                  </div>
                  <div className="strict-timings-form-group">
                    <label>Maximum check-in allowed in a day <span className="strict-timings-required">*</span></label>
                    <input
                      type="number"
                      name="maxCheckIn"
                      value={formData.maxCheckIn}
                      onChange={handleChange}
                      placeholder="e.g. 3"
                      className={`strict-timings-input-field ${errors.maxCheckIn ? 'strict-timings-error-field' : ''}`}
                      min="1"
                    />
                    {errors.maxCheckIn && <div className="strict-timings-error-message">{errors.maxCheckIn}</div>}
                  </div>
                  <div className="strict-timings-form-group">
                    <label>Auto Clockout Time (minutes) <span className="strict-timings-required">*</span></label>
                    <input
                      type="number"
                      name="autoClockoutTime"
                      value={formData.autoClockoutTime}
                      onChange={handleChange}
                      placeholder="e.g. 60"
                      className={`strict-timings-input-field ${errors.autoClockoutTime ? 'strict-timings-error-field' : ''}`}
                      min="0"
                    />
                    {errors.autoClockoutTime && <div className="strict-timings-error-message">{errors.autoClockoutTime}</div>}
                  </div>
                </div>

                <h3 className="strict-timings-section-title">Working Days</h3>

                <div className="strict-timings-form-row">
                  <div className="strict-timings-form-group">
                    <label>Office opens on <span className="strict-timings-required">*</span></label>
                    <div className="strict-timings-checkbox-group">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <label key={day} className="strict-timings-checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.workingDays.includes(day)}
                            onChange={() => handleCheckboxChange(day)}
                            className="strict-timings-checkbox-input"
                          />
                          <span className="strict-timings-checkbox-text">{day}</span>
                        </label>
                      ))}
                    </div>
                    {errors.workingDays && <div className="strict-timings-error-message">{errors.workingDays}</div>}
                  </div>
                </div>

                <div className="strict-timings-form-actions">
                  <button
                    type="button"
                    className="strict-timings-btn strict-timings-gray"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="strict-timings-btn strict-timings-blue"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default AttendanceSetting;