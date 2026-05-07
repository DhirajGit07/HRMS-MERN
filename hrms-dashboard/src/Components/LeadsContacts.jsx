
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import './LeadsContacts.css';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { FiDownload } from 'react-icons/fi';
import { FaFilter } from "react-icons/fa";
import LeadNavbar from '../pages/LeadNavbar'; // Assuming you have a LeadNavbar component


export default function LeadsContacts() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [isDateRangePickerOpen, setIsDateRangePickerOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [selectedFilterType, setSelectedFilterType] = useState('All');
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [isBulkActionDropdownOpen, setIsBulkActionDropdownOpen] = useState(false);

  // NEW STATE VARIABLES FOR SIDEBAR FILTERS
  const [selectedDateFilterOn, setSelectedDateFilterOn] = useState('Created');
  const [selectedLeadSource, setSelectedLeadSource] = useState('All');
  const [selectedLeadOwner, setSelectedLeadOwner] = useState('All');
  const [selectedAddedBy, setSelectedAddedBy] = useState('All');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/leads');
        const formatted = res.data.map((lead, index) => ({
          id: lead._id, // IMPORTANT: Use lead._id from the database for unique identification
          contactName: `${lead.salutation || ''} ${lead.name}`.trim(),
          email: lead.email,
          leadOwner: lead.leadOwner,
          ownerRole: lead.leadOwner.includes('Abhijeet') ? 'Software Developer' : 'Sales Manager',
          addedBy: lead.dealWatcher?.split(' (')[0] || '',
          addedByRole: lead.dealWatcher?.includes('Emily') ? 'Team Lead' : 'Director & CEO',
          created: lead.createdAt?.slice(0, 10) || '—',
          company: lead.company,
          phone: lead.phone,
          leadSource: lead.leadSource,
          industry: lead.industry,
          leadStatus: lead.leadStatus,
          address: lead.address,
          description: lead.description,
        }));
        setLeads(formatted);
      } catch (err) {
        console.error('Error fetching leads:', err);
      }
    };

    fetchLeads();
  }, []);

  const displayedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return leads.slice(startIndex, endIndex);
  }, [leads, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(leads.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage + 1;
  const endIndex = Math.min(startIndex + entriesPerPage - 1, leads.length);

  const toggleMenu = (id) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const handleAddLeadClick = () => {
    window.location.href = '/leadform';
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const toggleFilterSidebar = () => setIsFilterSidebarOpen(!isFilterSidebarOpen);
  const closeFilterSidebar = () => setIsFilterSidebarOpen(false);
  const toggleDateRangePicker = () => setIsDateRangePickerOpen((prev) => !prev);

  const handleDateRangeSelect = (range) => {
    setSelectedDateRange(range);
    setIsDateRangePickerOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedDateRange('');
    setSelectedFilterType('All');
  };

  // NEW FUNCTION TO CLEAR SIDEBAR FILTERS
  const handleClearSidebarFilters = () => {
    setSelectedDateFilterOn('Created'); // Reset to default option
    setSelectedLeadSource('All');
    setSelectedLeadOwner('All');
    setSelectedAddedBy('All');
    // You might want to close the sidebar after clearing, or keep it open for user convenience
    // closeFilterSidebar();
  };

  const handleViewLead = (leadId) => {
    navigate(`/leads/${leadId}`);
  };

  const handleChangeToClient = (leadId) => {
    console.log('Changing lead to client:', leadId);
  };

  const handleEntriesPerPageChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleExportToExcel = () => {
    Swal.fire({
      title: 'Export Data',
      text: 'Are you sure you want to export leads to Excel?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, export it!',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'leads-swal2-confirm-export',
        cancelButton: 'leads-swal2-cancel-export',
        actions: 'leads-swal2-actions'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const dataToExport = leads.map(lead => {
          return {
            'Contact Name': lead.contactName || '-',
            'Email': lead.email || '-',
            'Lead Owner': lead.leadOwner || '-',
            'Owner Role': lead.ownerRole || '-',
            'Added By': lead.addedBy || '-',
            'Added By Role': lead.addedByRole || '-',
            'Created Date': lead.created || '-'
          };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'LeadsRecords');
        const fileName = `Leads_Records_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);

        Swal.fire(
          'Exported!',
          'Your leads records have been exported to Excel.',
          'success'
        );
      }
    });
  };

  const handleSelectAllLeads = (e) => {
    if (e.target.checked) {
      const allDisplayedLeadIds = displayedLeads.map(lead => lead.id);
      setSelectedLeadIds(allDisplayedLeadIds);
    } else {
      setSelectedLeadIds([]);
    }
    setIsBulkActionDropdownOpen(false); // Close dropdown on select all/none
  };

  const handleSelectLead = (id) => {
    setSelectedLeadIds((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((leadId) => leadId !== id)
        : [...prevSelected, id]
    );
    setIsBulkActionDropdownOpen(false); // Close dropdown on individual select/deselect
  };

  const toggleBulkActionDropdown = () => {
    setIsBulkActionDropdownOpen(prev => !prev);
  };

  const handleDeleteSelectedLeads = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete them!',
      customClass: {
        confirmButton: 'leads-swal2-confirm-export', // Reusing styles from export for consistency
        cancelButton: 'leads-swal2-cancel-export',
        actions: 'leads-swal2-actions'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setLeads(prevLeads => prevLeads.filter(lead => !selectedLeadIds.includes(lead.id)));
        setSelectedLeadIds([]); // Clear selected IDs after deletion
        Swal.fire(
          'Deleted!',
          'Your selected leads have been deleted.',
          'success'
        );
      }
      setIsBulkActionDropdownOpen(false); // Close dropdown after action
    });
  };

  const isAllDisplayedLeadsSelected =
    displayedLeads.length > 0 && selectedLeadIds.length === displayedLeads.length;

  return (
    <div>
      <LeadNavbar />
    
    <div className="leads-container">
      {/* Top Filters */}
      <div className="top-bar">
        <div className="filters">
          <div className="date-range-filter-container">
            <input
              type="text"
              placeholder="Start Date To End Date"
              className="filter-input"
              readOnly
              value={selectedDateRange}
              onClick={toggleDateRangePicker}
            />
            {isDateRangePickerOpen && (
              <div className="date-range-dropdown">
                {['Today', 'Last 30 Days', 'This Month', 'Last Month', 'Last 90 Days', 'Last 6 Months', 'Last 1 Year', 'Custom Range'].map((range) => (
                  <div key={range} className="date-range-option" onClick={() => handleDateRangeSelect(range)}>
                    {range}
                  </div>
                ))}
              </div>
            )}
          </div>
          <select
            className="filter-select"
            value={selectedFilterType}
            onChange={(e) => setSelectedFilterType(e.target.value)}
          >
            <option>All</option>
            <option>Contacts</option>
            <option>Leads</option>
          </select>
          <div className="search-group">
            {/* Removed redundant 🔍 from placeholder as it's now an icon */}
            <input type="text" placeholder="Start typing to search" className="search-input" />
            <span className="search-icon">🔍</span>
          </div>
          {(selectedDateRange || selectedFilterType !== 'All') && (
            <button className="clear-btn" onClick={handleClearFilters}>Clear</button>
          )}
        </div>
        <div className="filter-icon" onClick={toggleFilterSidebar}>
          <span className="filter-icon-arrow"></span> <FaFilter />
          Filters
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-bar">
        <button className="add-btn" onClick={handleAddLeadClick}>
          <span className="plus-icon">+</span> Add Lead Contact
        </button>
        <button className="export-btn" onClick={handleExportToExcel}>
          <FiDownload style={{ marginRight: '4px', fontSize: '16px' }} />
          Export
        </button>

        {/* Conditionally rendered buttons for bulk actions */}
        {selectedLeadIds.length > 0 && (
          <>
            <div className="bulk-action-container">
              <button className="no-action-btn" onClick={toggleBulkActionDropdown}>
                No Action <span className="dropdown-arrow">▼</span>
              </button>
              {isBulkActionDropdownOpen && (
                <div className="bulk-action-dropdown-menu">
                  <button onClick={handleDeleteSelectedLeads}>Delete</button>
                  {/* Add more bulk action options here */}
                </div>
              )}
            </div>
            <button className="Leads-apply-btn">Apply</button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="lead-table">
          <thead className="table-header-Leads">
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isAllDisplayedLeadsSelected}
                  onChange={handleSelectAllLeads}
                />
              </th>
              <th>Contact Name</th>
              <th>Email</th>
              <th>Lead Owner</th>
              <th>Added By</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedLeads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.includes(lead.id)}
                    onChange={() => handleSelectLead(lead.id)}
                  />
                </td>
                <td><strong>{lead.contactName}</strong></td>
                <td>{lead.email}</td>
                <td>
                  <div className="owner-cell">
                    <div className="avatar-circle">👤</div>
                    <div>
                      <div className="owner-name">{lead.leadOwner}</div>
                      <div className="owner-role">{lead.ownerRole}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="added-by">
                    <div
                      className="avatar-circle with-image"
                      style={{
                        backgroundImage: `url("https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(lead.addedBy)}")`,
                      }}
                    />
                    <div>
                      <div className="added-name">{lead.addedBy}</div>
                      <div className="added-role">{lead.addedByRole}</div>
                    </div>
                  </div>
                </td>
                <td>{lead.created}</td>
                <td className="action-td">
                  <button className="action-menu" onClick={() => toggleMenu(lead.id)}>⋮</button>
                  {openMenuId === lead.id && (
                    <div className="dropdown-menu">
                      <button onClick={() => handleViewLead(lead.id)}>View</button>
                      <button onClick={() => handleChangeToClient(lead.id)}>Change To Client</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-footer">
        <div className="entries">
          Show
          <select value={entriesPerPage} onChange={handleEntriesPerPageChange}>
            {[5, 10, 25, 50, 100].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
          entries
        </div>
        <div className="pagination">
          <span>Showing {startIndex} to {endIndex} of {leads.length} entries</span>
          <button onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => setCurrentPage(index + 1)}
              className={currentPage === index + 1 ? 'active' : ''}
            >
              {index + 1}
            </button>
          ))}
          <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
        </div>
      </div>

      {/* Filter Sidebar */}
      <div className={`filter-sidebar-overlay ${isFilterSidebarOpen ? 'open' : ''}`} onClick={closeFilterSidebar}></div>
      <div className={`filter-sidebar ${isFilterSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Filters</h3>
          <button className="close-sidebar-btn" onClick={closeFilterSidebar}>&times;</button>
        </div>
        <div className="sidebar-content">
          <div className="filter-group">
            <label>Date Filter On</label>
            <select
              value={selectedDateFilterOn}
              onChange={(e) => setSelectedDateFilterOn(e.target.value)}
            >
              <option>Created</option>
              <option>Last Modified</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Lead Source</label>
            <select
              value={selectedLeadSource}
              onChange={(e) => setSelectedLeadSource(e.target.value)}
            >
              <option>All</option>
              <option>Email</option>
              <option>Google</option>
              <option>Website</option>
              <option>Referral</option>
              <option>Linkdin</option>
              <option>Friend</option>
              <option>Tv</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Lead Owner</label>
            <select
              value={selectedLeadOwner}
              onChange={(e) => setSelectedLeadOwner(e.target.value)}
            >
              <option>All</option>
              <option>Mr Abhijeet Dorge</option>
              <option>Ms. Emily White</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Added By</label>
            <select
              value={selectedAddedBy}
              onChange={(e) => setSelectedAddedBy(e.target.value)}
            >
              <option>All</option>
              <option>Mr Charul Jagtap</option>
              <option>Mr. David Green</option>
            </select>
          </div>
        </div>
        <div className="sidebar-footer">
          <button className="clear-sidebar-btn" onClick={handleClearSidebarFilters}>Clear</button>
          {/* You might also want an "Apply" button here to apply the filters */}
        </div>
      </div>
    </div>
    </div>
  );
}