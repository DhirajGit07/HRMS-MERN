import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './AddLeaveType.css';
import { MdDelete } from "react-icons/md";
import { CiEdit } from "react-icons/ci";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AddLeaveType({ openEditLeaveType, setOpenEditLeaveType }) {
  const [committedValues, setCommittedValues] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [companyId, setCompanyId] = useState('');
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      const userData = response.data;
      const extractedCompanyId = userData.companyId ? userData.companyId.split('-')[0] : '';
      setCompanyId(extractedCompanyId);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setCompanyId('');
      toast.error('Failed to fetch user profile.', {
        position: "top-right",
        autoClose: 3000,
      });
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
  ].map((name, index) => ({
    id: `default-${index}`,
    name,
    order: index,
    companyId: null
  }));

  // Fetch leave types from backend, filtered by companyId or no companyId
  const fetchLeaveTypes = async () => {
    try {
      const response = await axios.get('/api/leave-types-Add-Edit');
      const fetchedLeaveTypes = response.data.map(item => ({
        id: item._id,
        name: item.name,
        order: item.order,
        companyId: item.companyId || null
      }));
      
      // Filter leave types: include those with matching companyId or no companyId
      const filteredLeaveTypes = fetchedLeaveTypes.filter(
        item => item.companyId === companyId || item.companyId === null
      );

      // If no leave types match or companyId is empty, use default leave types
      if (filteredLeaveTypes.length === 0 || !companyId) {
        setCommittedValues(defaultLeaveTypes);
      } else {
        setCommittedValues(filteredLeaveTypes);
      }
    } catch (error) {
      const errorMessage = error.response
        ? `HTTP ${error.response.status}: ${error.response.data.error || JSON.stringify(error.response.data)}`
        : error.message;
      console.error('Error fetching leave types:', error);
      toast.error(`Failed to fetch leave types: ${errorMessage}`, {
        position: "top-right",
        autoClose: 3000,
      });
      setCommittedValues(defaultLeaveTypes); // Fallback to default leave types on error
    }
  };

  // Sequence fetchUserProfile and fetchLeaveTypes
  useEffect(() => {
    const loadData = async () => {
      await fetchUserProfile();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (companyId || companyId === '') {
      fetchLeaveTypes();
    }
  }, [companyId]);

  // Function to capitalize the first letter of each word
  const capitalizeWords = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Combine committed values with the current input for display
  const displayValues = inputValue.trim() && !editingId
    ? [...committedValues, { id: 'temp', name: capitalizeWords(inputValue), order: committedValues.length, companyId: companyId || null }]
    : committedValues;

  // Handle adding or updating a leave type
  const handleAddOrUpdate = async () => {
    // if (!inputValue || typeof inputValue !== 'string' || !inputValue.trim()) {
    //   console.warn('Invalid inputValue:', inputValue); // Debug log
    //   toast.error('Please enter a valid leave type name.', {
    //     position: "top-right",
    //     autoClose: 3000,
    //   });
    //   return;
    // }

    const capitalizedName = capitalizeWords(inputValue);
    try {
      if (editingId) {
        // Update existing leave type
        const updateData = { name: capitalizedName };
        if (companyId) {
          updateData.companyId = companyId;
        }
        const response = await axios.put(`/api/leave-types-Add-Edit/${editingId}`, updateData);
        setCommittedValues(
          committedValues.map(item =>
            item.id === editingId ? { ...item, name: response.data.name, companyId: response.data.companyId } : item
          )
        );
        toast.success(`Leave type "${capitalizedName}" updated successfully!`, {
          position: "top-right",
          autoClose: 3000,
        });
        setEditingId(null);
      } else {
        // Add new leave type
        const postData = { name: capitalizedName };
        if (companyId) {
          postData.companyId = companyId;
        }
        const response = await axios.post('/api/leave-types-Add-Edit', postData);
        setCommittedValues([
          ...committedValues,
          {
            id: response.data._id,
            name: response.data.name,
            order: response.data.order,
            companyId: response.data.companyId
          }
        ]);
        toast.success(`Leave type "${capitalizedName}" added successfully!`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
      setInputValue('');
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.error || JSON.stringify(error.response.data)
        : error.message;
      console.error('Error in handleAddOrUpdate:', error); // Debug log
      // toast.error(`Error: ${errorMessage}`, {
      //   position: "top-right",
      //   autoClose: 3000,
      // });
    }
  };

  // Handle blur (add/update on input blur)
  const handleBlur = () => {
    handleAddOrUpdate();
  };

  // Handle edit button click
  const handleEdit = (id, name) => {
    setInputValue(name || '');
    setEditingId(id);
    toast.info(`Editing leave type "${name}"`, {
      position: "top-right",
      autoClose: 3000,
    });
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    // Prevent deletion of default leave types
    if (id.startsWith('default-')) {
      toast.error('Default leave types cannot be deleted.', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    try {
      await axios.delete(`/api/leave-types-Add-Edit/${id}`);
      const deletedLeaveType = committedValues.find(item => item.id === id);
      setCommittedValues(committedValues.filter(item => item.id !== id));
      toast.success(`Leave type "${deletedLeaveType.name}" deleted successfully!`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.error || JSON.stringify(error.response.data)
        : error.message;
      toast.error(`Error: ${errorMessage}`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Handle drag-and-drop sorting
  const handleSort = async () => {
    const _values = [...committedValues];
    const draggedItemContent = _values[dragItem.current];
    const newOrder = dragOverItem.current;
    _values.splice(dragItem.current, 1);
    _values.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setCommittedValues(_values);
  };

  // Handle Done button click
  const handleDone = async () => {
    try {
      // Only call handleAddOrUpdate if inputValue is non-empty
      if (inputValue && typeof inputValue === 'string' && inputValue.trim()) {
        await handleAddOrUpdate();
      }
      setOpenEditLeaveType(false);
      toast.success('Changes saved successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.error || JSON.stringify(error.response.data)
        : error.message;
      console.error('Error in handleDone:', error);
      toast.error(`Error: ${errorMessage}`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  if (!openEditLeaveType) return null;

  return (
    <div className="editQuickAdd-modal-overlay">
      <div className="editQuickAdd-modal-container">
        <div className="editQuickAdd-modal-header">
          <h2 style={{ fontWeight: "400" }}>Edit Leave Type</h2>
          <button onClick={() => setOpenEditLeaveType(false)} className="editQuickAdd-close-button">&times;</button>
        </div>

        <label className="editQuickAdd-input-label">
          Add Leaves <span className="editQuickAdd-required">*</span>
        </label>
        <input
          type="text"
          className="editQuickAdd-input-field"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value || '')}
          onKeyDown={(e) => e.key === 'Enter' && handleAddOrUpdate()}
          onBlur={handleBlur}
        />

        <div className="editQuickAdd-item-list">
          {displayValues.map((val, idx) => (
            <div
              key={val.id}
              className="editQuickAdd-item"
              draggable
              onDragStart={() => (dragItem.current = idx)}
              onDragEnter={() => (dragOverItem.current = idx)}
              onDragEnd={handleSort}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className='addLeaveType-Edit-delete'>
                <div>
                  <span className="editQuickAdd-drag-icon">⋮⋮</span>
                  <span>{val.name}</span>
                </div>
                <div>
                  <span
                    className="editQuickAdd-action"
                    onClick={() => handleEdit(val.id, val.name)}
                    style={{ cursor: 'pointer', marginRight: '10px' }}
                  >
                    <CiEdit />
                  </span>
                  <span
                    className="editQuickAdd-action"
                    onClick={() => handleDelete(val.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <MdDelete color='red' />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="editQuickAdd-button-group">
          <button onClick={handleDone} className="editQuickAdd-done-button">Done</button>
          <button onClick={() => setOpenEditLeaveType(false)} className="editQuickAdd-cancel-button">Cancel</button>
        </div>
      </div>
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
        theme="light"
      />
    </div>
  );
}