import React, { useState, useRef, useEffect } from 'react';
import './Dashboard.css';
import DashboardNavbar from '../pages/DashboardNavbar';
import axios from 'axios';
import { FiPlus } from 'react-icons/fi';
import { FaBirthdayCake } from "react-icons/fa";
import Swal from 'sweetalert2';

const initialLeaveData = [
  { type: "Casual Leave", available: 0, booked: 0, icon: "🗓️" },
  { type: "Paid Leave", available: 0, booked: 0, icon: "🏖️" },
  { type: "Unpaid Leave", available: 0, booked: 0, icon: "⏰" },
  { type: "Paternity Leave", available: 0, booked: 0, icon: "👶" },
  { type: "Sabbatical Leave", available: 0, booked: 0, icon: "📚" },
  { type: "Sick Leave", available: 0, booked: 0, icon: "🩺" },
];

const Dashboard = () => {
  // State variables
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(false);
  const quickActionsRef = useRef(null);
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedLeaveData, setUpdatedLeaveData] = useState(initialLeaveData);
  const [employeeFiles, setEmployeeFiles] = useState([]);
  const [organizationFiles, setOrganizationFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState("");
  const [openTasks, setOpenTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");
  const [newHires, setNewHires] = useState([]);
  const [newHiresLoading, setNewHiresLoading] = useState(true);
  const [newHiresError, setNewHiresError] = useState(null);
  const [employeesOnLeaveToday, setEmployeesOnLeaveToday] = useState([]);
  const [bookedCount, setBookedCount] = useState(0);
  const [absentMonths, setAbsentMonths] = useState(0);
  const [userRole, setUserRole] = useState("Employee");
  const [favorites, setFavorites] = useState([]);
  const [showFavForm, setShowFavForm] = useState(false);
  const [favName, setFavName] = useState('');
  const [favPhone, setFavPhone] = useState('');
  const [favPhotoFile, setFavPhotoFile] = useState(null);
  const [favPreview, setFavPreview] = useState(null);
  const [editingFavoriteId, setEditingFavoriteId] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [holidaysError, setHolidaysError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState(null);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annDate, setAnnDate] = useState('');
  const [annText, setAnnText] = useState('');
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [loginDetails, setLoginDetails] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [hrmsRole, setHrmsRole] = useState('');
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [generalSettings, setGeneralSettings] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [dateOfJoining, setDateOfJoining] = useState(null);
  const [lastProcessedMonth, setLastProcessedMonth] = useState(null);
  const [lastProcessedYear, setLastProcessedYear] = useState(null);
  const [workFromHomeToday, setWorkFromHomeToday] = useState([]);
  const [workFromOfficeToday, setWorkFromOfficeToday] = useState([]);
  const [workStatusLoading, setWorkStatusLoading] = useState(true);
  const [workStatusError, setWorkStatusError] = useState("");

  const filterFavoritesWithCompId = favorites.filter(f => f.companyId === companyId);
  const filterHolidaysWithCompId = holidays.filter(f => f.companyId === companyId);
  const filterAnnouncementssWithCompId = announcements.filter(f => f.companyId === companyId);
  const filterOpenTasksWithCompId = openTasks.filter(t => t.employeeId.split("-")[0] === companyId);
  const filteremployeeFilesWithCompId = employeeFiles.filter(e => e.employeeId?.split("-")[0] === companyId);
  const filterorganizationFilesWithCompId = organizationFiles.filter(e => e.employeeId?.split("-")[0] === companyId);

  console.log(workFromHomeToday);
  console.log(workFromOfficeToday);

  // Define toggleForm function for holidays form
  const toggleForm = () => {
    setShowForm(!showForm);
    if (showForm) {
      setNewDate('');
      setNewLabel('');
      setEditingId(null);
    }
  };

  useEffect(() => {
    const fetchUserData = () => {
      try {
        const stored = localStorage.getItem("userData");
        if (stored) {
          const parsed = JSON.parse(stored);
          setIsAdmin(parsed.role === "Admin");
          setUserEmail(parsed.email);
          setUserRole(parsed.role || "Employee");
          setLoginDetails(parsed);
        }
      } catch {
        setIsAdmin(false);
        setUserRole("Employee");
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, settingsRes, leaveTypesRes] = await Promise.all([
          axios.get('http://localhost:8000/api/users/profile'),
          axios.get('http://localhost:8000/api/leave/general-settings').catch(() => null),
          axios.get('http://localhost:8000/api/leave-types'),
        ]);

        const fetchedCompanyId = profileRes.data.companyId || '';
        setCompanyId(fetchedCompanyId);
        setCompanyName(profileRes.data.companyName || '');
        setDesignation(profileRes.data.designation || '');
        setDepartment(profileRes.data.department || '');
        setHrmsRole(profileRes.data.hrmsRole || '');
        setGender(profileRes.data.gender || '');
        setMaritalStatus(profileRes.data.maritalStatus || '');
        setDateOfJoining(profileRes.data.dateOfJoining || null);
        setGeneralSettings(settingsRes?.data || null);
        setLeaveTypes(leaveTypesRes.data.filter(type => type.companyId === fetchedCompanyId) || []);

        const userRes = await axios.get('http://localhost:8000/api/users');
        setUsers(userRes.data);
      } catch (err) {
        console.error('Error:', err.response || err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update lastProcessedMonth and lastProcessedYear
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    if (lastProcessedMonth !== currentMonth || lastProcessedYear !== currentYear) {
      setLastProcessedMonth(currentMonth);
      setLastProcessedYear(currentYear);
    }
  }, [lastProcessedMonth, lastProcessedYear]);

  // Fetch leaves data
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        let leavesRes;
        if (isAdmin || (generalSettings && designation.toLowerCase().includes('manager'))) {
          leavesRes = await axios.get("http://localhost:8000/api/leaves");
        } else if (!generalSettings && isAdmin) {
          leavesRes = await axios.get("http://localhost:8000/api/leaves");
        } else {
          leavesRes = await axios.get(`http://localhost:8000/api/leaves?email=${userEmail}`);
        }

        setUpcomingLeaves(leavesRes.data);

        // Get today's date in IST, formatted as YYYY-MM-DD
        const today = new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).split("/").reverse().join("-");

        const onLeaveTodayApproved = leavesRes.data.filter((leave) => {
          try {
            const utcDateString = leave.startDate;
            const utcEndDateString = leave.endDate;

            const startDate = new Date(utcDateString);
            const endDate = new Date(utcEndDateString);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              console.warn(`Invalid date for leave: ${utcDateString} or ${utcEndDateString}`);
              return false;
            }

            const istStartDate = startDate.toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).split("/").reverse().join("-");

            const istEndDate = endDate.toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).split("/").reverse().join("-");

            return (
              leave.status === "Approved" &&
              istStartDate <= today &&
              istEndDate >= today &&
              leave.employeeId.split("-")[0] === companyId
            );
          } catch (error) {
            console.error(`Error processing leave: ${error}`);
            return false;
          }
        });
        setEmployeesOnLeaveToday(onLeaveTodayApproved);

        setBookedCount(leavesRes.data.filter(leave => leave.status === "Approved").length);
        setAbsentMonths(leavesRes.data.reduce((acc, leave) => {
          if (leave.status === "Approved") {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
            return acc + (months > 0 ? months : 0);
          }
          return acc;
        }, 0));

        setLoading(false);
      } catch (err) {
        setError("Failed to fetch leave data.");
        setLoading(false);
        console.error("Error fetching leave data:", err);
      }
    };

    fetchLeaves();
  }, [isAdmin, userEmail, generalSettings, designation, companyId]);

  // Compute adjusted leave data
  useEffect(() => {
    const computeLeaveData = () => {
      const leaveTypeMap = {
        "Casual Leave": 0,
        "Paid Leave": 0,
        "Sick Leave": 0,
        "Unpaid Leave": 0,
        "Paternity Leave": 0,
        "Sabbatical Leave": 0
      };

      // Match leave types with user profile
      const matchedLeaveTypes = leaveTypes.filter(leaveType =>
        leaveType.departments.includes(department) &&
        leaveType.designations.includes(designation) &&
        leaveType.userRole.includes(hrmsRole) &&
        leaveType.gender.includes(gender) &&
        leaveType.maritalStatus.includes(maritalStatus)
      );

      // Define currentMonth and currentYear
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Reset booked counts based on allotment
      Object.keys(leaveTypeMap).forEach((type) => {
        const matchedType = matchedLeaveTypes.find(lt => lt.name === type);
        if (matchedType) {
          if (matchedType.allotment === "Monthly" && lastProcessedMonth !== null && lastProcessedMonth !== currentMonth) {
            leaveTypeMap[type] = 0;
          } else if (matchedType.allotment === "Yearly" && lastProcessedYear !== null && lastProcessedYear !== currentYear) {
            leaveTypeMap[type] = 0;
          }
        }
      });

      // Filter leaves based on user role and settings
      let filteredLeaves = upcomingLeaves;
      if (generalSettings) {
        filteredLeaves = isAdmin || designation.toLowerCase().includes('manager')
          ? upcomingLeaves
          : upcomingLeaves.filter(leave => leave.teamEmail === userEmail);
      } else if (isAdmin) {
        filteredLeaves = upcomingLeaves;
      } else {
        filteredLeaves = upcomingLeaves.filter(leave => leave.teamEmail === userEmail);
      }

      filteredLeaves.forEach((leave) => {
        if (["Approved"].includes(leave.status) && leave.teamEmail === userEmail) {
          if (leaveTypeMap.hasOwnProperty(leave.leaveType)) {
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            const timeDiff = endDate - startDate;
            const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
            leaveTypeMap[leave.leaveType] += days;
          }
        }
      });

      let lwpOverflow = 0;
      ["Casual Leave", "Paid Leave", "Sick Leave"].forEach((type) => {
        if (leaveTypeMap[type] > 12) {
          lwpOverflow += leaveTypeMap[type] - 12;
          leaveTypeMap[type] = 12;
        }
      });

      leaveTypeMap["Unpaid Leave"] += lwpOverflow;

      // Update initialLeaveData with noOfLeaves from matched leave types
      let updatedLeaveData = initialLeaveData.map((leaveType) => {
        const matchedType = matchedLeaveTypes.find(lt => lt.name === leaveType.type);
        const booked = leaveTypeMap[leaveType.type] || 0;
        const available = matchedType ? matchedType.noOfLeaves : leaveType.available;
        return {
          ...leaveType,
          booked,
          available: Math.max(available - booked, 0),
        };
      });

      console.log(matchedLeaveTypes);
      

      // Add new leave types that don't exist in initialLeaveData
      const newLeaveTypes = matchedLeaveTypes
        .filter(lt => !initialLeaveData.some(ild => ild.type === lt.name))
        .map(lt => ({
          type: lt.name,
          available: Math.max(lt.noOfLeaves - (leaveTypeMap[lt.name] || 0), 0),
          booked: leaveTypeMap[lt.name] || 0,
          icon: "📅",
          color: "#e0e7ff"
        }));

      return [...updatedLeaveData, ...newLeaveTypes];
    };

    if (!loading) {
      setUpdatedLeaveData(computeLeaveData());
    }
  }, [loading, upcomingLeaves, leaveTypes, designation, department, hrmsRole, gender, maritalStatus, generalSettings, isAdmin, userEmail, lastProcessedMonth, lastProcessedYear]);

  // Filter users by company and employee ID prefix
  const filteredUsers = users.filter(u =>
    u.companyId === companyId &&
    u.employeeId?.startsWith(companyId) &&
    (
      u.fullname?.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      u.employeeId?.toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
  );

  // Fetch employees for birthdays
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/users');
        setEmployees(response.data);
        setEmployeesLoading(false);
      } catch (error) {
        setEmployeesError('Failed to fetch employees for birthdays');
        setEmployeesLoading(false);
        console.error('Error fetching employees:', error);
      }
    };
    fetchEmployees();
  }, []);

  // Compute upcoming birthdays
  const getUpcomingBirthdays = () => {
    if (employeesLoading || !employees.length) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);

    return employees
      .filter(emp => emp.dob)
      .map(emp => {
        const dob = new Date(emp.dob);
        const nextBirthday = new Date(
          today.getFullYear(),
          dob.getMonth(),
          dob.getDate()
        );
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        nextBirthday.setHours(0, 0, 0, 0);

        const diffTime = nextBirthday - today;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return { ...emp, nextBirthday, diffDays };
      })
      .filter(emp => emp.diffDays <= 30)
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 5);
  };

  const filterDOB = getUpcomingBirthdays().filter(e => e.companyId === companyId);

  const formatBirthdayDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })}`;
  };

  const getAfterText = (diffDays) => {
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `${diffDays} days after`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} after`;
    }
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} after`;
  };

  const fetchFiles = async () => {
    try {
      const employeeFilesRes = await axios.get('http://localhost:8000/api/employeeFile/employee-files');
      setEmployeeFiles(employeeFilesRes.data);
      const organizationFilesRes = await axios.get('http://localhost:8000/api/files/organization-files');
      setOrganizationFiles(organizationFilesRes.data);
      setFilesLoading(false);
    } catch (err) {
      setFilesError("Failed to fetch files.");
      setFilesLoading(false);
      console.error("Error fetching files:", err);
    }
  };

  const fetchNewHires = async () => {
    try {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const response = await axios.get("http://localhost:8000/api/candidates");
      const filterNewHires = response?.data?.filter((newHires) => {
        if (!newHires?.employeeId || !newHires?.expectedJoiningDate) return false;

        const joiningDate = new Date(newHires.expectedJoiningDate);
        joiningDate.setUTCHours(0, 0, 0, 0);

        return (
          newHires.employeeId.split("-")[0] === companyId &&
          joiningDate.toDateString() === todayDate.toDateString() &&
          newHires.status === "Completed"
        );
      });
      setNewHires(filterNewHires);
      setNewHiresLoading(false);
    } catch (error) {
      setNewHiresError("Failed to fetch new hires.");
      setNewHiresLoading(false);
      console.error("Error fetching new hires:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchNewHires();
    fetchOpenTasksDetails();
  }, [companyId]);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/holidays');
        setHolidays(response.data);
        setLoadingHolidays(false);
      } catch (error) {
        setHolidaysError("Failed to fetch holidays");
        setLoadingHolidays(false);
        console.error("Error fetching holidays:", error);
      }
    };

    fetchHolidays();
  }, []);

  const handleAddHoliday = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        const response = await axios.put(`http://localhost:8000/api/holidays/${editingId}`, {
          companyId: loginDetails.companyId,
          date: newDate,
          label: newLabel
        });
        setHolidays(holidays.map(h =>
          h._id === editingId ? response.data : h
        ));
      } else {
        const response = await axios.post('http://localhost:8000/api/holidays', {
          companyId: loginDetails.companyId,
          date: newDate,
          label: newLabel
        });
        setHolidays([...holidays, response.data]);
      }

      setNewDate('');
      setNewLabel('');
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving holiday:', error);
      alert(error.response?.data?.error || 'Failed to save holiday');
    }
  };

  const handleDeleteHoliday = async (id) => {
    Swal.fire({
      title: 'Are you sure you want to delete this holiday?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'red',
      cancelButtonColor: '#2196F3',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:8000/api/holidays/${id}`);
          setHolidays(holidays.filter(h => h._id !== id));
        } catch (error) {
          console.error('Error deleting holiday:', error);
          Swal.fire({
            title: 'Error!',
            text: 'Failed to delete holiday',
            icon: 'error',
            confirmButtonColor: '#2196F3'
          });
        }
      }
    });
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    setAnnouncementsError(null);

    try {
      const response = await axios.get('http://localhost:8000/api/announcements');
      setAnnouncements(response.data);
    } catch (error) {
      let errorMsg = "Failed to fetch announcements";

      if (error.response) {
        errorMsg = `Server error: ${error.response.status} - ${error.response.data?.message || 'No additional info'}`;
      } else if (error.request) {
        errorMsg = "No response from server. Check if backend is running.";
      } else {
        errorMsg = `Request error: ${error.message}`;
      }

      console.error('Fetch announcements error:', error);
      setAnnouncementsError(errorMsg);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const toggleAnnForm = () => {
    setShowAnnForm(!showAnnForm);
    if (!showAnnForm) {
      setAnnDate('');
      setAnnText('');
      setEditingAnnouncementId(null);
    }
  };

  const handleEditAnnouncement = (id) => {
    const announcementToEdit = announcements.find(ann => ann._id === id);
    if (announcementToEdit) {
      const date = new Date(announcementToEdit.date);
      const formattedDate = date.toISOString().slice(0, 16);
      setAnnDate(formattedDate);
      setAnnText(announcementToEdit.text);
      setEditingAnnouncementId(id);
      setShowAnnForm(true);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    Swal.fire({
      title: 'Are you sure you want to delete this announcement?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'red',
      cancelButtonColor: '#2196F3',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:8000/api/announcements/${id}`);
          setAnnouncements(announcements.filter(ann => ann._id !== id));
        } catch (error) {
          console.error('Delete announcement error:', error);
          Swal.fire({
            title: 'Error!',
            text: `Failed to delete announcement: ${error.response?.data?.error || error.message}`,
            icon: 'error',
            confirmButtonColor: '#2196F3'
          });
        }
      }
    });
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();

    if (!annText.trim()) {
      alert('Announcement text cannot be empty');
      return;
    }

    try {
      const announcementData = {
        companyId: loginDetails.companyId,
        date: annDate || new Date(),
        text: annText
      };

      if (editingAnnouncementId) {
        const response = await axios.put(
          `http://localhost:8000/api/announcements/${editingAnnouncementId}`,
          announcementData
        );
        setAnnouncements(announcements.map(ann =>
          ann._id === editingAnnouncementId ? response.data : ann
        ));
      } else {
        const response = await axios.post(
          'http://localhost:8000/api/announcements',
          announcementData
        );
        setAnnouncements([response.data, ...announcements]);
      }

      toggleAnnForm();
    } catch (error) {
      console.error('Save announcement error:', error);
      alert(`Failed to save announcement: ${error.response?.data?.error || error.message}`);
    }
  };

  const formatDate = iso => {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('default', { month: 'short' });
    const time = d.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' });
    return `${day} ${month} ${time}`;
  };

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/favorites');
        setFavorites(response.data);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };
    fetchFavorites();
  }, []);

  const toggleFavForm = () => {
    setShowFavForm(!showFavForm);
    if (!showFavForm) {
      setFavName('');
      setFavPhone('');
      setFavPhotoFile(null);
      setFavPreview(null);
      setEditingFavoriteId(null);
    }
  };

  const handlePhotoChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setFavPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFavPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleEditFavorite = (id) => {
    const favoriteToEdit = favorites.find(fav => fav._id === id);
    if (favoriteToEdit) {
      setFavName(favoriteToEdit.name);
      setFavPhone(favoriteToEdit.phone);
      setFavPreview(favoriteToEdit.photo ?
        `http://localhost:8000/uploads/${favoriteToEdit.photo}` : null);
      setEditingFavoriteId(id);
      setShowFavForm(true);
    }
  };

  const handleDeleteFavorite = async (id) => {
    Swal.fire({
      title: 'Are you sure you want to delete this favorite?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'red',
      cancelButtonColor: '#2196F3',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:8000/api/favorites/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          setFavorites(favorites.filter(fav => fav._id !== id));
        } catch (error) {
          console.error('Error deleting favorite:', error);
          Swal.fire({
            title: 'Error!',
            text: 'Failed to delete favorite',
            icon: 'error',
            confirmButtonColor: '#2196F3'
          });
        }
      }
    });
  };

  const handleAddFav = async (e) => {
    e.preventDefault();
    if (!favName || !favPhone || !loginDetails.companyId) return;
    try {
      const formData = new FormData();
      formData.append('companyId', loginDetails.companyId);
      formData.append('name', favName);
      formData.append('phone', favPhone);
      if (favPhotoFile) {
        formData.append('photo', favPhotoFile);
      }
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      };
      if (editingFavoriteId) {
        const response = await axios.put(
          `http://localhost:8000/api/favorites/${editingFavoriteId}`,
          formData,
          config
        );
        setFavorites(favorites.map(fav =>
          fav._id === editingFavoriteId ? response.data : fav
        ));
      } else {
        const response = await axios.post(
          'http://localhost:8000/api/favorites',
          formData,
          config
        );

        setFavorites([...favorites, response.data]);
      }
      toggleFavForm();
    } catch (error) {
      console.error('Error saving favorite:', error);
      alert(error.response?.data?.message || 'Failed to save favorite');
    }
  };

  const fetchOpenTasksDetails = async () => {
    try {
      const tasksRes = await axios.get('http://localhost:8000/api/tasks', {
        params: {
          populate: 'assignedUser'
        }
      });
      const openTasksData = tasksRes.data
        .filter(task => task.status === 'Open')
        .map(task => {
          let assignedNames = [];
          let assignedCount = 0;
          if (task.assignedUser) {
            const fullName = `${task.assignedUser.firstName} ${task.assignedUser.lastName}`.trim();
            assignedNames = [fullName];
            assignedCount = 1;
          } else if (Array.isArray(task.assignedTo)) {
            assignedCount = task.assignedTo.length;
            assignedNames = [`${assignedCount} employees`];
          } else if (task.assignedTo) {
            assignedNames = ['Unknown Employee'];
            assignedCount = 1;
          }
          return {
            ...task,
            assignedNames,
            assignedCount
          };
        });
      setOpenTasks(openTasksData);
      setTasksLoading(false);
    } catch (err) {
      setTasksError("Failed to fetch tasks details.");
      setTasksLoading(false);
      console.error("Error fetching tasks:", err);
    }
  };

  const fetchWorkStatus = async () => {
    try {
      if (!loginDetails?._id) {
        setWorkStatusError('User ID is not available. Please ensure you are logged in.');
        setWorkStatusLoading(false);
        console.log('loginDetails missing _id:', loginDetails);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/clockin/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          userId: loginDetails._id,
        },
      });

      const today = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
        .split('/')
        .reverse()
        .join('-');

      const homeSessions = response.data.clockIns.filter(
        (session) =>
          session.workingFrom === 'Home' &&
          new Date(session.clockInTime).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
            .split('/')
            .reverse()
            .join('-') === today &&
          session.companyId === companyId
      );

      const officeSessions = response.data.clockIns.filter(
        (session) =>
          session.workingFrom === 'Office' &&
          new Date(session.clockInTime).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
            .split('/')
            .reverse()
            .join('-') === today &&
          session.companyId === companyId
      );

      // Filter unique employees based on userId
      const uniqueHomeSessions = [];
      const seenHomeUserIds = new Set();
      for (const session of homeSessions) {
        if (!seenHomeUserIds.has(session.userId)) {
          seenHomeUserIds.add(session.userId);
          uniqueHomeSessions.push(session);
        }
      }

      const uniqueOfficeSessions = [];
      const seenOfficeUserIds = new Set();
      for (const session of officeSessions) {
        if (!seenOfficeUserIds.has(session.userId)) {
          seenOfficeUserIds.add(session.userId);
          uniqueOfficeSessions.push(session);
        }
      }

      setWorkFromHomeToday(uniqueHomeSessions);
      setWorkFromOfficeToday(uniqueOfficeSessions);
      setWorkStatusLoading(false);
    } catch (err) {
      setWorkStatusError(err.response?.data?.message || err.message || 'Failed to fetch work status data.');
      setWorkStatusLoading(false);
      console.error('Error fetching work status:', err.response?.data || err);
    }
  };

  useEffect(() => {
    if (loginDetails?._id && companyId) {
      fetchWorkStatus();
    }
  }, [loginDetails, companyId]);

  return (
    <div className="dashboard-container">
      <DashboardNavbar />
      <div className="dashboard-main-content">
        <div className="dashboard-scrollable-content">
          <div className="dashboard-grid">
            {/* Birthday Card */}
            <div className="dashboard-card birthdays">
              <h3>Birthdays</h3>
              {employeesLoading ? (
                <p>Loading birthdays...</p>
              ) : employeesError ? (
                <p className="error">{employeesError}</p>
              ) : (
                <>
                  {filterDOB.map(employee => {
                    const isToday = employee.diffDays === 0;
                    return (
                      <div
                        key={employee._id}
                        className={`birthday-item ${isToday ? 'today' : ''}`}
                      >
                        <div className="birthday-info">
                          <div className="birthday-avatar">
                            {isToday ? (
                              <FaBirthdayCake className="birthday-cake-icon" />
                            ) : employee.profileImage ? (
                              <img
                                src={`http://localhost:8000${employee.profileImage}`}
                                alt={employee.fullname}
                              />
                            ) : (
                              <span>{employee.fullname?.charAt(0) || '?'}</span>
                            )}
                          </div>
                          <div className="birthday-details">
                            <div className="name">
                              {employee.fullname || 'N/A'}
                              {isToday && (
                                <span className="birthday-badge">Happy Birthday!</span>
                              )}
                            </div>
                            <div className="role">
                              {isToday
                                ? '🎂 Wishing you a wonderful day!'
                                : employee.department || 'N/A'}
                            </div>
                          </div>
                        </div>
                        {!isToday && (
                          <div className="birthday-meta">
                            <div className="birthday-date">
                              {formatBirthdayDate(employee.dob)}
                            </div>
                            <div className="after">
                              {getAfterText(employee.diffDays)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filterDOB.length === 0 && (
                    <p>No upcoming birthdays</p>
                  )}
                </>
              )}
            </div>

            {/* New Hires Card */}
            <div className="dashboard-card new-hires">
              <h3>New Hires</h3>
              {newHiresLoading ? (
                <p>Loading new hires...</p>
              ) : newHiresError ? (
                <p>{newHiresError}</p>
              ) : newHires.length > 0 ? (
                newHires.map((hire) => (
                  <div className="dashboard-profile" key={hire._id}>
                    <div>
                      <strong>{`${hire.firstName} ${hire.lastName}`}</strong><br />
                      <span>{hire.department} </span><br />
                      <span>📞 {hire.mobile} </span><br />
                      <span>📧 {hire.email}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p>No new hires found.</p>
              )}
            </div>

            {/* Favorites Card */}
            <div className="dashboard-card favorites">
            <div className="favorites-header">
              <h3>Favorites</h3>
              {userRole === "Admin" && (
                <button className="add-button" onClick={toggleFavForm}>
                  <FiPlus size={18} />
                </button>
              )}
            </div>
            {showFavForm && (
              <form className="favorite-form" onSubmit={handleAddFav}>
                <div className="form-field">
                  <label htmlFor="fav-name">Name</label>
                  <input
                    id="fav-name"
                    type="text"
                    value={favName}
                    onChange={(e) => {
                      // Only allow letters and spaces
                      const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                      setFavName(value);
                    }}
                    placeholder="Full name"
                    required
                    minLength="2"
                    maxLength="50"
                    pattern="[a-zA-Z\s]+"
                    title="Please enter only letters (no numbers or special characters)"
                  />
                  {favName && !/^[a-zA-Z\s]+$/.test(favName) && (
                    <span className="error-message">Name can only contain letters and spaces</span>
                  )}
                </div>
                <div className="form-field">
                  <label htmlFor="fav-phone">Contact Number</label>
                  <input
                    id="fav-phone"
                    type="tel"
                    value={favPhone}
                    onChange={(e) => {
                      // Only allow numbers and optional + at start
                      const value = e.target.value.replace(/[^0-9+]/g, '');
                      // Ensure + is only at start if present
                      if (value.includes('+') && value.indexOf('+') !== 0) {
                        return;
                      }
                      setFavPhone(value);
                    }}
                    placeholder="+91 1234567890"
                    required
                    minLength="10"
                    maxLength="15"
                    pattern="^\+?[0-9]{10,15}$"
                    title="Please enter a valid phone number (10-15 digits, optional + at start)"
                  />
                  {favPhone && !/^\+?[0-9]{10,15}$/.test(favPhone) && (
                    <span className="error-message">Please enter a valid phone number (10-15 digits)</span>
                  )}
                </div>
                <div className="form-field">
                  <label htmlFor="fav-photo">Profile Photo</label>
                  <input
                    id="fav-photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  {favPreview && <img src={favPreview} alt="Preview" className="preview-img" />}
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={!favName || !favPhone || 
                    !/^[a-zA-Z\s]+$/.test(favName) || 
                    !/^\+?[0-9]{10,15}$/.test(favPhone)}>
                    Save
                  </button>
                  <button type="button" onClick={toggleFavForm}>Cancel</button>
                </div>
              </form>
            
                        )}
              <div className="favorites-list">
                {filterFavoritesWithCompId.length === 0 ? (
                  <p className="no-favorites-message">
                    No Favorites Added
                  </p>
                ) : (
                  filterFavoritesWithCompId.map((favorite) => (
                    <div className="dashboard-favorite" key={favorite._id}>
                      <img
                        src={favorite.photo ? `http://localhost:8000/uploads/${favorite.photo}` : 'https://via.placeholder.com/50'}
                        alt={favorite.name}
                        className="fav-icon"
                      />
                      <div className="favorite-details">
                        <strong>{favorite.name}</strong>
                        <div className="dashboard-phone">
                          <span className="phone-icon">📞</span>{favorite.phone}
                        </div>
                      </div>
                      <div className="favorite-actions">
                        {userRole === "Admin" && (
                          <button
                            className="favorite-edit-btn"
                            onClick={() => handleEditFavorite(favorite._id)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                        )}
                        {userRole === "Admin" && (
                          <button
                            className="favorite-delete-btn"
                            onClick={() => handleDeleteFavorite(favorite._id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Leave Report Card */}
            <div className="dashboard-card">
              <h3>Leave Report</h3>
              {loading ? (
                <div className="loading-message">Loading Leave Data...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : (
                <div className="dashboard-leave-cards-container">
                  {updatedLeaveData.length === 0 ? (
                    <p>No leave data available</p>
                  ) : (
                    updatedLeaveData.map((item, index) => (
                      <div key={index} className="dashboard-leave-cards">
                        <div className="leave-card-icon">{item.icon}</div>
                        <div className="leave-card-title">{item.type}</div>
                        <div className="leave-card-info">
                          <div>
                            <span className="leave-label">Available </span>
                            <span className="leave-value">{item.available}</span>
                          </div>
                          <div>
                            <span className="leave-label">Booked </span>
                            <span className="leave-value">{item.booked}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Upcoming Holidays Card */}
            <div className="dashboard-card upcoming-holidays">
              <div className="upcoming-header">
                <h3>Upcoming Holidays</h3>
                {userRole === "Admin" && (<button
                  className="add-button"
                  title="Add Holiday"
                  onClick={toggleForm}
                >
                  <FiPlus size={18} />
                </button>)}
              </div>

              {showForm && (
                <form className="holiday-form" onSubmit={handleAddHoliday}>
                  <div className="form-field">
                    <label htmlFor="date">Date</label>
                    <input
                      type="date"
                      id="date"
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="label">Holiday Name</label>
                    <input
                      type="text"
                      id="label"
                      placeholder="Holiday name"
                      value={newLabel}
                      onChange={e => setNewLabel(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit">Save</button>
                    <button type="button" onClick={toggleForm}>Cancel</button>
                  </div>
                </form>
              )}

              {loadingHolidays ? (
                <div className="loading-message">Loading holidays...</div>
              ) : holidaysError ? (
                <div className="error-message">{holidaysError}</div>
              ) : (
                <div className="holidays-list">
                  {
                    filterHolidaysWithCompId.length === 0 ? (
                      <p className="no-tasks-message">No Upcoming Holidays</p>
                    )
                      :
                      filterHolidaysWithCompId.map((holiday) => {
                        const date = new Date(holiday.date);
                        const day = String(date.getDate()).padStart(2, '0');
                        const monthName = date.toLocaleString('default', { month: 'short' });
                        return (
                          <div className="holiday-item" key={holiday._id}>
                            <div className="holiday-date">
                              <span className="holiday-day">{day}</span>
                              <span className="holiday-month">{monthName}</span>
                            </div>
                            <div className="holiday-info">
                              <h4 className="holiday-name">{holiday.label}</h4>
                            </div>
                            <div className="holiday-actions">
                              {userRole === "Admin" && (<button
                                className="holiday-edit-btn"
                                onClick={() => {
                                  setEditingId(holiday._id);
                                  setNewDate(formatDisplayDate(holiday.date));
                                  setNewLabel(holiday.label);
                                  setShowForm(true);
                                }}
                                title="Edit"
                              >
                                ✏️
                              </button>)}
                              {userRole === "Admin" && (<button
                                className="holiday-delete-btn"
                                onClick={() => handleDeleteHoliday(holiday._id)}
                                title="Delete"
                              >
                                🗑️
                              </button>)}
                            </div>
                          </div>
                        );
                      })}
                </div>
              )}
            </div>

            {/* Pending Tasks Card */}
            <div className="dashboard-card pending-tasks">
              <h3>My Pending Tasks</h3>
              {tasksLoading ? (
                <p className="loading-message">Loading tasks...</p>
              ) : tasksError ? (
                <p className="error-message">{tasksError}</p>
              ) : (
                <div className="tasks-list">
                  {filterOpenTasksWithCompId.length === 0 ? (
                    <p className="no-tasks-message">No pending tasks</p>
                  ) : (
                    <ul>
                      {filterOpenTasksWithCompId.map(task => (
                        <li className="task-item" key={task._id}>
                          <div className="task-priority">
                            <span className="priority-dot high"></span>
                          </div>
                          <div className="task-info">
                            <h4 className="task-name">{task.taskName}</h4>
                            <p className="task-description">{task.description || 'No description'}</p>
                            <div className="task-meta">
                              {task.dueDate && (
                                <span className="task-due">
                                  <strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                              {task.assignedTo && (
                                <div className="task-assigned">
                                  <strong>Assigned: </strong>
                                  {task.assignedCount === 0 ? (
                                    task.hasAssignmentError ? (
                                      <span className="error-text">(Invalid assignment)</span>
                                    ) : (
                                      'Unassigned'
                                    )
                                  ) : task.assignedCount === 1 ? (
                                    task.assignedNames[0]
                                  ) : (
                                    `${task.assignedCount} employees`
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Files Card */}
            <div className="dashboard-card files-card">
              <h3>My Files</h3>
              {filesLoading ? (
                <p className="loading-message">Loading files...</p>
              ) : filesError ? (
                <p className="error-message">{filesError}</p>
              ) : (
                <div className="files-container">
                  <div className="files-section">
                    <h4>Employee Files</h4>
                    {filteremployeeFilesWithCompId.length > 0 ? (
                      <ul className="files-list">
                        {filteremployeeFilesWithCompId.map((file) => (
                          <li className="file-item" key={file._id}>
                            <img
                              src="https://cdn-icons-png.flaticon.com/512/337/337946.png"
                              alt="File Icon"
                              className="file-icon"
                            />
                            <span className="file-name">{file.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-files-message">No employee files found.</p>
                    )}
                  </div>
                  <div className="files-section">
                    <h4>Organization Files</h4>
                    {filterorganizationFilesWithCompId.length > 0 ? (
                      <ul className="files-list">
                        {filterorganizationFilesWithCompId.map((file) => (
                          <li className="file-item" key={file._id}>
                            <img
                              src="https://cdn-icons-png.flaticon.com/512/337/337946.png"
                              alt="File Icon"
                              className="file-icon"
                            />
                            <span className="file-name">{file.originalName || file.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-files-message">No organization files found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Announcements Card */}
            <div className="dashboard-card announcements">
              <div className="announcements-header">
                <h3>Announcements</h3>
                {userRole === "Admin" && (<button
                  className="add-button"
                  title="Add Announcement"
                  onClick={toggleAnnForm}
                  disabled={loadingAnnouncements}
                >
                  <FiPlus size={18} />
                </button>)}
              </div>

              {showAnnForm && (
                <form className="announcement-form" onSubmit={handleAddAnnouncement}>
                  <div className="form-field">
                    <label htmlFor="ann-date">Date & Time</label>
                    <input
                      type="datetime-local"
                      id="ann-date"
                      value={annDate}
                      onChange={e => setAnnDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="ann-text">Message</label>
                    <textarea
                      id="ann-text"
                      rows={3}
                      placeholder="Type announcement..."
                      value={annText}
                      onChange={e => setAnnText(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" disabled={loadingAnnouncements}>
                      {editingAnnouncementId ? 'Update' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={toggleAnnForm}
                      disabled={loadingAnnouncements}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {loadingAnnouncements ? (
                <div className="loading-message">
                  <p>Loading announcements...</p>
                </div>
              ) : announcementsError ? (
                <div className="error-message">
                  <p>{announcementsError}</p>
                  <button onClick={fetchAnnouncements}>Retry</button>
                </div>
              ) : filterAnnouncementssWithCompId.length === 0 ? (
                <p className="no-announcements">No announcements found</p>
              ) : (
                <div className="announcements-list">
                  {filterAnnouncementssWithCompId.map((announcement) => (
                    <div className="announcement-item" key={announcement._id}>
                      <div className="announcement-content">
                        <p className="announcement-text">{announcement.text}</p>
                        <span className="announcement-date">
                          {formatDate(announcement.date)}
                        </span>
                      </div>
                      <div className="announcement-actions">
                        {userRole === "Admin" && (<button
                          className="announcement-edit-btn"
                          onClick={() => handleEditAnnouncement(announcement._id)}
                          title="Edit"
                        >
                          ✏️
                        </button>)}
                        {userRole === "Admin" && (<button
                          className="announcement-delete-btn"
                          onClick={() => handleDeleteAnnouncement(announcement._id)}
                          title="Delete"
                        >
                          🗑️
                        </button>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* On Leave Today Card */}
            <div className="dashboard-card on-leave-card">
              <h3 className="on-leave-title">On Leave Today (Approved)</h3>
              {employeesOnLeaveToday.length > 0 ? (
                <ul className="on-leave-list">
                  {employeesOnLeaveToday.map((leave) => (
                    <li key={leave._id} className="on-leave-item">
                      <span className="leave-employee">{leave.name} - {leave.leaveType}</span>
                      <div className="leave-dates">
                        <span className="leave-date"><strong className="leave-label">From:</strong> {new Date(leave.startDate).toLocaleDateString()}</span>
                        <span className="leave-date"><strong className="leave-label">To:</strong> {new Date(leave.endDate).toLocaleDateString()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-leave-message">No employees are on approved leave today.</p>
              )}
            </div>

            {/* On Work From Home Today Card */}
            <div className="dashboard-card on-leave-card">
              <h3 className="on-leave-title">On Work From Home Today</h3>
              {workStatusLoading ? (
                <div className="loading-message">Loading work status...</div>
              ) : workStatusError ? (
                <div className="error-message">{workStatusError}</div>
              ) : workFromHomeToday.length > 0 ? (
                <ul className="on-leave-list">
                  {workFromHomeToday.map((session) => (
                    <li key={session._id} className="on-leave-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={session.profileInfo.profileImage || `https://ui-avatars.com/api/?name=${session.profileInfo.firstName} ${session.profileInfo.lastName}&background=random`}
                          alt={`${session.profileInfo.firstName} ${session.profileInfo.lastName}`}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span className="leave-employee">
                          <span className='leave-employee-name'>
                            {session.profileInfo.firstName} {session.profileInfo.lastName}
                          </span>
                          <span>
                            {session.profileInfo.designation}
                          </span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-leave-message">No employees are working from home today.</p>
              )}
            </div>

            {/* On Work From Office Today Card */}
            <div className="dashboard-card on-leave-card">
              <h3 className="on-leave-title">On Work From Office Today</h3>
              {workStatusLoading ? (
                <div className="loading-message">Loading work status...</div>
              ) : workStatusError ? (
                <div className="error-message">{workStatusError}</div>
              ) : workFromOfficeToday.length > 0 ? (
                <ul className="on-leave-list">
                  {workFromOfficeToday.map((session) => (
                    <li key={session._id} className="on-leave-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={session.profileInfo.profileImage || `https://ui-avatars.com/api/?name=${session.profileInfo.firstName} ${session.profileInfo.lastName}&background=random`}
                          alt={`${session.profileInfo.firstName} ${session.profileInfo.lastName}`}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span className="leave-employee">
                          <span className='leave-employee-name'>
                            {session.profileInfo.firstName} {session.profileInfo.lastName} 
                          </span>
                          <span> 
                            {session.profileInfo.designation}
                          </span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-leave-message">No employees are working from office today.</p>
              )}
            </div>

            <div className="dashboard-card-demo"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;