import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

export const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const isFetchingRef = useRef(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check auth status
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch current user
      const fetchUser = async () => {
        try {
          const res = await axios.get('/auth/current-user', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            withCredentials: true
          });
          if (res.data && res.data.user) {
            setUser(res.data.user);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error('Error fetching user in ProjectContext:', err);
          setIsAuthenticated(false);
        }
      };
      
      fetchUser();
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Fetch all projects
  useEffect(() => {
    if (user && isAuthenticated && !isFetchingRef.current) {
      fetchProjects();
    }
  }, [user, isAuthenticated, fetchTrigger]);

  // Separate effect for tasks to prevent one from blocking the other
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchUserTasks();
    }
  }, [user, isAuthenticated]);

  // Function to manually trigger a refresh
  const refreshProjects = () => {
    setFetchTrigger(prev => prev + 1);
  };

  const fetchProjects = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('Fetch already in progress, skipping duplicate request');
      return;
    }
    
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found when fetching projects');
        setError('Authorization required. Please log in again.');
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }
      
      console.log('Fetching projects with token:', token.substring(0, 10) + '...');
      const res = await axios.get('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      
      console.log('Projects response:', res.data);
      
      // Handle potential response formats
      if (Array.isArray(res.data)) {
        setProjects(res.data);
      } else if (res.data && typeof res.data === 'object') {
        if (res.data.project) {
          setProjects([res.data.project]);
        } else if (res.data.projects) {
          setProjects(res.data.projects);
        } else {
          // If we can't identify a specific format, try to use the whole response
          if (Object.keys(res.data).length > 0) {
            console.log('Using fallback for projects data');
            setProjects([res.data]);
          } else {
            console.warn('Empty projects data returned');
            setProjects([]);
          }
        }
      } else {
        console.error('Unexpected projects response format:', res.data);
        setProjects([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      setError('Failed to load projects');
      // Don't clear projects array on error to allow showing stale data
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const fetchUserTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found when fetching tasks');
        return;
      }
      
      const res = await axios.get('/api/tasks/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      
      console.log('Tasks response:', res.data);
      setUserTasks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  // Create project
  const createProject = async (projectData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/projects', projectData, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      
      // Add the new project to the state
      setProjects(prevProjects => [...prevProjects, res.data]);
      
      // Record activity for new project creation
      try {
        await axios.post('/api/activity', {
          type: 'project_created',
          description: `created a new project: ${res.data.name}`,
          projectId: res.data._id
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        });
      } catch (activityErr) {
        console.error('Failed to record activity:', activityErr);
      }
      
      return { success: true, project: res.data };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to create project'
      };
    }
  };

  // Get project details
  const getProject = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      return { success: true, project: res.data };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to get project details'
      };
    }
  };

  // Update project
  const updateProject = async (id, projectData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/projects/${id}`, projectData, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project._id === id ? res.data : project
        )
      );
      return { success: true, project: res.data };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update project'
      };
    }
  };

  // Delete project
  const deleteProject = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      setProjects(prevProjects => 
        prevProjects.filter(project => project._id !== id)
      );
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to delete project'
      };
    }
  };

  // Create task
  const createTask = async (projectId, taskData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/projects/${projectId}/tasks`, taskData, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      fetchUserTasks(); // Refresh user tasks
      return { success: true, task: res.data };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to create task'
      };
    }
  };

  // Update task
  const updateTask = async (projectId, taskId, taskData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/projects/${projectId}/tasks/${taskId}`, taskData, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      
      // Check if task was completed and record activity
      if (taskData.status === 'completed') {
        try {
          await axios.post('/api/activity', {
            type: 'task_completed',
            description: `completed task: ${res.data.title}`,
            projectId: projectId,
            taskId: taskId
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            withCredentials: true
          });
        } catch (activityErr) {
          console.error('Failed to record task completion activity:', activityErr);
        }
      }
      
      fetchUserTasks(); // Refresh user tasks
      return { success: true, task: res.data };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update task'
      };
    }
  };

  // Delete task
  const deleteTask = async (projectId, taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/projects/${projectId}/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      fetchUserTasks(); // Refresh user tasks
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to delete task'
      };
    }
  };

  // Add team member
  const addTeamMember = async (projectId, email) => {
    try {
      if (!email || !email.trim()) {
        return {
          success: false,
          message: 'Email is required'
        };
      }

      console.log('Adding team member:', email, 'to project:', projectId);
      
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/projects/${projectId}/members`, 
        { email: email.trim() }, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      console.log('Team member added successfully:', res.data);
      refreshProjects(); // Refresh project list to get updated members
      return { success: true, member: res.data };
    } catch (err) {
      console.error('Failed to add team member:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to add team member'
      };
    }
  };

  // Remove team member
  const removeTeamMember = async (projectId, userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/projects/${projectId}/members/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      refreshProjects(); // Refresh project list to get updated members
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to remove team member'
      };
    }
  };

  // Search projects and tasks
  const search = async (query) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/search?q=${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      return { success: true, results: res.data };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Search failed'
      };
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        userTasks,
        loading,
        error,
        refreshProjects,
        getProject,
        createProject,
        updateProject,
        deleteProject,
        createTask,
        updateTask,
        deleteTask,
        addTeamMember,
        removeTeamMember,
        search
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}; 