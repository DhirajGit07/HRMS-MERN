// import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import axios from 'axios';
// import './EmployeeEditForm.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Attach JWT token to headers
// const token = localStorage.getItem('token');
// if (token) {
//   axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
// }

// // Helper function to format date for input[type="date"]
// const formatDateForInput = (dateString) => {
//   if (!dateString) return '';
//   const date = new Date(dateString);
//   if (isNaN(date.getTime())) return '';
//   return date.toISOString().split('T')[0];
// };

// const EmployeeEditForm = () => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [isEditMode, setIsEditMode] = useState(false);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);

//   const [formData, setFormData] = useState({
//     employeeId: '',
//     fullname: '',
//     email: '',
//     mobileNo: '',
//     role: 'Employee',
//     department: '',
//     ctc: '',
//     dob: '',
//     employeeStatus: 'Active',
//     ProbationPeriodStart: '',
//     ProbationPeriodEnd: '',
//     NoticePeriodStart: '',
//     NoticePeriodEnd: ''
//   });

//   const [errors, setErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Populate form if in edit-mode
//   useEffect(() => {
//     const emp = location.state?.employee;
//     if (emp) {
//       setIsEditMode(true);
//       setFormData({
//         employeeId: emp.employeeId || '',
//         fullname: emp.fullname || '',
//         email: emp.email || '',
//         mobileNo: emp.mobileNo || '',
//         role: emp.role || 'Employee',
//         department: emp.department || '',
//         ctc: emp.ctc || '',
//         dob: formatDateForInput(emp.dob),
//         employeeStatus: emp.employeeStatus || 'Active',
//         ProbationPeriodStart: formatDateForInput(emp.ProbationPeriodStart),
//         ProbationPeriodEnd: formatDateForInput(emp.ProbationPeriodEnd),
//         NoticePeriodStart: formatDateForInput(emp.NoticePeriodStart),
//         NoticePeriodEnd: formatDateForInput(emp.NoticePeriodEnd)
//       });
//     }
//   }, [location.state]);

//   const handleChange = e => {
//     const { name, value } = e.target;
//     setFormData(f => ({ ...f, [name]: value }));
//   };

//   const validate = () => {
//     const errs = {};
//     const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//     if (formData.email && !emailPattern.test(formData.email)) {
//       errs.email = 'Please enter a valid email address';
//     }
//     if (formData.mobileNo && !/^\d{10}$/.test(formData.mobileNo)) {
//       errs.mobileNo = 'Mobile number must be exactly 10 digits';
//     }
//     setErrors(errs);
//     return Object.keys(errs).length === 0;
//   };

//   // const handleSubmit = async e => {
//   //   e.preventDefault();
//   //   if (!validate()) return;
//   //   setIsSubmitting(true);

//   //   try {
//   //     const id = location.state.employee._id;
//   //     await axios.put(`http://localhost:8000/api/users/${id}`, formData);

//   //     setShowSuccessModal(true);
//   //     setTimeout(() => {
//   //       setShowSuccessModal(false);
//   //       navigate('/employee');
//   //     }, 1500);
//   //   } catch (err) {
//   //     console.error('Update failed:', err);
//   //     alert(err.response?.data?.message || 'Failed to update employee');
//   //   } finally {
//   //     setIsSubmitting(false);
//   //   }
//   // };

//     const handleSubmit = async e => {
//     e.preventDefault();
//     if (!validate()) {
//       // Show validation error toast
//       toast.error('Please fix the form errors', {
//         position: "top-right",
//         autoClose: 3000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         progress: undefined,
//       });
//       return;
//     }
    
//     setIsSubmitting(true);

//     try {
//       const id = location.state.employee._id;
//       await axios.put(`http://localhost:8000/api/users/${id}`, formData);

//       // Show success toast
//       toast.success('Employee updated successfully!', {
//         position: "top-right",
//         autoClose: 3000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         progress: undefined,
//       });

//       // Keep your existing success modal if you still want it
//       // setShowSuccessModal(true);
//       setTimeout(() => {
//         setShowSuccessModal(false);
//         navigate('/employee');
//       }, 1500);
//     } catch (err) {
//       console.error('Update failed:', err);
//       const errorMessage = err.response?.data?.message || 'Failed to update employee';
      
//       // Show error toast
//       toast.error(errorMessage, {
//         position: "top-right",
//         autoClose: 3000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         progress: undefined,
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="ee-container">
//             <ToastContainer
//         position="top-right"
//         autoClose={3000}
//         hideProgressBar={false}
//         newestOnTop={false}
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//       />

//       <div className="ee-header">
//         <h2>{isEditMode ? 'Edit Employee' : 'New Employee'}</h2>
//       </div>

//       <div className="ee-form-box">
//         <form onSubmit={handleSubmit}>
//           {/* Employee Information */}
//           <h3 className="ee-section-title">Employee Information</h3>
//           <div className="ee-form-row">
//             <div className="ee-form-group">
//               <label>Employee ID <span className="ee-required">*</span></label>
//               <input
//                 name="employeeId"
//                 value={formData.employeeId}
//                 onChange={handleChange}
//                 className={`ee-input-field ${errors.employeeId ? 'ee-error-field' : ''}`}
//               />
//               {errors.employeeId && <div className="ee-error-message">{errors.employeeId}</div>}
//             </div>
//             <div className="ee-form-group">
//               <label>Full Name <span className="ee-required">*</span></label>
//               <input
//                 name="fullname"
//                 value={formData.fullname}
//                 onChange={handleChange}
//                 className={`ee-input-field ${errors.fullname ? 'ee-error-field' : ''}`}
//               />
//               {errors.fullname && <div className="ee-error-message">{errors.fullname}</div>}
//             </div>
//           </div>

//           <div className="ee-form-row">
//             <div className="ee-form-group">
//               <label>Email <span className="ee-required">*</span></label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 className={`ee-input-field ${errors.email ? 'ee-error-field' : ''}`}
//                 readOnly={isEditMode}
//               />
//               {errors.email && <div className="ee-error-message">{errors.email}</div>}
//             </div>
//             <div className="ee-form-group">
//               <label>Mobile No. <span className="ee-required">*</span></label>
//               <input
//                 name="mobileNo"
//                 value={formData.mobileNo}
//                 onChange={handleChange}
//                 className={`ee-input-field ${errors.mobileNo ? 'ee-error-field' : ''}`}
//               />
//               {errors.mobileNo && <div className="ee-error-message">{errors.mobileNo}</div>}
//             </div>
//           </div>

//           <div className="ee-form-row">
//             <div className="ee-form-group-1">
//               <label>Date of Birth (DOB)</label>
//               <input
//                 type="date"
//                 name="dob"
//                 value={formData.dob}
//                 onChange={handleChange}
//                 className="ee-input-field"
//                 readOnly
//               />
//             </div>
//           </div>

//           {/* Employment Details */}
//           <h3 className="ee-section-title">Employment Details</h3>
//           <div className="ee-form-row">
//             <div className="ee-form-group">
//               <label>Role <span className="ee-required">*</span></label>
//               <select
//                 name="role"
//                 value={formData.role}
//                 onChange={handleChange}
//                 className={`ee-input-field ${errors.role ? 'ee-error-field' : ''}`}
//               >
//                 <option value="Employee">Employee</option>
//                 <option value="Admin">Admin</option>
//               </select>
//               {errors.role && <div className="ee-error-message">{errors.role}</div>}
//             </div>
//             <div className="ee-form-group">
//               <label>Department <span className="ee-required">*</span></label>
//               <input
//                 name="department"
//                 value={formData.department}
//                 onChange={handleChange}
//                 className={`ee-input-field ${errors.department ? 'ee-error-field' : ''}`}
//               />
//               {errors.department && <div className="ee-error-message">{errors.department}</div>}
//             </div>
//           </div>

//           <div className="ee-form-row">
//             <div className="ee-form-group">
//               <label>CTC</label>
//               <input
//                 name="ctc"
//                 value={formData.ctc}
//                 onChange={handleChange}
//                 className="ee-input-field"
//                 placeholder="e.g. 500000"
//               />
//             </div>
//             <div className="ee-form-group">
//               <label>Status</label>
//               <select
//                 name="employeeStatus"
//                 value={formData.employeeStatus}
//                 onChange={handleChange}
//                 className="ee-input-field"
//               >
//                 <option value="Active">Active</option>
//                 <option value="Inactive">Inactive</option>
//               </select>
//             </div>
//           </div>

//           {/* Probation and Notice Period Dates */}
//           <div className="ee-form-row">
//             <div className="ee-form-group">
//               <label>Probation Period Start</label>
//               <input
//                 type="date"
//                 name="ProbationPeriodStart"
//                 value={formData.ProbationPeriodStart}
//                 onChange={handleChange}
//                 className="ee-input-field"
//               />
//             </div>
//             <div className="ee-form-group">
//               <label>Probation Period End</label>
//               <input
//                 type="date"
//                 name="ProbationPeriodEnd"
//                 value={formData.ProbationPeriodEnd}
//                 onChange={handleChange}
//                 className="ee-input-field"
//                 min={formData.ProbationPeriodStart}
//                 disabled={!formData.ProbationPeriodStart}
//               />
//             </div>
//           </div>

//           <div className="ee-form-row">
//             <div className="ee-form-group">
//               <label>Notice Period Start</label>
//               <input
//                 type="date"
//                 name="NoticePeriodStart"
//                 value={formData.NoticePeriodStart}
//                 onChange={handleChange}
//                 className="ee-input-field"
//               />
//             </div>
//             <div className="ee-form-group">
//               <label>Notice Period End</label>
//               <input
//                 type="date"
//                 name="NoticePeriodEnd"
//                 value={formData.NoticePeriodEnd}
//                 onChange={handleChange}
//                 className="ee-input-field"
//                 min={formData.NoticePeriodStart}
//                 disabled={!formData.NoticePeriodStart}
//               />
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="ee-form-actions ee-sticky-footer">
//             <button
//               type="button"
//               className="ee-btn ee-gray"
//               onClick={() => navigate('/employee')}
//               disabled={isSubmitting}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="ee-btn ee-blue"
//               disabled={isSubmitting}
//             >
//               {isSubmitting ? 'Updating...' : 'Update Employee'}
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* Success Modal */}
//       {showSuccessModal && (
//         <div className="success-modal-overlay">
//           <div className="success-modal">
//             <h3>🎉 Submission Successful!</h3>
//             <p>Your employee details have been saved successfully.</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default EmployeeEditForm;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './EmployeeEditForm.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Attach JWT token to headers
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Helper function to format date for input[type="date"]
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const EmployeeEditForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isEditMode, setIsEditMode] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
    candidateId:'',
    employeeId: '',
    fullname: '',
    email: '',
    mobileNo: '',
    role: 'Employee',
    department: '',
    ctc: '',
    dob: '',
    employeeStatus: 'Active',
    ProbationPeriodStart: '',
    ProbationPeriodEnd: '',
    NoticePeriodStart: '',
    NoticePeriodEnd: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form if in edit-mode
  useEffect(() => {
    const emp = location.state?.employee;
    if (emp) {
      setIsEditMode(true);
      setFormData({
        employeeId: emp.employeeId || '',
        candidateId:emp.candidateId || '',
        fullname: emp.fullname || '',
        email: emp.email || '',
        mobileNo: emp.mobileNo || '',
        role: emp.role || 'Employee',
        department: emp.department || '',
        ctc: emp.ctc || '',
        dob: formatDateForInput(emp.dob),
        employeeStatus: emp.employeeStatus || 'Active',
        ProbationPeriodStart: formatDateForInput(emp.ProbationPeriodStart),
        ProbationPeriodEnd: formatDateForInput(emp.ProbationPeriodEnd),
        NoticePeriodStart: formatDateForInput(emp.NoticePeriodStart),
        NoticePeriodEnd: formatDateForInput(emp.NoticePeriodEnd)
      });
    }
  }, [location.state]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (formData.email && !emailPattern.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (formData.mobileNo && !/^\d{10}$/.test(formData.mobileNo)) {
      errs.mobileNo = 'Mobile number must be exactly 10 digits';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // const handleSubmit = async e => {
  //   e.preventDefault();
  //   if (!validate()) return;
  //   setIsSubmitting(true);

  //   try {
  //     const id = location.state.employee._id;
  //     await axios.put(`http://localhost:8000/api/users/${id}`, formData);

  //     setShowSuccessModal(true);
  //     setTimeout(() => {
  //       setShowSuccessModal(false);
  //       navigate('/employee');
  //     }, 1500);
  //   } catch (err) {
  //     console.error('Update failed:', err);
  //     alert(err.response?.data?.message || 'Failed to update employee');
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

    const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) {
      // Show validation error toast
      toast.error('Please fix the form errors', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const id = location.state.employee._id;
      await axios.put(`http://localhost:8000/api/users/${id}`, formData);

      // Show success toast
      toast.success('Employee updated successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      // Keep your existing success modal if you still want it
      // setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/employee');
      }, 1500);
    } catch (err) {
      console.error('Update failed:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update employee';
      
      // Show error toast
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ee-container">
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

      <div className="ee-header">
        <h2>{isEditMode ? 'Edit Employee' : 'New Employee'}</h2>
      </div>

      <div className="ee-form-box">
        <form onSubmit={handleSubmit}>
          {/* Employee Information */}
          <h3 className="ee-section-title">Employee Information</h3>
          <div className="ee-form-row">
            <div className="ee-form-group">
              <label>System ID <span className="ee-required">*</span></label>
              <input
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                className={`ee-input-field ${errors.employeeId ? 'ee-error-field' : ''}`}
              />
              {errors.employeeId && <div className="ee-error-message">{errors.employeeId}</div>}
            </div>
             <div className="ee-form-group">
              <label>Candiadte ID <span className="ee-required">*</span></label>
              <input
                name="candidateId"
                value={formData.candidateId}
                onChange={handleChange}
                className={`ee-input-field ${errors.candidateId ? 'ee-error-field' : ''}`}
              />
              {errors.employeeId && <div className="ee-error-message">{errors.employeeId}</div>}
            </div>
            <div className="ee-form-group">
              <label>Full Name <span className="ee-required">*</span></label>
              <input
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                className={`ee-input-field ${errors.fullname ? 'ee-error-field' : ''}`}
              />
              {errors.fullname && <div className="ee-error-message">{errors.fullname}</div>}
            </div>
          </div>

          <div className="ee-form-row">
            <div className="ee-form-group">
              <label>Email <span className="ee-required">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`ee-input-field ${errors.email ? 'ee-error-field' : ''}`}
                readOnly={isEditMode}
              />
              {errors.email && <div className="ee-error-message">{errors.email}</div>}
            </div>
            <div className="ee-form-group">
              <label>Mobile No. <span className="ee-required">*</span></label>
              <input
                name="mobileNo"
                value={formData.mobileNo}
                onChange={handleChange}
                className={`ee-input-field ${errors.mobileNo ? 'ee-error-field' : ''}`}
              />
              {errors.mobileNo && <div className="ee-error-message">{errors.mobileNo}</div>}
            </div>
          </div>

          <div className="ee-form-row">
            <div className="ee-form-group-1">
              <label>Date of Birth (DOB)</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="ee-input-field"
                readOnly
              />
            </div>
          </div>

          {/* Employment Details */}
          <h3 className="ee-section-title">Employment Details</h3>
          <div className="ee-form-row">
            <div className="ee-form-group">
              <label>Role <span className="ee-required">*</span></label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`ee-input-field ${errors.role ? 'ee-error-field' : ''}`}
              >
                <option value="Employee">Employee</option>
                <option value="Admin">Admin</option>
              </select>
              {errors.role && <div className="ee-error-message">{errors.role}</div>}
            </div>
            <div className="ee-form-group">
              <label>Department <span className="ee-required">*</span></label>
              <input
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`ee-input-field ${errors.department ? 'ee-error-field' : ''}`}
              />
              {errors.department && <div className="ee-error-message">{errors.department}</div>}
            </div>
          </div>

          <div className="ee-form-row">
            <div className="ee-form-group">
              <label>CTC</label>
              <input
                name="ctc"
                value={formData.ctc}
                onChange={handleChange}
                className="ee-input-field"
                placeholder="e.g. 500000"
              />
            </div>
            <div className="ee-form-group">
              <label>Status</label>
              <select
                name="employeeStatus"
                value={formData.employeeStatus}
                onChange={handleChange}
                className="ee-input-field"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Probation and Notice Period Dates */}
          <div className="ee-form-row">
            <div className="ee-form-group">
              <label>Probation Period Start</label>
              <input
                type="date"
                name="ProbationPeriodStart"
                value={formData.ProbationPeriodStart}
                onChange={handleChange}
                className="ee-input-field"
              />
            </div>
            <div className="ee-form-group">
              <label>Probation Period End</label>
              <input
                type="date"
                name="ProbationPeriodEnd"
                value={formData.ProbationPeriodEnd}
                onChange={handleChange}
                className="ee-input-field"
                min={formData.ProbationPeriodStart}
                disabled={!formData.ProbationPeriodStart}
              />
            </div>
          </div>

          <div className="ee-form-row">
            <div className="ee-form-group">
              <label>Notice Period Start</label>
              <input
                type="date"
                name="NoticePeriodStart"
                value={formData.NoticePeriodStart}
                onChange={handleChange}
                className="ee-input-field"
              />
            </div>
            <div className="ee-form-group">
              <label>Notice Period End</label>
              <input
                type="date"
                name="NoticePeriodEnd"
                value={formData.NoticePeriodEnd}
                onChange={handleChange}
                className="ee-input-field"
                min={formData.NoticePeriodStart}
                disabled={!formData.NoticePeriodStart}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="ee-form-actions ee-sticky-footer">
            <button
              type="button"
              className="ee-btn ee-gray"
              onClick={() => navigate('/employee')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ee-btn ee-blue"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Employee'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <h3>🎉 Submission Successful!</h3>
            <p>Your employee details have been saved successfully.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeEditForm;