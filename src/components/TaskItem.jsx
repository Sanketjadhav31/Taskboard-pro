import React, { useState, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const TaskItem = ({ task, onStatusChange, onDeleteTask, onViewDetails }) => {
  const { darkMode } = useContext(ThemeContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const handleStatusChange = (e) => {
    e.stopPropagation();
    onStatusChange(task._id, e.target.value);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDeleteTask(task._id);
    }
  };
  
  return (
    <div 
      className="linear-list-item dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" 
      onClick={() => onViewDetails(task)}
    >
      <div className="linear-list-item-content">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={task.status === 'completed'}
            onChange={(e) => {
              e.stopPropagation();
              onStatusChange(task._id, task.status === 'completed' ? 'to_do' : 'completed');
            }}
            className="mr-3 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <h3 className={`font-medium ${
            task.status === 'completed' 
              ? 'line-through text-gray-500 dark:text-gray-400' 
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {task.title}
          </h3>
        </div>
        
        {task.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {task.description.length > 100 
              ? task.description.substring(0, 100) + '...' 
              : task.description}
          </p>
        )}
        
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {task.priority && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
              ${task.priority === 'High' 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                : task.priority === 'Medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              }`}
            >
              {task.priority}
            </span>
          )}
          
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
            ${task.status === 'completed' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
              : task.status === 'in_progress'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {task.status === 'to_do' 
              ? 'To Do' 
              : task.status === 'in_progress' 
              ? 'In Progress' 
              : task.status === 'completed'
              ? 'Completed'
              : task.status}
          </span>
          
          {task.dueDate && (
            <span className={`text-xs ${
              new Date(task.dueDate) < new Date() && task.status !== 'completed'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
          
          {task.assignee && (
            <div className="flex items-center gap-1">
              <div className="h-5 w-5 rounded-full bg-primary-600 dark:bg-primary-700 flex items-center justify-center">
                <span className="text-xs text-white">
                  {task.assignee.displayName?.charAt(0) || '?'}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {task.assignee.displayName}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="linear-list-item-actions">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className="linear-btn linear-btn-icon dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(task);
                    setIsDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  View Details
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle edit functionality
                    setIsDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem; 