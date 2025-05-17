import React, { useState, useContext } from 'react';
import TaskDetailModal from './TaskDetailModal';
import { ThemeContext } from '../context/ThemeContext';

const TaskCard = ({ task, updateStatus, deleteTask }) => {
  const { darkMode } = useContext(ThemeContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const handleStatusChange = (e) => {
    e.stopPropagation();
    updateStatus(task._id, e.target.value);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    deleteTask(task._id);
  };
  
  const handleDropdownToggle = (e) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-800';
      case 'Medium':
        return darkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800';
      default:
        return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <>
      <div 
        className={`task-card dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 ${
          task.status === 'completed' ? 'completed' : ''
        }`}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="task-card-header">
          <h3 className={`task-title ${
            task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'
          }`}>
            {task.title}
          </h3>
          
          <div className="relative">
            <button
              onClick={handleDropdownToggle}
              className="btn-icon dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-10">
                <div className="py-1 dark:bg-gray-800">
                  {/* ... dropdown menu items ... */}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {task.description && (
          <p className="task-description text-gray-600 dark:text-gray-400">
            {task.description.length > 75 
              ? task.description.slice(0, 75) + '...' 
              : task.description}
          </p>
        )}
        
        <div className="task-card-footer">
          <div className="flex flex-wrap gap-2 mt-3">
            {task.priority && (
              <span className={`priority-badge ${task.priority.toLowerCase()} dark:bg-opacity-20`}>
                {task.priority}
              </span>
            )}
            
            <span className={`status-badge ${task.status.toLowerCase().replace(/_/g, '-')} dark:bg-opacity-20`}>
              {formatStatus(task.status)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 mt-3">
            {task.dueDate && (
              <div className={`task-due-date ${
                new Date(task.dueDate) < new Date() && task.status !== 'completed' 
                  ? 'overdue' : ''
              }`}>
                <span className="text-xs dark:text-gray-400">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {task.assignee && (
              <div className="task-assignee">
                <div className="avatar avatar-xs bg-primary-600 dark:bg-primary-500">
                  <span className="avatar-text-xs">
                    {task.assignee.displayName?.charAt(0) || '?'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isModalOpen && (
        <TaskDetailModal 
          task={task} 
          onClose={() => setIsModalOpen(false)}
          updateStatus={updateStatus}
          deleteTask={deleteTask}
        />
      )}
    </>
  );
};

export default TaskCard;
