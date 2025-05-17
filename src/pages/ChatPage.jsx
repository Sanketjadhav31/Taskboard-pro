import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ProjectContext } from '../context/ProjectContext';
import { ChatContext } from '../context/ChatContext';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import Chat from '../components/Chat';

const ChatPage = () => {
  const { projects, loading: projectsLoading } = useContext(ProjectContext);
  const { unreadCounts, totalUnreadCount, onlineUsers, connectionStatus, reconnect } = useContext(ChatContext);
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Set loading state based on project context
  useEffect(() => {
    setLoadingProjects(projectsLoading);
  }, [projectsLoading]);

  // Update reconnecting state based on connection status
  useEffect(() => {
    if (connectionStatus === 'connecting') {
      setIsReconnecting(true);
    } else {
      setIsReconnecting(false);
    }
  }, [connectionStatus]);

  // Select the first project by default or the one with unread messages
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      // First look for a project with unread messages
      const projectWithUnread = projects.find(project => unreadCounts[project._id] > 0);
      
      if (projectWithUnread) {
        setSelectedProject(projectWithUnread);
      } else {
        // Otherwise just select the first project
        setSelectedProject(projects[0]);
      }
    }
  }, [projects, unreadCounts, selectedProject]);
  
  const handleSelectProject = (project) => {
    setSelectedProject(project);
  };

  // Handle manual reconnection
  const handleReconnect = () => {
    setIsReconnecting(true);
    reconnect();
  };

  // Sorted projects with unread messages first
  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    
    return [...projects].sort((a, b) => {
      // Projects with unread messages come first
      const aUnread = unreadCounts[a._id] || 0;
      const bUnread = unreadCounts[b._id] || 0;
      
      if (aUnread > 0 && bUnread === 0) return -1;
      if (bUnread > 0 && aUnread === 0) return 1;
      
      // Then sort by unread count
      if (aUnread !== bUnread) return bUnread - aUnread;
      
      // Finally sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [projects, unreadCounts]);
  
  // Check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers && onlineUsers.includes(userId);
  };
  
  if (loadingProjects) {
    return (
      <div className="linear-loading flex items-center justify-center h-64">
        <div className="linear-spinner dark:border-gray-600 dark:border-t-primary-400"></div>
      </div>
    );
  }
  
  return (
    <div className="linear-fade-in">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Project Chats</h2>
          {connectionStatus !== 'connected' && (
            <button 
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white transition-colors duration-150"
            >
              {isReconnecting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Reconnecting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reconnect
                </>
              )}
            </button>
          )}
        </div>
        <div className="flex items-center space-x-1 mb-3">
          <p className="text-gray-600 dark:text-gray-400">
            Communicate with your team in real-time.
          </p>
          <div className="status-indicator ml-2">
            {connectionStatus === 'connected' ? (
              <span className="inline-flex items-center text-sm text-green-600 dark:text-green-400">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                Connected
              </span>
            ) : connectionStatus === 'connecting' ? (
              <span className="inline-flex items-center text-sm text-yellow-600 dark:text-yellow-400">
                <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mr-1 animate-pulse"></span>
                Connecting...
              </span>
            ) : connectionStatus === 'disconnected' ? (
              <span className="inline-flex items-center text-sm text-red-600 dark:text-red-400">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-1"></span>
                Disconnected
                <button 
                  onClick={handleReconnect} 
                  className="ml-2 underline text-xs"
                  disabled={isReconnecting}
                >
                  {isReconnecting ? 'Reconnecting...' : 'Try reconnecting'}
                </button>
              </span>
            ) : connectionStatus === 'error' ? (
              <span className="inline-flex items-center text-sm text-red-600 dark:text-red-400">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-1"></span>
                Connection Error
                <button 
                  onClick={handleReconnect} 
                  className="ml-2 underline text-xs"
                  disabled={isReconnecting}
                >
                  {isReconnecting ? 'Reconnecting...' : 'Try reconnecting'}
                </button>
              </span>
            ) : null}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project list (Column 1) */}
        <div className="space-y-4">
          <div className="linear-card dark:bg-gray-800 dark:border-gray-700 transition-all duration-200">
            <div className="linear-card-header dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Your Projects</h3>
              {totalUnreadCount > 0 && (
                <span className="inline-block py-1 px-2 text-xs font-semibold rounded-full bg-primary-600 dark:bg-primary-700 text-white">
                  {totalUnreadCount}
                </span>
              )}
            </div>
            <div className="linear-card-body p-0">
              {sortedProjects.length > 0 ? (
                <div className="linear-list divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                  {sortedProjects.map(project => (
                    <button
                      key={project._id}
                      className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-colors duration-200 flex items-center justify-between ${
                        selectedProject?._id === project._id 
                          ? 'bg-primary-50 dark:bg-primary-900/30' 
                          : ''
                      }`}
                      onClick={() => handleSelectProject(project)}
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: project.color || '#6366f1' }}
                        ></div>
                        <h4 className="font-medium dark:text-white">{project.name}</h4>
                      </div>
                      <div className="flex items-center">
                        {unreadCounts[project._id] > 0 && (
                          <span className="inline-block py-1 px-2 text-xs font-semibold rounded-full bg-primary-600 dark:bg-primary-700 text-white mr-2">
                            {unreadCounts[project._id]}
                          </span>
                        )}
                        {project.members && project.members.some(member => isUserOnline(member._id)) && (
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 mb-3">No projects found</p>
                  <Link to="/projects" className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create a new project
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Project Details */}
          {selectedProject && (
            <div className="linear-card dark:bg-gray-800 dark:border-gray-700 transition-all duration-200">
              <div className="linear-card-header dark:border-gray-700">
                <h3 className="text-lg font-semibold dark:text-white">Project Details</h3>
              </div>
              <div className="linear-card-body">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h4>
                  <p className="text-gray-800 dark:text-gray-200">
                    {selectedProject.description || 'No description provided.'}
                  </p>
                </div>
                
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Team Members</h4>
                  <div className="flex flex-wrap items-center mt-2">
                    {selectedProject.members && selectedProject.members.length > 0 ? (
                      selectedProject.members.map(member => (
                        <div key={member._id} className="flex items-center mr-4 mb-2">
                          <div className="linear-avatar linear-avatar-sm dark:bg-gray-700 mr-2 relative">
                            {member.photo ? (
                              <img src={member.photo} alt={member.displayName || 'Member'} className="h-full w-full object-cover" />
                            ) : (
                              <span>{member.displayName?.charAt(0) || member.email?.charAt(0) || '?'}</span>
                            )}
                            {isUserOnline(member._id) && (
                              <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-500 border border-white dark:border-gray-800"></span>
                            )}
                          </div>
                          <span className="text-sm dark:text-gray-200">
                            {member.displayName || member.email}
                            {member._id === user?._id && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(you)</span>}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No team members</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Link 
                    to={`/projects/${selectedProject._id}`} 
                    className="text-primary-600 dark:text-primary-400 hover:underline text-sm flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    View Project Details
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Chat (Column 2-3) */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <Chat 
              chatId={selectedProject._id} 
              title={`Chat - ${selectedProject.name}`} 
              height="70vh"
              fullWidth
            />
          ) : (
            <div className="linear-card dark:bg-gray-800 dark:border-gray-700 h-70vh flex items-center justify-center">
              <div className="text-center p-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Select a Project</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Choose a project from the list to start chatting with your team members in real-time.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 