import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './LeaveGeneralSetting.css';
import axios from 'axios';

const LeaveGeneralSetting = () => {
  const [countLeavesFrom, setCountLeavesFrom] = useState('');
  const [yearStartsFrom, setYearStartsFrom] = useState('January');
  const [managerAction, setManagerAction] = useState('Approved');
  const [error, setError] = useState(null);
  const [companyId, setCompanyId] = useState(''); 

  console.log(companyId);
  
  // Handle radio button change
  const handleRadioChange = (event) => {
    setCountLeavesFrom(event.target.id);
  };

  // Handle dropdown changes
  const handleYearChange = (event) => {
    setYearStartsFrom(event.target.value);
  };

  const handleManagerActionChange = (event) => {
    setManagerAction(event.target.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axios.get('http://localhost:8000/api/users/profile');
        if(profileRes.status === 200){
          setCompanyId(profileRes.data.companyId || '');
        }
      } catch (err) {
        console.error('Error:', err.response || err);
        setError(err.response?.data?.message || 'Failed to load data');
      } 
    };
    fetchData();
  }, []);

  // Fetch initial settings without notifications
  useEffect(() => {
    fetch('http://localhost:8000/api/leave/general-settings', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch settings`);
        }
        return response.json();
      })
      .then(data => {
        if (data.countLeavesFrom) {
          setCountLeavesFrom(data.countLeavesFrom);
          setYearStartsFrom(data.yearStartsFrom || 'January');
          setManagerAction(data.managerAction);
        }
      })
      .catch(error => {
        console.error('Error fetching settings:', error);
        setError('Failed to load settings');
        // Suppress SweetAlert2 for initial GET
      });
  }, []);

  // Handle auto-saving
  useEffect(() => {
    // Only send POST request if countLeavesFrom is selected
    if (countLeavesFrom !== '') {
      const settings = {
        countLeavesFrom,
        yearStartsFrom: countLeavesFrom === 'startOfYear' ? yearStartsFrom : null,
        managerAction,
        companyId,
      };

      fetch('http://localhost:8000/api/leave/general-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(err => {
              throw new Error(`HTTP ${response.status}: ${err.message || 'Failed to save settings'}`);
            });
          }
          return response.json();
        })
        .then(data => {
          setError(null);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Settings saved successfully!',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            width: '300px',
            padding: '10px',
          });
        })
        .catch(error => {
          console.error('Error saving settings:', error);
          setError(error.message);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: error.message.includes('404')
              ? 'Server endpoint not found'
              : 'Failed to save settings',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            width: '300px',
            padding: '10px',
          });
        });
    }
  }, [countLeavesFrom, yearStartsFrom, managerAction, companyId]);

  return (
    <div className="LGS-container">
      <div className="LGS-card">
        <div className="LGS-radio-row">
          <div className="LGS-radio-option">
            <input
              type="radio"
              id="joiningDate"
              name="countLeaves"
              className="LGS-radio"
              checked={countLeavesFrom === 'joiningDate'}
              onChange={handleRadioChange}
            />
            <label htmlFor="joiningDate" className="LGS-radio-label">
              Count leaves from the date of joining
            </label>
          </div>

          <div className="LGS-radio-option">
            <input
              type="radio"
              id="startOfYear"
              name="countLeaves"
              className="LGS-radio"
              checked={countLeavesFrom === 'startOfYear'}
              onChange={handleRadioChange}
            />
            <label htmlFor="startOfYear" className="LGS-radio-label">
              Count leaves from the start of the year
            </label>
          </div>
        </div>

        {countLeavesFrom === 'startOfYear' && (
          <div className="LGS-form-group">
            <label className="LGS-labelYear">Year Starts from </label>
            <select className="LGS-select" value={yearStartsFrom} onChange={handleYearChange}>
              <option>January</option>
              <option>February</option>
              <option>March</option>
              <option>April</option>
              <option>May</option>
              <option>June</option>
              <option>July</option>
              <option>August</option>
              <option>September</option>
              <option>October</option>
              <option>November</option>
              <option>December</option>
            </select>
          </div>
        )}
        <div className="LGS-form-group">
          <label className="LGS-labelReporting">Reporting Manager can </label>
          <select className="LGS-select" value={managerAction} onChange={handleManagerActionChange}>
            <option>Approved</option>
            <option>Not-Approved</option>
          </select>
          <span className="LGS-label">the Leave</span>
        </div>
      </div>
    </div>
  );
};

export default LeaveGeneralSetting;