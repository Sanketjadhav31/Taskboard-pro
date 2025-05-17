import React, { useContext } from 'react';
import TaskCard from './TaskCard';
import { ThemeContext } from '../context/ThemeContext';

const TaskColumn = ({ status, tasks, onDragStart, onDragOver, onDrop }) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div 
      className="col dark:bg-gray-800 dark:border-gray-700"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      <div className="col-header dark:border-gray-700">
        <h3 className="txt-sm font-bold dark:text-gray-200">{status} ({tasks.length})</h3>
      </div>
      
      <div className="col-body">
        {tasks.map(task => (
          <TaskCard 
            key={task._id}
            task={task}
            onDragStart={onDragStart}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="empty-col txt-center txt-gray p-4 dark:text-gray-400 dark:border-gray-700">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskColumn;
