import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';

const TaskDetailModal = ({ task, onClose, onUpdate, onDelete, projectMembers = [] }) => {
  const { darkMode } = useContext(ThemeContext);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'to_do',
    priority: task.priority || 'medium',
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    assignedTo: task.assignedTo?._id || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Update form if task changes
  useEffect(() => {
    setForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'to_do',
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assignedTo: task.assignedTo?._id || ''
    });
  }, [task]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Format form data to match API expectations
      const updatedData = {
        ...form,
        // Convert empty strings to null for API
        assignedTo: form.assignedTo || null,
        dueDate: form.dueDate || null
      };
      
      // Convert priority to lowercase if needed by API
      if (typeof updatedData.priority === 'string') {
        updatedData.priority = updatedData.priority.toLowerCase();
      }
      
      console.log('Submitting task update:', updatedData);
      
      if (onUpdate) {
        await onUpdate(updatedData);
      }
      
      // Close modal after successful update
      onClose();
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.response?.data?.message || 'Failed to update task. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setLoading(true);
      try {
        if (onDelete) {
          await onDelete();
        }
        onClose();
      } catch (err) {
        console.error('Error deleting task:', err);
        setError(err.response?.data?.message || 'Failed to delete task. Please try again.');
        setLoading(false);
      }
    }
  };
  
  // Format the status display text
  const formatStatusDisplay = (status) => {
    if (!status) return 'To Do';
    
    switch(status.toLowerCase()) {
      case 'to_do':
        return 'To Do';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'backlog':
        return 'Backlog';
      case 'done':
        return 'Completed';
      case 'todo':
        return 'To Do';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl mx-auto rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
        <div className="absolute top-0 right-0 p-4">
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 dark:bg-gray-800">
          <div className="modal-header dark:border-gray-700">
            <h2 className="modal-title dark:text-gray-100">
              {isEditing ? 'Edit Task' : 'Task Details'}
            </h2>
          </div>
          
          {error && (
            <div className="alert-error dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 p-3 mb-4 rounded-md">
              {error}
            </div>
          )}
          
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title" className="dark:text-gray-300">Title</label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description" className="dark:text-gray-300">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  className="input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                ></textarea>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status" className="dark:text-gray-300">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  >
                    <option value="to_do">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="backlog">Backlog</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="priority" className="dark:text-gray-300">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dueDate" className="dark:text-gray-300">Due Date</label>
                  <input
                    id="dueDate"
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                    className="input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="assignedTo" className="dark:text-gray-300">Assignee</label>
                  <select
                    id="assignedTo"
                    name="assignedTo"
                    value={form.assignedTo}
                    onChange={handleChange}
                    className="input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map(member => (
                      <option key={member._id} value={member._id}>
                        {member.displayName || member.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="modal-footer dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary dark:bg-primary-600 dark:hover:bg-primary-700"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="task-details dark:bg-gray-800">
              <div className="task-header">
                <h3 className="task-title dark:text-gray-100">{task.title}</h3>
                <div className="task-badges">
                  <span className={`status-badge ${(task.status || 'to_do').toLowerCase().replace(' ', '-')} dark:bg-opacity-20`}>
                    {formatStatusDisplay(task.status)}
                  </span>
                  {task.priority && (
                    <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  )}
                </div>
              </div>
              
              {task.description && (
                <div className="task-section">
                  <h4 className="section-title dark:text-gray-400">Description</h4>
                  <p className="task-description dark:text-gray-300">{task.description}</p>
                </div>
              )}
              
              <div className="task-meta dark:bg-gray-700">
                <div className="meta-row">
                  <div className="meta-label dark:text-gray-400">Assignee</div>
                  <div className="meta-value dark:text-gray-300">
                    {task.assignedTo ? (
                      <div className="assignee-info">
                        <div className="avatar-sm dark:bg-gray-600 dark:text-gray-300">
                          {task.assignedTo.photo ? (
                            <img src={task.assignedTo.photo} alt={task.assignedTo.displayName || 'User'} />
                          ) : (
                            <div className="avatar-text-sm">
                              {task.assignedTo.displayName?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <span>{task.assignedTo.displayName || 'User'}</span>
                      </div>
                    ) : (
                      <span className="txt-gray dark:text-gray-400">Unassigned</span>
                    )}
                  </div>
                </div>
                
                <div className="meta-row">
                  <div className="meta-label dark:text-gray-400">Due Date</div>
                  <div className="meta-value dark:text-gray-300">
                    {task.dueDate ? (
                      <span className={new Date(task.dueDate) < new Date() && task.status !== 'completed' && task.status !== 'done' ? 'overdue' : ''}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="txt-gray dark:text-gray-400">No due date</span>
                    )}
                  </div>
                </div>
                
                <div className="meta-row">
                  <div className="meta-label dark:text-gray-400">Created</div>
                  <div className="meta-value dark:text-gray-300">
                    {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </div>
              
              <div className="modal-footer dark:border-gray-700 mt-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="btn btn-danger dark:bg-red-800 dark:hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
