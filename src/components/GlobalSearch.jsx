import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SearchResultItem = ({ item, onClick }) => {
  // Render different item types differently
  switch (item.type) {
    case 'project':
      return (
        <div 
          className="p-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-md"
          onClick={() => onClick(`/projects/${item._id}`)}
        >
          <div className="flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center" 
            style={{ backgroundColor: item.color || '#6366f1' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Project</p>
          </div>
        </div>
      );
    
    case 'task':
      return (
        <div 
          className="p-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-md"
          onClick={() => onClick(`/tasks`)}
        >
          <div className="flex-shrink-0 h-8 w-8 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Task in {item.project ? item.project.name : 'Unknown Project'}
            </p>
          </div>
        </div>
      );
      
    case 'user':
      return (
        <div 
          className="p-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-md"
          onClick={() => onClick(`/team`)}
        >
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 flex items-center justify-center">
            {item.photo ? (
              <img src={item.photo} alt={item.displayName} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="text-sm font-medium">
                {item.displayName?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.displayName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Team member</p>
          </div>
        </div>
      );
      
    default:
      return null;
  }
};

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  // Handle outside clicks to close the results dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Debounced search function
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data) {
          setResults(response.data);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [query]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
      setQuery('');
    }
  };
  
  const handleResultClick = (path) => {
    navigate(path);
    setShowResults(false);
    setQuery('');
  };
  
  return (
    <div className="relative" ref={searchRef}>
      <form onSubmit={handleSearch}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input 
            type="text" 
            placeholder="Search projects, tasks, and team..." 
            className="linear-input w-64 pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:border-primary-500 transition-all duration-200"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim()) {
                setShowResults(true);
              }
            }}
            onFocus={() => {
              if (query.trim()) {
                setShowResults(true);
              }
            }}
          />
          
          {query && (
            <button 
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>
      
      {/* Results dropdown */}
      {showResults && query.trim() && (
        <div className="absolute mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Results</h3>
          </div>
          
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="linear-spinner h-6 w-6 dark:border-gray-600 dark:border-t-primary-400"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {results.map((item, index) => (
                <SearchResultItem 
                  key={`${item.type}-${item._id || index}`} 
                  item={item}
                  onClick={handleResultClick}
                />
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
            </div>
          ) : null}
          
          <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button 
              type="button"
              className="w-full text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              onClick={handleSearch}
            >
              View all results for "{query}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch; 