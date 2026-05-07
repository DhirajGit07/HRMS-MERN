import React from "react";
import { useNavigate, useLocation , Link} from "react-router-dom";
import "./LeaveSummary.css";  // Common CSS used

const LeavePageLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = location.pathname;

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
    <div className="leave-container">
      <div className="leave-header">
        <div className="leave-tabs">
          
        </div>
      </div>

      {children}
    </div>
  );
};

export default LeavePageLayout;
