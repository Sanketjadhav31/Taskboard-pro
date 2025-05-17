import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ProjectContext } from '../context/ProjectContext';
import { AuthContext } from '../context/AuthContext';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailModal from './TaskDetailModal';
import { io } from 'socket.io-client';

const TaskBoard = ({ project, onTaskUpdate }) => {
  const { createTask, updateTask, deleteTask } = useContext(ProjectContext);
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState(project.tasks || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const buttonClickTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const ignoreNextUpdateRef = useRef(false);
  
  // Get socket io instance
  useEffect(() => {
    // Import socket.io client dynamically to prevent SSR issues
    import('socket.io-client').then(({ io }) => {
      const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
      socketRef.current = socket;
      
      // Authenticate with user ID if available
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload && payload.id) {
            socket.emit('authenticate', { userId: payload.id });
            
            // Join project room to receive project-specific updates
            if (project && project._id) {
              socket.emit('join:project', project._id);
              console.log(`Joined project room: ${project._id}`);
            }
          }
        } catch (err) {
          console.error('Error authenticating socket:', err);
        }
      }
      
      return () => {
        // Leave project room when component unmounts
        if (socket && project && project._id) {
          socket.emit('leave:project', project._id);
        }
        socket.disconnect();
      };
    });
  }, [project._id]);
  
  useEffect(() => {
    if (project && project.tasks) {
      setTasks(project.tasks || []);
        setLoading(false);
      }
  }, [project]);
  
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    // If dropped outside a droppable area
    if (!destination) return;
    
    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
    
    // Find the task that was dragged
    const task = tasks.find(task => task._id === draggableId);
    
    if (!task) return;
    
    // Update task status based on the destination column
    const newStatus = destination.droppableId;
    
    // Store original tasks for rollback
    const originalTasks = [...tasks];
    
    // Update task locally first for immediate UI feedback
    const updatedTasks = tasks.map(t => 
      t._id === task._id ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);
    
    // Skip the next socket update since we're the initiator
    ignoreNextUpdateRef.current = true;
    
    // Then update on the server
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setTasks(originalTasks); // Revert to original state
        ignoreNextUpdateRef.current = false;
        return;
      }
      
      const result = await axios.put(`/api/tasks/${task._id}`, 
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      if (result.data) {
        // Server update successful
        if (onTaskUpdate) {
          onTaskUpdate();
        }
      } else {
        setError('Failed to update task status');
        setTasks(originalTasks); // Revert if failed
        ignoreNextUpdateRef.current = false;
      }
    } catch (err) {
      // Revert to original state if server update fails
      setTasks(originalTasks);
      ignoreNextUpdateRef.current = false;
      console.error('Error updating task status:', err);
      setError(err.response?.data?.message || 'Failed to update task status. Please try again.');
    }
  };
  
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Store original tasks for rollback
      const originalTasks = [...tasks];
      
      // Get the task to update
      const taskToUpdate = tasks.find(task => task._id === taskId);
      if (!taskToUpdate) {
        console.error(`Task with id ${taskId} not found`);
        setError(`Could not find task to update`);
        return;
      }
      
      // Update task locally first for immediate UI feedback
      const updatedTasks = tasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      );
      setTasks(updatedTasks);
      
      // Skip the next socket update since we're the initiator
      ignoreNextUpdateRef.current = true;
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setTasks(originalTasks); // Revert to original state
        ignoreNextUpdateRef.current = false;
        return;
      }
      
      // Then update on the server directly to avoid another layer of abstraction
      const result = await axios.put(`/api/tasks/${taskId}`, 
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      if (result.data) {
        // Server update successful
        if (onTaskUpdate) {
          onTaskUpdate();
        }
        
        // For completed tasks, add celebration effect or notification
        if (newStatus === 'completed') {
          setToastMessage({
            message: `Task "${taskToUpdate.title}" completed successfully!`,
            type: 'success',
            duration: 3000
          });
        }
      } else {
        setError('Failed to update task status');
        setTasks(originalTasks); // Revert if failed
        ignoreNextUpdateRef.current = false;
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      
      // Set clear error message
      if (err.response && err.response.data && err.response.data.message) {
        setError(`Failed to update task: ${err.response.data.message}`);
      } else if (err.message) {
        setError(`Failed to update task: ${err.message}`);
      } else {
        setError('Failed to update task. Please try again.');
      }
      
      // Revert to original state if server update fails
      // Get original tasks again to ensure we have the latest state
      const originalTasks = [...tasks];
      setTasks(originalTasks);
      ignoreNextUpdateRef.current = false;
    }
  };
  
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      // Remove task locally first for immediate UI feedback
      const updatedTasks = tasks.filter(task => task._id !== taskId);
      setTasks(updatedTasks);
      
      // Then delete from the server
      const result = await deleteTask(project._id, taskId);
      
      // Close modal if the deleted task was selected
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask(null);
      }
      
      if (!result.success) {
        setError(result.message || 'Failed to delete task');
        setTasks(tasks); // Revert if failed
      } else if (onTaskUpdate) {
        onTaskUpdate();
      }
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };
  
  const handleCreateTask = async (taskData) => {
    try {
      const result = await createTask(project._id, taskData);
      if (result.success) {
        // Add the new task to our local state
        setTasks([...tasks, result.task]);
        setIsCreateModalOpen(false);
        
        if (onTaskUpdate) {
          onTaskUpdate();
        }
      } else {
        setError(result.message || 'Failed to create task');
      }
    } catch (err) {
      setError('Failed to create task');
      console.error('Error creating task:', err);
    }
  };
  
  const handleUpdateTask = async (taskId, updatedData) => {
    try {
      // Store original tasks for potential rollback
      const originalTasks = [...tasks];
      
      // Find the task we're updating
      const taskToUpdate = tasks.find(task => task._id === taskId);
      if (!taskToUpdate) {
        setError('Task not found');
        return;
      }
      
      // Skip the next socket update since we're the initiator
      ignoreNextUpdateRef.current = true;
      
      // Update task locally first for immediate UI feedback
      const updatedTasks = tasks.map(task => 
        task._id === taskId ? { ...task, ...updatedData } : task
      );
      setTasks(updatedTasks);
      
      // Call the updateTask method from ProjectContext
      const result = await updateTask(project._id, taskId, updatedData);
      
      if (result.success) {
        // Update the task in our local state
        setTasks(tasks.map(task => task._id === taskId ? result.task : task));
        setSelectedTask(null);
        
        if (onTaskUpdate) {
          onTaskUpdate();
        }
      } else {
        setError(result.message || 'Failed to update task');
        // Restore original state
        setTasks(originalTasks);
      }
    } catch (err) {
      console.error('Error updating task:', err);
      
      // Set clear error message
      if (err.response && err.response.data && err.response.data.message) {
        setError(`Failed to update task: ${err.response.data.message}`);
      } else if (err.message) {
        setError(`Failed to update task: ${err.message}`);
      } else {
        setError('Failed to update task. Please try again.');
      }
      
      // Get the original tasks for rollback
      const originalTasks = [...tasks];
      setTasks(originalTasks);
      ignoreNextUpdateRef.current = false;
    }
  };
  
  const handleAddTaskClick = useCallback(() => {
    // Prevent rapid clicks by using a ref instead of state
    if (buttonClickTimeoutRef.current) return;
    
    // Open the modal
    setIsCreateModalOpen(true);
    
    // Set a flag to prevent multiple clicks
    buttonClickTimeoutRef.current = true;
    
    // Clear the flag after a delay
    setTimeout(() => {
      buttonClickTimeoutRef.current = null;
    }, 500);
  }, []);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      buttonClickTimeoutRef.current = null;
    };
  }, []);
  
  const filteredTasks = tasks.filter(task => {
    if (!task) return false;
    
    // Apply active filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'completed' && task.status !== 'completed') return false;
      if (activeFilter === 'in_progress' && task.status !== 'in_progress') return false;
      if (activeFilter === 'to_do' && task.status !== 'to_do') return false;
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (task.title && task.title.toLowerCase().includes(term)) || 
        (task.description && task.description.toLowerCase().includes(term))
      );
    }
    
    return true;
  });
  
  const todoTasks = filteredTasks.filter(task => task.status === 'to_do' || task.status === 'backlog');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'in_progress');
  const completedTasks = filteredTasks.filter(task => task.status === 'completed');
  
  // Listen for real-time task updates via Socket.io
  useEffect(() => {
    if (!socketRef.current) return;
    
    // Listen for task updates from other users
    socketRef.current.on('task:update', (data) => {
      // Skip this update if we're the originator or if there's no data
      if (ignoreNextUpdateRef.current || !data) {
        ignoreNextUpdateRef.current = false;
        return;
      }
      
      // Handle different update formats
      if (data.task) {
        // If we get a full task object
        setTasks(prevTasks => {
          return prevTasks.map(t => 
            t._id === data.task._id ? { ...t, ...data.task } : t
          );
        });
        
        // If this task is currently selected, update it
        setSelectedTask(prevTask => 
          prevTask && prevTask._id === data.task._id 
            ? { ...prevTask, ...data.task }
            : prevTask
        );
        
        // Show notification for task update
        setToastMessage({
          message: `Task "${data.task.title}" was updated by ${data.updatedBy?.displayName || 'another user'}`,
          type: 'info',
          duration: 4000
        });
      } else if (data.taskId && data.update) {
        // If we get an update object
        setTasks(prevTasks => {
          return prevTasks.map(t => 
            t._id === data.taskId ? { ...t, ...data.update } : t
          );
        });
        
        // If this task is currently selected, update it
        setSelectedTask(prevTask => 
          prevTask && prevTask._id === data.taskId 
            ? { ...prevTask, ...data.update }
            : prevTask
        );
        
        // Display notification for automation-triggered updates
        if (data.automationTriggered && data.message) {
          // Show a toast notification
          setToastMessage({
            message: data.message,
            type: 'info',
            duration: 5000
          });
        }
      }
    });
    
    // Listen for new tasks
    socketRef.current.on('task:create', (data) => {
      if (!data || !data.task) return;
      
      // Add the new task to our local state
      setTasks(prevTasks => [...prevTasks, data.task]);
      
      // Show notification
      setToastMessage({
        message: `New task "${data.task.title}" was added by ${data.createdBy?.displayName || 'another user'}`,
        type: 'info',
        duration: 4000
      });
    });
    
    // Listen for deleted tasks
    socketRef.current.on('task:delete', (data) => {
      if (!data || !data.taskId) return;
      
      // Remove the task from our local state
      setTasks(prevTasks => prevTasks.filter(t => t._id !== data.taskId));
      
      // If this task is currently selected, close the modal
      if (selectedTask && selectedTask._id === data.taskId) {
        setSelectedTask(null);
      }
      
      // Show notification
      setToastMessage({
        message: `A task was deleted by ${data.deletedBy?.displayName || 'another user'}`,
        type: 'info',
        duration: 4000
      });
    });
    
    // Listen for automation events
    socketRef.current.on('project:automation', (data) => {
      if (data && data.message) {
        // Show a toast notification for the automation
        setToastMessage({
          message: data.message,
          type: 'automation',
          duration: 5000
        });
      }
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off('task:update');
        socketRef.current.off('task:create');
        socketRef.current.off('task:delete');
        socketRef.current.off('project:automation');
      }
    };
  }, [socketRef.current]);
  
  // State for toast notifications
  const [toastMessage, setToastMessage] = useState(null);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="linear-spinner"></div>
      </div>
    );
  }
  
    return (
    <div className="linear-fade-in">
        {error && (
        <div className="linear-card bg-red-50 border-red-200 mb-4 p-3 text-red-700 flex justify-between">
          <p>{error}</p>
          <button 
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700"
          >
            &times;
          </button>
          </div>
        )}
        
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleAddTaskClick}
            className="linear-btn linear-btn-primary flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Task
          </button>
          
          <div className="inline-flex rounded-md shadow-sm">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`linear-btn ${activeFilter === 'all' ? 'linear-btn-primary' : 'linear-btn-secondary'} rounded-r-none`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveFilter('to_do')}
              className={`linear-btn ${activeFilter === 'to_do' ? 'linear-btn-primary' : 'linear-btn-secondary'} rounded-none border-l-0 border-r-0`}
            >
              To Do
            </button>
            <button 
              onClick={() => setActiveFilter('in_progress')}
              className={`linear-btn ${activeFilter === 'in_progress' ? 'linear-btn-primary' : 'linear-btn-secondary'} rounded-none border-r-0`}
            >
              In Progress
            </button>
            <button 
              onClick={() => setActiveFilter('completed')}
              className={`linear-btn ${activeFilter === 'completed' ? 'linear-btn-primary' : 'linear-btn-secondary'} rounded-l-none`}
            >
              Completed
            </button>
          </div>
        </div>
        
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text"
            placeholder="Search tasks..."
            className="linear-input pl-9 pr-10 w-full focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button 
                onClick={() => setSearchTerm('')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* To Do Column */}
          <div className="linear-card">
            <div className="linear-card-header flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                <h3 className="font-medium">To Do</h3>
              </div>
              <span className="linear-badge linear-badge-secondary">{todoTasks.length}</span>
            </div>
            <Droppable droppableId="to_do">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="linear-card-body p-2 h-[calc(100vh-280px)] overflow-y-auto"
                >
                  {todoTasks.length > 0 ? (
                    todoTasks.map((task, index) => (
                    <Draggable key={task._id} draggableId={task._id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                            className="linear-card mb-2 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedTask(task)}
                        >
                            <div className="linear-card-body p-3">
                              <h4 className="text-sm font-medium mb-1">{task.title}</h4>
                          {task.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                              )}
                              <div className="flex items-center justify-between">
                                <span className={`linear-badge ${
                                  task.priority === 'high' ? 'linear-badge-danger' :
                                  task.priority === 'medium' ? 'linear-badge-warning' :
                                  'linear-badge-success'
                                }`}>
                                  {task.priority}
                                </span>
                                
                                {task.assignedTo && (
                                  <div className="linear-avatar linear-avatar-xs" title={task.assignedTo.displayName || 'User'}>
                                    {task.assignedTo.photo ? (
                                      <img src={task.assignedTo.photo} alt={task.assignedTo.displayName || 'User'} />
                                    ) : (
                                      <span>{task.assignedTo.displayName?.charAt(0) || '?'}</span>
                                    )}
                                    </div>
                                  )}
                                </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      No tasks
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
          
          {/* In Progress Column */}
          <div className="linear-card">
            <div className="linear-card-header flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <h3 className="font-medium">In Progress</h3>
              </div>
              <span className="linear-badge linear-badge-secondary">{inProgressTasks.length}</span>
            </div>
            <Droppable droppableId="in_progress">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="linear-card-body p-2 h-[calc(100vh-280px)] overflow-y-auto"
                >
                  {inProgressTasks.length > 0 ? (
                    inProgressTasks.map((task, index) => (
                    <Draggable key={task._id} draggableId={task._id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                            className="linear-card mb-2 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedTask(task)}
                        >
                            <div className="linear-card-body p-3">
                              <h4 className="text-sm font-medium mb-1">{task.title}</h4>
                          {task.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                              )}
                              <div className="flex items-center justify-between">
                                <span className={`linear-badge ${
                                  task.priority === 'high' ? 'linear-badge-danger' :
                                  task.priority === 'medium' ? 'linear-badge-warning' :
                                  'linear-badge-success'
                                }`}>
                                  {task.priority}
                                </span>
                                
                                {task.assignedTo && (
                                  <div className="linear-avatar linear-avatar-xs" title={task.assignedTo.displayName || 'User'}>
                                    {task.assignedTo.photo ? (
                                      <img src={task.assignedTo.photo} alt={task.assignedTo.displayName || 'User'} />
                                    ) : (
                                      <span>{task.assignedTo.displayName?.charAt(0) || '?'}</span>
                                    )}
                                    </div>
                                  )}
                                </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      No tasks
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
          
          {/* Completed Column */}
          <div className="linear-card">
            <div className="linear-card-header flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <h3 className="font-medium">Completed</h3>
              </div>
              <span className="linear-badge linear-badge-secondary">{completedTasks.length}</span>
            </div>
            <Droppable droppableId="completed">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="linear-card-body p-2 h-[calc(100vh-280px)] overflow-y-auto"
                >
                  {completedTasks.length > 0 ? (
                    completedTasks.map((task, index) => (
                    <Draggable key={task._id} draggableId={task._id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                            className="linear-card mb-2 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedTask(task)}
                        >
                            <div className="linear-card-body p-3">
                              <h4 className="text-sm font-medium mb-1 line-through text-gray-500">{task.title}</h4>
                          {task.description && (
                                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{task.description}</p>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="linear-badge linear-badge-success">
                                  Completed
                                </span>
                                
                                {task.assignedTo && (
                                  <div className="linear-avatar linear-avatar-xs" title={task.assignedTo.displayName || 'User'}>
                                    {task.assignedTo.photo ? (
                                      <img src={task.assignedTo.photo} alt={task.assignedTo.displayName || 'User'} />
                                    ) : (
                                      <span>{task.assignedTo.displayName?.charAt(0) || '?'}</span>
                                    )}
                                    </div>
                                  )}
                                </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      No completed tasks
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>
      
      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="linear-modal-overlay">
          <div className="linear-modal">
            <div className="linear-card">
              <div className="linear-card-header flex justify-between">
                <h3 className="font-medium">Create Task</h3>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
        <CreateTaskModal 
          projectId={project._id}
          onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreateTask}
                projectMembers={project.members || []}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="linear-modal-overlay">
          <div className="linear-modal">
            <TaskDetailModal 
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onUpdate={(updatedData) => handleUpdateTask(selectedTask._id, updatedData)}
              onDelete={() => handleDeleteTask(selectedTask._id)}
              projectMembers={project.members || []}
            />
          </div>
        </div>
      )}
      
      {/* Toast Message */}
      {toastMessage && (
        <div 
          className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 max-w-md transition-opacity duration-300 ${
            toastMessage.type === 'automation' 
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
              : toastMessage.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
          }`}
        >
          <div className="flex items-start">
            {toastMessage.type === 'automation' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            <div>
              <p className="font-medium">{toastMessage.message}</p>
            </div>
            <button 
              className="ml-4 text-sm font-medium focus:outline-none flex-shrink-0"
              onClick={() => setToastMessage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
