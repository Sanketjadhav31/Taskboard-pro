import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import CreateProjectModal from '../components/CreateProjectModal';
import { ProjectContext } from '../context/ProjectContext';

const Projects = () => {
  const { projects, loading, error, refreshProjects } = useContext(ProjectContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [localError, setLocalError] = useState('');
  
  // Only trigger project fetch once when component mounts
  useEffect(() => {
    refreshProjects();
    // Clear any local errors when component is mounted
    setLocalError('');
  }, []);
  
  // Handle project creation modal close - refresh projects
  const handleModalClose = () => {
    setIsModalOpen(false);
    refreshProjects(); // Refresh projects when modal is closed
  };
  
  const filteredProjects = Array.isArray(projects) ? projects.filter(project => {
    if (!project) return false;
    
    // Apply search filter
    const matchesSearch = project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter
    if (filter === 'all') return matchesSearch;
    if (filter === 'active') {
      return matchesSearch && !project.isCompleted;
    }
    if (filter === 'completed') {
      return matchesSearch && project.isCompleted;
    }
    
    return matchesSearch;
  }) : [];
  
  // Create a retry handler
  const handleRetry = () => {
    setLocalError('');
    refreshProjects();
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="linear-spinner"></div>
        <p className="text-gray-600 mt-4">Loading projects...</p>
      </div>
    );
  }
  
  return (
    <div className="linear-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="linear-btn linear-btn-primary flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Project
        </button>
      </div>
      
      {(error || localError) && (
        <div className="linear-card mb-6 bg-red-50 border-red-200 text-red-700">
          <div className="linear-card-body flex justify-between items-center">
            <p>{error || localError}</p>
            <button 
              onClick={handleRetry}
              className="linear-btn linear-btn-sm linear-btn-danger"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div className="relative w-full md:w-64 lg:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="linear-input pl-10 w-full"
          />
        </div>
        
        <div className="inline-flex rounded-md shadow-sm">
          <button 
            onClick={() => setFilter('all')}
            className={`linear-btn ${filter === 'all' ? 'linear-btn-primary' : 'linear-btn-secondary'} rounded-r-none`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('active')}
            className={`linear-btn ${filter === 'active' ? 'linear-btn-primary' : 'linear-btn-secondary'} rounded-none border-l-0 border-r-0`}
          >
            Active
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`linear-btn ${filter === 'completed' ? 'linear-btn-primary' : 'linear-btn-secondary'} rounded-l-none`}
          >
            Completed
          </button>
        </div>
      </div>
      
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <Link to={`/projects/${project._id}`} key={project._id} className="linear-card hover:shadow-md transition-all duration-200">
              <div className="linear-card-body p-0">
                <div 
                  className="h-2 w-full rounded-t-lg" 
                  style={{ backgroundColor: project.color || '#6366f1' }}
                ></div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      <span>{project.tasks?.length || 0} Tasks</span>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      <span>{project.members?.length || 0} Members</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-5">
                    {project.dueDate && (
                      <div className="flex items-center text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">Due {new Date(project.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {project.isCompleted && (
                      <span className="linear-badge linear-badge-success flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Completed</span>
                      </span>
                    )}
                    
                    {!project.dueDate && !project.isCompleted && (
                      <div className="h-4"></div>
                    )}
                    
                    <div className="flex -space-x-2">
                      {project.members && project.members.slice(0, 3).map((member, index) => (
                        <div key={member._id || index} className="linear-avatar linear-avatar-sm">
                          {member.photo ? (
                            <img src={member.photo} alt={member.displayName} />
                          ) : (
                            <span>{member.displayName ? member.displayName.charAt(0) : '?'}</span>
                          )}
                        </div>
                      ))}
                      {project.members && project.members.length > 3 && (
                        <div className="linear-avatar linear-avatar-sm bg-gray-200 text-gray-600">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {project.progress !== undefined && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-primary-500 h-1.5 rounded-full" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="linear-card">
          <div className="linear-card-body flex flex-col items-center justify-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">No projects found</h3>
            <p className="text-gray-500 text-center mt-2 max-w-md">
              {searchQuery || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first project'}
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="linear-btn linear-btn-primary mt-6 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Project
            </button>
          </div>
        </div>
      )}
      
      {isModalOpen && (
        <div className="linear-modal-overlay">
          <div className="linear-modal">
            <CreateProjectModal 
              onClose={handleModalClose}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;

