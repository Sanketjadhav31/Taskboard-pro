import React from 'react';

/**
 * PageLayout component provides consistent layout structure for pages
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Optional page description
 * @param {React.ReactNode} props.actions - Optional action buttons to display in the header
 * @param {React.ReactNode} props.children - Page content
 * @param {boolean} props.loading - Whether the page is loading
 * @param {string} props.error - Error message to display
 * @param {boolean} props.fullWidth - Whether the content should take up full width
 * @param {string} props.className - Additional classes for the main container
 */
const PageLayout = ({ 
  title, 
  description, 
  actions, 
  children, 
  loading = false, 
  error = null,
  fullWidth = false,
  className = ''
}) => {
  return (
    <div className={`linear-fade-in ${className}`}>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-2xl font-bold mb-1 dark:text-gray-100">{title}</h1>
            {description && (
              <p className="text-gray-600 dark:text-gray-400">{description}</p>
            )}
          </div>
          
          {actions && (
            <div className="flex gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="linear-card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 mb-6 p-4 text-red-700 dark:text-red-400 rounded-lg">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className="linear-card p-8 flex justify-center items-center">
          <div className="linear-spinner dark:border-gray-600 dark:border-t-primary-400"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      ) : (
        <div className={fullWidth ? 'w-full' : 'max-w-6xl mx-auto'}>
          {children}
        </div>
      )}
    </div>
  );
};

export default PageLayout; 