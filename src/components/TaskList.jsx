import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TaskDetailModal from './TaskDetailModal';

const TaskList = ({ tasks, updateStatus, deleteTask }) => {
  const [selectedTask, setSelectedTask] = useState(null);
    const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'priority':
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'assignee':
        const aName = a.assignee?.displayName || '';
        const bName = b.assignee?.displayName || '';
        comparison = aName.localeCompare(bName);
        break;
      case 'dueDate':
        const aDate = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
        const bDate = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
        comparison = aDate - bDate;
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return (
    <div className="task-list-container">
      <div className="list-header">
        <div className="search-box">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        
        <div className="task-count">
          {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
        </div>
      </div>
      
      <div className="task-table-container">
        <table className="task-table">
          <thead>
            <tr>
              <th 
                onClick={() => handleSort('title')}
                className={`sortable-header ${sortBy === 'title' ? 'sorted' : ''}`}
              >
                Title
                {sortBy === 'title' && (
                  <span className="sort-icon">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('status')}
                className={`sortable-header ${sortBy === 'status' ? 'sorted' : ''}`}
              >
                Status
                {sortBy === 'status' && (
                  <span className="sort-icon">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('priority')}
                className={`sortable-header ${sortBy === 'priority' ? 'sorted' : ''}`}
              >
                Priority
                {sortBy === 'priority' && (
                  <span className="sort-icon">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('assignee')}
                className={`sortable-header ${sortBy === 'assignee' ? 'sorted' : ''}`}
              >
                Assignee
                {sortBy === 'assignee' && (
                  <span className="sort-icon">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('dueDate')}
                className={`sortable-header ${sortBy === 'dueDate' ? 'sorted' : ''}`}
              >
                Due Date
                {sortBy === 'dueDate' && (
                  <span className="sort-icon">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.length > 0 ? (
              sortedTasks.map(task => (
                <tr key={task._id} className={task.status === 'Done' ? 'completed-task' : ''}>
                  <td>
                    <div 
                      className="task-title-cell"
                      onClick={() => setSelectedTask(task)}
                    >
                      {task.title}
                    </div>
                  </td>
                  <td>
                    <select
                      value={task.status}
                      onChange={(e) => updateStatus(task._id, e.target.value)}
                      className={`status-select ${task.status.toLowerCase().replace(' ', '-')}`}
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </td>
                  <td>
                    <span className={`priority-badge ${task.priority?.toLowerCase()}`}>
                      {task.priority || 'None'}
                    </span>
                  </td>
                  <td>
                    {task.assignee ? (
                      <div className="flex items-center">
                        <div className="avatar-xs mr-2">
                          {task.assignee.photo ? (
                            <img src={task.assignee.photo} alt={task.assignee.displayName} />
                          ) : (
                            <div className="avatar-text-xs">
                              {task.assignee.displayName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span>{task.assignee.displayName}</span>
                      </div>
                    ) : (
                      <span className="txt-gray">Unassigned</span>
                    )}
                  </td>
                  <td>
                    {task.dueDate ? (
                      <span className={`due-date ${new Date(task.dueDate) < new Date() && task.status !== 'Done' ? 'overdue' : ''}`}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="txt-gray">No due date</span>
                    )}
                  </td>
                  <td>
                    <div className="task-actions">
                      <button 
                        onClick={() => setSelectedTask(task)}
                        className="btn-icon"
                        title="View Details"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => deleteTask(task._id)}
                        className="btn-icon text-red-600"
                        title="Delete Task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-table-message">
                  {searchQuery 
                    ? 'No tasks match your search criteria'
                    : 'No tasks found in this project'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          updateStatus={updateStatus}
          deleteTask={deleteTask}
        />
      )}
    </div>
  );
};

export default TaskList;
