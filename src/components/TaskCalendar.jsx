import React, { useState } from 'react';
import TaskDetailModal from './TaskDetailModal';

const TaskCalendar = ({ tasks, updateStatus, deleteTask }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Create array of day numbers for the month
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Create array for empty cells before first day of month
  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => null);
  
  // Combine empty cells and days
  const calendarDays = [...emptyCells, ...days];
  
  // Group tasks by date
  const tasksByDate = tasks.reduce((acc, task) => {
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const year = dueDate.getFullYear();
      const month = dueDate.getMonth();
      const day = dueDate.getDate();
      
      // Only include tasks for the current month and year
      if (year === currentYear && month === currentMonth) {
        if (!acc[day]) {
          acc[day] = [];
        }
        acc[day].push(task);
      }
    }
    return acc;
  }, {});
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Format month and year
  const monthYearFormat = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);
  
  return (
    <div className="task-calendar-container">
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button 
            onClick={goToPreviousMonth}
            className="btn btn-sm btn-secondary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <h3 className="calendar-title">{monthYearFormat}</h3>
          <button 
            onClick={goToNextMonth}
            className="btn btn-sm btn-secondary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <button 
          onClick={goToToday}
          className="btn btn-sm btn-primary"
        >
          Today
        </button>
      </div>
      
      <div className="calendar-grid">
        <div className="calendar-weekdays">
          <div className="weekday">Sun</div>
          <div className="weekday">Mon</div>
                    <div className="weekday">Tue</div>
          <div className="weekday">Wed</div>
          <div className="weekday">Thu</div>
          <div className="weekday">Fri</div>
          <div className="weekday">Sat</div>
        </div>
        
        <div className="calendar-days">
          {calendarDays.map((day, index) => {
            const isToday = day && 
              currentYear === new Date().getFullYear() && 
              currentMonth === new Date().getMonth() && 
              day === new Date().getDate();
            
            const dayTasks = day ? tasksByDate[day] || [] : [];
            
            return (
              <div 
                key={index} 
                className={`calendar-cell ${!day ? 'empty-cell' : ''} ${isToday ? 'today' : ''}`}
              >
                {day && (
                  <>
                    <div className="day-number">{day}</div>
                    <div className="day-tasks">
                      {dayTasks.slice(0, 3).map(task => (
                        <div 
                          key={task._id}
                          onClick={() => setSelectedTask(task)}
                          className={`calendar-task ${task.status.toLowerCase().replace(' ', '-')}`}
                        >
                          <div className={`task-priority-indicator ${task.priority?.toLowerCase()}`}></div>
                          <span className="task-title">{task.title}</span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="more-tasks">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
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

export default TaskCalendar;
