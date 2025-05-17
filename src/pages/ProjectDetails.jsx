import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import TaskBoard from '../components/TaskBoard';
import { ProjectContext } from '../context/ProjectContext';
import { AuthContext } from '../context/AuthContext';
import Chat from '../components/Chat';
import { ThemeContext } from '../context/ThemeContext';
import ProjectMembers from '../components/ProjectMembers';
import ProjectAutomations from '../components/ProjectAutomations';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProject, updateProject, deleteProject, addTeamMember, removeTeamMember } = useContext(ProjectContext);
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('board'); // board, list, calendar
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    dueDate: '',
    isCompleted: false
  });
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  });
  const [activeTab, setActiveTab] = useState('tasks');
  
  useEffect(() => {
    fetchProjectDetails();
    
    // Check if there's a stored active tab in localStorage
    const storedTab = localStorage.getItem('activeProjectTab');
    if (storedTab) {
      setActiveTab(storedTab);
      localStorage.removeItem('activeProjectTab'); // Clear it after use
    }
  }, [id]);
  
  useEffect(() => {
    if (project && project.tasks) {
      // Calculate task statistics
      const stats = {
        total: project.tasks.length,
        completed: project.tasks.filter(t => t.status === 'completed').length,
        inProgress: project.tasks.filter(t => t.status === 'in_progress').length,
        pending: project.tasks.filter(t => t.status === 'to_do' || t.status === 'backlog').length
      };
      setTaskStats(stats);
    }
  }, [project]);
  
  const fetchProjectDetails = async () => {
      try {
        setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authorization required. Please log in again.');
        setLoading(false);
        return;
      }
      
      const result = await getProject(id);
      
      if (result.success) {
        setProject(result.project);
        // Initialize the form with project data
        setForm({
          name: result.project.name || '',
          description: result.project.description || '',
          color: result.project.color || '#6366f1',
          dueDate: result.project.dueDate ? new Date(result.project.dueDate).toISOString().split('T')[0] : '',
          isCompleted: result.project.isCompleted || false
        });
      } else {
        setError(result.message || 'Failed to load project');
      }
      } catch (err) {
      console.error('Error in fetchProjectDetails:', err);
      setError('Failed to load project. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const result = await updateProject(id, form);
      
      if (result.success) {
        setProject(result.project);
      setIsEditing(false);
      } else {
        setError(result.message || 'Failed to update project');
      }
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const result = await deleteProject(id);
      
      if (result.success) {
        navigate('/projects', { replace: true });
      } else {
        setError(result.message || 'Failed to delete project');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!newMemberEmail.trim()) return;
    
    try {
      setAddMemberLoading(true);
      setAddMemberError('');
      
      const result = await addTeamMember(id, newMemberEmail);
      
      if (result.success) {
        // Refresh project details to get updated member list
        await fetchProjectDetails();
        setShowAddMemberModal(false);
        setNewMemberEmail('');
      } else {
        setAddMemberError(result.message || 'Failed to add team member');
      }
    } catch (err) {
      console.error('Error adding team member:', err);
      setAddMemberError('Failed to add team member. Please try again.');
    } finally {
      setAddMemberLoading(false);
    }
  };
  
  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const result = await removeTeamMember(id, userId);
      
      if (result.success) {
        // Refresh project details to get updated member list
        await fetchProjectDetails();
      } else {
        setError(result.message || 'Failed to remove team member');
      }
    } catch (err) {
      console.error('Error removing team member:', err);
      setError('Failed to remove team member. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !project) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="linear-spinner"></div>
      </div>
    );
  }
  
  if (error && !project) {
    return (
      <div className="linear-card p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-xl font-bold mb-2">Error Loading Project</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link 
          to="/projects"
          className="linear-btn linear-btn-primary"
        >
          Back to Projects
        </Link>
      </div>
    );
  }
  
  if (!project) return null;
  
  const getProgressPercentage = () => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    
    // If project is marked as completed, always return 100%
    if (project.isCompleted) return 100;
    
    // Calculate based on completed tasks
    return Math.round((taskStats.completed / taskStats.total) * 100);
  };
  
  return (
    <div className="linear-fade-in">
      {error && (
        <div className="linear-card bg-red-50 border-red-200 mb-4 p-3 text-red-700">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            &times;
          </button>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center">
          <Link 
            to="/projects"
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <span 
                className="inline-block w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: project.color || '#6366f1' }}
              ></span>
              {project.name}
            </h1>
            {!isEditing && project.description && (
              <p className="text-gray-600 mt-1">{project.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="linear-btn linear-btn-secondary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button 
                onClick={handleDelete}
                className="linear-btn linear-btn-danger"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </>
          )}
        </div>
      </div>
          
          {isEditing ? (
        <div className="linear-card mb-6">
          <div className="linear-card-header">
            <h3 className="font-semibold">Edit Project</h3>
          </div>
          <div className="linear-card-body">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="block text-sm font-medium mb-1">Project Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="linear-input w-full"
                    placeholder="Project name"
                  />
                </div>
                
                <div className="form-group">
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <div className="flex items-center">
                  <input
                    type="color"
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                      className="h-10 w-10 rounded-md cursor-pointer"
                  />
                    <span className="ml-2 text-gray-600">{form.color}</span>
                  </div>
                </div>
              </div>
              
              <div className="form-group mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="linear-input w-full"
                  placeholder="Project description"
                  rows="3"
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                    className="linear-input w-full"
                  />
                </div>
                
                <div className="form-group flex items-center h-full pt-6">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isCompleted"
                      checked={form.isCompleted}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-primary-600 rounded"
                    />
                    <span className="ml-2 text-gray-700">Mark project as completed</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="linear-btn linear-btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="linear-btn linear-btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="linear-card">
              <div className="linear-card-body flex items-center">
                <div className="rounded-full bg-primary-100 p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Total Tasks</div>
                  <div className="text-xl font-bold">{taskStats.total}</div>
                </div>
              </div>
            </div>
            
            <div className="linear-card">
              <div className="linear-card-body flex items-center">
                <div className="rounded-full bg-green-100 p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Completed</div>
                  <div className="text-xl font-bold">{taskStats.completed}</div>
                </div>
              </div>
                  </div>
            
            <div className="linear-card">
              <div className="linear-card-body flex items-center">
                <div className="rounded-full bg-blue-100 p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">In Progress</div>
                  <div className="text-xl font-bold">{taskStats.inProgress}</div>
                </div>
              </div>
                </div>
                
            <div className="linear-card">
              <div className="linear-card-body flex items-center">
                <div className="rounded-full bg-gray-100 p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Pending</div>
                  <div className="text-xl font-bold">{taskStats.pending}</div>
                </div>
              </div>
            </div>
          </div>
        
          <div className="linear-card mb-6">
            <div className="linear-card-body">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Project Progress</div>
                  <div className={`text-lg font-bold ${getProgressPercentage() === 100 ? 'text-green-600 dark:text-green-400' : ''}`}>
                    {getProgressPercentage()}%
                    {getProgressPercentage() === 100 && 
                      <span className="ml-2 text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                        Completed
                      </span>
                    }
                  </div>
                </div>
                
                <div className="flex items-center">
                  {project.dueDate && (
                    <div className="text-sm mr-4">
                      <span className="text-gray-500 mr-1">Due:</span>
                      <span className="font-medium">{new Date(project.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
                  
                  {project.isCompleted ? (
                    <span className="linear-badge linear-badge-success">Completed</span>
                  ) : (
                    <span className="linear-badge linear-badge-primary">Active</span>
                  )}
                </div>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ease-in-out ${
                    getProgressPercentage() === 100 ? 'bg-green-600 dark:bg-green-500' : 'bg-primary-600 dark:bg-primary-500'
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </>
        )}
      
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          className={`pb-4 px-6 font-medium text-sm ${
            activeTab === 'tasks' 
            ? 'border-b-2 border-primary-600 text-primary-600' 
            : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
        </button>
        <button 
          className={`pb-4 px-6 font-medium text-sm ${
            activeTab === 'team' 
            ? 'border-b-2 border-primary-600 text-primary-600' 
            : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('team')}
        >
          Team ({project.members?.length || 0})
        </button>
        <button 
          className={`pb-4 px-6 font-medium text-sm ${
            activeTab === 'chat' 
            ? 'border-b-2 border-primary-600 text-primary-600' 
            : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button 
          className={`pb-4 px-6 font-medium text-sm ${
            activeTab === 'automations' 
            ? 'border-b-2 border-primary-600 text-primary-600' 
            : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('automations')}
        >
          Automations
        </button>
      </div>
      
      {activeTab === 'tasks' ? (
        <TaskBoard project={project} onTaskUpdate={fetchProjectDetails} />
      ) : activeTab === 'team' ? (
        <>
          {project.members && project.members.length > 0 ? (
            <ProjectMembers project={project} currentUser={user} />
          ) : (
            <div className="linear-card p-6 text-center dark:bg-gray-800 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No team members yet.</p>
              <button 
                onClick={() => setShowAddMemberModal(true)}
                className="linear-btn linear-btn-primary dark:bg-primary-600 dark:hover:bg-primary-700 dark:text-white"
              >
                Add Team Member
              </button>
            </div>
          )}
                  </>
      ) : activeTab === 'automations' ? (
        <ProjectAutomations 
          projectId={id} 
          isOwner={project?.owner && user?._id ? project.owner._id.toString() === user._id.toString() : false} 
        />
      ) : (
        <div className="chat-container h-[calc(100vh-240px)] bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <Chat 
            chatId={id} 
            title={`${project.name} - Team Chat`}
            height="100%"
            fullWidth={true}
          />
        </div>
      )}
      
      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="linear-modal-overlay">
          <div className="linear-modal">
            <div className="linear-card">
              <div className="linear-card-header flex justify-between">
                <h3 className="font-medium">Add Team Member</h3>
                <button 
                  onClick={() => setShowAddMemberModal(false)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {addMemberError && (
                <div className="linear-card-body pt-0">
                  <div className="bg-red-50 border-red-200 p-3 rounded-md text-red-700 text-sm mb-4">
                    {addMemberError}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleAddMember}>
                <div className="linear-card-body pt-0">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      required
                      className="linear-input w-full"
                      placeholder="team@example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the email address of the person you want to invite
                    </p>
                  </div>
                </div>
                
                <div className="linear-card-footer flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="linear-btn linear-btn-secondary"
                    disabled={addMemberLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="linear-btn linear-btn-primary"
                    disabled={addMemberLoading}
                  >
                    {addMemberLoading ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
