import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

import './AllNavBar.css';
import userlogo from '../assets/user logo.jpg';
import OverviewProfile from '../assets/profileicon.png';
import searchImg from '../assets/search.png';
import phoneIcon from '../assets/phoneIcon.png';
import settingIcon from '../assets/settings.png';
import notification from '../assets/Notification.png';
import { FiLogOut } from 'react-icons/fi';
import ProfileModel from './ProfileModel';
import Swal from 'sweetalert2';
// ✅ Set base URL for image resolution
axios.defaults.baseURL = 'http://localhost:8000'; // Change this as per your backend

const InnerFileSaveNavbar = () => {
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [showSearchInput, setShowSearchInput] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const quickActionsRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const [userProfile, setUserProfile] = useState({
        profileImage: OverviewProfile,
        firstName: '',
        lastName: '',
        designation: ''

    });
    useEffect(() => {
        function handleClickOutside(event) {
            if (quickActionsRef.current && !quickActionsRef.current.contains(event.target)) {
                setShowQuickActions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSearch = (query) => {
        console.log("Searching for:", query);

        // Add specific logic for searching in different routes
        if (location.pathname === '/homepage') {
            alert(`Searching "${query}" on Home Page`);
            // Implement actual search logic here
        } else if (location.pathname === '#') {
            alert(`Searching "${query}" on Dashboard`);
            // Implement actual search logic here
        } else {
            alert(`Search not available on this page`);
        }
    };
    // ✅ Fetch user profile info and image
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await axios.get('/api/users/profile');
                const userData = response.data;

                const resolvedImageUrl = userData.profileImage
                    ? userData.profileImage.startsWith('http')
                        ? userData.profileImage
                        : `${axios.defaults.baseURL}${userData.profileImage}`
                    : OverviewProfile;

                console.log('Fetched profile image URL:', resolvedImageUrl);

                setUserProfile({
                    profileImage: resolvedImageUrl,
                    firstName: userData.firstName || 'User',
                    lastName: userData.lastName || '',
                    designation: userData.designation || 'Team Member'

                });
            } catch (error) {
                console.error('Error fetching user profile:', error);
                if (error.response?.status === 401) {
                    navigate('/login');
                }
                // } finally {
                //   setLoading(false);
            }
        };

        fetchUserProfile();
    }, [navigate]);

    const handleLogout = () => {
        setIsLoggingOut(true); // show loading or fadeout

        setTimeout(() => {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('user');
            localStorage.removeItem('userToken');
            navigate('/');
        }, 400); // wait 0.5 seconds before redirect
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
    return (
        <>
            {isLoggingOut && (
                <div className="logout-overlay">
                    <div className="spinner" />
                    <div className="logout-text">Logging out...</div>
                </div>
            )}
            <nav className="all-navbar">
                <Link to="/morefile" className={`all-nav-links ${location.pathname === '/morefile' ? 'active' : ''}`}>
                    My Files
                </Link>

                <div className="all-nav-icons">


                    {showSearchInput && (
                        <input
                            type="text"
                            className="all-search-input"
                            placeholder="Search..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch(searchText);
                                }
                            }}
                        />
                    )}



                    <Link to="/settingpage">
                        <img src={settingIcon} alt="Settings" className="all-icon-button" />
                    </Link>

                    <img
                        src={userProfile.profileImage}
                        alt="Profile"
                        className="all-profile-pic"
                        onClick={() => {
                            setShowProfileModal(true);
                            setShowNotificationModal(false); // Close notification if open
                        }}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = OverviewProfile;
                        }}
                    />

                    <FiLogOut
                        size={1}
                        className="all-icon-button1"
                        onClick={handleSweetAlertLogout}
                        title="Logout"
                    />
                    {showLogoutConfirm && (
                        <div className="logout-confirm-overlay">


                            <div className="logout-confirm-modal">
                                <div className="user-info">


                                    <div className='settingpageUpper'>
                                        <div className="user-name1"> Hi!&nbsp;
                                            {userProfile.firstName} {userProfile.lastName}
                                        </div>

                                    </div>
                                </div>
                                <h3>Are You Sure You Want To Logout?</h3>
                                <div className="logout-confirm-buttons">
                                    <button onClick={handleLogout} className="logout-confirm-btn">Yes</button>
                                    <button onClick={() => setShowLogoutConfirm(false)} className="logout-cancel-btn">Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            <div className="all-tabs">
                <Link to="/innerfilesave" className={`all-tab ${location.pathname === '/innerfilesave' ? 'active' : ''}`}>
                    Organization Files
                </Link>
                <Link to="/inner-employee-file" className={`all-tab ${location.pathname === '/inner-employee-file' ? 'active' : ''}`}>Employee Files
                </Link>
                <Link to="/inner-hr-forms-templates" className={`all-tab ${location.pathname === '/inner-hr-forms-templates' ? 'active' : ''}`}>HR Forms & Templates
                </Link>
                {/* Notification Modal */}
                {showNotificationModal && (
                    <div className="notificationNav-modal-overlay">
                        <div className="notificationNav-modal-content">
                            <button className="notificationNav-close-btn" onClick={() => setShowNotificationModal(false)}>
                                &times;
                            </button>
                            <h2 className="notifications">Notifications</h2>
                            <div className="notificationNav-inner-box">
                                <div className="notificationNav-form-group">
                                    <span>No Notification</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Drawer */}
                <ProfileModel
                    isOpen={showProfileModal}
                    onClose={() => setShowProfileModal(false)}
                    userProfile={userProfile}
                />
            </div>
        </>
    );
};

export default InnerFileSaveNavbar;


// import React, { useState, useRef, useEffect } from 'react';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import axios from 'axios';

// import './AllNavBar.css';
// import userlogo from '../assets/user logo.jpg';
// import OverviewProfile from '../assets/profileicon.png';
// import searchImg from '../assets/search.png';
// import phoneIcon from '../assets/phoneIcon.png';
// import settingIcon from '../assets/settings.png';
// import notification from '../assets/Notification.png';
// import { FiLogOut } from 'react-icons/fi';
// import ProfileModel from './ProfileModel';
// import Swal from 'sweetalert2';

// axios.defaults.baseURL = 'http://localhost:8000';

// const InnerFileSaveNavbar = () => {
//     const [showQuickActions, setShowQuickActions] = useState(false);
//     const [showSearchInput, setShowSearchInput] = useState(false);
//     const [searchText, setSearchText] = useState('');
//     const [showNotificationModal, setShowNotificationModal] = useState(false);
//     const [showProfileModal, setShowProfileModal] = useState(false);
//     const [isLoggingOut, setIsLoggingOut] = useState(false);
//     const quickActionsRef = useRef(null);
//     const location = useLocation();
//     const navigate = useNavigate();
//     const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
//     const [userRole, setUserRole] = useState("Employee"); // Default is Employee

//     const [userProfile, setUserProfile] = useState({
//         profileImage: OverviewProfile,
//         firstName: '',
//         lastName: '',
//         designation: ''
//     });

//     useEffect(() => {
//         // Get role from localStorage
//         const storedUser = localStorage.getItem("userData");
//         if (storedUser) {
//             try {
//                 const { role } = JSON.parse(storedUser);
//                 setUserRole(role || "Employee");
//             } catch {
//                 setUserRole("Employee");
//             }
//         }

//         // Click outside handler
//         function handleClickOutside(event) {
//             if (quickActionsRef.current && !quickActionsRef.current.contains(event.target)) {
//                 setShowQuickActions(false);
//             }
//         }
//         document.addEventListener("mousedown", handleClickOutside);
//         return () => document.removeEventListener("mousedown", handleClickOutside);
//     }, []);

//     const handleSearch = (query) => {
//         if (location.pathname === '/homepage') {
//             alert(`Searching "${query}" on Home Page`);
//         } else {
//             alert(`Search not available on this page`);
//         }
//     };

//     useEffect(() => {
//         const fetchUserProfile = async () => {
//             try {
//                 const response = await axios.get('/api/users/profile');
//                 const userData = response.data;
//                 const resolvedImageUrl = userData.profileImage
//                     ? userData.profileImage.startsWith('http')
//                         ? userData.profileImage
//                         : `${axios.defaults.baseURL}${userData.profileImage}`
//                     : OverviewProfile;

//                 setUserProfile({
//                     profileImage: resolvedImageUrl,
//                     firstName: userData.firstName || 'User',
//                     lastName: userData.lastName || '',
//                     designation: userData.designation || 'Team Member'
//                 });
//             } catch (error) {
//                 console.error('Error fetching user profile:', error);
//                 if (error.response?.status === 401) {
//                     navigate('/login');
//                 }
//             }
//         };

//         fetchUserProfile();
//     }, [navigate]);

//     const handleLogout = () => {
//         setIsLoggingOut(true);
//         setTimeout(() => {
//             localStorage.removeItem('isAuthenticated');
//             localStorage.removeItem('user');
//             localStorage.removeItem('userToken');
//             localStorage.removeItem('userData');
//             navigate('/');
//         }, 400);
//     };

//     const handleSweetAlertLogout = () => {
//         Swal.fire({
//             title: 'Are you sure you want to logout?',
//             icon: 'warning',
//             showCancelButton: true,
//             confirmButtonColor: '#d33',
//             cancelButtonColor: '#3085d6',
//             confirmButtonText: 'Yes, Logout',
//             cancelButtonText: 'Cancel'
//         }).then((result) => {
//             if (result.isConfirmed) {
//                 handleLogout();
//             }
//         });
//     };

//     return (
//         <>
//             {isLoggingOut && (
//                 <div className="logout-overlay">
//                     <div className="spinner" />
//                     <div className="logout-text">Logging out...</div>
//                 </div>
//             )}
//             <nav className="all-navbar">
//                 <Link to="/morefile" className={`all-nav-links ${location.pathname === '/morefile' ? 'active' : ''}`}>
//                     My Files
//                 </Link>

//                 <div className="all-nav-icons">
//                     {showSearchInput && (
//                         <input
//                             type="text"
//                             className="all-search-input"
//                             placeholder="Search..."
//                             value={searchText}
//                             onChange={(e) => setSearchText(e.target.value)}
//                             onKeyDown={(e) => {
//                                 if (e.key === 'Enter') {
//                                     handleSearch(searchText);
//                                 }
//                             }}
//                         />
//                     )}

//                     <Link to="/settingpage">
//                         <img src={settingIcon} alt="Settings" className="all-icon-button" />
//                     </Link>

//                     <img
//                         src={userProfile.profileImage}
//                         alt="Profile"
//                         className="all-profile-pic"
//                         onClick={() => {
//                             setShowProfileModal(true);
//                             setShowNotificationModal(false);
//                         }}
//                         onError={(e) => {
//                             e.target.onerror = null;
//                             e.target.src = OverviewProfile;
//                         }}
//                     />

//                     <FiLogOut
//                         size={1}
//                         className="all-icon-button1"
//                         onClick={handleSweetAlertLogout}
//                         title="Logout"
//                     />

//                     {showLogoutConfirm && (
//                         <div className="logout-confirm-overlay">
//                             <div className="logout-confirm-modal">
//                                 <div className="user-info">
//                                     <div className='settingpageUpper'>
//                                         <div className="user-name1">Hi! {userProfile.firstName} {userProfile.lastName}</div>
//                                     </div>
//                                 </div>
//                                 <h3>Are You Sure You Want To Logout?</h3>
//                                 <div className="logout-confirm-buttons">
//                                     <button onClick={handleLogout} className="logout-confirm-btn">Yes</button>
//                                     <button onClick={() => setShowLogoutConfirm(false)} className="logout-cancel-btn">Cancel</button>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </nav>

//             <div className="all-tabs">
//                 {userRole === "Admin" && (
//                     <Link to="/innerfilesave" className={`all-tab ${location.pathname === '/innerfilesave' ? 'active' : ''}`}>
//                         Organization Files
//                     </Link>
//                 )}
//                 <Link to="/inner-employee-file" className={`all-tab ${location.pathname === '/inner-employee-file' ? 'active' : ''}`}>
//                     Employee Files
//                 </Link>
//                 <Link to="/inner-hr-forms-templates" className={`all-tab ${location.pathname === '/inner-hr-forms-templates' ? 'active' : ''}`}>
//                     HR Forms & Templates
//                 </Link>

//                 {showNotificationModal && (
//                     <div className="notificationNav-modal-overlay">
//                         <div className="notificationNav-modal-content">
//                             <button className="notificationNav-close-btn" onClick={() => setShowNotificationModal(false)}>
//                                 &times;
//                             </button>
//                             <h2 className="notifications">Notifications</h2>
//                             <div className="notificationNav-inner-box">
//                                 <div className="notificationNav-form-group">
//                                     <span>No Notification</span>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 <ProfileModel
//                     isOpen={showProfileModal}
//                     onClose={() => setShowProfileModal(false)}
//                     userProfile={userProfile}
//                 />
//             </div>
//         </>
//     );
// };

// export default InnerFileSaveNavbar;
