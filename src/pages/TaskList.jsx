import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';

const TaskList = () => {
  const { darkMode } = useContext(ThemeContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get('/api/tasks');
        setTasks(response.data);
      } catch (err) {
        setError('Failed to load tasks');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);
  
  if (loading) {
    return <div className="loading dark:text-gray-300">Loading tasks...</div>;
  }
  
  if (error) {
    return <div className="error dark:text-red-400">{error}</div>;
  }
  
  return (
    <div className="task-list dark:bg-gray-800 dark:border-gray-700">
      <div className="task-list-header dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700">
        <div>Title</div>
        <div>Assignee</div>
        <div>Status</div>
        <div>Priority</div>
        <div>Due Date</div>
        <div>Actions</div>
      </div>
      
      {tasks.map(task => (
        <div 
          key={task._id} 
          className="task-list-item dark:border-gray-700 dark:text-gray-200"
        >
          <div className="task-list-title dark:text-gray-200">{task.title}</div>
          <div className="task-list-assignee">
            {task.assignee ? (
              <div className="avatar-xs dark:bg-gray-700 dark:text-gray-300">
                {task.assignee.name.charAt(0)}
              </div>
            ) : (
              <span className="unassigned dark:text-gray-400">Unassigned</span>
            )}
          </div>
          <div>
            <span className={`status-badge ${task.status.toLowerCase()} dark:bg-opacity-20`}>
              {task.status}
            </span>
          </div>
          <div>
            <span className={`priority-badge ${task.priority.toLowerCase()} dark:bg-opacity-20`}>
              {task.priority}
            </span>
          </div>
          <div className="task-list-due-date dark:text-gray-400">
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
          </div>
          <div className="task-list-actions">
            <button className="action-btn dark:text-gray-400 dark:hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button className="action-btn dark:text-gray-400 dark:hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList; 