import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import PageLayout from '../components/PageLayout';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState({
    projects: [],
    tasks: [],
    users: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}&full=true`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data) {
          // Group results by type
          const groupedResults = {
            projects: response.data.filter(item => item.type === 'project'),
            tasks: response.data.filter(item => item.type === 'task'),
            users: response.data.filter(item => item.type === 'user')
          };
          
          setResults(groupedResults);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  // Calculate total results
  const totalResults = results.projects.length + results.tasks.length + results.users.length;

  return (
    <PageLayout
      title="Search Results"
      description={`${totalResults} results for "${query}"`}
      loading={loading}
      error={error}
    >
      {!loading && !error && totalResults === 0 && (
        <div className="linear-card p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h2 className="text-xl font-bold mb-2 dark:text-gray-200">No results found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No items match your search for "{query}"
          </p>
        </div>
      )}

      {!loading && !error && totalResults > 0 && (
        <div className="space-y-8">
          {/* Projects section */}
          {results.projects.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.projects.map((project) => (
                  <Link 
                    key={project._id} 
                    to={`/projects/${project._id}`}
                    className="linear-card hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="linear-card-body">
                      <div className="flex items-center mb-2">
                        <div 
                          className="w-4 h-4 rounded-full mr-2" 
                          style={{ backgroundColor: project.color || '#6366f1' }}
                        ></div>
                        <h3 className="font-bold dark:text-gray-100">{project.name}</h3>
                      </div>
                      
                      {project.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {project.description}
                        </p>
                      )}
                      
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Tasks: {project.taskCount || 0} • Members: {project.memberCount || 0}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tasks section */}
          {results.tasks.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Tasks</h2>
              <div className="linear-card">
                <div className="linear-card-body p-0">
                  <div className="linear-list divide-y divide-gray-100 dark:divide-gray-700">
                    {results.tasks.map((task) => (
                      <Link 
                        key={task._id} 
                        to={`/tasks`}
                        className="block hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <div className="p-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mt-1">
                              <div className={`h-4 w-4 rounded-full ${
                                task.status === 'completed' ? 'bg-green-500' :
                                task.status === 'in_progress' ? 'bg-blue-500' :
                                task.status === 'blocked' ? 'bg-red-500' :
                                'bg-gray-300 dark:bg-gray-600'
                              }`}></div>
                            </div>
                            <div className="ml-3">
                              <h3 className="font-medium dark:text-gray-100">{task.title}</h3>
                              
                              <div className="flex flex-wrap gap-2 mt-2">
                                {task.priority && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  }`}>
                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                  </span>
                                )}
                                
                                {task.project && (
                                  <span 
                                    className="text-xs px-2 py-1 rounded-full text-white" 
                                    style={{ backgroundColor: task.project.color || '#6366f1' }}
                                  >
                                    {task.project.name}
                                  </span>
                                )}
                                
                                {task.dueDate && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team members section */}
          {results.users.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Team Members</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.users.map((user) => (
                  <Link 
                    key={user._id} 
                    to={`/team`}
                    className="linear-card hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="linear-card-body flex items-center">
                      <div className="flex-shrink-0 mr-4">
                        {user.photo ? (
                          <img 
                            src={user.photo} 
                            alt={user.displayName} 
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400 flex items-center justify-center">
                            <span className="text-lg font-medium">
                              {user.displayName?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium dark:text-gray-100">{user.displayName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        
                        {user.role && (
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
};

export default SearchPage; 