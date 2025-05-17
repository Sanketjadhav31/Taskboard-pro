import React, { useContext, useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import { AuthContext } from './context/AuthContext';
import ThemeProvider from './context/ThemeContext';
import ChatProvider from './context/ChatContext';
import MyTasks from './pages/MyTasks';
import Team from './pages/Team';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import NotificationsPage from './pages/NotificationsPage';
import ChatPage from './pages/ChatPage';
import LandingPage from './pages/LandingPage';
import Automations from './pages/Automations';
import SearchPage from './pages/SearchPage';
import NotificationManager from './components/NotificationManager';
import './index.css';

// Create a basic Notifications component since it doesn't exist yet
const Notifications = () => {
  return (
    <div className="linear-fade-in">
      <h1 className="text-2xl font-bold mb-3">Notifications</h1>
      <p className="text-gray-600 mb-6">View and manage all your notifications</p>
      
      <div className="linear-card">
        <div className="linear-card-header">
          <h2 className="text-lg font-semibold">All Notifications</h2>
          <button className="linear-btn linear-btn-sm linear-btn-secondary">Mark all as read</button>
        </div>
        <div className="linear-card-body p-0">
          <div className="linear-list">
            <div className="linear-list-item flex items-start">
              <div className="linear-avatar linear-avatar-sm mr-3 bg-primary-100 text-primary-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">You were assigned a new task: "Update dashboard UI"</p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="linear-list-item flex items-start">
              <div className="linear-avatar linear-avatar-sm mr-3 bg-info-100 text-info-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">John mentioned you in a comment: "Can @you review this PR?"</p>
                <p className="text-xs text-gray-500 mt-1">1 day ago</p>
              </div>
            </div>
            <div className="linear-list-item flex items-start">
              <div className="linear-avatar linear-avatar-sm mr-3 bg-success-100 text-success-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Task "Implement login page" was marked as completed</p>
                <p className="text-xs text-gray-500 mt-1">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Configure axios defaults - only do this once
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

// Add request interceptor to inject token - moved outside component to prevent recreating on each render
axios.interceptors.request.use(
  (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors - moved outside component with improved redirect handling
let isRedirecting = false; // Prevent multiple redirects
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle authentication errors (401/403)
    if (error.response && 
        (error.response.status === 401 || error.response.status === 403) && 
        !isRedirecting && 
        !window.location.pathname.includes('/login') && 
        !window.location.pathname.includes('/auth-success')) {
      // Only clear token and redirect if not already doing so and not on login/auth pages
      isRedirecting = true;
      console.log('Session expired or unauthorized, redirecting to login');
      // Clear token
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      // Redirect to login after a small delay to prevent redirect loops
      setTimeout(() => {
        window.location = '/login';
        isRedirecting = false; // Reset flag after redirect
      }, 100);
    }
    return Promise.reject(error);
  }
);

// Auth Success Component to handle OAuth redirects
const AuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUserData, setUser, setIsAuthenticated } = useContext(AuthContext);
  const [processingAuth, setProcessingAuth] = useState(true);
  
  const token = searchParams.get('token');
  const redirectTo = searchParams.get('redirectTo') || 'dashboard';
  
  // This effect runs once on component mount
  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        console.log('Auth success page: Processing authentication');
        
        if (token) {
          console.log('Auth success page: Token found in URL');
          
          // Clear any existing token and set the new one
          localStorage.removeItem('token');
          localStorage.setItem('token', token);
          
          // Update axios headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user data directly (don't rely on refreshUserData)
          const res = await axios.get('/auth/current-user', {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true
          });
          
          if (res.data && res.data.user) {
            console.log('Auth success: User data fetched successfully');
            // Set user and auth state directly
            setUser(res.data.user);
            setIsAuthenticated(true);
            
            // Wait a moment before redirecting
            setTimeout(() => {
              console.log('Auth success: Redirecting to', redirectTo);
              navigate(`/${redirectTo}`, { replace: true });
              setProcessingAuth(false);
            }, 500);
            return;
          }
        }
        
        // If we didn't return above (no token or no user data)
        console.log('Auth success: No token or user data, trying fallback refresh');
        const success = await refreshUserData();
        
        if (success) {
          console.log('Auth success: Fallback refresh successful');
          navigate(`/${redirectTo}`, { replace: true });
        } else {
          console.error('Auth success: Authentication failed');
          navigate('/login', { replace: true, state: { error: 'Authentication failed' } });
        }
        
        setProcessingAuth(false);
      } catch (err) {
        console.error('Error during auth redirect:', err);
        navigate('/login', { replace: true, state: { error: 'Authentication error' } });
        setProcessingAuth(false);
      }
    };
    
    handleAuthSuccess();
  }, [token, redirectTo, navigate, refreshUserData, setUser, setIsAuthenticated]);
  
  if (!processingAuth) return null;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="linear-spinner dark:border-gray-600 dark:border-t-primary-400"></div>
      <p className="ml-3 text-gray-600 dark:text-gray-300">Completing authentication...</p>
    </div>
  );
};

const App = () => {
  const { user, isAuthenticated, loading, logout } = useContext(AuthContext);
  const [initialized, setInitialized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Log authentication state for debugging
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, user, loading });
  }, [isAuthenticated, user, loading]);
  
  // Memoize the toggle function to prevent recreating on each render
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prevState => !prevState);
  }, []);
  
  useEffect(() => {
    // Set initialized to true once the auth check is complete
    if (!loading) {
      setInitialized(true);
    }
  }, [loading]);
  
  // Don't render anything until authentication is checked
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="linear-spinner dark:border-gray-600 dark:border-t-primary-400"></div>
      </div>
    );
  }
  
  return (
    <Router>
      <ThemeProvider>
        <ChatProvider>
          <div className={`min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {isAuthenticated && (
              <>
                <Sidebar 
                  user={user} 
                  collapsed={sidebarCollapsed} 
                  toggleSidebar={toggleSidebar} 
                />
                <Header 
                  user={user} 
                  logout={logout} 
                  className="w-full"
                />
                <NotificationManager />
              </>
            )}
            
            <main className={`flex-grow transition-all duration-300 ease-in-out bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 ${
              isAuthenticated ? `p-6 ${sidebarCollapsed ? 'ml-16 w-[calc(100%-4rem)]' : 'ml-64'} mt-16` : 'w-full'
            }`}>
              <div className="w-full">
                <Routes>
                  {/* Public routes - accessible without authentication */}
                  <Route 
                    path="/" 
                    element={
                      !isAuthenticated ? (
                        <LandingPage />
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    } 
                  />
                  <Route 
                    path="/login" 
                    element={
                      !isAuthenticated ? (
                        <Login />
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    } 
                  />
                  <Route 
                    path="/signup" 
                    element={
                      !isAuthenticated ? (
                        <Signup />
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    } 
                  />
                  <Route path="/auth-success" element={<AuthSuccess />} />
                  
                  {/* Protected routes - require authentication */}
                  <Route 
                    path="/dashboard" 
                    element={
                      isAuthenticated ? (
                        <Dashboard />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    } 
                  />
                  <Route 
                    path="/projects" 
                    element={
                      isAuthenticated ? (
                        <Projects />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    } 
                  />
                  <Route 
                    path="/projects/:id" 
                    element={
                      isAuthenticated ? (
                        <ProjectDetails />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    } 
                  />
                  <Route 
                    path="/tasks" 
                    element={
                      isAuthenticated ? (
                        <MyTasks />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    } 
                  />
                  <Route 
                    path="/team" 
                    element={
                      isAuthenticated ? (
                        <Team />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      isAuthenticated ? (
                        <Settings />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      isAuthenticated ? (
                        <Profile />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    } 
                  />
                  <Route 
                    path="/notifications" 
                    element={
                      isAuthenticated ? (
                        <NotificationsPage />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    } 
                  />
                  <Route 
                    path="/chat" 
                    element={
                      isAuthenticated ? (
                        <ChatPage />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    } 
                  />
                  <Route 
                    path="/automations" 
                    element={
                      isAuthenticated ? (
                        <Automations />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    } 
                  />
                  <Route 
                    path="/search" 
                    element={
                      isAuthenticated ? (
                        <SearchPage />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    } 
                  />
                  
                  {/* 404 page */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </main>
          </div>
        </ChatProvider>
      </ThemeProvider>
    </Router>
  );
};

export default React.memo(App);
