import React, { useEffect, useRef, useState } from "react";
import "./SuperadminPanel.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPenAlt, FaTrash, FaFilter, FaChevronDown, FaChevronUp, FaFileExport } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import OverviewProfile from '../assets/profileicon.png';

const SuperadminPanel = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [pendingStatusFilter, setPendingStatusFilter] = useState("all");
  const [pendingNameFilter, setPendingNameFilter] = useState("");
  const [pendingEmailFilter, setPendingEmailFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSystemFilters, setShowSystemFilters] = useState(true);
  const [showFieldFilters, setShowFieldFilters] = useState(true);
  const [sortOption, setSortOption] = useState("status-active");
  const [userProfile, setUserProfile] = useState({
    profileImage: OverviewProfile,
    firstName: 'Admin',
    lastName: '',
    designation: 'Super Admin'
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const filterSidebarRef = useRef(null);
  const navigate = useNavigate();

  // Close filter sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterSidebarRef.current && !filterSidebarRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

  useEffect(() => {
    fetchCompanies();
    fetchUserProfile();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchTerm, companies, statusFilter, nameFilter, emailFilter, sortOption]);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/users/companies");
      setCompanies(res.data);
    } catch (err) {
      console.error("Error fetching companies:", err);
      alert("Failed to fetch company data.");
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      const userData = response.data;

      const resolvedImageUrl = userData.profileImage
        ? userData.profileImage.startsWith('http')
          ? userData.profileImage
          : `http://localhost:8000${userData.profileImage}`
        : OverviewProfile;

      setUserProfile({
        profileImage: resolvedImageUrl,
        firstName: userData.firstName || 'Admin',
        lastName: userData.lastName || '',
        designation: userData.designation || 'Super Admin'
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.response?.status === 401) {
        navigate('/');
      }
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      localStorage.removeItem('userToken');
      navigate('/');
    }, 400);
  };

  const handleSweetAlertLogout = () => {
    Swal.fire({
      title: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        handleLogout();
      }
    });
  };

  const sortCompanies = (companiesToSort) => {
    switch (sortOption) {
      case 'name-asc':
        return [...companiesToSort].sort((a, b) =>
          (a.companyName?.toLowerCase() || '').localeCompare(b.companyName?.toLowerCase() || '')
        );
      case 'name-desc':
        return [...companiesToSort].sort((a, b) =>
          (b.companyName?.toLowerCase() || '').localeCompare(a.companyName?.toLowerCase() || '')
        );
      case 'status-active':
        return [...companiesToSort].sort((a, b) => {
          const statusA = a.companyStatus?.toLowerCase() || "active";
          const statusB = b.companyStatus?.toLowerCase() || "active";
          if (statusA === "active" && statusB === "inactive") return -1;
          if (statusA === "inactive" && statusB === "active") return 1;
          return 0;
        });
      case 'status-inactive':
        return [...companiesToSort].sort((a, b) => {
          const statusA = a.companyStatus?.toLowerCase() || "active";
          const statusB = b.companyStatus?.toLowerCase() || "active";
          if (statusA === "inactive" && statusB === "active") return -1;
          if (statusA === "active" && statusB === "inactive") return 1;
          return 0;
        });
      default:
        return companiesToSort;
    }
  };

  const filterCompanies = () => {
    const term = searchTerm.toLowerCase();
    const filtered = companies
      .filter(company => {
        const matchesSearch =
          company.companyName?.toLowerCase().includes(term) ||
          company.companyId?.toLowerCase().includes(term);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && company.companyStatus !== "inactive") ||
          (statusFilter === "inactive" && company.companyStatus === "inactive");

        const matchesName =
          !nameFilter || company.companyName?.toLowerCase().includes(nameFilter.toLowerCase());

        const matchesEmail =
          !emailFilter || company.email?.toLowerCase().includes(emailFilter.toLowerCase());

        return matchesSearch && matchesStatus && matchesName && matchesEmail;
      });

    const sorted = sortCompanies(filtered);
    setFilteredCompanies(sorted);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const handleView = (company) => {
    navigate(`/company-view/${company._id}`, {
      state: {
        companyName: company.companyName,
        companyId: company.companyId,
      },
    });
  };

  const handleEdit = (companyId) => {
    navigate(`/edit-company/${companyId}`);
  };

  const handleDeleteCompany = async (companyId) => {
    Swal.fire({
      title: 'Are you sure you want to delete this company?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'red',
      cancelButtonColor: '#2196F3',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`http://localhost:8000/api/users/delete-company/${companyId}`);
          Swal.fire('Deleted!', response.data.message, 'success');
          await fetchCompanies();
        } catch (error) {
          console.error("Delete error:", error);
          Swal.fire('Error', error?.response?.data?.message || "Failed to delete company", 'error');
        }
      }
    });
  };

  const clearAllFilters = () => {
    setStatusFilter("all");
    setNameFilter("");
    setEmailFilter("");
    setSearchTerm("");
    setSortOption("status-active");
    setPendingStatusFilter("all");
    setPendingNameFilter("");
    setPendingEmailFilter("");
  };

  const exportToExcel = () => {
    Swal.fire({
      title: 'Export to Excel',
      text: `Are you sure you want to export records?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, export it!',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'exit-swal2-confirm-export',
        cancelButton: 'exit-swal2-cancel-export',
        actions: 'exit-swal2-actions'
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const exportData = filteredCompanies.map(company => ({
          "Company ID": company.companyId || '',
          "Company Name": company.companyName || '',
          "Company Status": company.companyStatus || 'active',
        }));

        if (exportData.length === 0) {
          Swal.fire('No Data', 'There is no data to export', 'info');
          return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Companies");
        XLSX.writeFile(wb, `Companies_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      }
    });
  };

  const activeCount = companies.filter(c => c.companyStatus !== "inactive").length;
  const inactiveCount = companies.filter(c => c.companyStatus === "inactive").length;

  return (
    <div className="superadmin-container">
      {isLoggingOut && (
        <div className="logout-overlay">
          <div className="spinner" />
          <div className="logout-text">Logging out...</div>
        </div>
      )}

      <div className="superadmin-navbar">
        <div className="navbar-brand">Manage Companies</div>
        <div className="navbar-right-section">
          <div className="sort-dropdown-container">
            <span className="search-by-label">Sort By:</span>
            <select className="sort-dropdown" value={sortOption} onChange={handleSortChange}>
              <option value="name-asc">Name ↑</option>
              <option value="name-desc">Name ↓</option>
              <option value="status-active">Active First</option>
              <option value="status-inactive">Inactive First</option>
            </select>
          </div>
          <FiLogOut
            className="superadmin-logout-btn"
            onClick={handleSweetAlertLogout}
            title="Logout"
          />
        </div>
      </div>

      <div className="superadmin-panel">
        <div className="superadmin-content-container">
          <div
            ref={filterSidebarRef}
            className={`superadmin-filter-sidebar ${showFilters ? 'visible' : ''}`}
          >
            <div className="filter-header">
              <h3>Filter Companies By</h3>
            </div>

            <div className="filter-section">
              <div className="filter-section-header" onClick={() => setShowSystemFilters(!showSystemFilters)}>
                <h4>System Defined Filters</h4>
                {showSystemFilters ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              {showSystemFilters && (
                <div className="filter-options">
                  <label>
                    <input
                      type="radio"
                      name="status"
                      checked={pendingStatusFilter === "all"}
                      onChange={() => setPendingStatusFilter("all")}
                    />{" "}
                    All
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="status"
                      checked={pendingStatusFilter === "active"}
                      onChange={() => setPendingStatusFilter("active")}
                    />{" "}
                    <span className="filter-options-status-active">Active ({activeCount})</span>
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="status"
                      checked={pendingStatusFilter === "inactive"}
                      onChange={() => setPendingStatusFilter("inactive")}
                    />{" "}
                    <span className="filter-options-status-inactive">Inactive ({inactiveCount})</span>
                  </label>
                </div>

              )}
            </div>

            <div className="filter-section">
              <div className="filter-section-header" onClick={() => setShowFieldFilters(!showFieldFilters)}>
                <h4>Filter by Fields</h4>
                {showFieldFilters ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              {showFieldFilters && (
                <div className="filter-field">
                  <label>Company Name</label>
                  <div className="search-input-container">
                    <input
                      type="text"
                      placeholder="Search By Name"
                      value={pendingNameFilter}
                      onChange={(e) => setPendingNameFilter(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="filter-actions">
              <button className="apply-filters-btn" onClick={() => {
                setStatusFilter(pendingStatusFilter);
                setNameFilter(pendingNameFilter);
                setEmailFilter(pendingEmailFilter);
                setShowFilters(false);
              }}>Apply Filters</button>
              <button className="clear-filters-btn" onClick={clearAllFilters}>Clear All</button>
            </div>
          </div>

          <div className="superadmin-main-content">
            <div className="superadmin-header">
              <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
                <FaFilter /> Filters
              </button>
              <button className="export-btn" onClick={exportToExcel}>
                <FaFileExport /> Export
              </button>
            </div>

            {/* <div className="superadmin-table-summary">
              Total Companies: {filteredCompanies.length}
            </div> */}
            <div className="superadmin-table-summary">
              <button className="total-companies-btn">
                 {filteredCompanies.length} Records Found
              </button>
            </div>

            <div className="superadmin-table-container">
              <div className="table-scroll-wrapper">
                <table className="superadmin-table">
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map((company) => (
                        <tr key={company._id}>
                          <td>{company.companyName}</td>
                          <td>
                            <span className={company.companyStatus === "inactive" ? "status-inactive" : "status-active"}>
                              {company.companyStatus === "inactive" ? "Inactive" : "Active"}

                            </span>
                          </td>
                          <td className="superadmin-actions">
                            <button className="superadmin-btn superadmin-btn-view" onClick={() => handleView(company)}>View</button>
                            <FaPenAlt className="superadmin-edit-icon" onClick={() => handleEdit(company.companyId)} />
                            <FaTrash className="superadmin-trash-icon" onClick={() => handleDeleteCompany(company.companyId)} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="superadmin-no-data">No companies found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminPanel;