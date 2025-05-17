import React, { useState } from 'react';
import CreateProjectModal from './CreateProjectModal';

const EmptyState = ({ setProjects }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <svg xmlns="http://www.w3.org/2000/svg" className="icon-xl mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <h2 className="text-xl font-bold mb-2">No projects yet</h2>
        <p className="txt-gray mb-6">
          Get started by creating your first project to organize your tasks and collaborate with your team.
        </p>
        <button 
          onClick={() => setIsOpen(true)}
          className="btn btn-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create Project
        </button>
      </div>
      
      {isOpen && (
        <CreateProjectModal 
          onClose={() => setIsOpen(false)} 
          setProjects={setProjects}
        />
      )}
    </div>
  );
};

export default EmptyState;
