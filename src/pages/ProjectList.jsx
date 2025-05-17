import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProjectCard from '../components/ProjectCard';
import CreateProjectModal from '../components/CreateProjectModal';

const ProjectList = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  useEffect(() => {
    fetchProjects();
  }, []);
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/projects');
      setProjects(res.data.projects);
      setError('');
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateProject = async (projectData) => {
    try {
      const res = await axios.post('/api/projects', projectData);
      setProjects([...projects, res.data.project]);
      setShowCreateModal(false);
      return { success: true };
    } catch (err) {
      console.error('Error creating project:', err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Failed to create project' 
      };
    }
  };
  
  if (loading) {
    return <div className="loader"></div>;
  }
  
  return (
    <div className="project-list-container">
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowCreateModal(true)}
        >
          <svg className="icon mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          New Project
        </button>
      </div>
      
      {error && <div className="alert-error">{error}</div>}
      
      {projects.length > 0 ? (
        <div className="project-list">
          {projects.map(project => (
            <ProjectCard 
              key={project._id} 
              project={project} 
              currentUser={user}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <svg className="icon-xl mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <h2 className="empty-state-title">No projects found</h2>
          <p className="empty-state-description">
            You haven't created any projects yet. Create your first project to get started.
          </p>
          <button 
            className="btn btn-primary mt-4" 
            onClick={() => setShowCreateModal(true)}
          >
            Create Project
          </button>
        </div>
      )}
      
      {showCreateModal && (
        <CreateProjectModal 
          onClose={() => setShowCreateModal(false)} 
          onCreate={handleCreateProject}
        />
      )}
    </div>
  );
};

export default ProjectList;
