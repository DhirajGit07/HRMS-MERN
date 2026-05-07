import React, { useState, useEffect, useRef } from 'react';
import './GeneralApplicabilityForm.css';
import SettingSidebarNavbar from '../pages/SettingSidebarNavbar';
import SettingSidebar from '../pages/SettingSidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { HiOutlinePlus } from 'react-icons/hi';
import AddLeaveType from './AddLeaveType';

const GeneralApplicabilityForm = ({ onClose, leaveTypeData, isEditing }) => {
    const [activeTab, setActiveTab] = useState('General');
    const [allUsers, setAllUsers] = useState([]);
    const [companyId, setCompanyId] = useState('');
    const [openEditLeaveType, setOpenEditLeaveType] = useState(false);
    const [leaveTypeOptions, setLeaveTypeOptions] = useState([]);
    const [isLoadingLeaveTypes, setIsLoadingLeaveTypes] = useState(true);
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState({
        gender: false,
        maritalStatus: false,
        departments: false,
        designation: false,
        userRole: false,
        name: false
    });

    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRefs = {
        gender: useRef(null),
        maritalStatus: useRef(null),
        departments: useRef(null),
        designations: useRef(null),
        userRole: useRef(null),
        name: useRef(null)
    };

    const fetchAllUserdata = async () => {
        try {
            const [userRes, profileRes] = await Promise.all([
                axios.get('http://localhost:8000/api/users'),
                axios.get('http://localhost:8000/api/users/profile')
            ]);
            if (userRes.status === 200 && profileRes.status === 200) {
                const filteredUsers = userRes.data.filter(user => user.companyId === profileRes.data.companyId);
                setAllUsers(filteredUsers);
                setCompanyId(profileRes.data.companyId || '');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            console.error(error.response?.data?.message || 'Failed to load data');
            setAllUsers([]);
            setCompanyId('');
        }
    };

    // Default leave types to display when no matching companyId or companyId is empty
    const defaultLeaveTypes = [
        'Sick Leave',
        'Casual Leave',
        'Paid Leave',
        'Unpaid Leave',
        'Paternity Leave',
        'Sabbatical Leave',
    ].map(name => ({
        value: name,
        label: name
    }));

    const fetchLeaveTypes = async () => {
        try {
            setIsLoadingLeaveTypes(true);
            const response = await axios.get('/api/leave-types-Add-Edit');
            const fetchedLeaveTypes = response.data.map(item => ({
                value: item.name,
                label: item.name,
                companyId: item.companyId || null
            }));

            // Filter leave types: include those with matching companyId or no companyId
            let filteredLeaveTypes = fetchedLeaveTypes.filter(
                item => item.companyId === companyId || item.companyId === null
            );

            // If editing, ensure the leaveTypeData.name is included in leaveTypeOptions
            if (isEditing && leaveTypeData && leaveTypeData.name) {
                const nameToCheck = Array.isArray(leaveTypeData.name) ? leaveTypeData.name[0] : leaveTypeData.name;
                if (nameToCheck && typeof nameToCheck === 'string') {
                    const leaveTypeExists = filteredLeaveTypes.some(
                        item => item.value.toLowerCase() === nameToCheck.toLowerCase()
                    );
                    if (!leaveTypeExists) {
                        filteredLeaveTypes.push({
                            value: nameToCheck,
                            label: nameToCheck,
                            companyId: companyId || null
                        });
                    }
                }
            }

            // If no leave types match or companyId is empty, use default leave types
            if (filteredLeaveTypes.length === 0 || !companyId) {
                setLeaveTypeOptions(defaultLeaveTypes);
            } else {
                setLeaveTypeOptions(filteredLeaveTypes);
            }
        } catch (error) {
            const errorMessage = error.response
                ? `HTTP ${error.response.status}: ${error.response.data.error || JSON.stringify(error.response.data)}`
                : error.message;
            console.error('Error fetching leave types:', errorMessage);
            alert(`Error fetching leave types: ${errorMessage}`);
            setLeaveTypeOptions(defaultLeaveTypes); // Fallback to default leave types on error
        } finally {
            setIsLoadingLeaveTypes(false);
        }
    };

    useEffect(() => {
        fetchAllUserdata();
        fetchLeaveTypes();
    }, [openEditLeaveType, companyId]);

    const formatDateForInput = (isoDate) => {
        if (!isoDate || typeof isoDate !== 'string') {
            return '';
        }
        try {
            const date = new Date(isoDate);
            if (isNaN(date.getTime())) {
                return '';
            }
            const formatted = date.toISOString().split('T')[0];
            return formatted;
        } catch (error) {
            console.error('formatDateForInput error:', error);
            return '';
        }
    };

    const [formData, setFormData] = useState(() => {
        const initialData = leaveTypeData || {
            name: [],
            allotment: '',
            noOfLeaves: 0,
            monthlyLimit: '--',
            status: 'Paid',
            colorCode: '#16813D',
            gender: [],
            maritalStatus: [],
            departments: [],
            designations: [],
            userRole: [],
            effectiveAfter: '',
            effectiveAfterUnit: 'Day(s)',
            allowedInProbation: true,
            unusedLeaves: 'Carry Forward',
            allowedInNoticePeriod: true
        };
        if (leaveTypeData && leaveTypeData.effectiveAfter) {
            initialData.effectiveAfter = formatDateForInput(leaveTypeData.effectiveAfter);
        }
        if (isEditing && leaveTypeData && leaveTypeData.name) {
            // Ensure name is a flat array
            initialData.name = Array.isArray(leaveTypeData.name) ? leaveTypeData.name : [leaveTypeData.name];
        }
        return initialData;
    });

    // Synchronize formData.name with leaveTypeOptions in edit mode
    useEffect(() => {
        if (isEditing && leaveTypeData && leaveTypeData.name && leaveTypeOptions.length > 0) {
            const nameToCheck = Array.isArray(leaveTypeData.name) ? leaveTypeData.name[0] : leaveTypeData.name;
            if (nameToCheck && typeof nameToCheck === 'string') {
                const leaveTypeExists = leaveTypeOptions.some(
                    option => option.value.toLowerCase() === nameToCheck.toLowerCase()
                );
                if (leaveTypeExists && !formData.name.some(name => name.toLowerCase() === nameToCheck.toLowerCase())) {
                    setFormData(prev => ({
                        ...prev,
                        name: [nameToCheck]
                    }));
                }
            }
        }
    }, [leaveTypeOptions, isEditing, leaveTypeData]);

    const dropdownOptions = {
        gender: ['Male', 'Female'],
        maritalStatus: ['Single', 'Married', 'Widower', 'Widow', 'Separate', 'Divorced'],
        departments: [...new Set(allUsers.map(user => user.department).filter(Boolean))].sort(),
        designations: [...new Set(allUsers.map(user => user.designation).filter(Boolean))].sort(),
        userRole: [...new Set(allUsers.map(user => user.hrmsRole).filter(Boolean))].sort(),
        name: leaveTypeOptions.map(option => option.value)
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            Object.keys(dropdownRefs).forEach((field) => {
                if (dropdownOpen[field] && dropdownRefs[field].current && !dropdownRefs[field].current.contains(event.target)) {
                    setDropdownOpen(prev => ({
                        ...prev,
                        [field]: false
                    }));
                }
            });
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleDropdown = (field) => {
        setDropdownOpen(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleOptionChange = (field, value) => {
        setFormData(prev => {
            const currentOptions = prev[field];
            if (value === 'Select All') {
                if (currentOptions.length === dropdownOptions[field].length) {
                    return {
                        ...prev,
                        [field]: []
                    };
                } else {
                    return {
                        ...prev,
                        [field]: [...dropdownOptions[field]]
                    };
                }
            } else {
                if (currentOptions.includes(value)) {
                    return {
                        ...prev,
                        [field]: currentOptions.filter(option => option !== value)
                    };
                } else {
                    if (field === 'name' && isEditing) {
                        return {
                            ...prev,
                            [field]: [value]
                        };
                    }
                    return {
                        ...prev,
                        [field]: [...currentOptions, value]
                    };
                }
            }
        });
    };

    const getSelectedLeaveTypeNames = () => {
        if (formData.name.length === 0) return 'Select leave types...';
        if (formData.name.length > 3) return `${formData.name.length} leave types selected`;
        return formData.name.join(', ');
    };

    const filteredLeaveTypes = leaveTypeOptions.filter(option => {
        const searchLower = searchTerm.toLowerCase();
        return option.label.toLowerCase().includes(searchLower);
    });

    const isValidDate = (dateString) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    };

    const validateForm = () => {
        const requiredFields = [
            { field: 'name', label: 'Leave Type' },
            { field: 'allotment', label: 'Leave Alignment Type' },
            { field: 'status', label: 'Leave Paid Status' },
            { field: 'colorCode', label: 'Color Code' },
            { field: 'gender', label: 'Gender' },
            { field: 'maritalStatus', label: 'Marital Status' },
            { field: 'departments', label: 'Department' },
            { field: 'designations', label: 'Designation' },
            { field: 'userRole', label: 'User Role' },
        ];

        const errors = [];

        const missingFields = requiredFields.filter(({ field }) => 
            !formData[field] || 
            (Array.isArray(formData[field]) && formData[field].length === 0) 
        );

        if (missingFields.length > 0) {
            const missingFieldLabels = missingFields.map(({ label }) => label).join(', ');
            errors.push(`Please fill in the following required fields: ${missingFieldLabels}`);
        }

        if (formData.colorCode && !/#[0-9A-Fa-f]{6}/.test(formData.colorCode)) {
            errors.push("Color Code must be a valid hex color (e.g., #FFFFFF)");
        }

        if (formData.noOfLeaves < 0) {
            errors.push("Number of Leaves cannot be negative");
        }

        return errors;
    };

    const handleCancel = () => {
        navigate('/leave-setting');
        onClose();
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        const errors = validateForm();
        
        if (errors.length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                html: `<ul>${errors.map(error => `<li>${error}</li>`).join('')}</ul>`,
                confirmButtonText: 'OK',
                customClass: {
                    popup: 'general-applicability-swal-popup'
                }
            });
            return;
        }

        try {
            if (isEditing) {
                const formattedFormData = {
                    ...formData,
                    effectiveAfter: formData.effectiveAfter
                        ? new Date(formData.effectiveAfter).toISOString()
                        : null,
                    companyId: companyId,
                    name: formData.name.length > 0 ? formData.name[0] : ''
                };
                await axios.put(`http://localhost:8000/api/leave-types/${leaveTypeData._id}`, formattedFormData);
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Leave type updated successfully!',
                    confirmButtonText: 'OK',
                    customClass: {
                        popup: 'general-applicability-swal-popup'
                    }
                });
            } else {
                const leaveTypes = formData.name.map(name => ({
                    ...formData,
                    name,
                    effectiveAfter: formData.effectiveAfter
                        ? new Date(formData.effectiveAfter).toISOString()
                        : null,
                    companyId: companyId
                }));
                await axios.post('http://localhost:8000/api/leave-types/bulk', { leaveTypes });
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: `Created ${formData.name.length} leave type(s) successfully!`,
                    confirmButtonText: 'OK',
                    customClass: {
                        popup: 'general-applicability-swal-popup'
                    }
                });
            }
            onClose();
            navigate('/leave-setting');
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save leave type(s). Please try again.',
                confirmButtonText: 'OK',
                customClass: {
                    popup: 'general-applicability-swal-popup'
                }
            });
            console.error('Error saving leave type(s):', error);
        }
    };

    const renderMultiSelectDropdown = (field) => {
        const allSelected = formData[field]?.length === dropdownOptions[field]?.length;
        
        if (field === 'name') {
            if (isLoadingLeaveTypes) {
                return <div>Loading leave types...</div>;
            }
            return (
                <div className="strict-timings-employee-dropdown-container" ref={dropdownRefs[field]}>
                    <div
                        className="strict-timings-employee-dropdown-toggle"
                        onClick={() => toggleDropdown(field)}
                    >
                        {getSelectedLeaveTypeNames()}
                        <span className="strict-timings-dropdown-arrow">{dropdownOpen[field] ? '▲' : '▼'}</span>
                    </div>

                    {dropdownOpen[field] && (
                        <div className="strict-timings-employee-dropdown-menu">
                            <div className="strict-timings-employee-search-container">
                                <input
                                    type="text"
                                    placeholder="Search leave types..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="strict-timings-employee-search-input"
                                />
                            </div>

                            <div className="strict-timings-employee-checkbox-container">
                                <label className="strict-timings-employee-checkbox-item strict-timings-select-all">
                                    <input
                                        type="checkbox"
                                        checked={formData[field].length === filteredLeaveTypes.length && filteredLeaveTypes.length > 0}
                                        onChange={() => handleOptionChange(field, 'Select All')}
                                    />
                                    <span>Select All</span>
                                </label>

                                {filteredLeaveTypes.length > 0 ? (
                                    filteredLeaveTypes.map(option => {
                                        const isChecked = formData.name.some(name => 
                                            name.trim().toLowerCase() === option.value.trim().toLowerCase()
                                        );
                                        return (
                                            <label key={option.value} className="strict-timings-employee-checkbox-item">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleOptionChange(field, option.value)}
                                                />
                                                <span>{option.label}</span>
                                            </label>
                                        );
                                    })
                                ) : (
                                    <div className="strict-timings-no-employees-found">No leave types found</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="general-applicability-custom-dropdown" ref={dropdownRefs[field]}>
                <div 
                    className="general-applicability-dropdown-header"
                    onClick={() => toggleDropdown(field)}
                >
                    {formData[field].length === 0 
                        ? `Select ${field.charAt(0).toUpperCase() + field.slice(1)}` 
                        : formData[field].join(', ')}
                    <span className="general-applicability-dropdown-arrow">
                        {dropdownOpen[field] ? '▲' : '▼'}
                    </span>
                </div>
                {dropdownOpen[field] && (
                    <div className="general-applicability-dropdown-options">
                        <div key="select-all" className="general-applicability-option-item">
                            <label htmlFor={`${field}-select-all`} className="general-applicability-option-label">
                                <input
                                    type="checkbox"
                                    id={`${field}-select-all`}
                                    checked={allSelected}
                                    onChange={() => handleOptionChange(field, 'Select All')}
                                    className="general-applicability-checkbox"
                                />
                                Select All
                            </label>
                        </div>
                        {dropdownOptions[field].map(option => (
                            <div key={option} className="general-applicability-option-item">
                                <label htmlFor={`${field}-${option}`} className="general-applicability-option-label">
                                    <input
                                        type="checkbox"
                                        id={`${field}-${option}`}
                                        checked={formData[field].includes(option)}
                                        onChange={() => handleOptionChange(field, option)}
                                        className="general-applicability-checkbox"
                                    />
                                    {option}
                                </label>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <SettingSidebarNavbar />
            <div className="general-applicability-modal-main-container">
                <SettingSidebar />
                <div className="general-applicability-modal-container">
                    <div className="general-applicability-modal">
                        <div className="general-applicability-modal-header">
                            <h2>{isEditing ? 'Edit Leave Type' : 'Add New Leave Type'}</h2>
                        </div>
                        <div className="general-applicability-modal-tabs">
                            <button
                                className={`general-applicability-tab ${activeTab === 'General' ? 'general-applicability-active' : ''}`}
                                onClick={() => setActiveTab('General')}
                            >
                                General
                            </button>
                            <button
                                className={`general-applicability-tab ${activeTab === 'Applicability' ? 'general-applicability-active' : ''}`}
                                onClick={() => setActiveTab('Applicability')}
                            >
                                Applicability
                            </button>
                            <button
                                className={`general-applicability-tab ${activeTab === 'Entitlement' ? 'general-applicability-active' : ''}`}
                                onClick={() => setActiveTab('Entitlement')}
                            >
                                Entitlement
                            </button>
                        </div>

                        <div className="general-applicability-modal-body">
                            {activeTab === 'General' ? (
                                <>
                                    <h3>General</h3>
                                    <form className="general-applicability-form-grid">
                                        <div className="general-applicability-form-group">
                                            <label>Leave Type <span className="general-applicability-required">*</span></label>
                                            <div className='general-applicability-leaveType'>
                                                {renderMultiSelectDropdown('name')}
                                                <span onClick={() => setOpenEditLeaveType(!openEditLeaveType)} className='general-applicability-plus-icon'><HiOutlinePlus /></span>
                                            </div>
                                        </div>
                                        <div className="general-applicability-form-group">
                                            <label>Leave Alignment Type</label>
                                            <select
                                                name="allotment"
                                                className="general-applicability-input"
                                                value={formData.allotment}
                                                onChange={handleChange}
                                            >
                                                <option value="" disabled>Select Alignment Type</option>
                                                <option value="Monthly">Monthly</option>
                                                <option value="Yearly">Yearly</option>
                                            </select>
                                        </div>
                                        <div className="general-applicability-form-group">
                                            <label>
                                                {`No of ${formData.allotment} Leaves`}
                                                <span className="general-applicability-tooltip">?</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="noOfLeaves"
                                                className="general-applicability-input"
                                                value={formData.noOfLeaves}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="general-applicability-form-group">
                                            <label>
                                                Leave Paid Status <span className="general-applicability-required">*</span>
                                                <span className="general-applicability-tooltip">?</span>
                                            </label>
                                            <select
                                                name="status"
                                                className="general-applicability-input"
                                                value={formData.status}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select Paid Status</option>
                                                <option>Paid</option>
                                                <option>Unpaid</option>
                                                <option>Partially Paid</option>
                                            </select>
                                        </div>
                                        <div className="general-applicability-form-group">
                                            <label>Color Code <span className="general-applicability-required">*</span></label>
                                            <div className="general-applicability-color-picker">
                                                <input
                                                    type="text"
                                                    name="colorCode"
                                                    className="general-applicability-input"
                                                    value={formData.colorCode}
                                                    onChange={handleChange}
                                                    style={{ flex: 1 }}
                                                />
                                                <div className="general-applicability-color-box" style={{ backgroundColor: formData.colorCode }}></div>
                                            </div>
                                        </div>
                                    </form>
                                </>
                            ) : activeTab === 'Applicability' ? (
                                <>
                                    <h3>Applicability</h3>
                                    <form className="general-applicability-form-grid">
                                        <div className="general-applicability-form-group">
                                            <label>
                                                Gender <span className="general-applicability-required">*</span>
                                                <span className="general-applicability-tooltip">?</span>
                                            </label>
                                            {renderMultiSelectDropdown('gender')}
                                        </div>
                                        <div className="general-applicability-form-group">
                                            <label>
                                                Marital Status <span className="general-applicability-required">*</span>
                                                <span className="general-applicability-tooltip">?</span>
                                            </label>
                                            {renderMultiSelectDropdown('maritalStatus')}
                                        </div>
                                        <div className="general-applicability-form-group">
                                            <label>
                                                Department <span className="general-applicability-required">*</span>
                                                <span className="general-applicability-tooltip">?</span>
                                            </label>
                                            {renderMultiSelectDropdown('departments')}
                                        </div>
                                        <div className="general-applicability-form-group">
                                            <label>
                                                Designation <span className="general-applicability-required">*</span>
                                                <span className="general-applicability-tooltip">?</span>
                                            </label>
                                            {renderMultiSelectDropdown('designations')}
                                        </div>
                                        <div className="general-applicability-form-group">
                                            <label>
                                                User Role <span className="general-applicability-required">*</span>
                                                <span className="general-applicability-tooltip">?</span>
                                            </label>
                                            {renderMultiSelectDropdown('userRole')}
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <h3>Entitlement</h3>
                                    <form className="general-entitlement-form-grid">
                                        <div className="general-entitlement-form-row">
                                            <div className="general-entitlement-form-group effective-after-group">
                                                <label>
                                                    Effective After
                                                    <span className="general-applicability-tooltip">?</span>
                                                </label>
                                                <div className="general-applicability-input-group">
                                                    <input
                                                        type="date"
                                                        name="effectiveAfter"
                                                        className="general-applicability-input effective-after-input"
                                                        value={formData.effectiveAfter}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="checkbox-group-entitlement">
                                                <input
                                                    type="checkbox"
                                                    name="allowedInProbation"
                                                    checked={formData.allowedInProbation}
                                                    onChange={handleCheckboxChange}
                                                    style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                                                />
                                                <label>
                                                    Allowed in Probation
                                                    <span className="general-applicability-tooltip">?</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="general-entitlement-form-row">
                                            <div className="general-entitlement-form-group">
                                                <label>
                                                    Unused Leaves
                                                    <span className="general-applicability-tooltip">?</span>
                                                </label>
                                                <div className="general-applicability-input-group">
                                                    <select
                                                        name="unusedLeaves"
                                                        className="general-applicability-input"
                                                        value={formData.unusedLeaves}
                                                        onChange={handleSelectChange}
                                                    >
                                                        <option>Carry Forward</option>
                                                        <option>Lapse</option>
                                                        <option>Encash</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="checkbox-group-entitlement">
                                                <input
                                                    type="checkbox"
                                                    name="allowedInNoticePeriod"
                                                    checked={formData.allowedInNoticePeriod}
                                                    onChange={handleCheckboxChange}
                                                    style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                                                />
                                                <label>
                                                    Allowed in Notice Period
                                                    <span className="general-applicability-tooltip">?</span>
                                                </label>
                                            </div>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                        <div className="general-applicability-modal-footer">
                            <button className="general-applicability-cancel" onClick={handleCancel}>Cancel</button>
                            <button className="general-applicability-save" onClick={handleSave}>Save</button>
                        </div>
                    </div>
                </div>
            </div>
            <AddLeaveType openEditLeaveType={openEditLeaveType} setOpenEditLeaveType={setOpenEditLeaveType}/>
        </>
    );
};

export default GeneralApplicabilityForm;