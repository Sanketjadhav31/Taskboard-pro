import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ProjectContext } from '../context/ProjectContext';
import { ThemeContext } from '../context/ThemeContext';
import TaskDetailModal from '../components/TaskDetailModal';
import ProjectCard from '../components/ProjectCard';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { projects, refreshProjects } = useContext(ProjectContext);
  const { darkMode } = useContext(ThemeContext);
  const [tasks, setTasks] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasksCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Fetch dashboard data function
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
        
      // Get token for authorization
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setIsLoading(false);
        return;
      }
      
      // Setup default headers
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Initialize defaults
      let userTasks = [];
      let activities = [];
      let statsData = {
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        overdueTasksCount: 0
      };
      
      try {
        // Fetch data in parallel with Promise.all for better performance
        const [tasksRes, activityRes, statsRes] = await Promise.all([
          axios.get('/api/tasks/user', config),
          axios.get('/api/tasks/activity', config),
          axios.get('/api/tasks/stats', config)
        ]);
        
        // Process tasks data
        if (tasksRes && tasksRes.data) {
          userTasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
          
          // If server doesn't return stats, calculate them from tasks
          if (!statsRes || !statsRes.data) {
            statsData.totalTasks = userTasks.length;
            statsData.completedTasks = userTasks.filter(t => t.status === 'completed').length;
            
            // Calculate overdue tasks
            const today = new Date();
            statsData.overdueTasksCount = userTasks.filter(t => {
              if (!t.dueDate || t.status === 'completed') return false;
              const dueDate = new Date(t.dueDate);
              return dueDate < today;
            }).length;
          }
        }
        
        // Process activity data
        if (activityRes && activityRes.data && activityRes.data.activities) {
          activities = activityRes.data.activities;
        }
        
        // Process stats data from server
        if (statsRes && statsRes.data) {
          statsData = {
            ...statsData, // Keep defaults
            ...statsRes.data // Override with actual data if available
          };
        }
        
        // Always get total projects from ProjectContext
        statsData.totalProjects = projects.length || 0;
        
        // Update state with fetched data
        setTasks(userTasks);
        setRecentActivity(activities);
        
        // Extract and set recent projects from activities
        processRecentProjects(activities, projects);
        
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        
        // Set default data on error
        setTasks([]);
        setRecentActivity([]);
        setRecentProjects(projects.slice(0, 3));
        setStats({
          totalProjects: projects.length || 0,
          totalTasks: 0,
          completedTasks: 0,
          overdueTasksCount: 0
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error in dashboard data fetch:", error);
      setIsLoading(false);
    }
  };
  
  // Process recent projects from activities and projects list
  const processRecentProjects = (activities, allProjects) => {
    if (!allProjects || !Array.isArray(allProjects) || allProjects.length === 0) {
      setRecentProjects([]);
      return;
    }
    
    // First, sort projects by creation date (most recent first)
    const sortedProjects = [...allProjects].sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Start with the most recent projects (up to 4)
    let recent = sortedProjects.slice(0, 4);
    
    // If we have activities, prioritize projects with recent activity
    if (activities && Array.isArray(activities) && activities.length > 0) {
      // Get unique project IDs from activities
      const activityProjectIds = new Set();
      
      // First, add project_created activities (newest projects)
      activities.forEach(activity => {
        if (activity.projectId && activity.type === 'project_created') {
          activityProjectIds.add(activity.projectId);
        }
      });
      
      // Then add other activity types
      activities.forEach(activity => {
        if (activity.projectId && 
           (activity.type === 'project_updated' || 
            activity.type === 'project_completed' ||
            activity.type === 'task_created' ||
            activity.type === 'task_completed')) {
          activityProjectIds.add(activity.projectId);
        }
      });
      
      // Build active projects array
      const activeProjects = [];
      activityProjectIds.forEach(id => {
        const project = allProjects.find(p => p._id === id);
        if (project) {
          activeProjects.push(project);
        }
      });
      
      // If we have active projects, prioritize them in our recent list
      if (activeProjects.length > 0) {
        // Create a final list with active projects first, then recent ones
        const mergedProjects = [];
        
        // Add active projects
        activeProjects.forEach(project => {
          if (!mergedProjects.some(p => p._id === project._id)) {
            mergedProjects.push(project);
          }
        });
        
        // Then add recent projects that aren't already in the list
        recent.forEach(project => {
          if (!mergedProjects.some(p => p._id === project._id)) {
            mergedProjects.push(project);
          }
        });
        
        // If we still have room, add more projects from sorted list
        sortedProjects.forEach(project => {
          if (!mergedProjects.some(p => p._id === project._id)) {
            mergedProjects.push(project);
          }
        });
        
        // Limit to 4 projects
        recent = mergedProjects.slice(0, 4);
      }
    }
    
    setRecentProjects(recent);
  };
    
  // Call fetchDashboardData on component mount and when projects change
  useEffect(() => {
    fetchDashboardData();
    
    // Set up an interval to refresh activity data every 60 seconds
    const activityRefreshInterval = setInterval(() => {
      refreshActivityData();
    }, 60000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(activityRefreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length]);
  
  // Add focus event listener to refresh data when user returns to the tab
  useEffect(() => {
    const handleFocus = () => {
      refreshActivityData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Function to only refresh activity data without refreshing everything
  const refreshActivityData = async () => {
    try {
      // Get token for authorization
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      
      // Setup default headers
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const activityRes = await axios.get('/api/activity', config);
      
      // Process activity data
      if (activityRes && activityRes.data && activityRes.data.activities) {
        setRecentActivity(activityRes.data.activities);
        processRecentProjects(activityRes.data.activities, projects);
      }
    } catch (error) {
      console.error("Error refreshing activity data:", error);
    }
  };
  
  // Calculate priority class
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'linear-badge-danger';
      case 'medium':
        return 'linear-badge-warning';
      case 'low':
        return 'linear-badge-success';
      default:
        return 'linear-badge-primary';
    }
  };
  
  // Calculate status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'linear-badge-success';
      case 'in_progress':
        return 'linear-badge-warning';
      case 'blocked':
        return 'linear-badge-danger';
      default:
        return 'linear-badge-primary';
    }
  };
  
  // Format status for display
  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };
  
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  if (isLoading) {
    return (
      <div className="linear-loading flex items-center justify-center h-64">
        <div className="linear-spinner"></div>
      </div>
    );
  }
  
  return (
    <div className="linear-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-100">Welcome back, {user.displayName}</h2>
        <p className="text-gray-600 dark:text-gray-400">Here's what's happening in your projects today.</p>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="linear-card dark:bg-gray-800 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/20 transition-all duration-200">
          <div className="linear-card-body flex items-center">
            <div className="rounded-full bg-primary-100 dark:bg-primary-900/30 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Projects</p>
              <p className="text-xl font-bold dark:text-white">{stats.totalProjects}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Projects count: {projects.length}</p>
            </div>
          </div>
        </div>
        
        <div className="linear-card dark:bg-gray-800 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/20 transition-all duration-200">
          <div className="linear-card-body flex items-center">
            <div className="rounded-full bg-info-100 dark:bg-blue-900/30 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-info-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
              <p className="text-xl font-bold dark:text-white">{stats.totalTasks}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">User tasks: {tasks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="linear-card dark:bg-gray-800 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/20 transition-all duration-200">
          <div className="linear-card-body flex items-center">
            <div className="rounded-full bg-success-100 dark:bg-green-900/30 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
              <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-xl font-bold dark:text-white">{stats.completedTasks}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Completed tasks count from server</p>
            </div>
          </div>
        </div>
        
        <div className="linear-card dark:bg-gray-800 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/20 transition-all duration-200">
          <div className="linear-card-body flex items-center">
            <div className="rounded-full bg-danger-100 dark:bg-red-900/30 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-danger-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
              <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
              <p className="text-xl font-bold dark:text-white">{stats.overdueTasksCount}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Overdue tasks (past due date)</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks & Projects (Column 1-2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Tasks */}
          <div className="linear-card dark:bg-gray-800 dark:border-gray-700 transition-all duration-200">
            <div className="linear-card-header dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">My Tasks</h3>
              <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200">View all</Link>
            </div>
            <div className="linear-card-body p-0">
              {tasks.length > 0 ? (
                <div className="linear-list divide-y divide-gray-200 dark:divide-gray-700">
                  {tasks.slice(0, 5).map(task => (
                    <div 
                      key={task._id} 
                      className="linear-list-item flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/70 p-4 transition-colors duration-200"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          className="mr-3 h-4 w-4 text-primary-600 dark:text-primary-500 dark:border-gray-600 dark:bg-gray-700 rounded focus:ring-primary-500 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800"
                          onChange={(e) => e.stopPropagation()}
                        />
                        <div>
                          <h4 className="text-sm font-medium dark:text-white">{task.title}</h4>
                          <div className="flex items-center mt-1">
                            <span className={`linear-badge ${getPriorityClass(task.priority || 'medium')} mr-2 dark:bg-opacity-30 dark:text-opacity-90`}>
                              {task.priority ? 
                                (task.priority.charAt(0).toUpperCase() + task.priority.slice(1)) : 
                                'Medium'}
                            </span>
                            <span className={`linear-badge ${getStatusClass(task.status || 'to_do')} dark:bg-opacity-30 dark:text-opacity-90`}>
                              {formatStatus(task.status || 'to_do')}
                            </span>
                            {task.dueDate && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        {(task.project || task.projectName) && (
                          <span 
                            className="text-xs inline-block py-1 px-2 rounded-full dark:bg-opacity-80 dark:border dark:border-opacity-20" 
                            style={{
                              backgroundColor: task.projectColor || task.project?.color || '#6366f1', 
                              color: 'white'
                            }}
                          >
                            {task.projectName || task.project?.name || 'Project'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No tasks assigned to you</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Projects */}
          <div className="linear-card dark:bg-gray-800 dark:border-gray-700 transition-all duration-200">
            <div className="linear-card-header dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Recent Projects</h3>
              <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200">View all</Link>
            </div>
            <div className="linear-card-body">
            {recentProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentProjects.slice(0, 4).map(project => (
                    <Link to={`/projects/${project._id}`} key={project._id}>
                      <div className="linear-card hover:shadow-md transition-shadow dark:bg-gray-700 dark:border-gray-600 dark:hover:shadow-lg dark:hover:shadow-gray-900/20">
                        <div className="linear-card-body">
                        <div className="flex items-center">
                          <div 
                              className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: project.color || '#6366f1' }}
                          ></div>
                            <h4 className="font-medium dark:text-white">{project.name}</h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{project.description}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex -space-x-2">
                              {project.members && project.members.length > 0 ? (
                                <>
                                  {project.members.slice(0, 3).map(member => (
                                    <div key={member._id} className="linear-avatar linear-avatar-sm dark:bg-gray-600 dark:text-gray-200">
                                      {member.photo ? (
                                        <img src={member.photo} alt={member.displayName || 'Member'} />
                                      ) : (
                                        <span>{member.displayName?.charAt(0) || '?'}</span>
                                      )}
                                    </div>
                                  ))}
                                  {project.members.length > 3 && (
                                    <div className="linear-avatar linear-avatar-sm dark:bg-gray-600 dark:text-gray-200">
                                      +{project.members.length - 3}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-xs text-gray-500 dark:text-gray-400">No members</div>
                              )}
                        </div>
                            <div className="text-xs">
                              {project.isCompleted ? (
                                <span className="text-green-500 dark:text-green-400 font-medium">Completed</span>
                              ) : (
                                <>
                                  <span className="text-gray-500 dark:text-gray-400">Progress: </span>
                                  <span className="font-medium dark:text-white">{project.progress || 0}%</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No recent projects</p>
                  <Link to="/projects" className="linear-btn linear-btn-primary mt-3 dark:bg-primary-600 dark:text-white">Create a project</Link>
              </div>
            )}
            </div>
          </div>
        </div>
        
        {/* Activity & Team (Column 3) */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="linear-card dark:bg-gray-800 dark:border-gray-700 transition-all duration-200">
            <div className="linear-card-header dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Recent Activity</h3>
            </div>
            <div className="linear-card-body p-0">
              {recentActivity.length > 0 ? (
                <div className="linear-list divide-y divide-gray-200 dark:divide-gray-700">
                  {recentActivity.map(activity => (
                    <div key={activity._id} className="linear-list-item p-4 dark:hover:bg-gray-700/60 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-start">
                        <div className="linear-avatar linear-avatar-sm mr-3 dark:bg-gray-700 dark:text-gray-300">
                          {activity.user?.photo ? (
                            <img src={activity.user.photo} alt={activity.user.displayName || 'User'} />
                          ) : (
                            activity.user?.displayName?.charAt(0) || '?'
                          )}
          </div>
                        <div>
                          <p className="text-sm dark:text-gray-200">
                            <span className="font-medium dark:text-white">{activity.user?.displayName || 'A user'}</span>
                            {' '}{activity.description || `performed an action`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : 'Recently'}
                          </p>
                        </div>
                      </div>
                    </div>
                ))}
                </div>
            ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>
          
          {/* Team Members */}
          <div className="linear-card dark:bg-gray-800 dark:border-gray-700 transition-all duration-200">
            <div className="linear-card-header dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Team</h3>
              <Link to="/team" className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200">View all</Link>
            </div>
            <div className="linear-card-body p-0">
              <div className="linear-member-list divide-y divide-gray-200 dark:divide-gray-700">
                {projects.length > 0 && projects[0].members && projects[0].members.length > 0 ? (
                  projects[0].members.slice(0, 5).map(member => (
                    <div key={member._id} className="linear-member-card hover:bg-gray-50 dark:hover:bg-gray-700 p-3 transition-colors duration-200 flex items-center justify-between">
                      <div className="linear-member-info flex items-center">
                        <div className="linear-avatar linear-avatar-sm dark:bg-gray-600 dark:text-gray-200">
                          {member.photo ? (
                            <img src={member.photo} alt={member.displayName || member.email || 'Member'} />
                          ) : (
                            member.displayName?.charAt(0) || member.email?.charAt(0) || '?'
                          )}
      </div>
                        <div className="linear-member-details ml-3">
                          <div className="linear-member-name text-sm font-medium dark:text-white">{member.displayName || member.email || 'Unknown Member'}</div>
                          <div className="linear-member-email text-xs text-gray-500 dark:text-gray-400">{member.email || 'No email provided'}</div>
        </div>
                      </div>
                      <div className="linear-badge linear-badge-primary linear-member-role dark:bg-primary-900/70 dark:text-primary-300">
                        {member.role || 'Member'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No team members found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Task Modal */}
      {showTaskModal && selectedTask && (
        <div className="linear-modal-overlay dark:bg-gray-900/80">
          <div className="linear-modal dark:bg-gray-800">
            <TaskDetailModal 
              task={selectedTask} 
              onClose={() => setShowTaskModal(false)}
              onUpdate={(updatedData) => {
                console.log('Task updated:', updatedData);
                setShowTaskModal(false);
                // Refresh dashboard data after update
                fetchDashboardData();
              }}
              onDelete={() => {
                console.log('Task deleted');
                setShowTaskModal(false);
                // Refresh dashboard data after delete
                fetchDashboardData();
              }}
              projectMembers={[]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
