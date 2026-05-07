
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Components/SideBar';
import Dashboard from './Components/Dashboard';
import DashboardNavbar from './pages/DashboardNavbar';
import Attendance from './Components/Attendance';
import AttendanceNavbar from './pages/AttendanceNavbar';
import Homepage from './Components/Home';
import MoreFile from './Components/FileSavePage';
import LeadDetailsPage from './pages/LeadDetailsPage'; // Adjust path if your file structure is different
import ProfileSettingsPage from './Components/ProfileSettingsPage';
import ProfileEditablePage from './Components/ProfileEditablePage';
import InnerOrganizationFile from './Components/InnerOrganizationFile';
import InnerEmployeeFile from './Components/InnerEmployeeFile';
import InnerHRFormsTemplates from './Components/InnerHR_Forms_Templates';
import Onboarding from './Components/Onboarding';
import OnboardingForm from './Components/OnboardingForm';

import LeaveSummary from './Components/LeaveSummary';
import ApplyLeaveForm from './Components/ApplyLeaveForm';
import LeaveBalance from './Components/LeaveBalance';
import LeaveRequests from './Components/LeaveRequests';
import ShiftSchedule from './Components/ShiftSchedule';
import Attendanceshift from './Components/AttendanceShift';

import MyTasks from "./Components/MyTasks";
import TrackTasks from "./Components/TrackTasks";
import AllTasks from "./Components/AllTasks";
import FormView from "./Components/FormView";
import AddTaskForm from "./Components/AddTaskForm";
import AddExitDetails from "./Components/AddExitDetails";
import ExitDetailsView from "./Components/ExitDetailsView";
import Login from './Components/Login';
import SignUp from './Components/SignUp';



import AddressProof from "./Components/AddressProof";
import AddressProofForm from "./Components/AddressProofForm";
import BonafideLetter from "./Components/BonafideLetter";
import BonafideLetterForm from './Components/BonafideLetterForm';
import ExperienceLetter from './Components/ExperienceLetter';
import ExperienceLetterForm from './Components/ExperienceLetterForm';


import SettingPage from './Components/SettingPage';
import ProfileModel from './pages/ProfileModel';

import Employee from './Components/Employee';

import PFESICPage from './Components/PFESICPage';
import PFESICPageAdd from './Components/PFESICPageAdd';
import SettingSidebar from './Components/Setting_Sidebar';
import EmployeeEditForm from './Components/EmployeeEditForm';
import AttendancePage from './Components/AttendancePage';

import CompanyView from './Components/CompanyView'; // Adjust path if your file structure is different

import SuperadminPanel from './Components/SuperadminPanel';
import AddEmployee from './Components/AddEmployee';
import ChangePassword from './Components/ChangePassword';
import EditCompany from './Components/EditCompanyPage';

import AttendanceSetting from './Components/AttendanceSetting';
import LeaveSetting from './Components/LeaveSetting';
import SidebarSetting from './pages/SettingSidebar';
import GeneralApplicabilityForm from './Components/GeneralApplicabilityForm';
import ResetPassword from './Components/ResetPassword';

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {

        return localStorage.getItem('isAuthenticated') === 'true';
    });

    const handleLogin = (success) => {
        if (success) {
            setIsLoggedIn(true);
            window.location.reload()
            localStorage.setItem('isAuthenticated', 'true');
        }
    };
    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userToken'); // Clear the token as well
    }


    return (
        <Router>
            <div className="app-container">
                {isLoggedIn ? (
                    <>
                        <Sidebar />
                        <div className="main-content">
                            <Routes>

                                <Route path="/" element={<Navigate to="/homepage" />} />
                                <Route path="/homepage" element={<Homepage onLogout={handleLogout} />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/attendance" element={<Attendance />} />
                                <Route path="/homepage" element={<Homepage />} />
                                <Route path="/morefile" element={<MoreFile />} />
                                <Route path="/innerfilesave" element={<InnerOrganizationFile />} />
                                <Route path="/inner-hr-forms-templates" element={<InnerHRFormsTemplates />} />

                                <Route path="/profile-settings" element={<ProfileSettingsPage />} />
                                <Route path="/edit-profile" element={<ProfileEditablePage />} />
                                <Route path="/inner-employee-file" element={<InnerEmployeeFile />} />

                                <Route path="/onboarding" element={<Onboarding />} />
                                <Route path="/onboarding-form" element={<OnboardingForm />} />

                                <Route path="/leavesummary" element={<LeaveSummary />} />
                                <Route path="/applyleave" element={<ApplyLeaveForm />} />
                                <Route path="/leavebalance" element={<LeaveBalance />} />
                                <Route path="/leaverequests" element={<LeaveRequests />} />

                                <Route path="/shiftschedule" element={<ShiftSchedule />} />
                                <Route path="/attendanceshift" element={<Attendanceshift />} />


                                <Route path="/MyTasks" element={<MyTasks />} />
                                <Route path="/TrackTasks" element={<TrackTasks />} />
                                <Route path="/AllTasks" element={<AllTasks />} />
                                <Route path="/FormView" element={<FormView />} />
                                <Route path="/AddTaskForm" element={<AddTaskForm />} />
                                <Route path="/exitdetails" element={<ExitDetailsView />} />
                                <Route path="/add-exit-details" element={<AddExitDetails />} />
                                <Route path="/add-exit-details/:id" element={<AddExitDetails />} />

                                <Route path="/AddressProof" element={<AddressProof />} />
                                <Route path="/AddressProofForm" element={<AddressProofForm />} />
                                <Route path="/BonafideLetter" element={<BonafideLetter />} />
                                <Route path="/BonafideLetterForm" element={<BonafideLetterForm />} />
                                <Route path="/ExperienceLetter" element={<ExperienceLetter />} />
                                <Route path="/ExperienceLetterForm" element={<ExperienceLetterForm />} />




                                <Route path="/settingpage" element={<SettingPage />} />
                                <Route path="/profilemodel" element={<ProfileModel onLogout={handleLogout} />} />
                                <Route path="/employee" element={<Employee />} />
                                <Route path="/pfesic" element={<PFESICPage />} />
                                <Route path="/pfesic-add" element={<PFESICPageAdd />} />

                                <Route path="/setting-sidebar" element={<SettingSidebar />} />
                                <Route path="/employee-edit" element={<EmployeeEditForm />} />

                                <Route path="/attendance-page" element={<AttendancePage />} />

                             

                                <Route path="/superadminpanel" element={<SuperadminPanel />} />
                               
                                <Route path="/company-view/:companyId" element={<CompanyView />} />
                                <Route path="/addemployee" element={<AddEmployee />} />
                                <Route path="/changepassword" element={<ChangePassword />} />

                                <Route path="/edit-company/:id" element={<EditCompany />} />

                                <Route path='/sidebarsetting' element={<SidebarSetting />} />
                                <Route path="/att-setting" element={<AttendanceSetting />} />
                                <Route path="/leave-setting" element={<LeaveSetting />} />
                              
                                <Route path="/add-new-leave-type" element={<GeneralApplicabilityForm />} />
                                {/* <Route path="/resetpassword" element={<ResetPassword />} /> */}



                            </Routes>
                        </div>
                    </>
                ) : (
                    <Routes>
                        <Route path="/" element={<Login onLogin={handleLogin} />} />
                        <Route path="/resetpassword" element={<ResetPassword />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                )}
            </div>
        </Router>
    );

};
export default App;