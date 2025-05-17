import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenChecked, setTokenChecked] = useState(false);

  // Check for token or cookie-based authentication on page load
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      
      try {
        // First check for JWT token in localStorage
        const token = localStorage.getItem('token');
        
        // Configure axios with token if it exists
        if (token) {
          console.log('Found existing token:', token.substring(0, 15) + '...');
          
          // Validate token format (simple check)
          if (!token.includes('.') || token.trim() === '') {
            console.error('Invalid token format, clearing token');
            localStorage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }
          
          // Set token in axios headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Try to get current user with the token
          console.log('Fetching user data with token...');
          const res = await axios.get('/auth/current-user', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            withCredentials: true
          });
          
          console.log('User data response:', res.status, res.data ? 'has data' : 'no data');
          
          if (res.data && res.data.user) {
            console.log('Successfully authenticated user:', res.data.user.email);
            setUser(res.data.user);
            setIsAuthenticated(true);
          } else {
            console.log('No valid user found with token');
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          console.log('No token found, user is not authenticated');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth error:', err);
        // Only clear token if error is authentication related
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.log('Authentication error, clearing token');
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
        setTokenChecked(true);
      }
    };

    checkAuth();
    
    // Set up a timer to refresh auth every 15 minutes to keep session alive
    const authRefreshInterval = setInterval(() => {
      console.log('Refreshing auth token...');
      checkAuth();
    }, 15 * 60 * 1000); // 15 minutes
    
    // Listen for storage events to handle login/logout in other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        console.log('Token changed in localStorage, refreshing auth state');
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up interval and event listener on component unmount
    return () => {
      clearInterval(authRefreshInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Global axios configuration for authorization
  useEffect(() => {
    // Set up interceptor for all requests
    const interceptor = axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
          config.withCredentials = true; // Always send cookies
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Clean up interceptor on unmount
    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  // Register user
  const register = async (formData) => {
    try {
      console.log('Registering user:', formData.email);
      const res = await axios.post('/auth/register', formData);
      const token = res.data.token;
      
      if (!token) {
        console.error('No token received from registration');
        return {
          success: false,
          message: 'Registration failed - no authentication token received'
        };
      }
      
      localStorage.setItem('token', token);
      
      // Set authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(res.data.user);
      setIsAuthenticated(true);
      console.log('User registered successfully:', res.data.user);
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      console.log('Logging in user:', formData.email);
      const res = await axios.post('/auth/login', formData);
      const token = res.data.token;
      
      if (!token) {
        console.error('No token received from login');
        return {
          success: false,
          message: 'Login failed - no authentication token received'
        };
      }
      
      localStorage.setItem('token', token);
      
      // Set authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(res.data.user);
      setIsAuthenticated(true);
      console.log('User logged in successfully:', res.data.user);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed'
      };
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          message: 'Not authenticated'
        };
      }

      // Set authorization header explicitly for this request
      const res = await axios.put('/api/user/profile', userData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setUser(prevState => ({ ...prevState, ...res.data.user }));
      return { success: true, user: res.data.user };
    } catch (err) {
      console.error('Profile update error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update profile'
      };
    }
  };

  // Update user photo
  const updatePhoto = async (photoData) => {
    try {
      const formData = new FormData();
      formData.append('photo', photoData);
      
      const token = localStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          message: 'Not authenticated'
        };
      }

      // Set authorization header explicitly for this request
      const res = await axios.post('/api/user/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      setUser(prevState => ({ ...prevState, photo: res.data.photoUrl }));
      return { success: true, photoUrl: res.data.photoUrl };
    } catch (err) {
      console.error('Photo upload error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update profile photo'
      };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await axios.get('/auth/logout', { withCredentials: true });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found during refresh');
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
      
      // Ensure token is in Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const res = await axios.get('/auth/current-user', {
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        withCredentials: true
      });
      
      if (res.data && res.data.user) {
        console.log('Successfully refreshed user data:', res.data.user.email);
        setUser(res.data.user);
        setIsAuthenticated(true);
        return true;
      }
      
      console.log('No valid user data returned from refresh');
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } catch (err) {
      console.error('Error refreshing user data:', err);
      // Only clear token if error is authentication related
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        console.log('Authentication error during refresh, clearing token');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
      }
      return false;
    }
  };

  // Initiate Google OAuth login
  const googleLogin = () => {
    // Clear any existing token before redirecting to Google OAuth
    try {
      console.log('Starting Google OAuth login flow');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      // Redirect to Google OAuth
      const baseUrl = axios.defaults.baseURL || 'http://localhost:5000';
      console.log('Redirecting to Google OAuth:', `${baseUrl}/auth/google`);
      window.location.href = `${baseUrl}/auth/google`;
    } catch (e) {
      console.error('Error initiating Google login:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        setIsAuthenticated,
        loading,
        tokenChecked,
        register,
        login,
        googleLogin,
        logout,
        updateProfile,
        updatePhoto,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
