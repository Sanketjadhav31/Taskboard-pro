import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProjectAutomations = ({ projectId, isOwner }) => {
  const { user } = useContext(AuthContext);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    description: '',
    trigger_type: 'status_change',
    trigger_value: 'Done',
    action_type: 'notify',
    action_payload: { message: 'Task has been completed!' }
  });

  // Fetch automations
  useEffect(() => {
    const fetchAutomations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching automations for project:', projectId);
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No authentication token available');
          setError('Authentication token missing. Please log in again.');
          setLoading(false);
          return;
        }
        
        // Make sure we're using the full API URL
        const response = await axios.get(`${API_BASE_URL}/api/automations/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Received automation data:', response.data);
        setAutomations(response.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching automations:', err);
        let errorMessage = 'Failed to load automations. Please try again.';
        
        if (err.response) {
          console.error('Server responded with error:', err.response.status, err.response.data);
          
          if (err.response.status === 401) {
            errorMessage = 'Your session has expired. Please log in again.';
          } else if (err.response.status === 403) {
            errorMessage = 'You do not have permission to view these automations.';
          } else if (err.response.status === 404) {
            errorMessage = 'Project not found or has been deleted.';
          } else {
            errorMessage = err.response.data.message || errorMessage;
          }
        } else if (err.request) {
          console.error('No response received:', err.request);
          errorMessage = 'Server not responding. Please check your connection.';
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    if (projectId) {
      fetchAutomations();
    } else {
      console.error('No projectId provided');
      setError('Project ID is missing. Cannot load automations.');
      setLoading(false);
    }
  }, [projectId]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'trigger_type') {
      // Set appropriate default trigger value based on trigger type
      let defaultTriggerValue = '';
      
      switch (value) {
        case 'status_change':
          defaultTriggerValue = 'Done';
          break;
        case 'assignment':
          defaultTriggerValue = ''; // Will be a user ID in practice
          break;
        case 'due_date_passed':
          defaultTriggerValue = null; // No specific value needed
          break;
        default:
          defaultTriggerValue = '';
      }
      
      setNewAutomation({
        ...newAutomation,
        trigger_type: value,
        trigger_value: defaultTriggerValue
      });
    } else if (name === 'action_type') {
      // Set appropriate default action payload based on action type
      let defaultActionPayload = {};
      
      switch (value) {
        case 'assign_badge':
          defaultActionPayload = { badge_id: 'task_completer' };
          break;
        case 'change_status':
          defaultActionPayload = { new_status: 'In Progress' };
          break;
        case 'notify':
          defaultActionPayload = { message: 'Automated notification' };
          break;
        default:
          defaultActionPayload = {};
      }
      
      setNewAutomation({
        ...newAutomation,
        action_type: value,
        action_payload: defaultActionPayload
      });
    } else if (name === 'trigger_value') {
      setNewAutomation({
        ...newAutomation,
        trigger_value: value
      });
    } else if (name.startsWith('action_payload.')) {
      const field = name.split('.')[1];
      setNewAutomation({
        ...newAutomation,
        action_payload: {
          ...newAutomation.action_payload,
          [field]: value
        }
      });
    } else {
      setNewAutomation({
        ...newAutomation,
        [name]: value
      });
    }
  };

  // Create a new automation
  const handleCreateAutomation = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        return;
      }
      
      // Validate required fields
      if (!newAutomation.name || !newAutomation.trigger_type || !newAutomation.action_type) {
        setError('Please fill in all required fields (name, trigger type, and action type).');
        return;
      }
      
      // Ensure the projectId is properly formatted
      if (!projectId) {
        setError('Project ID is missing. Please reload the page and try again.');
        return;
      }
      
      const automationData = {
        ...newAutomation,
        projectId,
        created_by: user?._id || null // Use current user ID
      };
      
      console.log('Creating new automation with data:', JSON.stringify(automationData));
      
      // Make sure we're using the full API URL
      const response = await axios.post(`${API_BASE_URL}/api/automations`, 
        automationData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Automation created with response:', response.data);
      
      // Add the new automation to state
      setAutomations(prevAutomations => [...prevAutomations, response.data]);
      setShowAddModal(false);
      
      // Reset form
      setNewAutomation({
        name: '',
        description: '',
        trigger_type: 'status_change',
        trigger_value: 'Done',
        action_type: 'notify',
        action_payload: { message: 'Task has been completed!' }
      });
    } catch (err) {
      console.error('Error creating automation:', err);
      
      let errorMessage = 'Failed to create automation. Please try again.';
      
      if (err.response) {
        console.error('Server error details:', err.response.status, err.response.data);
        
        if (err.response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to create automations. Only project owners can create automations.';
        } else if (err.response.status === 400) {
          errorMessage = 'Invalid automation data. Please check all fields and try again.';
        } else {
          errorMessage = err.response.data.message || errorMessage;
        }
      } else if (err.request) {
        console.error('No response received:', err.request);
        errorMessage = 'Server not responding. Please check your connection.';
      }
      
      setError(errorMessage);
    }
  };

  // Toggle automation active status
  const toggleAutomationStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/automations/${id}`,
        {
          isActive: !currentStatus
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      setAutomations(automations.map(automation => 
        automation._id === id 
          ? { ...automation, isActive: !automation.isActive } 
          : automation
      ));
    } catch (err) {
      console.error('Error toggling automation status:', err);
      setError('Failed to update automation. Please try again.');
    }
  };
  
  // Delete an automation
  const deleteAutomation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this automation?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/automations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setAutomations(automations.filter(automation => automation._id !== id));
    } catch (err) {
      console.error('Error deleting automation:', err);
      setError('Failed to delete automation. Please try again.');
    }
  };

  // Create sample automations
  const createSampleAutomations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Validate projectId
      if (!projectId) {
        console.error('No projectId provided for sample automations');
        setError('Project ID is missing. Cannot create automations.');
        setLoading(false);
        return;
      }
      
      console.log(`Creating sample automations for project: ${projectId}`);
      
      const sampleAutomations = [
        {
          projectId,
          name: "Task Completion Notification",
          description: "Send a notification when a task is marked as done",
          trigger_type: "status_change",
          trigger_value: "Done",
          action_type: "notify",
          action_payload: { message: "A task has been completed! 🎉" }
        },
        {
          projectId,
          name: "Task Completer Badge",
          description: "Award a badge when a user completes a task",
          trigger_type: "status_change",
          trigger_value: "Done",
          action_type: "assign_badge",
          action_payload: { badge_id: "task_completer" }
        },
        {
          projectId,
          name: "Auto Start on Assignment",
          description: "Move task to In Progress when assigned",
          trigger_type: "assignment",
          trigger_value: null, // Any assignment
          action_type: "change_status",
          action_payload: { new_status: "In Progress" }
        }
      ];
      
      console.log(`Creating ${sampleAutomations.length} sample automations for project ${projectId}`);
      
      const newAutomations = [];
      let errorOccurred = false;
      
      for (const automation of sampleAutomations) {
        try {
          console.log('Creating sample automation:', JSON.stringify(automation));
          const response = await axios.post(`${API_BASE_URL}/api/automations`, 
            automation,
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log('Sample automation created:', response.data._id);
          newAutomations.push(response.data);
        } catch (error) {
          console.error(`Failed to create sample automation "${automation.name}":`, error);
          console.error('Error response:', error.response?.data);
          errorOccurred = true;
        }
      }
      
      if (newAutomations.length > 0) {
        console.log(`Successfully created ${newAutomations.length} sample automations`);
        setAutomations([...automations, ...newAutomations]);
        
        if (errorOccurred) {
          setError(`Created ${newAutomations.length} out of ${sampleAutomations.length} sample automations. Some automations could not be created.`);
        }
      } else {
        setError('Failed to create any sample automations. Please try again or create automations manually.');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error creating sample automations:', err);
      
      let errorMessage = 'Failed to create sample automations. Please try again.';
      if (err.response) {
        console.error('Server error details:', err.response.status, err.response.data);
        
        if (err.response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to create automations. Only project owners can create automations.';
        } else {
          errorMessage = err.response.data.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = 'Server not responding. Please check your connection.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Render trigger value form field based on trigger type
  const renderTriggerValueField = () => {
    switch (newAutomation.trigger_type) {
      case 'status_change':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Status Value
            </label>
            <select
              name="trigger_value"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={newAutomation.trigger_value || ''}
              onChange={handleInputChange}
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
        );
        
      case 'assignment':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Assigned User (optional)
            </label>
            <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">
              Leave blank to trigger for any user assignment
            </p>
            <input
              type="text"
              name="trigger_value"
              placeholder="User ID (optional)"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={newAutomation.trigger_value || ''}
              onChange={handleInputChange}
            />
          </div>
        );
        
      case 'due_date_passed':
        return (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This automation will trigger when a task's due date passes.
            </p>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Render action payload form fields based on action type
  const renderActionPayloadFields = () => {
    switch (newAutomation.action_type) {
      case 'assign_badge':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Badge Code
            </label>
            <select
              name="action_payload.badge_id"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={newAutomation.action_payload?.badge_id || ''}
              onChange={handleInputChange}
            >
              <option value="task_completer">Task Completer</option>
              <option value="productivity_star">Productivity Star</option>
              <option value="team_player">Team Player</option>
              <option value="early_finisher">Early Finisher</option>
            </select>
          </div>
        );
        
      case 'change_status':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              New Status
            </label>
            <select
              name="action_payload.new_status"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={newAutomation.action_payload?.new_status || ''}
              onChange={handleInputChange}
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
        );
        
      case 'notify':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Notification Message
            </label>
            <input 
              type="text" 
              name="action_payload.message" 
              placeholder="Message to send" 
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={newAutomation.action_payload?.message || ''}
              onChange={handleInputChange}
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  // Get human-readable trigger description
  const getTriggerDescription = (automation) => {
    const { trigger_type, trigger_value } = automation;
    
    switch (trigger_type) {
      case 'status_change':
        return `When a task is moved to "${trigger_value}"`;
        
      case 'assignment':
        return trigger_value 
          ? `When a task is assigned to a specific user`
          : `When a task is assigned to any user`;
        
      case 'due_date_passed':
        return `When a task's due date passes`;
        
      default:
        return 'Unknown trigger';
    }
  };

  // Get human-readable action description
  const getActionDescription = (automation) => {
    const { action_type, action_payload } = automation;
    
    switch (action_type) {
      case 'assign_badge':
        return `Assign "${action_payload?.badge_id || 'unknown'}" badge`;
        
      case 'change_status':
        return `Move task to "${action_payload?.new_status || 'unknown'}"`;
        
      case 'notify':
        return `Send notification: "${action_payload?.message || 'unknown'}"`;
        
      default:
        return 'Unknown action';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Debug output for ownership
  console.log('ProjectAutomations debug:', { 
    projectId, 
    isOwner, 
    userId: user?._id, 
    userEmail: user?.email 
  });

  return (
    <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Workflow Automations</h2>
        {/* Always show the Add Automation button for now to debug the issue */}
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition dark:bg-primary-700 dark:hover:bg-primary-800"
        >
          Add Automation
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {automations.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">No automations yet</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Create your first automation to automate workflows in your project.</p>
          
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                console.log('Create Automation button clicked');
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition dark:bg-primary-700 dark:hover:bg-primary-800"
            >
              Create Automation
            </button>
            <button
              onClick={() => {
                console.log('Add Sample Automations button clicked');
                createSampleAutomations();
              }}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Add Sample Automations
            </button>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {automations.map((automation) => (
            <motion.li
              key={automation._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-lg p-4 ${
                automation.isActive 
                  ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                  : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/30'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{automation.name}</h3>
                  <p className="text-gray-600 text-sm dark:text-gray-400">{automation.description}</p>
                  
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400 mr-2">Trigger:</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{getTriggerDescription(automation)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400 mr-2">Action:</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{getActionDescription(automation)}</span>
                    </div>
                  </div>
                </div>
                
                {isOwner && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleAutomationStatus(automation._id, automation.isActive)}
                      className={`px-3 py-1 rounded text-sm ${
                        automation.isActive 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}
                    >
                      {automation.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => deleteAutomation(automation._id)}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm dark:bg-red-900/30 dark:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </motion.li>
          ))}
        </ul>
      )}
      
      {/* Add Automation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 dark:bg-opacity-70">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Create Automation</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateAutomation}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Automation name"
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={newAutomation.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="Automation description"
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={newAutomation.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  Trigger Type
                </label>
                <select
                  name="trigger_type"
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={newAutomation.trigger_type}
                  onChange={handleInputChange}
                >
                  <option value="status_change">Task Status Change</option>
                  <option value="assignment">Task Assignment</option>
                  <option value="due_date_passed">Due Date Passed</option>
                </select>
              </div>
              
              {renderTriggerValueField()}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  Action Type
                </label>
                <select
                  name="action_type"
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={newAutomation.action_type}
                  onChange={handleInputChange}
                >
                  <option value="assign_badge">Assign Badge</option>
                  <option value="change_status">Change Status</option>
                  <option value="notify">Send Notification</option>
                </select>
              </div>
              
              {renderActionPayloadFields()}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectAutomations; 