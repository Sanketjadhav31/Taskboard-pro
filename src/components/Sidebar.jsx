import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';

const Sidebar = ({ user, collapsed, toggleSidebar }) => {
  const location = useLocation();
  const { darkMode } = useContext(ThemeContext);
  
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  return (
    <aside className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm z-20 transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'} linear-fade-in`}>
      {/* Sidebar header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center">
          <div className="flex items-center">
            <div className="linear-logo text-primary-500">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            {!collapsed && <span className="text-xl font-bold text-gray-800 dark:text-gray-100 ml-2">Taskboard-pro</span>}
          </div>
        </div>
        <button 
          onClick={toggleSidebar}
          className="linear-action-btn text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="py-4 bg-white dark:bg-gray-800 h-full overflow-y-auto">
        <div className="px-3 mb-2 mt-1">
          <h3 className={`text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${collapsed ? 'text-center' : ''}`}>
            {collapsed ? 'Main' : 'Main Menu'}
          </h3>
        </div>
        <ul className="space-y-1 px-2 mb-6">
          <li>
            <Link 
              to="/" 
              className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 ${isActive('/') 
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {!collapsed && <span className="ml-3">Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link 
              to="/tasks" 
              className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 ${isActive('/tasks') 
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              {!collapsed && <span className="ml-3">My Tasks</span>}
            </Link>
          </li>
          <li>
            <Link 
              to="/projects" 
              className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 ${isActive('/projects') 
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              {!collapsed && <span className="ml-3">Projects</span>}
            </Link>
          </li>
          <li>
            <Link 
              to="/automations" 
              className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 ${isActive('/automations') 
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {!collapsed && <span className="ml-3">Automations</span>}
            </Link>
          </li>
        </ul>
        
        <div className="px-3 mb-2">
          <h3 className={`text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${collapsed ? 'text-center' : ''}`}>
            {collapsed ? 'Comm' : 'Communication'}
          </h3>
        </div>
        <ul className="space-y-1 px-2 mb-6">
          <li>
            <Link 
              to="/chat" 
              className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 ${isActive('/chat') 
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {!collapsed && <span className="ml-3">Chat</span>}
            </Link>
          </li>
          <li>
            <Link 
              to="/team" 
              className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 ${isActive('/team') 
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {!collapsed && <span className="ml-3">Team</span>}
            </Link>
          </li>
        </ul>
        
        <div className="px-3 mb-2">
          <h3 className={`text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${collapsed ? 'text-center' : ''}`}>
            {collapsed ? 'User' : 'Account'}
          </h3>
        </div>
        <ul className="space-y-1 px-2">
          <li>
            <Link 
              to="/profile" 
              className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 ${isActive('/profile') 
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {!collapsed && <span className="ml-3">Profile</span>}
            </Link>
          </li>
          <li>
            <Link 
              to="/settings" 
              className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 ${isActive('/settings') 
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {!collapsed && <span className="ml-3">Settings</span>}
            </Link>
          </li>
        </ul>
        
        {!collapsed && user && (
          <div className="sidebar-footer mt-auto p-4 border-t border-gray-200 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center space-x-3">
              <div className="avatar avatar-sm dark:bg-gray-700">
                {user?.photo ? (
                  <img src={user.photo} alt={user.displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="avatar-text-sm dark:text-gray-300">
                    {user?.displayName?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              
              <div className="user-info dark:bg-gray-800">
                <div className="user-name text-sm font-medium text-gray-800 dark:text-gray-300">{user?.displayName}</div>
                <div className="user-email text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
