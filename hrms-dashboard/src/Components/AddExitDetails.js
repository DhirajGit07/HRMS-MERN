import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './AddExitDetails.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AddExitDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userRole, setUserRole] = useState('');

  const [formData, setFormData] = useState({
    employeeId: '',
    candidateId: '',
    employeeEmail: '',
    separationDate: '',
    fullAndFinalSettlement: '',
    reasonForLeaving: '',
    rejoinOrganization: '',
    likedMost: '',
    improveStaffWelfare: '',
    additionalComments: '',
    checklist: {
      companyVehicle: '',
      equipments: '',
      libraryBooks: '',
      security: '',
      exitInterview: '',
      noticePeriod: '',
      resignationLetter: '',
      managerClearance: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('/api/users/profile');
        const profileData = response.data;

        setUserRole(profileData.role || '');

        let employeeId = profileData.employeeId || '';
        let candidateId = profileData.candidateId || '';

        try {
          // Fetch employee list to get employee ID and candidate ID
          const { data: employees } = await axios.get('/api/users');
          const match = employees.find(e =>
            e.email?.toLowerCase() === profileData.email?.toLowerCase()
          );

          if (match) {
            if (match.employeeId?.trim() && match.employeeId.trim() !== 'N/A') {
              employeeId = match.employeeId.trim();
            }
            // If candidateId is not in profile, try to get it from employee data
            if (!candidateId || candidateId === 'N/A') {
              candidateId = match.candidateId || '';
            }
          }
        } catch (empErr) {
          console.error('Error fetching employees:', empErr);
        }

        setUserEmail(profileData.email);
        setFormData(prev => ({
          ...prev,
          employeeId: employeeId,
          candidateId: candidateId,
          employeeEmail: profileData.email || ''
        }));
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      const fetchExitDetail = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`/api/exitdetails/${id}`);
          setFormData(response.data);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching exit detail:', error);
          setError('Failed to load exit detail');
          setLoading(false);
        }
      };
      fetchExitDetail();
    }
  }, [id]);

  // ✅ Automatically calculate Full and Final Settlement date (+45 days)
  useEffect(() => {
    if (formData.separationDate) {
      const sepDate = new Date(formData.separationDate);
      const finalDate = new Date(sepDate.setDate(sepDate.getDate() + 45));
      const formattedDate = finalDate.toISOString().split('T')[0];

      setFormData(prev => ({
        ...prev,
        fullAndFinalSettlement: formattedDate
      }));
    }
  }, [formData.separationDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in formData.checklist) {
      setFormData((prev) => ({
        ...prev,
        checklist: {
          ...prev.checklist,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEditMode
        ? `/api/exitdetails/${id}`
        : '/api/exitdetails';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await axios({
        method,
        url,
        data: formData
      });

      // Enhanced success toast with different messages for edit/create
      toast.success(
        isEditMode
          ? 'Exit details updated successfully! ✅'
          : 'New exit details created successfully! 🎉',
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-success',
        }
      );

      // Navigate after toast is shown
      setTimeout(() => navigate('/exitdetails'), 1500);
    } catch (error) {
      console.error('Error saving exit detail:', error);
      const errorMessage = error.response?.data?.message ||
        `Failed to ${isEditMode ? 'update' : 'create'} exit detail. Please try again.`;

      // Enhanced error toast with different messages
      toast.error(
        isEditMode
          ? `Update failed: ${errorMessage} ❌`
          : `Creation failed: ${errorMessage} ❌`,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-error',
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/exitdetails');
  };

  if (loadingProfile) return <div className="aed-loading">Loading user profile...</div>;
  if (loading && isEditMode) return <div className="aed-loading">Loading exit details...</div>;

  return (
    <div className="aed-container">
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
        toastClassName="custom-toast"
        progressClassName="custom-toast-progress"
      />
      <div className="aed-header">
        <h2>{isEditMode ? 'Edit Exit Details' : 'Add New Exit Details'}</h2>
      </div>

      {error && <div className="aed-error-message">{error}</div>}

      <div className="aed-form-box">
        <h3 className="aed-section-title" onClick={() => navigate('/employee')}
        >Separation</h3>

        <div className="aed-form-row">
          {userRole === 'admin' && (
            <div className="aed-form-group">
              <label>System ID <span className="aed-required">*</span></label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                className="aed-input-field"
                required
                disabled={loading || isEditMode}
              />
            </div>
          )}
          <div className="aed-form-group">
            <label>Candidate ID <span className="aed-required">*</span></label>
            <input
              type="text"
              name="candidateId"
              value={formData.candidateId}
              onChange={handleChange}
              className="aed-input-field"
              required
              disabled={true}
            />
          </div>

        </div>

        <div className="aed-form-row">
          <div className="aed-form-group">
            <label>Employee Email</label>
            <input
              type="text"
              value={userEmail}
              className="aed-input-field"
              disabled
            />
          </div>
          <div className="aed-form-group">
            <label>Separation date [Last Working Date] <span className="aed-required">*</span></label>
            <input
              type="date"
              name="separationDate"
              value={formData.separationDate}
              onChange={handleChange}
              className="aed-input-field"
              required
              disabled={loading}
            />
          </div>

        </div>

        <div className="aed-form-row">
          <div className="aed-form-group">
            <label>Full and Final Settlement <span className="aed-required">*</span></label>
            <input
              type="date"
              name="fullAndFinalSettlement"
              value={formData.fullAndFinalSettlement}
              onChange={handleChange}
              className="aed-input-field"
              required
              disabled
            />
          </div>
          <div className="aed-form-group">
            <label>Reason for leaving</label>
            <select
              name="reasonForLeaving"
              value={formData.reasonForLeaving}
              onChange={handleChange}
              className="aed-input-field"
              disabled={loading}
            >
              <option value="">Select</option>
              <option value="Personal">Personal</option>
              <option value="Better Opportunity">Better Opportunity</option>
              <option value="Career Change">Career Change</option>
              <option value="Relocation">Relocation</option>
              <option value="Health Reasons">Health Reasons</option>
            </select>
          </div>
        </div>

        <h3 className="aed-section-title">Questionnaire</h3>

        <div className="aed-form-row">
          <div className="aed-form-group">
            <label>Working for this organization again</label>
            <select
              name="rejoinOrganization"
              value={formData.rejoinOrganization}
              onChange={handleChange}
              className="aed-input-field"
              disabled={loading}
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Maybe">Maybe</option>
            </select>
          </div>

          <div className="aed-form-group">
            <label>What did you like the most of the organization</label>
            <textarea
              name="likedMost"
              value={formData.likedMost}
              onChange={handleChange}
              className="aed-input-field"
              disabled={loading}
              placeholder="Enter what you liked most"
            ></textarea>
          </div>
        </div>

        <div className="aed-form-row">
          <div className="aed-form-group">
            <label>Think the organization do to improve staff welfare</label>
            <textarea
              name="improveStaffWelfare"
              value={formData.improveStaffWelfare}
              onChange={handleChange}
              className="aed-input-field"
              disabled={loading}
              placeholder="Your suggestions for improvement"
              rows="3"
            ></textarea>
          </div>
          <div className="aed-form-group">
            <label>Anything you wish to share with us</label>
            <textarea
              name="additionalComments"
              value={formData.additionalComments}
              onChange={handleChange}
              className="aed-input-field"
              disabled={loading}
              placeholder="Additional comments or feedback"
              rows="3"
            ></textarea>
          </div>
        </div>

        <h3 className="aed-section-title">Checklist for Exit Interview</h3>

        <div className="aed-form-row">
          <div className="aed-form-group">
            <label>Company Vehicle handed in</label>
            <input
              type="text"
              name="companyVehicle"
              value={formData.checklist.companyVehicle}
              onChange={handleChange}
              className="aed-input-field"
              disabled={loading}
            />
          </div>
          <div className="aed-form-group">
            <label>All equipments handed in</label>
            <input
              type="text"
              name="equipments"
              value={formData.checklist.equipments}
              onChange={handleChange}
              className="aed-input-field"
              disabled={loading}
            />
          </div>
        </div>

        <div className="aed-form-row">
          <div className="aed-form-group">
            <label>All library books submitted</label>
            <input
              type="text"
              name="libraryBooks"
              value={formData.checklist.libraryBooks}
              onChange={handleChange}
              className="aed-input-field"
              disabled={loading}
            />
          </div>
          <div className="aed-form-group">
            <label>Security</label>
            <input
              type="text"
              name="security"
              value={formData.checklist.security}
              onChange={handleChange}
              className="aed-input-field"
              disabled={loading}
            />
          </div>
        </div>

        <div className="aed-form-row">
          <div className="aed-form-group">
            <label>Exit interview conducted</label>
            <input
              type="text"
              name="exitInterview"
              value={formData.checklist.exitInterview}
              onChange={handleChange}
              className="aed-input-field"
              disabled={loading}
            />
          </div>
          <div className="aed-form-group">
            <label>Notice period followed</label>
            <input
              type="text"
              name="noticePeriod"
              value={formData.checklist.noticePeriod}
              onChange={handleChange}
              className="aed-input-field"
              disabled={loading}
            />
          </div>
        </div>

        <div className="aed-form-row">
          <div className="aed-form-group">
            <label>Resignation letter submitted</label>
            <input
              type="text"
              name="resignationLetter"
              value={formData.checklist.resignationLetter}
              onChange={handleChange}
              className="aed-input-field"
              disabled={loading}
            />
          </div>
          <div className="aed-form-group">
            <label>Manager/Supervisor clearance</label>
            <input
              type="text"
              name="managerClearance"
              value={formData.checklist.managerClearance}
              onChange={handleChange}
              className="aed-input-field"
              disabled={loading}
            />
          </div>
        </div>
        <div className="aed-form-actions aed-sticky-footer">
          <button
            type="button"
            className="aed-btn aed-blue"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Processing...' : isEditMode ? 'Update' : 'Submit'}
          </button>
          <button
            type="button"
            className="aed-btn aed-gray"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExitDetails;