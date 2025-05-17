import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationContext } from '../context/NotificationContext';

const NotificationsPage = () => {
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useContext(NotificationContext);
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all, unread, read
  
  // Filter notifications based on selected filter
  const filteredNotifications = notifications ? notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  }) : [];
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'project_invite') {
      navigate(`/projects/${notification.projectId}`);
    } else if (notification.type === 'task_assigned') {
      navigate('/tasks');
    } else if (notification.type === 'task_comment') {
      navigate(`/projects/${notification.projectId}`);
    }
  };
  
  // Get the icon based on notification type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'project_invite':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
      case 'task_assigned':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'task_comment':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };
  
  // Format the date relative to now
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    // Less than a minute
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Default to date string
    return date.toLocaleDateString();
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="linear-spinner"></div>
        <p className="text-gray-600 mt-4">Loading notifications...</p>
      </div>
    );
  }
  
  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  return (
    <div className="linear-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Notifications</h1>
          <p className="text-gray-600">View and manage all your notifications</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="linear-btn linear-btn-primary flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={() => setFilter('all')}
          className={`linear-btn ${filter === 'all' ? 'linear-btn-primary' : 'linear-btn-secondary'}`}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('unread')}
          className={`linear-btn ${filter === 'unread' ? 'linear-btn-primary' : 'linear-btn-secondary'}`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button 
          onClick={() => setFilter('read')}
          className={`linear-btn ${filter === 'read' ? 'linear-btn-primary' : 'linear-btn-secondary'}`}
        >
          Read
        </button>
      </div>
      
      <div className="linear-card">
        <div className="linear-card-header">
          <h2 className="text-lg font-semibold">
            {filter === 'all' ? 'All Notifications' : 
             filter === 'unread' ? 'Unread Notifications' : 
             'Read Notifications'}
          </h2>
        </div>
        <div className="linear-card-body p-0">
          {filteredNotifications.length > 0 ? (
            <div className="linear-list">
              {filteredNotifications.map(notification => (
                <div 
                  key={notification._id} 
                  className={`linear-list-item flex items-start justify-between group ${!notification.read ? 'bg-primary-50' : ''}`}
                >
                  <div 
                    className="flex items-start cursor-pointer flex-grow"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div 
                      className={`linear-avatar linear-avatar-md mr-4 flex-shrink-0 ${
                        !notification.read 
                          ? 'bg-primary-100 text-primary-600' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium">
                          {notification.title || (notification.message && notification.message.split(':')[0])}
                        </h3>
                        {!notification.read && (
                          <span className="linear-badge linear-badge-primary ml-2">New</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message || notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {notification.read ? (
                      <button
                        className="linear-action-btn hover:text-primary-600 mr-2"
                        onClick={() => markAsRead(notification._id, false)}
                        title="Mark as unread"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        className="linear-action-btn hover:text-primary-600 mr-2"
                        onClick={() => markAsRead(notification._id)}
                        title="Mark as read"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      className="linear-action-btn hover:text-red-600"
                      onClick={() => deleteNotification(notification._id)}
                      title="Delete notification"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="linear-avatar linear-avatar-lg bg-gray-100 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">No notifications</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                {filter === 'unread' 
                  ? "You have no unread notifications." 
                  : filter === 'read' 
                  ? "You have no read notifications."
                  : "You have no notifications at the moment."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage; 