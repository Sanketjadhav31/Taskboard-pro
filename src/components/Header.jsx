import React, { useState, useRef, useEffect, useContext, useCallback, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { ThemeContext } from '../context/ThemeContext';
import { ChatContext } from '../context/ChatContext';
import GlobalSearch from './GlobalSearch';

const Header = ({ user, logout, className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const themeToggleRef = useRef(null);
  const chatIconRef = useRef(null);
  
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useContext(NotificationContext);
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const { totalUnreadCount } = useContext(ChatContext);
  
  // Get the appropriate title based on the current path
  const getTitle = () => {
    const path = window.location.pathname;
    
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/projects') return 'Projects';
    if (path.startsWith('/projects/')) return 'Project Details';
    if (path === '/tasks') return 'My Tasks';
    if (path === '/team') return 'Team';
    if (path === '/settings') return 'Settings';
    if (path === '/profile') return 'Profile';
    if (path === '/notifications') return 'Notifications';
    if (path === '/chat') return 'Chat';
    
    return 'Taskboard-pro';
  };

  // Handle clicks outside dropdowns to close them
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle notification click with useCallback to prevent recreation on each render
  const handleNotificationClick = useCallback((notification) => {
    markAsRead(notification._id);
    
    // Navigate based on notification type
    if (notification.type === 'project_invite') {
      navigate(`/projects/${notification.projectId}`);
    } else if (notification.type === 'task_assigned') {
      navigate(`/tasks`);
    } else if (notification.type === 'task_comment') {
      navigate(`/projects/${notification.projectId}`);
    }
    
    setShowNotifications(false);
  }, [markAsRead, navigate]);
  
  const toggleNotifications = useCallback((e) => {
    e.stopPropagation();
    setShowProfileMenu(false); // Close profile menu when opening notifications
    setShowNotifications(prev => !prev);
  }, []);
  
  const toggleProfileMenu = useCallback((e) => {
    e.stopPropagation();
    setShowNotifications(false); // Close notifications when opening profile menu
    setShowProfileMenu(prev => !prev);
  }, []);
  
  const handleMarkAllAsRead = useCallback((e) => {
    e.stopPropagation();
    markAllAsRead();
  }, [markAllAsRead]);

  const handleLogout = useCallback(() => {
    setShowProfileMenu(false);
    logout();
  }, [logout]);
  
  return (
    <header className={`header dark:bg-gray-800 dark:border-gray-700 w-full ${className}`}>
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{getTitle()}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search box - using Global Search component */}
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          
          {/* Theme toggle icon */}
          <div className="relative" ref={themeToggleRef}>
            <button 
              className="linear-action-btn relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
              onClick={toggleTheme}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Chat icon - enhanced with notification badge */}
          <div className="relative" ref={chatIconRef}>
            <Link 
              to="/chat"
              className="linear-action-btn relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
              aria-label="Open chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 dark:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-green-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                  {totalUnreadCount}
                </span>
              )}
            </Link>
          </div>
          
          {/* Notification icon - enhanced with active animation */}
          <div className="relative" ref={notificationRef}>
            <button 
              className={`linear-action-btn relative p-2 ${unreadCount > 0 ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} rounded-full transition-colors duration-200`}
              onClick={toggleNotifications}
              aria-expanded={showNotifications}
              aria-haspopup="true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${unreadCount > 0 ? 'text-primary-600 dark:text-primary-400' : 'dark:text-gray-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Notification dropdown */}
            {showNotifications && (
              <div className="notification-dropdown fixed right-0 top-0 mt-16 mr-6 w-96 max-h-[calc(100vh-80px)] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 py-3 px-4 z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold dark:text-gray-100">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-red-900/30 dark:text-red-400">
                          {unreadCount} new
                        </span>
                      )}
                    </h3>
                    {unreadCount > 0 && (
                      <button 
                        className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors duration-200"
                        onClick={handleMarkAllAsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="overflow-y-auto max-h-[60vh]">
                  {notifications && notifications.length > 0 ? (
                    <div className="linear-list divide-y divide-gray-100 dark:divide-gray-700">
                      {notifications.map(notification => (
                        <div 
                          key={notification._id} 
                          className={`py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200
                          ${!notification.read ? 'bg-primary-50 dark:bg-primary-900 dark:bg-opacity-20' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center 
                            ${!notification.read 
                              ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300' 
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                              {notification.type === 'project_invite' && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                              )}
                              {notification.type === 'task_assigned' && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              )}
                              {notification.type === 'task_comment' && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              )}
                              {!notification.type || (notification.type !== 'project_invite' && notification.type !== 'task_assigned' && notification.type !== 'task_comment') && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-3 w-full">
                              <p className="text-sm leading-tight font-medium mb-1 dark:text-gray-100">
                                {notification.message || notification.title}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(notification.createdAt).toLocaleString([], {
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit', 
                                    minute:'2-digit'
                                  })}
                                </p>
                                {!notification.read && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                                    New
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 px-4 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Notifications will appear here</p>
                    </div>
                  )}
                </div>
                
                <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-3 z-10">
                  <Link 
                    to="/notifications" 
                    className="block w-full text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                    onClick={() => setShowNotifications(false)}
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* User profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              className="flex items-center space-x-2 focus:outline-none"
              onClick={toggleProfileMenu}
              aria-expanded={showProfileMenu}
              aria-haspopup="true"
            >
              <div className="linear-avatar linear-avatar-sm">
                {user?.photo ? (
                  <img src={user.photo} alt={user.displayName} className="h-full w-full object-cover" />
                ) : (
                  <span>
                    {user?.displayName?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">{user?.displayName}</span>
            </button>
            
            {/* Profile dropdown menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-1">
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile</span>
                    </div>
                  </Link>
                  <Link 
                    to="/settings" 
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Settings</span>
                    </div>
                  </Link>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button 
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20"
                    onClick={handleLogout}
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

Header.displayName = 'Header';

export default Header;
