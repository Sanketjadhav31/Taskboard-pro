import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const socketRef = useRef(null);

  // Update user when auth changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch current user
      const fetchUser = async () => {
        try {
          const res = await axios.get('/auth/current-user', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            withCredentials: true
          });
          if (res.data && res.data.user) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.error('Error fetching user in NotificationContext:', err);
        }
      };
      
      fetchUser();
    } else {
      setUser(null);
    }
  }, []);

  // Set up Socket.io connection
  useEffect(() => {
    if (user) {
      // Connect to Socket.io server
      const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
      socketRef.current = socket;
      
      // Authenticate socket connection
      socket.emit('authenticate', { userId: user._id });
      
      // Listen for new notifications
      socket.on('notification:new', (notification) => {
        console.log('New notification received:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if supported
        if (Notification && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
      });
      
      // Clean up on unmount
      return () => {
        if (socket) {
          socket.off('notification:new');
          socket.disconnect();
        }
      };
    }
  }, [user]);

  // Request notification permissions
  useEffect(() => {
    if (Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch notifications when user is logged in
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Fetch notifications from the server
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const res = await axios.get('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter(notif => !notif.read).length);
      } else {
        console.error('Unexpected notifications format:', res.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/notifications/read-all', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      setUnreadCount(0);
      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  };

  // Delete a notification
  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/notifications/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const notifToDelete = notifications.find(n => n._id === id);
      if (notifToDelete && !notifToDelete.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      setNotifications(prev => 
        prev.filter(notif => notif._id !== id)
      );
      
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  };

  // Create mock notifications if API doesn't exist
  const createMockNotifications = () => {
    const mockData = [
      {
        _id: '1',
        title: 'New task assigned',
        message: 'You have been assigned a new task in Website Redesign project',
        type: 'task',
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '2',
        title: 'Meeting scheduled',
        message: 'Team meeting scheduled for tomorrow at 10:00 AM',
        type: 'meeting',
        read: false,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '3',
        title: 'Project deadline approaching',
        message: 'The deadline for Marketing Campaign project is approaching',
        type: 'deadline',
        read: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    setNotifications(mockData);
    setUnreadCount(mockData.filter(n => !n.read).length);
  };

  // Use mock data if real API fails
  useEffect(() => {
    if (user && notifications.length === 0) {
      createMockNotifications();
    }
  }, [user, notifications.length]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}; 