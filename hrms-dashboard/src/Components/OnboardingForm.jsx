import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import './OnboardingForm.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OnboardingForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [errors, setErrors] = useState({});
    const [duplicates, setDuplicates] = useState([]);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [candidateId, setCandidateId] = useState(null);
    const [userProfile, setUserProfile] = useState(null); // Added for profile data
    const [loadingProfile, setLoadingProfile] = useState(true); // Added for profile loading state

    const [formData, setFormData] = useState({
        candidateId: '',
        employeeId: '',
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        department: '',
        sourceOfHire: '',
        joiningDate: '',
        offerLetterReceived: '',
        panCard: '',
        aadhaarCard: '',
        // uanNumber: '',
        currentLocation: '',
        status: 'In Progress'
    });

    // Fetch user profile
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('userToken');
                if (!token) return;

                const response = await axios.get('/api/users/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserProfile(response.data);
            } catch (error) {
                console.error('Error fetching user profile:', error);
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchUserProfile();
    }, []);

    // Set form data from profile or candidate
    useEffect(() => {
        if (location.state && location.state.candidate) {
            // Edit mode - set from candidate
            const candidate = location.state.candidate;
            setIsEditMode(true);
            setCandidateId(candidate._id);

            const joiningDate = candidate.expectedJoiningDate
                ? new Date(candidate.expectedJoiningDate).toISOString().split('T')[0]
                : '';

            setFormData({
                candidateId: candidate.canId || '',
                employeeId: candidate.employeeId || '',
                firstName: candidate.firstName || '',
                lastName: candidate.lastName || '',
                email: candidate.email || '',
                mobile: candidate.mobile || '',
                department: candidate.department || '',
                sourceOfHire: candidate.sourceOfHire || '',
                joiningDate: joiningDate,
                offerLetterReceived: candidate.offerLetterReceived || '',
                panCard: candidate.panCard || '',
                aadhaarCard: candidate.aadhaarCard || '',
                // uanNumber: candidate.uanNumber || '',
                currentLocation: candidate.currentLocation || '',
                status: candidate.status || 'In Progress'
            });
        } else if (userProfile && !isEditMode) {
            // New candidate mode - set from user profile
            setFormData(prev => ({
                ...prev,
                employeeId: userProfile.employeeId || '',
                firstName: userProfile.firstName || prev.firstName,
                lastName: userProfile.lastName || prev.lastName,
                email: userProfile.email || prev.email,
                mobile: userProfile.mobileNo || prev.mobile
            }));
        }
    }, [location.state, userProfile, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = {};

        // Required field checks
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required";
        if (!formData.department) newErrors.department = "Department is required";
        if (!formData.sourceOfHire) newErrors.sourceOfHire = "Source of hire is required";
        if (!formData.joiningDate) newErrors.joiningDate = "Joining date is required";
        if (!formData.offerLetterReceived) newErrors.offerLetterReceived = "Please specify if offer letter was received";
        if (!formData.panCard.trim()) newErrors.panCard = "PAN Card number is required";
        if (!formData.aadhaarCard.trim()) newErrors.aadhaarCard = "Aadhaar Card number is required";
        if (!formData.currentLocation.trim()) newErrors.currentLocation = "Current location is required";

        // Pattern validations
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (formData.email && !emailPattern.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!formData.mobile.trim()) {
            newErrors.mobile = "Mobile number is required";
        } else if (!/^[0-9]*$/.test(formData.mobile)) {
            newErrors.mobile = "Only numbers are allowed";
        } else if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
            newErrors.mobile = "Must be 10 digits starting with 6-9";
        }

        if (formData.panCard && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.panCard)) {
            newErrors.panCard = "PAN number must be valid (e.g. ABCDE1234F)";
        }

        if (formData.aadhaarCard && !/^\d{12}$/.test(formData.aadhaarCard)) {
            newErrors.aadhaarCard = "Aadhaar number must be a 12-digit number";
        }

        // if (formData.uanNumber && formData.uanNumber.length > 0 && !/^\d{12}$/.test(formData.uanNumber)) {
        //     newErrors.uanNumber = "UAN number must be a 12-digit number";
        // }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     setDuplicates([]);
    //     setShowDuplicateModal(false);

    //     if (!validateForm()) {
    //         return;
    //     }

    //     setIsSubmitting(true);

    //     try {
    //         const payload = {
    //             ...formData,
    //             expectedJoiningDate: formData.joiningDate,
    //             offerLetterReceived: formData.offerLetterReceived || 'No'
    //         };

    //         let response;
    //         if (isEditMode) {
    //             response = await axios.put(`http://localhost:8000/api/candidates/${candidateId}`, payload);
    //         } else {
    //             response = await axios.post('http://localhost:8000/api/candidates', payload);
    //         }

    //         if (response.data.success) {
    //             setShowSuccessModal(true);
    //             setTimeout(() => {
    //                 setShowSuccessModal(false);
    //                 navigate("/onboarding");
    //             }, 2000);
    //         } else {
    //             console.error("Submission failed:", response.data.message);
    //         }
    //     } catch (error) {
    //         if (error.response && error.response.status === 409) {
    //             const duplicateFields = error.response.data.duplicates || [];
    //             setDuplicates(duplicateFields);
    //             setShowDuplicateModal(true);
    //         } else if (error.response && error.response.data.errors) {
    //             const serverErrors = {};
    //             error.response.data.errors.forEach(err => {
    //                 const field = err.path;
    //                 serverErrors[field] = err.message;
    //             });
    //             setErrors(serverErrors);
    //         } else {
    //             console.error("Submit error:", error);
    //             alert("Error submitting form. Please try again.");
    //         }
    //     } finally {
    //         setIsSubmitting(false);
    //     }
    // };

     const handleSubmit = async (e) => {
        e.preventDefault();
        setDuplicates([]);
        setShowDuplicateModal(false);

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                expectedJoiningDate: formData.joiningDate,
                offerLetterReceived: formData.offerLetterReceived || 'No'
            };

            let response;
            if (isEditMode) {
                response = await axios.put(`http://localhost:8000/api/candidates/${candidateId}`, payload);
            } else {
                response = await axios.post('http://localhost:8000/api/candidates', payload);
            }

            if (response.data.success) {
                // Show success toast
                toast.success(
                    isEditMode 
                        ? 'Candidate updated successfully!' 
                        : 'Candidate onboarded successfully!', 
                    {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    }
                );
                
                // Keep your existing success modal if you still want it
                // setShowSuccessModal(true);
                setTimeout(() => {
                    setShowSuccessModal(false);
                    navigate("/onboarding");
                }, 2000);
            } else {
                console.error("Submission failed:", response.data.message);
                toast.error(response.data.message || 'Submission failed', {
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
            if (error.response && error.response.status === 409) {
                const duplicateFields = error.response.data.duplicates || [];
                setDuplicates(duplicateFields);
                setShowDuplicateModal(true);
                
                // Show error toast for duplicates
                toast.error(getDuplicateMessage(), {
                    position: "top-right",
                    autoClose: 5000,  // Longer duration for duplicate errors
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } else if (error.response && error.response.data.errors) {
                const serverErrors = {};
                error.response.data.errors.forEach(err => {
                    const field = err.path;
                    serverErrors[field] = err.message;
                });
                setErrors(serverErrors);
                
                // Show general error toast
                toast.error('Please fix the form errors', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } else {
                console.error("Submit error:", error);
                toast.error('Error submitting form. Please try again.', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    const getDuplicateMessage = () => {
        if (duplicates.length === 0) return '';

        const fieldNames = {
            'email': 'Email address',
            'mobile': 'Mobile number',
            'PAN card': 'PAN card number',
            'Aadhaar card': 'Aadhaar card number',
            // 'UAN number': 'UAN number'
        };

        const formattedFields = duplicates.map(field => fieldNames[field] || field);

        if (formattedFields.length === 1) {
            return `${formattedFields[0]} already exists in our system.`;
        }

        return `${formattedFields.slice(0, -1).join(', ')} and ${formattedFields.slice(-1)} already exist in our system.`;
    };

    return (
        <div className="onboarding-form-container">
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
            <div className="onboarding-form-header">
                <h2>{isEditMode ? 'Edit Candidate' : 'New Candidate Onboarding'}</h2>
            </div>

            {showSuccessModal && (
                <div className="onboarding-form-modal-overlay">
                    <div className="onboarding-form-modal onboarding-form-success">
                        <h3>🎉 Submission Successful!</h3>
                        <p>Your candidate details have been saved successfully.</p>
                    </div>
                </div>
            )}

            {showDuplicateModal && (
                <div className="onboarding-form-modal-overlay">
                    <div className="onboarding-form-modal">
                        <h3>Duplicate Information Found</h3>
                        <p>{getDuplicateMessage()}</p>
                        <p>Please correct the information and try again.</p>
                        <button
                            className="onboarding-form-btn onboarding-form-blue"
                            onClick={() => setShowDuplicateModal(false)}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <div className="onboarding-form-form-box">
                <form onSubmit={handleSubmit}>
                    <h3 className="onboarding-form-section-title">Personal Information</h3>
                    <div className={formData.candidateId ? "onboarding-form-form-row" : ""}>
                        <div className="onboarding-form-form-group1">
                            <label>System ID</label>
                            <input
                            type="text"
                            name="employeeId"
                            value={formData.employeeId}
                            readOnly
                            className="onboarding-form-input-field"
                            />
                        </div>
                        {formData.candidateId && (
                            <div className="onboarding-form-form-group1">
                            <label>Candidate ID</label>
                            <input
                                type="text"
                                name="candidateId"
                                value={formData.candidateId}
                                readOnly
                                className="onboarding-form-input-field"
                            />
                            </div>
                        )}
                        </div>
                    <div className="onboarding-form-form-row">
                        
                        <div className="onboarding-form-form-group">
                            <label>First Name <span className="onboarding-form-required">*</span></label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className={`onboarding-form-input-field ${errors.firstName ? 'onboarding-form-error-field' : ''}`}
                            />
                            {errors.firstName && <div className="onboarding-form-error-message">{errors.firstName}</div>}
                        </div>
                        <div className="onboarding-form-form-group">
                            <label>Last Name <span className="onboarding-form-required">*</span></label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className={`onboarding-form-input-field ${errors.lastName ? 'onboarding-form-error-field' : ''}`}
                            />
                            {errors.lastName && <div className="onboarding-form-error-message">{errors.lastName}</div>}
                        </div>
                    </div>

                    <div className="onboarding-form-form-row">
                        <div className="onboarding-form-form-group">
                            <label>Email Address <span className="onboarding-form-required">*</span></label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`onboarding-form-input-field ${errors.email ? 'onboarding-form-error-field' : ''}`}
                                readOnly={isEditMode}
                            />
                            {errors.email && <div className="onboarding-form-error-message">{errors.email}</div>}
                        </div>
                        <div className="onboarding-form-form-group">
                            <label>Mobile Number <span className="onboarding-form-required">*</span></label>
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                maxLength="10"
                                className={`onboarding-form-input-field ${errors.mobile ? 'onboarding-form-error-field' : ''}`}
                                readOnly={isEditMode}
                                placeholder="Enter 10-digit mobile number"
                            />
                            {errors.mobile && <div className="onboarding-form-error-message">{errors.mobile}</div>}
                        </div>
                        
                    </div>

                    <h3 className="onboarding-form-section-title">Professional Details</h3>

                    <div className="onboarding-form-form-row">
                        <div className="onboarding-form-form-group">
                            <label>Role <span className="onboarding-form-required">*</span></label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className={`onboarding-form-input-field ${errors.department ? 'onboarding-form-error-field' : ''}`}
                            >
                                <option value="">Select Department</option>
                                <option value="Software Developer">Software Developer</option>
                                <option value="Data Analyst">Data Analyst</option>
                                <option value="Software Testing">Software Testing</option>
                                <option value="AWS Cloud">AWS Cloud</option>
                                <option value="Marketing">Marketing</option>
                            </select>
                            {errors.department && <div className="onboarding-form-error-message">{errors.department}</div>}
                        </div>
                        <div className="onboarding-form-form-group">
                            <label>Hiring Source <span className="onboarding-form-required">*</span></label>
                            <select
                                name="sourceOfHire"
                                value={formData.sourceOfHire}
                                onChange={handleChange}
                                className={`onboarding-form-input-field ${errors.sourceOfHire ? 'onboarding-form-error-field' : ''}`}
                            >
                                <option value="">Select Source</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Company Website">Company Website</option>
                                <option value="Employee Referral">Employee Referral</option>
                                <option value="Job Portal">Job Portal</option>
                                <option value="Campus Recruitment">Campus Recruitment</option>
                                <option value="Walk-in">Walk-in</option>
                                <option value="Consultancy">Consultancy</option>
                            </select>
                            {errors.sourceOfHire && <div className="onboarding-form-error-message">{errors.sourceOfHire}</div>}
                        </div>
                    </div>

                    <div className="onboarding-form-form-row">
                        <div className="onboarding-form-form-group">
                            <label>Expected Joining Date <span className="onboarding-form-required">*</span></label>
                            <input
                                type="date"
                                name="joiningDate"
                                value={formData.joiningDate}
                                onChange={handleChange}
                                className={`onboarding-form-input-field ${errors.joiningDate ? 'onboarding-form-error-field' : ''}`}
                            />
                            {errors.joiningDate && <div className="onboarding-form-error-message">{errors.joiningDate}</div>}
                        </div>
                        <div className="onboarding-form-form-group">
                            <label>Offer Letter Received on Email Address? <span className="onboarding-form-required">*</span></label>
                            <select
                                name="offerLetterReceived"
                                value={formData.offerLetterReceived}
                                onChange={handleChange}
                                className={`onboarding-form-input-field ${errors.offerLetterReceived ? 'onboarding-form-error-field' : ''}`}
                            >
                                <option value="">Select Option</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                            {errors.offerLetterReceived && <div className="onboarding-form-error-message">{errors.offerLetterReceived}</div>}
                        </div>
                    </div>

                    {isEditMode && (
                        <div className="onboarding-form-form-row">
                            <div className="onboarding-form-form-group">
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="onboarding-form-input-field"
                                >
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                            <div className="onboarding-form-form-group">
                                {/* Empty div to maintain layout */}
                            </div>
                        </div>
                    )}

                    <h3 className="onboarding-form-section-title">Document Information</h3>

                    <div className="onboarding-form-form-row">
                        <div className="onboarding-form-form-group">
                            <label>PAN Card Number <span className="onboarding-form-required">*</span></label>
                            <input
                                type="text"
                                name="panCard"
                                value={formData.panCard}
                                onChange={handleChange}
                                className={`onboarding-form-input-field ${errors.panCard ? 'onboarding-form-error-field' : ''}`}
                                readOnly={isEditMode}
                            />
                            {errors.panCard && <div className="onboarding-form-error-message">{errors.panCard}</div>}
                        </div>
                        <div className="onboarding-form-form-group">
                            <label>Aadhaar Card Number <span className="onboarding-form-required">*</span></label>
                            <input
                                type="text"
                                name="aadhaarCard"
                                value={formData.aadhaarCard}
                                onChange={handleChange}
                                className={`onboarding-form-input-field ${errors.aadhaarCard ? 'onboarding-form-error-field' : ''}`}
                                readOnly={isEditMode}
                            />
                            {errors.aadhaarCard && <div className="onboarding-form-error-message">{errors.aadhaarCard}</div>}
                        </div>
                    </div>

                    <div className="onboarding-form-form-row">
                       
                        <div className="onboarding-form-form-group">
                            <label>Current Location <span className="onboarding-form-required">*</span></label>
                            <input
                                type="text"
                                name="currentLocation"
                                value={formData.currentLocation}
                                onChange={handleChange}
                                className={`onboarding-form-input-field ${errors.currentLocation ? 'onboarding-form-error-field' : ''}`}
                            />
                            {errors.currentLocation && <div className="onboarding-form-error-message">{errors.currentLocation}</div>}
                        </div>
                    </div>
                </form>
            </div>

            <div className="onboarding-form-form-actions onboarding-form-sticky-footer">
                <button
                    type="button"
                    className="onboarding-form-btn onboarding-form-gray"
                    onClick={() => navigate('/onboarding')}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="onboarding-form-btn onboarding-form-blue"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? (isEditMode ? 'Updating...' : 'Submitting...')
                        : (isEditMode ? 'Update Candidate' : 'Submit Form')}
                </button>
            </div>
        </div>
    );
};

export default OnboardingForm;