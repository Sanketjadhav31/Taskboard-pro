import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const NotificationToast = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Auto-dismiss notification after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300); // Allow time for fade-out animation
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  // Handle different notification types
  const getIcon = () => {
    switch (notification.type) {
      case 'task_created':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case 'task_completed':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'project_created':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  // Get notification destination link
  const getLink = () => {
    if (notification.projectId && notification.type.includes('project')) {
      return `/projects/${notification.projectId}`;
    } else if (notification.taskId && notification.type.includes('task')) {
      return `/tasks`;
    } else {
      return '#';
    }
  };
  
  return (
    <div 
      className={`fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md transition-all duration-300 z-50 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => {
              if (onClose) onClose();
            }, 300);
          }}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            {getIcon()}
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {notification.title || 'New Notification'}
            </h3>
            
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {notification.message}
            </p>
            
            {notification.linkText && (
              <Link 
                to={getLink()} 
                className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(() => {
                    if (onClose) onClose();
                  }, 300);
                }}
              >
                {notification.linkText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast; 