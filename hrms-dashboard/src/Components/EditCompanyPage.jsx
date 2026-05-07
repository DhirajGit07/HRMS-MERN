import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EditCompanyPage.css';
import axios from 'axios';
import SuperAdminNavbar from '../pages/CompanyViewNavbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditCompanyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [companyData, setCompanyData] = useState({
    companyId: '',
    companyName: '',
    companyStatus: 'active',
    startDate: '',
    endDate: '',
    pendingAmount: '',
    revisedPayment: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function fetchCompany() {
      try {
        const { data } = await axios.get(`http://localhost:8000/api/users/company/${id}`);
        setCompanyData({
          companyId: data.companyId,
          companyName: data.companyName,
          companyStatus: data.companyStatus || 'active',
          startDate: data.startDate?.split('T')[0] || '',
          endDate: data.endDate?.split('T')[0] || '',
          pendingAmount: data.pendingAmount || '',
          revisedPayment: data.revisedPayment || ''
        });
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch company data.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    }
    fetchCompany();
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setCompanyData(c => ({ ...c, [name]: value }));
    setErrors(err => ({ ...err, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!companyData.companyName.trim()) {
      errs.companyName = 'Company name is required';
      toast.warn('Company name is required', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    if (companyData.pendingAmount && companyData.pendingAmount < 0) {
      errs.pendingAmount = 'Cannot be negative';
      toast.warn('Pending amount cannot be negative', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    if (companyData.revisedPayment && companyData.revisedPayment < 0) {
      errs.revisedPayment = 'Cannot be negative';
      toast.warn('Revised payment cannot be negative', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await axios.put(
        `http://localhost:8000/api/users/company-update/${id}`,
        companyData
      );
      toast.success('Company updated successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      // setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/superadminpanel');
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Update failed', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
      
      <SuperAdminNavbar />
      <div className="ec-container">
        <h2 className="ec-header">Edit Company Details</h2>
        <div className="ec-form-box">
          <form onSubmit={handleSubmit}>
            {/* Company Info */}
            <div className="ec-section-title">Company Information</div>
            <div className="ec-form-row">
              <div className="ec-form-group">
                <label>Company ID</label>
                <input
                  type="text"
                  name="companyId"
                  value={companyData.companyId}
                  readOnly
                  className="ec-input-field readonly"
                />
              </div>
              <div className="ec-form-group">
                <label>Company Name <span className="ec-required">*</span></label>
                <input
                  type="text"
                  name="companyName"
                  value={companyData.companyName}
                  onChange={handleChange}
                  className={`ec-input-field ${errors.companyName ? 'ec-error-field' : ''}`}
                />
                {errors.companyName && (
                  <div className="ec-error-message">{errors.companyName}</div>
                )}
              </div>
            </div>

            <div className="ec-form-row">
              <div className="ec-form-group">
                <label>Status</label>
                <select
                  name="companyStatus"
                  value={companyData.companyStatus}
                  onChange={handleChange}
                  className="ec-input-field"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Date & Payment */}
            <div className="ec-section-title">Dates & Payments</div>
            <div className="ec-form-row">
              <div className="ec-form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={companyData.startDate}
                  onChange={handleChange}
                  className="ec-input-field"
                />
              </div>
              <div className="ec-form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={companyData.endDate}
                  onChange={handleChange}
                  className="ec-input-field"
                />
              </div>
            </div>

            <div className="ec-form-row">
              <div className="ec-form-group">
                <label>Pending Amount (₹)</label>
                <input
                  type="number"
                  name="pendingAmount"
                  value={companyData.pendingAmount}
                  onChange={handleChange}
                  className={`ec-input-field ${errors.pendingAmount ? 'ec-error-field' : ''}`}
                  min="0"
                />
                {errors.pendingAmount && (
                  <div className="ec-error-message">{errors.pendingAmount}</div>
                )}
              </div>
              <div className="ec-form-group">
                <label>Revised Payment (₹)</label>
                <input
                  type="number"
                  name="revisedPayment"
                  value={companyData.revisedPayment}
                  onChange={handleChange}
                  className={`ec-input-field ${errors.revisedPayment ? 'ec-error-field' : ''}`}
                  min="0"
                />
                {errors.revisedPayment && (
                  <div className="ec-error-message">{errors.revisedPayment}</div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="ec-form-actions ec-sticky-footer">
              <button
                type="button"
                className="ec-btn ec-gray"
                onClick={() => navigate('/superadminpanel')}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ec-btn ec-blue"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Company'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="ec-success-modal-overlay">
          <div className="ec-success-modal">
            <h3>🎉 Company Updated!</h3>
            <p>Company details saved successfully.</p>
          </div>
        </div>
      )}
    </>
  );
};

export default EditCompanyPage;