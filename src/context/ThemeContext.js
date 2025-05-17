import React, { createContext, useState, useEffect, useCallback } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Use lazy initialization to only run this once
  const [darkMode, setDarkMode] = useState(() => {
    try {
      // Check local storage for user's preferred theme
      const savedTheme = localStorage.getItem('darkMode');
      
      // If there's a saved preference, use it
      if (savedTheme !== null) {
        return savedTheme === 'true';
      }
      
      // Otherwise check if the user's system prefers dark mode
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (error) {
      console.error('Error getting theme preference:', error);
      return false; // Default to light mode if there's an error
    }
  });

  // Use useCallback to prevent recreating this function on each render
  const toggleTheme = useCallback(() => {
    setDarkMode(prevMode => {
      try {
        const newMode = !prevMode;
        localStorage.setItem('darkMode', String(newMode));
        return newMode;
      } catch (error) {
        console.error('Error saving theme preference:', error);
        return !prevMode; // Still toggle the theme even if saving fails
      }
    });
  }, []);

  // Apply theme effect - only runs when darkMode changes
  useEffect(() => {
    try {
      // Apply the theme to the document
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }, [darkMode]);

  // Create a memoized context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({ 
    darkMode, 
    toggleTheme 
  }), [darkMode, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 