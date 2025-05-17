import React, { useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import NotificationToast from './NotificationToast';

const NotificationManager = () => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // Setup socket connection
  useEffect(() => {
    if (!user || !user._id) return;
    
    // Connect to socket
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    
    // Authenticate with user ID
    newSocket.emit('authenticate', { userId: user._id });
    
    setSocket(newSocket);
    
    // Clean up socket on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);
  
  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Listen for project-related events
    socket.on('project:created', (data) => {
      if (data && data.project) {
        const notification = {
          id: `project-created-${Date.now()}`,
          type: 'project_created',
          title: 'New Project Created',
          message: `A new project "${data.project.name}" has been created`,
          projectId: data.project._id,
          linkText: 'View Project',
          timestamp: new Date()
        };
        
        addNotification(notification);
      }
    });
    
    socket.on('project:updated', (data) => {
      if (data && data.project) {
        const notification = {
          id: `project-updated-${Date.now()}`,
          type: 'project_updated',
          title: 'Project Updated',
          message: `Project "${data.project.name}" has been updated`,
          projectId: data.project._id,
          linkText: 'View Project',
          timestamp: new Date()
        };
        
        addNotification(notification);
      }
    });
    
    // Listen for task-related events
    socket.on('task:created', (data) => {
      if (data && data.task) {
        const notification = {
          id: `task-created-${Date.now()}`,
          type: 'task_created',
          title: 'New Task Added',
          message: `A new task "${data.task.title}" has been created`,
          taskId: data.task._id,
          projectId: data.task.projectId || data.task.project,
          linkText: 'View Task',
          timestamp: new Date()
        };
        
        addNotification(notification);
      }
    });
    
    socket.on('task:completed', (data) => {
      if (data && data.task) {
        const notification = {
          id: `task-completed-${Date.now()}`,
          type: 'task_completed',
          title: 'Task Completed',
          message: `Task "${data.task.title}" has been completed`,
          taskId: data.task._id,
          projectId: data.task.projectId || data.task.project,
          linkText: 'View Task',
          timestamp: new Date()
        };
        
        addNotification(notification);
      }
    });
    
    socket.on('task:updated', (data) => {
      if (data && data.task) {
        const notification = {
          id: `task-updated-${Date.now()}`,
          type: 'task_updated',
          title: 'Task Updated',
          message: `Task "${data.task.title}" has been updated`,
          taskId: data.task._id,
          projectId: data.task.projectId || data.task.project,
          linkText: 'View Task',
          timestamp: new Date()
        };
        
        addNotification(notification);
      }
    });
    
    // Clean up event listeners
    return () => {
      socket.off('project:created');
      socket.off('project:updated');
      socket.off('task:created');
      socket.off('task:completed');
      socket.off('task:updated');
    };
  }, [socket]);
  
  // Add a new notification
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 5)); // Keep only 5 most recent
  };
  
  // Remove a notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  return (
    <>
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </>
  );
};

export default NotificationManager; 