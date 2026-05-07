import React, { useEffect, useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { FiDownload } from 'react-icons/fi';
import { FaPlus } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import axios from "axios";
import OnboardingNavbar from "../pages/OnboardingNavbar";
import warningIcon from "../assets/warning-icon.png";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import "./Onboarding.css";

const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

function Onboarding({ onLogout }) {
  const [candidates, setCandidates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [userRole, setUserRole] = useState("Employee");
  const [userEmail, setUserEmail] = useState("");
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const navigate = useNavigate();

  console.log(candidates);
  

  // Load profile and employees
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const profileRes = await axios.get('http://localhost:8000/api/users/profile');
        setCompanyName(profileRes.data.companyName || '');
        setCompanyId(profileRes.data.companyId || '');

        const userRes = await axios.get('http://localhost:8000/api/users');
        setEmployees(userRes.data);

        const storedUser = localStorage.getItem("userData");
        if (storedUser) {
          const { role, email } = JSON.parse(storedUser);
          setUserRole(role || "Employee");
          setUserEmail(email || "");
        }
      } catch (err) {
        console.error('Initial Load Error:', err.response || err);
        setError(err.response?.data?.message || 'Failed to load data');
      }
    };

    fetchInitialData();
  }, []);

  // Fetch candidates after employees loaded
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        let url = "http://localhost:8000/api/candidates";
        if (userRole !== "Admin") url += `?email=${userEmail}`;

        const res = await axios.get(url);

        const mapped = res.data
          .map(candidate => {
            const emp = employees.find(e =>
              e.email?.toLowerCase() === candidate.email?.toLowerCase() &&
              e.companyId === companyId
            );
            if (!emp) return null;

            return {
              ...candidate,
              empId: emp.employeeId || "",
              canId: emp.candidateId || "",
              uanNumber: emp.uanNO ? emp.uanNO : "N/A",  // ✅ Fetch UAN from employee or default N/A
              offerLetterReceived: candidate.offerLetterReceived ? "Yes" : "No"
            };
          })
          .filter(Boolean);
        setCandidates(mapped);
      } catch (err) {
        console.error("Candidate fetch error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to fetch candidates.");
      } finally {
        setLoading(false);
      }
    };

    if (employees.length > 0 && companyId) fetchCandidates();
  }, [employees, userRole, userEmail, companyId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".action-cell")) setOpenMenuIndex(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEdit = (candidate) => {
    navigate('/onboarding-form', { state: { candidate } });
    setOpenMenuIndex(null);
  };

  const handleDeleteConfirmed = async (index) => {
    const id = filteredCandidates[index]._id;
    try {
      await axios.delete(`http://localhost:8000/api/candidates/${id}`);
      setCandidates(prev => prev.filter(c => c._id !== id));
      toast.success('Candidate deleted successfully!', { position: "top-right", autoClose: 3000 });
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error(err.response?.data?.message || 'Failed to delete candidate', { position: "top-right", autoClose: 3000 });
    } finally {
      setConfirmDeleteIndex(null);
    }
  };

  const toggleMenu = (index, e) => {
    e.stopPropagation();
    setOpenMenuIndex(prev => (prev === index ? null : index));
  };

  const filteredCandidates = candidates.filter(candidate => {
    if (userRole !== "Admin" && candidate.email !== userEmail) return false;
    if (searchTerm) {
      return Object.values(candidate).join(" ").toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const handleLogout = () => {
    localStorage.clear();
    onLogout();
  };

  const truncateText = (text, maxLength = 15) =>
    text?.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

  const handleExportToExcel = () => {
    Swal.fire({
      title: 'Export Candidate Data',
      html: `You are about to export candidate records to Excel.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, export it!',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        try {
          const dataToExport = filteredCandidates.map(c => ({
            'Employee ID': c.empId || '-',
            'First Name': c.firstName || '-',
            'Last Name': c.lastName || '-',
            'Email': c.email || '-',
            'Mobile': c.mobile || '-',
            'Status': c.status || '-',
            'Role': c.department || '-',
            'Hiring Source': c.sourceOfHire || '-',
            'PAN Card': c.panCard || '-',
            'Aadhaar Card': c.aadhaarCard || '-',
            'UAN Number': c.uanNumber || 'N/A',
            'Created At': c.createdAt ? new Date(c.createdAt).toLocaleString() : '-',
            'Last Updated': c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '-'
          }));

          const ws = XLSX.utils.json_to_sheet(dataToExport);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Candidates");

          const filename = `Candidates_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
          XLSX.writeFile(wb, filename);
          return true;
        } catch (err) {
          Swal.showValidationMessage(`Export failed: ${err.message}`);
          return false;
        }
      }
    }).then(result => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Export Successful!', text: 'Candidate data has been exported.', icon: 'success', timer: 2000, showConfirmButton: false });
      }
    });
  };

  return (
    <div className="app-layout">
      <main className="main-content">
        <OnboardingNavbar onLogout={handleLogout} />
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="view-controls">
          <div className="view-dropdown-wrapper"><header className="header"></header></div>
          <div className="header-right">
            <div className="search-container">
              {userRole === "Admin" && (
                <input
                  className="search-box"
                  type="text"
                  placeholder="🔍 Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              )}
            </div>
            <Link to="/onboarding-form" className="onboarding-add-btn">
              <FaPlus style={{ marginRight: '-2px' }} /> New Onboarding
            </Link>
            {userRole === "Admin" && (
              <button className="export-excel-btn" onClick={handleExportToExcel}>
                <FiDownload style={{ marginRight: '2px' }} /> Export
              </button>
            )}
          </div>
        </div>

        <div className="table-container">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  {userRole === "Admin" &&  <th>System ID</th>}
                  <th>Candidate ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email Address</th>
                  <th>Mobile Number</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Hiring Source</th>
                  <th>Offer Letter</th>
                  <th>PAN</th>
                  <th>Aadhaar</th>
                  <th>UAN</th>
                  {userRole === "Admin" && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={userRole === "Admin" ? 13 : 12}>Loading...</td></tr>
                ) : error ? (
                  <tr><td colSpan={userRole === "Admin" ? 13 : 12}>{error}</td></tr>
                ) : filteredCandidates.length > 0 ? (
                  filteredCandidates.map((c, i) => (
                    <tr key={c._id} >
                        {userRole === "Admin" && (<td style={{borderRight:"1px solid #e0e0e0", borderBottom:"1px solid #e0e0e0"}}>{c.empId}</td>)}
        
                      <td style={{borderRight:"1px solid #e0e0e0", borderBottom:"1px solid #e0e0e0"}}>{c.canId}</td>
                      <td style={{borderRight:"1px solid #e0e0e0", borderBottom:"1px solid #e0e0e0"}}>{truncateText(c.firstName)}</td>
                      <td style={{borderRight:"1px solid #e0e0e0", borderBottom:"1px solid #e0e0e0"}}>{truncateText(c.lastName)}</td>
                      <td style={{borderRight:"1px solid #e0e0e0", borderBottom:"1px solid #e0e0e0"}} title={c.email}>{truncateText(c.email, 10)}</td>
                      <td style={{borderRight:"1px solid #e0e0e0", borderBottom:"1px solid #e0e0e0"}}>{c.mobile}</td>
                      <td style={{borderRight:"1px solid #e0e0e0", borderBottom:"1px solid #e0e0e0"}} className={`status ${c.status?.replace(" ", "-").toLowerCase()}`}>{c.status}</td>
                      <td style={{borderRight:"1px solid #e0e0e0", borderBottom:"1px solid #e0e0e0"}}>{truncateText(c.department)}</td>
                      <td style={{borderRight:"1px solid #e0e0e0", borderBottom:"1px solid #e0e0e0"}}>{truncateText(c.sourceOfHire)}</td>
                      <td style={{borderRight:"1px solid #e0e0e0", borderBottom:"1px solid #e0e0e0"}}>{c.offerLetterReceived}</td>
                      <td style={{borderRight:"1px solid #e0e0e0", borderBottom:"1px solid #e0e0e0"}}>{truncateText(c.panCard)}</td>
                      <td style={{borderRight:"1px solid #e0e0e0", borderBottom:"1px solid #e0e0e0"}}>{truncateText(c.aadhaarCard)}</td>
                      <td style={{borderRight:"1px solid #e0e0e0", borderBottom:"1px solid #e0e0e0"}}>{c.uanNumber}</td> {/* ✅ Now shows UAN or N/A */}
                      {userRole === "Admin" && (
                        <td className="action-cell" style={{borderRight:"1px solid #e0e0e0", borderBottom:"1px solid #e0e0e0"}}>

                          <button className="action-dot" onClick={(e) => toggleMenu(i, e)}>
                            <BsThreeDots />
                          </button>
                          {openMenuIndex === i && (
                            <div className="dropdown-menu-dot">
                              <div className="Edit-blue" onClick={() => handleEdit(c)}>Edit</div>
                              <div className="delete-red" onClick={() => setConfirmDeleteIndex(i)}>Delete</div>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={userRole === "Admin" ? 13 : 12}>No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="footer">
            <span>Total Record: <span className="blue-link">{filteredCandidates.length}</span></span>
            <div className="pagination">
              <select><option>10</option><option>20</option><option>30</option><option>50</option></select>
              <span>{'<'}</span><span>1</span><span>{'>'}</span>
            </div>
          </div>
        </div>
      </main>

      {confirmDeleteIndex !== null && (
        <div className="onboarding-modal-overlay">
          <div className="onboarding-modal-content">
            <img src={warningIcon} alt="warning" className="onboarding-warning-icon" />
            <h3>DELETE CANDIDATE</h3>
            <p>Are you sure you want to delete this candidate?</p>
            <div className="onboarding-modal-actions">
              <button className="onboarding-cancel-btn" onClick={() => setConfirmDeleteIndex(null)}>Cancel</button>
              <button className="onboarding-confirm-btn" onClick={() => handleDeleteConfirmed(confirmDeleteIndex)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Onboarding;
