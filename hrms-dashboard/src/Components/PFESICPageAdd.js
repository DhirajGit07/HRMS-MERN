import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PFESICPageAdd.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PFESICPageAdd = ({ onBack, onSave, currentTab, editData }) => {
  const [formData, setFormData] = useState({
    status: editData?.status || '',
    employeeId: editData?.employeeId || '',
    candidateId: editData?.candidateId || '',
    employeeName: editData?.employeeName || '',
    middlename: editData?.middlename || '',
    gender: editData?.gender || '',
    maritalstatus: editData?.maritalstatus || '',
    dob: editData?.dob ? new Date(editData.dob).toISOString().split('T')[0] : '',
    actualDoj: editData?.actualDoj ? new Date(editData.actualDoj).toISOString().split('T')[0] : '',
    minorityStatus: editData?.minorityStatus || '',
    dojepfo: editData?.dojepfo ? new Date(editData.dojepfo).toISOString().split('T')[0] : '',
    department: editData?.department || '',
    designation: editData?.designation || '',
    mobile: editData?.mobile || '',
    aadhar: editData?.aadhar || '',
    pan: editData?.pan || '',
    email: editData?.email || '',
    leaving: editData?.leaving ? new Date(editData.leaving).toISOString().split('T')[0] : '',
    bankName: editData?.bankName || '',
    bankAcc: editData?.bankAcc || '',
    ifsc: editData?.ifsc || '',
    presentAddress: editData?.presentAddress || '',
    permanentAddress: editData?.permanentAddress || '',
    pfNumber: editData?.pfNumber || '',
    uanNumber: editData?.uanNumber || '',
    esicIp: editData?.esicIp || '',
    nomineeName: editData?.nomineeName || '',
    nomineeRelation: editData?.nomineeRelation || '',
    nomineeAddress: editData?.nomineeAddress || '',
    remark: editData?.remark || '',
    recordType: currentTab,
  });

  const [file, setFile] = useState(null);
  const [existingDocPath, setExistingDocPath] = useState(editData?.docPath || '');
  const [fileName, setFileName] = useState(editData?.docPath ? editData.docPath.split('/').pop() : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldFocus, setFieldFocus] = useState({});
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
const [userRole, setUserRole] = useState('');
  // Fetch profile data when component mounts
   useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/users/profile');
        const profileData = response.data;
        setProfileData(profileData);

         
        // Set user role from profile data
        setUserRole(profileData.role || '');

        // Try to fetch employee data to get candidateId if not available in profile
        let candidateId = profileData.candidateId || '';
        
        if (!candidateId || candidateId === 'N/A') {
          try {
            const employeesResponse = await axios.get('/api/users');
            const employees = employeesResponse.data;
            const match = employees.find(e =>
              e.email?.toLowerCase() === profileData.email?.toLowerCase()
            );
            
            if (match && match.candidateId && match.candidateId !== 'N/A') {
              candidateId = match.candidateId;
            }
          } catch (empErr) {
            console.error('Error fetching employees:', empErr);
          }
        }

        // Auto-fill fields if not editing existing record
        if (!editData) {
          setFormData(prev => ({
            ...prev,
            email: profileData.email || '',
            employeeId: profileData.employeeId || '',
            candidateId: candidateId,
            department: profileData.department || ''
          }));
        } else if (editData && (!editData.candidateId || editData.candidateId === 'N/A') && candidateId) {
          // If editing but candidateId is missing or invalid, populate it
          setFormData(prev => ({
            ...prev,
            candidateId: candidateId
          }));
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        toast.error('Failed to load profile data', {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Don't allow changes to employeeId and candidateId if they come from profile
    if ((name === 'employeeId' && profileData?.employeeId) || 
        (name === 'candidateId' && profileData?.candidateId)) {
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setFieldErrors(prev => ({ ...prev, doc: '' }));
      setFile(null);
      setFileName('');
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setFieldErrors(prev => ({
        ...prev,
        doc: 'File size must be less than 15MB'
      }));
      setFile(null);
      setFileName('');
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      setFieldErrors(prev => ({
        ...prev,
        doc: 'Only PDF files are allowed'
      }));
      setFile(null);
      setFileName('');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFieldErrors(prev => ({ ...prev, doc: '' }));
    setExistingDocPath(''); // Clear existing path when new file is selected
  };

  const handleFocus = (fieldName) => {
    setFieldFocus(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleBlur = (fieldName) => {
    setFieldFocus(prev => ({ ...prev, [fieldName]: false }));
    validateField(fieldName, formData[fieldName]);
  };

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'employeeId':
        if (!value) error = 'Employee ID is required';
        break;
      case 'candidateId':
        if (!value) error = 'Candidate ID is required';
        break;
      case 'employeeName':
        if (!value) error = 'Employee name is required';
        else if (!/^[A-Za-z\s]{3,50}$/.test(value)) error = 'Name should be 3-50 letters only';
        break;
      case 'middlename':
        if (!value) error = 'Middle name is required';
        else if (!/^[A-Za-z\s]{1,50}$/.test(value)) error = 'Middle name should be letters only';
        break;
      case 'mobile':
        if (!value) error = 'Mobile number is required';
        else if (!/^[6-9]\d{9}$/.test(value)) error = 'Enter valid 10-digit mobile number';
        break;
      case 'aadhar':
        if (!value) error = 'Aadhaar number is required';
        else if (!/^\d{12}$/.test(value)) error = 'Aadhaar must be 12 digits';
        break;
      case 'pan':
        if (!value) error = 'PAN number is required';
        else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) error = 'Enter valid PAN (e.g., ABCDE1234F)';
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Enter valid email address';
        break;
      case 'bankAcc':
        if (!value) error = 'Bank account is required';
        else if (!/^\d{9,18}$/.test(value)) error = 'Account number should be 9-18 digits';
        break;
      case 'ifsc':
        if (!value) error = 'IFSC code is required';
        else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) error = 'Enter valid IFSC (e.g., SBIN0001234)';
        break;
      case 'pfNumber':
        if (value && !/^[A-Za-z]+\d{17}$/.test(value)) error = 'Enter valid PF number (e.g., PUPUN35413760000010024)';
        break;
      case 'uanNumber':
        if (value && !/^\d{12}$/.test(value)) error = 'UAN must be 12 digits';
        break;
      case 'esicIp':
         if (value && !/^\d{10}$/.test(value)) error = 'ESIC IP must be 10 digits';
        break;
      case 'dob':
      case 'actualDoj':
      case 'dojepfo':
        break;
      case 'leaving':
        break;
      case 'nomineeName':
       if (value &&  !/^[A-Za-z\s]{2,50}$/.test(value)) error = 'Nominee name should be 2-50 letters only';
        break;
      case 'nomineeRelation':
         if (value && !/^[A-Za-z\s]{2,50}$/.test(value)) error = 'Relation should be 2-50 letters only';
        break;
      default:
        if (!value && name !== 'email' && name !== 'uanNumber' && name !== 'nomineeName' &&
          name !== 'nomineeRelation' && name !== 'nomineeAddress' && name !== 'remark' && name !== 'pfNumber' && name !== 'esicIp') {
          // error = 'This field is required';
        }
    }

    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));

    return !error;
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      if (!validateField(key, formData[key])) {
        isValid = false;
      }
    });

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Client-side validation
    if (!validateForm()) {
      setIsSubmitting(false);
      toast.error('Please correct the errors in the form', {
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

    try {
      const formDataToSend = new FormData();
      // Append all form fields
      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (value !== undefined && value !== null) {
          formDataToSend.append(key, value);
        }
      });
      // Append file if provided
      if (file) {
        formDataToSend.append('doc', file);
      }
      // Append existing doc path if no new file is provided but one exists
      if (!file && existingDocPath) {
        formDataToSend.append('existingDocPath', existingDocPath);
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      let response;
      if (editData?._id) {
        response = await axios.put(`/api/pfesic/${editData._id}`, formDataToSend, config);
      } else {
        response = await axios.post('/api/pfesic', formDataToSend, config);
      }

      toast.success(response.data.message || 'Record saved successfully!', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        
      });

      onSave(response.data);
    } catch (err) {
      const payload = err.response?.data || {};
      const errorMessage = payload.message || 'Failed to save record';

      if (payload.errors) {
        const serverErrors = {};
        Object.entries(payload.errors).forEach(([field, msg]) => {
          serverErrors[field] = msg;
        });
        setFieldErrors(serverErrors);
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      console.error('Error saving record:', err.response?.status, payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldInstructions = (fieldName) => {
    const instructions = {
      employeeId: 'Unique employee identifier',
      candidateId: 'Unique candidate identifier',
      employeeName: 'Full name as per Aadhaar (letters only)',
      middlename: 'Middle name (letters only)',
      mobile: '10-digit number starting with 6-9',
      aadhar: '12-digit Aadhaar number',
      pan: 'Format: ABCDE1234F',
      email: 'Optional (format: user@example.com)',
      bankAcc: '9-18 digit account number',
      ifsc: 'Format: SBIN0001234',
      pfNumber: 'Format: PUPUN35413760000010024',
      uanNumber: 'Optional 12-digit number',
      esicIp: '10-digit ESIC IP number',
      dob: 'Employee date of birth (DD-MM-YYYY)',
      actualDoj: 'Date of joining the company (DD-MM-YYYY)',
      dojepfo: 'Date of joining EPFO (DD-MM-YYYY)',
      leaving: 'Date of leaving the company (DD-MM-YYYY)',
      doc: 'Upload PDF document (max 15MB)'
    };

    return instructions[fieldName] || '';
  };

  const isFieldRequired = (fieldName) => {
    const optionalFields = ['email','remark', 'leaving'];
    return !optionalFields.includes(fieldName) && (currentTab !== 'PF' || fieldName !== 'doc');
  };

  return (
    <form className="addpf-form" onSubmit={handleSubmit}>
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
      {isLoading && (
        <div className="addpf-loading">Loading profile data...</div>
      )}
      {error && (
        <div className="addpf-error">
          <strong>Error:</strong> {error}
          {error === 'Please fix the validation errors' && (
            <ul className="addpf-server-errors">
              {Object.entries(fieldErrors).map(([field, errMsg]) => (
                <li key={field}>{field}: {errMsg}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="addpf-form-grid">
        {/* Status */}
        <div className="addpf-form-group">
          <label>Employee Status<span className="required-asterisk">*</span></label>
          <select
            name="status"
            onChange={handleChange}
            onFocus={() => handleFocus('status')}
            onBlur={() => handleBlur('status')}
            required
            value={formData.status}
          >
            <option value="">Select</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {fieldFocus.status && !fieldErrors.status && (
            <div className="addpf-instruction">Select employee current status</div>
          )}
          {fieldErrors.status && <div className="addpf-field-error">{fieldErrors.status}</div>}
        </div>

        {/* Employee ID - Only show for admins */}
        {userRole === 'admin' && (
          <div className="addpf-form-group">
            <label>System ID<span className="required-asterisk">*</span></label>
            <input
              type="text"
              name="employeeId"
              onChange={handleChange}
              onFocus={() => handleFocus('employeeId')}
              onBlur={() => handleBlur('employeeId')}
              required
              value={formData.employeeId}
              readOnly={!!profileData?.employeeId}
            />
            {fieldFocus.employeeId && !fieldErrors.employeeId && (
              <div className="addpf-instruction">{getFieldInstructions('employeeId')}</div>
            )}
            {fieldErrors.employeeId && <div className="addpf-field-error">{fieldErrors.employeeId}</div>}
          </div>
        )}
        
        {/* Candidate ID */}
         <div className="addpf-form-group">
          <label>Candidate ID<span className="required-asterisk">*</span></label>
          <input
            type="text"
            name="candidateId"
            onChange={handleChange}
            onFocus={() => handleFocus('candidateId')}
            onBlur={() => handleBlur('candidateId')}
            required
            value={formData.candidateId}
            readOnly={true}
            // className="read-only-field"
          />
          {fieldFocus.candidateId && !fieldErrors.candidateId && (
            <div className="addpf-instruction">{getFieldInstructions('candidateId')}</div>
          )}
          {fieldErrors.candidateId && <div className="addpf-field-error">{fieldErrors.candidateId}</div>}
        </div>

        {/* Employee Name */}
        <div className="addpf-form-group">
          <label>Employee Name (As Per Aadhar)<span className="required-asterisk">*</span></label>
          <input
            type="text"
            name="employeeName"
            onChange={handleChange}
            onFocus={() => handleFocus('employeeName')}
            onBlur={() => handleBlur('employeeName')}
            required
            value={formData.employeeName}
          />
          {fieldFocus.employeeName && !fieldErrors.employeeName && (
            <div className="addpf-instruction">{getFieldInstructions('employeeName')}</div>
          )}
          {fieldErrors.employeeName && <div className="addpf-field-error">{fieldErrors.employeeName}</div>}
        </div>

        {/* Middle Name */}
        <div className="addpf-form-group">
          <label>Middle Name<span className="required-asterisk">*</span></label>
          <input
            type="text"
            name="middlename"
            onChange={handleChange}
            onFocus={() => handleFocus('middlename')}
            onBlur={() => handleBlur('middlename')}
            required
            value={formData.middlename}
          />
          {fieldFocus.middlename && !fieldErrors.middlename && (
            <div className="addpf-instruction">{getFieldInstructions('middlename')}</div>
          )}
          {fieldErrors.middlename && <div className="addpf-field-error">{fieldErrors.middlename}</div>}
        </div>

        {/* Gender */}
        <div className="addpf-form-group">
          <label>Gender<span className="required-asterisk">*</span></label>
          <select
            name="gender"
            onChange={handleChange}
            onFocus={() => handleFocus('gender')}
            onBlur={() => handleBlur('gender')}
            required
            value={formData.gender}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {fieldFocus.gender && !fieldErrors.gender && (
            <div className="addpf-instruction">Select gender</div>
          )}
          {fieldErrors.gender && <div className="addpf-field-error">{fieldErrors.gender}</div>}
        </div>

        {/* Marital Status */}
        <div className="addpf-form-group">
          <label>Marital Status<span className="required-asterisk">*</span></label>
          <select
            name="maritalstatus"
            onChange={handleChange}
            onFocus={() => handleFocus('maritalstatus')}
            onBlur={() => handleBlur('maritalstatus')}
            required
            value={formData.maritalstatus}
          >
            <option value="">Select</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
          </select>
          {fieldFocus.maritalstatus && !fieldErrors.maritalstatus && (
            <div className="addpf-instruction">Enter marital status</div>
          )}
          {fieldErrors.maritalstatus && <div className="addpf-field-error">{fieldErrors.maritalstatus}</div>}
        </div>

        {/* Date of Birth */}
        <div className="addpf-form-group">
          <label>Date Of Birth<span className="required-asterisk">*</span></label>
          <input
            type="date"
            name="dob"
            onChange={handleChange}
            onFocus={() => handleFocus('dob')}
            onBlur={() => handleBlur('dob')}
            required
            value={formData.dob}
          />
          {fieldFocus.dob && !fieldErrors.dob && (
            <div className="addpf-instruction">{getFieldInstructions('dob')}</div>
          )}
          {fieldErrors.dob && <div className="addpf-field-error">{fieldErrors.dob}</div>}
        </div>

        {/* Actual DOJ */}
        <div className="addpf-form-group">
          <label>Actual DOJ<span className="required-asterisk">*</span></label>
          <input
            type="date"
            name="actualDoj"
            onChange={handleChange}
            onFocus={() => handleFocus('actualDoj')}
            onBlur={() => handleBlur('actualDoj')}
            required
            value={formData.actualDoj}
          />
          {fieldFocus.actualDoj && !fieldErrors.actualDoj && (
            <div className="addpf-instruction">{getFieldInstructions('actualDoj')}</div>
          )}
          {fieldErrors.actualDoj && <div className="addpf-field-error">{fieldErrors.actualDoj}</div>}
        </div>

        {/* Minority Status */}
        <div className="addpf-form-group">
          <label>Minority Status<span className="required-asterisk">*</span></label>
          <select
            name="minorityStatus"
            onChange={handleChange}
            onFocus={() => handleFocus('minorityStatus')}
            onBlur={() => handleBlur('minorityStatus')}
            required
            value={formData.minorityStatus}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          {fieldFocus.minorityStatus && !fieldErrors.minorityStatus && (
            <div className="addpf-instruction">Select minority status</div>
          )}
          {fieldErrors.minorityStatus && <div className="addpf-field-error">{fieldErrors.minorityStatus}</div>}
        </div>

        {/* DOJ to EPFO */}
        <div className="addpf-form-group">
          <label>DOJ to EPFO<span className="required-asterisk">*</span></label>
          <input
            type="date"
            name="dojepfo"
            onChange={handleChange}
            onFocus={() => handleFocus('dojepfo')}
            onBlur={() => handleBlur('dojepfo')}
            required
            value={formData.dojepfo}
          />
          {fieldFocus.dojepfo && !fieldErrors.dojepfo && (
            <div className="addpf-instruction">{getFieldInstructions('dojepfo')}</div>
          )}
          {fieldErrors.dojepfo && <div className="addpf-field-error">{fieldErrors.dojepfo}</div>}
        </div>

        {/* Department */}
        <div className="addpf-form-group">
          <label>Department<span className="required-asterisk">*</span></label>
          <input
            type="text"
            name="department"
            onChange={handleChange}
            onFocus={() => handleFocus('department')}
            onBlur={() => handleBlur('department')}
            required
            value={formData.department}
          />
          {fieldFocus.department && !fieldErrors.department && (
            <div className="addpf-instruction">Enter department name</div>
          )}
          {fieldErrors.department && <div className="addpf-field-error">{fieldErrors.department}</div>}
        </div>

        {/* Designation */}
        <div className="addpf-form-group">
          <label>Designation<span className="required-asterisk">*</span></label>
          <input
            type="text"
            name="designation"
            onChange={handleChange}
            onFocus={() => handleFocus('designation')}
            onBlur={() => handleBlur('designation')}
            required
            value={formData.designation}
          />
          {fieldFocus.designation && !fieldErrors.designation && (
            <div className="addpf-instruction">Enter employee designation</div>
          )}
          {fieldErrors.designation && <div className="addpf-field-error">{fieldErrors.designation}</div>}
        </div>

        {/* Mobile */}
        <div className="addpf-form-group">
          <label>Mobile Number<span className="required-asterisk">*</span></label>
          <input
            type="text"
            name="mobile"
            onChange={handleChange}
            onFocus={() => handleFocus('mobile')}
            onBlur={() => handleBlur('mobile')}
            required
            value={formData.mobile}
          />
          {fieldFocus.mobile && !fieldErrors.mobile && (
            <div className="addpf-instruction">{getFieldInstructions('mobile')}</div>
          )}
          {fieldErrors.mobile && <div className="addpf-field-error">{fieldErrors.mobile}</div>}
        </div>

        {/* Aadhar */}
        <div className="addpf-form-group">
          <label>Aadhaar No.<span className="required-asterisk">*</span></label>
          <input
            type="text"
            name="aadhar"
            onChange={handleChange}
            onFocus={() => handleFocus('aadhar')}
            onBlur={() => handleBlur('aadhar')}
            required
            value={formData.aadhar}
          />
          {fieldFocus.aadhar && !fieldErrors.aadhar && (
            <div className="addpf-instruction">{getFieldInstructions('aadhar')}</div>
          )}
          {fieldErrors.aadhar && <div className="addpf-field-error">{fieldErrors.aadhar}</div>}
        </div>

        {/* PAN */}
        <div className="addpf-form-group">
          <label>PAN No.<span className="required-asterisk">*</span></label>
          <input
            type="text"
            name="pan"
            onChange={handleChange}
            onFocus={() => handleFocus('pan')}
            onBlur={() => handleBlur('pan')}
            required
            value={formData.pan}
          />
          {fieldFocus.pan && !fieldErrors.pan && (
            <div className="addpf-instruction">{getFieldInstructions('pan')}</div>
          )}
          {fieldErrors.pan && <div className="addpf-field-error">{fieldErrors.pan}</div>}
        </div>

        {/* Email */}
        <div className="addpf-form-group">
          <label>Email ID</label>
          <input
            type="email"
            name="email"
            onChange={handleChange}
            onFocus={() => handleFocus('email')}
            onBlur={() => handleBlur('email')}
            value={formData.email}
            readOnly={!!profileData?.email}
          />
          {fieldFocus.email && !fieldErrors.email && (
            <div className="addpf-instruction">{getFieldInstructions('email')}</div>
          )}
          {fieldErrors.email && <div className="addpf-field-error">{fieldErrors.email}</div>}
        </div>

        {/* Date of Leaving */}
        <div className="addpf-form-group">
          <label>Date of Leaving</label>
          <input
            type="date"
            name="leaving"
            onChange={handleChange}
            onFocus={() => handleFocus('leaving')}
            onBlur={() => handleBlur('leaving')}
            value={formData.leaving}
          />
          {fieldFocus.leaving && !fieldErrors.leaving && (
            <div className="addpf-instruction">{getFieldInstructions('leaving')}</div>
          )}
          {fieldErrors.leaving && <div className="addpf-field-error">{fieldErrors.leaving}</div>}
        </div>

        {/* Bank Name */}
        <div className="addpf-form-group">
          <label>Bank Name<span className="required-asterisk">*</span></label>
          <input
            type="text"
            name="bankName"
            onChange={handleChange}
            onFocus={() => handleFocus('bankName')}
            onBlur={() => handleBlur('bankName')}
            required
            value={formData.bankName}
          />
          {fieldFocus.bankName && !fieldErrors.bankName && (
            <div className="addpf-instruction">Enter bank name</div>
          )}
          {fieldErrors.bankName && <div className="addpf-field-error">{fieldErrors.bankName}</div>}
        </div>

        {/* Bank Account */}
        <div className="addpf-form-group">
          <label>Bank A/C No.<span className="required-asterisk">*</span></label>
          <input
            type="text"
            name="bankAcc"
            onChange={handleChange}
            onFocus={() => handleFocus('bankAcc')}
            onBlur={() => handleBlur('bankAcc')}
            required
            value={formData.bankAcc}
          />
          {fieldFocus.bankAcc && !fieldErrors.bankAcc && (
            <div className="addpf-instruction">{getFieldInstructions('bankAcc')}</div>
          )}
          {fieldErrors.bankAcc && <div className="addpf-field-error">{fieldErrors.bankAcc}</div>}
        </div>

        {/* IFSC */}
        <div className="addpf-form-group">
          <label>IFSC Code<span className="required-asterisk">*</span></label>
          <input
            type="text"
            name="ifsc"
            onChange={handleChange}
            onFocus={() => handleFocus('ifsc')}
            onBlur={() => handleBlur('ifsc')}
            required
            value={formData.ifsc}
          />
          {fieldFocus.ifsc && !fieldErrors.ifsc && (
            <div className="addpf-instruction">{getFieldInstructions('ifsc')}</div>
          )}
          {fieldErrors.ifsc && <div className="addpf-field-error">{fieldErrors.ifsc}</div>}
        </div>

        {/* Present Address */}
        <div className="addpf-form-group">
          <label>Present Address<span className="required-asterisk">*</span></label>
          <input
            type="text"
            name="presentAddress"
            onChange={handleChange}
            onFocus={() => handleFocus('presentAddress')}
            onBlur={() => handleBlur('presentAddress')}
            required
            value={formData.presentAddress}
          />
          {fieldFocus.presentAddress && !fieldErrors.presentAddress && (
            <div className="addpf-instruction">Enter current residential address</div>
          )}
          {fieldErrors.presentAddress && <div className="addpf-field-error">{fieldErrors.presentAddress}</div>}
        </div>

        {/* Permanent Address */}
        <div className="addpf-form-group">
          <label>Permanent Address<span className="required-asterisk">*</span></label>
          <input
            type="text"
            name="permanentAddress"
            onChange={handleChange}
            onFocus={() => handleFocus('permanentAddress')}
            onBlur={() => handleBlur('permanentAddress')}
            required
            value={formData.permanentAddress}
          />
          {fieldFocus.permanentAddress && !fieldErrors.permanentAddress && (
            <div className="addpf-instruction">Enter permanent residential address</div>
          )}
          {fieldErrors.permanentAddress && <div className="addpf-field-error">{fieldErrors.permanentAddress}</div>}
        </div>

        {/* PF Number */}
        <div className="addpf-form-group">
          <label>PF Number</label>
          <input
            type="text"
            name="pfNumber"
            onChange={handleChange}
            onFocus={() => handleFocus('pfNumber')}
            onBlur={() => handleBlur('pfNumber')}
            value={formData.pfNumber}
          />
          {fieldFocus.pfNumber && !fieldErrors.pfNumber && (
            <div className="addpf-instruction">{getFieldInstructions('pfNumber')}</div>
          )}
          {fieldErrors.pfNumber && <div className="addpf-field-error">{fieldErrors.pfNumber}</div>}
        </div>

        {/* UAN Number */}
        <div className="addpf-form-group">
          <label>UAN Number</label>
          <input
            type="text"
            name="uanNumber"
            onChange={handleChange}
            onFocus={() => handleFocus('uanNumber')}
            onBlur={() => handleBlur('uanNumber')}
            value={formData.uanNumber}
          />
          {fieldFocus.uanNumber && !fieldErrors.uanNumber && (
            <div className="addpf-instruction">{getFieldInstructions('uanNumber')}</div>
          )}
          {fieldErrors.uanNumber && <div className="addpf-field-error">{fieldErrors.uanNumber}</div>}
        </div>

        {/* ESIC IP */}
        <div className="addpf-form-group">
          <label>ESIC IP No.</label>
          <input
            type="text"
            name="esicIp"
            onChange={handleChange}
            onFocus={() => handleFocus('esicIp')}
            onBlur={() => handleBlur('esicIp')}
            value={formData.esicIp}
          />
          {fieldFocus.esicIp && !fieldErrors.esicIp && (
            <div className="addpf-instruction">{getFieldInstructions('esicIp')}</div>
          )}
          {fieldErrors.esicIp && <div className="addpf-field-error">{fieldErrors.esicIp}</div>}
        </div>

        {/* Nominee Name */}
        <div className="addpf-form-group">
          <label>Nominee Name (for ESIC)</label>
          <input
            type="text"
            name="nomineeName"
            onChange={handleChange}
            onFocus={() => handleFocus('nomineeName')}
            onBlur={() => handleBlur('nomineeName')}
            value={formData.nomineeName}
          />
          {fieldFocus.nomineeName && !fieldErrors.nomineeName && (
            <div className="addpf-instruction">Enter nominee name (if applicable)</div>
          )}
          {fieldErrors.nomineeName && <div className="addpf-field-error">{fieldErrors.nomineeName}</div>}
        </div>

        {/* Nominee Relation */}
        <div className="addpf-form-group">
          <label>Relation With Employee</label>
          <input
            type="text"
            name="nomineeRelation"
            onChange={handleChange}
            onFocus={() => handleFocus('nomineeRelation')}
            onBlur={() => handleBlur('nomineeRelation')}
            value={formData.nomineeRelation}
          />
          {fieldFocus.nomineeRelation && !fieldErrors.nomineeRelation && (
            <div className="addpf-instruction">Enter relationship (e.g., Spouse, Father)</div>
          )}
          {fieldErrors.nomineeRelation && <div className="addpf-field-error">{fieldErrors.nomineeRelation}</div>}
        </div>

        {/* Nominee Address */}
        <div className="addpf-form-group">
          <label>Nominee Address</label>
          <input
            type="text"
            name="nomineeAddress"
            onChange={handleChange}
            onFocus={() => handleFocus('nomineeAddress')}
            onBlur={() => handleBlur('nomineeAddress')}
            value={formData.nomineeAddress}
          />
          {fieldFocus.nomineeAddress && !fieldErrors.nomineeAddress && (
            <div className="addpf-instruction">Enter nominee's address (if applicable)</div>
          )}
          {fieldErrors.nomineeAddress && <div className="addpf-field-error">{fieldErrors.nomineeAddress}</div>}
        </div>

        {/* Remark */}
        <div className="addpf-form-group">
          <label>Remark</label>
          <input
            type="text"
            name="remark"
            onChange={handleChange}
            onFocus={() => handleFocus('remark')}
            onBlur={() => handleBlur('remark')}
            value={formData.remark}
          />
          {fieldFocus.remark && !fieldErrors.remark && (
            <div className="addpf-instruction">Any additional remarks</div>
          )}
          {fieldErrors.remark && <div className="addpf-field-error">{fieldErrors.remark}</div>}
        </div>

        {/* Document Upload */}
        <div className="addpf-form-group">
          <label>Doc (PDF)</label>
          <div className="file-input-container">
            <input
              type="file"
              name="doc"
              accept="application/pdf"
              onChange={handleFileChange}
              onFocus={() => handleFocus('doc')}
              onBlur={() => handleBlur('doc')}
            />
            <div className={`file-input-display ${fieldFocus.doc ? 'focused' : ''}`}>
              <span className={fileName || existingDocPath ? 'file-input-name' : 'file-input-placeholder'}>
                {fileName || (existingDocPath ? existingDocPath.split('/').pop() : 'Choose a PDF file')}
              </span>
              <span className="file-input-browse">Choose file</span>
            </div>
            </div>
          {fieldFocus.doc && !fieldErrors.doc && (
            <div className="addpf-instruction">{getFieldInstructions('doc')}</div>
          )}
          {fieldErrors.doc && <div className="addpf-field-error">{fieldErrors.doc}</div>}
        </div>
      </div>

      <div className="addpf-button-group">
        <button
          type="submit"
          className="addpf-save-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : editData ? 'Update' : 'Save'}
        </button>
        <button
          type="button"
          className="addpf-back-btn"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </button>
      </div>
    </form>
  );
};

export default PFESICPageAdd;