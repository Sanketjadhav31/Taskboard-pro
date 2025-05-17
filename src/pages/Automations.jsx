import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ProjectContext } from '../context/ProjectContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Automations = () => {
  const { user } = useContext(AuthContext);
  const { projects } = useContext(ProjectContext);
  const [projectAutomations, setProjectAutomations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllProjectAutomations = async () => {
      if (!projects || projects.length === 0) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token missing');
          setLoading(false);
          return;
        }
        
        const automationsByProject = {};
        
        for (const project of projects) {
          if (project._id) {
            try {
              const response = await axios.get(
                `${API_BASE_URL}/api/automations/project/${project._id}`,
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              
              automationsByProject[project._id] = response.data || [];
            } catch (err) {
              console.error(`Error fetching automations for project ${project._id}:`, err);
              // We don't set the global error here, just log and continue
            }
          }
        }
        
        setProjectAutomations(automationsByProject);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching project automations:', err);
        setError('Failed to load automations');
        setLoading(false);
      }
    };
    
    fetchAllProjectAutomations();
  }, [projects]);
  
  const getTotalAutomationsCount = () => {
    return Object.values(projectAutomations).reduce(
      (total, automations) => total + automations.length,
      0
    );
  };
  
  // Get active automations count
  const getActiveAutomationsCount = () => {
    return Object.values(projectAutomations).reduce(
      (total, automations) => 
        total + automations.filter(a => a.isActive).length,
      0
    );
  };
  
  // Automations by trigger type
  const getAutomationsByTriggerType = () => {
    const result = { status_change: 0, assignment: 0, due_date_passed: 0 };
    
    Object.values(projectAutomations).forEach(automations => {
      automations.forEach(automation => {
        if (result[automation.trigger_type] !== undefined) {
          result[automation.trigger_type]++;
        }
      });
    });
    
    return result;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const totalAutomations = getTotalAutomationsCount();
  const triggerTypes = getAutomationsByTriggerType();

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Workflow Automations</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your project automations to streamline workflows and increase productivity.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Total Automations</h3>
              <p className="text-3xl font-bold">{totalAutomations}</p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Automations across all your projects
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Active Automations</h3>
              <p className="text-3xl font-bold">{getActiveAutomationsCount()}</p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Currently active workflow automations
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Projects</h3>
              <p className="text-3xl font-bold">{projects?.length || 0}</p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Projects with automation capabilities
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold">Automation Triggers</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Status Change</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                  {triggerTypes.status_change}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Trigger when a task status changes
              </p>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Assignment</h3>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-purple-900/30 dark:text-purple-400">
                  {triggerTypes.assignment}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Trigger when a task is assigned to a user
              </p>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Due Date</h3>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-yellow-900/30 dark:text-yellow-400">
                  {triggerTypes.due_date_passed}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Trigger when a task's due date passes
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Projects with Automations</h2>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {projects && projects.length > 0 ? (
            projects.map(project => (
              <div key={project._id} className="px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3" 
                      style={{ backgroundColor: project.color || '#6366f1' }}
                    ></div>
                    <h3 className="font-medium">{project.name}</h3>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 mr-4">
                      {projectAutomations[project._id]?.length || 0} automations
                    </span>
                    
                    <Link
                      to={`/projects/${project._id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                      onClick={() => localStorage.setItem('activeProjectTab', 'automations')}
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No projects found</p>
              <Link 
                to="/projects/new" 
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Create a Project
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Automations; 