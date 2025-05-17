import React, { useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';

const CreateProjectModal = ({ onClose }) => {
  const { createProject, refreshProjects } = useContext(ProjectContext);
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You need to be logged in to create a project');
        setLoading(false);
        return;
      }
      
      if (!form.name || form.name.trim() === '') {
        setError('Project name is required');
        setLoading(false);
        return;
      }
      
      console.log('Creating project with data:', form);
      const result = await createProject(form);
      
      console.log('Create project result:', result);
      
      if (result.success) {
        refreshProjects();
        onClose();
      } else {
        setError(result.message || 'Failed to create project');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        setError(err.response.data?.message || 'Failed to create project');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Create New Project</h2>
          <button onClick={onClose} className="btn-close">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Project Name</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Enter project name"
              value={form.name}
              onChange={handleChange}
              required
              className="input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Enter project description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              className="input"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="color">Project Color</label>
              <div className="color-picker">
                <input
                  id="color"
                  type="color"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  className="input-color"
                />
                <span className="color-value">{form.color}</span>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                id="dueDate"
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
