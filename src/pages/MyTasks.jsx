import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import TaskDetailModal from '../components/TaskDetailModal';
import { ThemeContext } from '../context/ThemeContext';

const MyTasks = () => {
  const { darkMode } = useContext(ThemeContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  
  useEffect(() => {    
    const fetchTasks = async () => {      
      try {        
        setLoading(true);        
        const token = localStorage.getItem('token');        
        const response = await axios.get('/api/tasks/user', {          
          headers: {            
            'Authorization': `Bearer ${token}`          
          }        
        });        
        setTasks(Array.isArray(response.data) ? response.data : []);      
      } catch (err) {        
        console.error('Error fetching tasks:', err);        
        setError('Failed to load tasks. Please try again.');      
      } finally {        
        setLoading(false);      
      }    
    };        
    
    fetchTasks();
    
    // Setup socket for real-time updates
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    
    // Authenticate with user ID if available
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.id) {
          socket.emit('authenticate', { userId: payload.id });
        }
      } catch (err) {
        console.error('Error authenticating socket:', err);
      }
    }
    
    // Listen for task updates
    socket.on('task:update', (data) => {
      if (data && data.task) {
        setTasks(prevTasks => 
          prevTasks.map(t => t._id === data.task._id ? { ...t, ...data.task } : t)
        );
      }
    });
    
    // Listen for new tasks
    socket.on('task:create', (data) => {
      if (data && data.task) {
        setTasks(prevTasks => [...prevTasks, data.task]);
      }
    });
    
    // Listen for deleted tasks
    socket.on('task:delete', (data) => {
      if (data && data.taskId) {
        setTasks(prevTasks => prevTasks.filter(t => t._id !== data.taskId));
      }
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);
  
  const filteredTasks = () => {
    switch (activeFilter) {
      case 'today':
        return tasks.filter(task => {
          if (!task.dueDate) return false;
          
          // Get today's date without time component
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Get tomorrow's date for range check
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          // Get task date without time component
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          
          // Check if task date is today
          return taskDate.getTime() === today.getTime() && task.status !== 'completed';
        });
        
      case 'upcoming':
        return tasks.filter(task => {
          if (!task.dueDate) return false;
          
          // Get today's date without time component
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Get tomorrow's date for range check
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          // Get task date without time component
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          
          // Check if task date is after today
          return taskDate.getTime() > today.getTime() && task.status !== 'completed';
        });
        
      case 'completed':
        return tasks.filter(task => task.status === 'completed');
        
      default: // all
        return tasks;
    }
  };
  
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Get token for authorization
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      // First update the UI optimistically
      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      ));

      // Make the API call
      const response = await axios.put(
        `/api/tasks/${taskId}`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // If there's an error with the API call, we'll hit the catch block
      if (!response.data) {
        throw new Error('Failed to update task status');
      }
      
    } catch (err) {
      console.error('Error updating task status:', err);
      
      // Revert the optimistic update
      setTasks(prevTasks => {
        const originalTask = prevTasks.find(t => t._id === taskId);
        return prevTasks.map(task => 
          task._id === taskId ? { ...task, status: originalTask.status } : task
        );
      });
      
      setError(err.response?.data?.message || 'Failed to update task status. Please try again.');
    }
  };
  
  const openTaskDetails = (task) => {
    setSelectedTask(task);
  };
  
  const closeTaskDetails = () => {
    setSelectedTask(null);
  };
  
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'linear-badge-danger';
      case 'medium':
        return 'linear-badge-warning';
      case 'low':
        return 'linear-badge-success';
      default:
        return 'linear-badge-primary';
    }
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'linear-badge-success';
      case 'in_progress':
        return 'linear-badge-warning';
      case 'blocked':
        return 'linear-badge-danger';
      default:
        return 'linear-badge-primary';
    }
  };
  
  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  };
  
  if (loading) {
    return (
      <div className="linear-loading flex justify-center items-center h-64">
        <div className="linear-spinner dark:border-gray-600 dark:border-t-primary-400"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="linear-card linear-card-body text-center dark:bg-gray-800 dark:border-gray-700">
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="linear-btn linear-btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="linear-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-3 dark:text-gray-100">My Tasks</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and track all your assigned tasks</p>
        
        <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px space-x-8">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeFilter === 'all' 
                ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              All Tasks
              <span className="ml-1.5 py-0.5 px-2 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs">
                {tasks.length}
              </span>
            </button>
            <button 
              onClick={() => setActiveFilter('today')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeFilter === 'today' 
                ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Today
              <span className="ml-1.5 py-0.5 px-2 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs">
                {tasks.filter(task => {
                  if (!task.dueDate) return false;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const taskDate = new Date(task.dueDate);
                  taskDate.setHours(0, 0, 0, 0);
                  return taskDate.getTime() === today.getTime() && task.status !== 'completed';
                }).length}
              </span>
            </button>
            <button 
              onClick={() => setActiveFilter('upcoming')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeFilter === 'upcoming' 
                ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Upcoming
              <span className="ml-1.5 py-0.5 px-2 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs">
                {tasks.filter(task => {
                  if (!task.dueDate) return false;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const taskDate = new Date(task.dueDate);
                  taskDate.setHours(0, 0, 0, 0);
                  return taskDate.getTime() > today.getTime() && task.status !== 'completed';
                }).length}
              </span>
            </button>
            <button 
              onClick={() => setActiveFilter('completed')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeFilter === 'completed' 
                ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Completed
              <span className="ml-1.5 py-0.5 px-2 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs">
                {tasks.filter(task => task.status === 'completed').length}
              </span>
            </button>
          </nav>
        </div>
      </div>
      
      <div className="linear-card dark:bg-gray-800 dark:border-gray-700">
        <div className="linear-card-body p-0">
          {filteredTasks().length > 0 ? (
            <div className="linear-list">
              {filteredTasks().map(task => (
                <div 
                  key={task._id}
                  className="linear-list-item flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer dark:border-gray-700"
                  onClick={() => openTaskDetails(task)}
                >
                  <div className="flex-1 flex items-start">
                    <div className="mr-4">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(
                            task._id, 
                            task.status === 'completed' ? 'to_do' : 'completed'
                          );
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {task.title}
                        </h3>
                      </div>
                      
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className={`linear-badge ${getPriorityClass(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        
                        <span className={`linear-badge ${getStatusClass(task.status)}`}>
                          {formatStatus(task.status)}
                        </span>
                        
                        {task.project && (
                          <span 
                            className="text-xs py-0.5 px-2 rounded-full" 
                            style={{
                              backgroundColor: task.project.color || '#6366f1',
                              color: 'white'
                            }}
                          >
                            {task.project.name}
                          </span>
                        )}
                        
                        {task.dueDate && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openTaskDetails(task);
                      }}
                      className="linear-action-btn dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No {activeFilter} tasks</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {activeFilter === 'all' 
                  ? "You don't have any tasks assigned to you yet" 
                  : activeFilter === 'today'
                  ? "You don't have any tasks due today"
                  : activeFilter === 'upcoming'
                  ? "You don't have any upcoming tasks"
                  : "You don't have any completed tasks"}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={closeTaskDetails}
          onUpdate={(updatedTask) => {
            setTasks(
              tasks.map(task => 
                task._id === selectedTask._id ? { ...task, ...updatedTask } : task
              )
            );
            closeTaskDetails();
          }}
          onDelete={() => {
            setTasks(tasks.filter(task => task._id !== selectedTask._id));
            closeTaskDetails();
          }}
        />
      )}
    </div>
  );
};

export default MyTasks;
