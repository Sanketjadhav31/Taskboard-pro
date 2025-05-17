import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Settings = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    photo: user?.photo || ''
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    email: user?.notificationSettings?.email ?? true,
    browser: user?.notificationSettings?.browser ?? true,
    taskAssigned: user?.notificationSettings?.taskAssigned ?? true,
    taskStatusChange: user?.notificationSettings?.taskStatusChange ?? true,
    mentions: user?.notificationSettings?.mentions ?? true,
    projectUpdates: user?.notificationSettings?.projectUpdates ?? true
  });
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await axios.put('/api/user/profile', profileForm);
      
      if (response.data.user) {
        updateUser(response.data.user);
        setMessage({ 
          type: 'success', 
          text: 'Profile updated successfully!' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'New passwords do not match'
      });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await axios.put('/api/user/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setMessage({ 
        type: 'success', 
        text: 'Password updated successfully!' 
      });
      
      // Reset password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update password' 
      });
      console.error('Password update error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNotificationsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await axios.put('/api/notifications/settings', { 
        notificationSettings: notifications 
      });
      
      if (response.data.user) {
        updateUser(response.data.user);
        setMessage({ 
          type: 'success', 
          text: 'Notification preferences updated successfully!' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update notification settings' 
      });
      console.error('Notifications update error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderProfileTab = () => (
    <form onSubmit={handleProfileSubmit} className="space-y-6">
      {message.text && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profile Photo
        </label>
        <div className="flex items-center">
          <div className="linear-avatar linear-avatar-lg mr-4">
            {profileForm.photo ? (
              <img src={profileForm.photo} alt={profileForm.displayName} className="h-full w-full object-cover" />
            ) : (
              profileForm.displayName.charAt(0)
            )}
          </div>
          <div>
            <input 
              type="text" 
              name="photo" 
              placeholder="Photo URL" 
              value={profileForm.photo} 
              onChange={handleProfileChange}
              className="linear-input"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter a URL for your profile photo
            </p>
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="displayName">
          Name
        </label>
        <input 
          type="text" 
          id="displayName" 
          name="displayName" 
          value={profileForm.displayName}
          onChange={handleProfileChange}
          className="linear-input"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="bio">
          Bio
        </label>
        <textarea 
          id="bio" 
          name="bio" 
          rows="4" 
          value={profileForm.bio}
          onChange={handleProfileChange}
          className="linear-input"
          placeholder="Tell us a bit about yourself"
        ></textarea>
      </div>
      
      <div className="pt-3">
        <button 
          type="submit" 
          className="linear-btn linear-btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
  
  const renderPasswordTab = () => (
    <form onSubmit={handlePasswordSubmit} className="space-y-6">
      {message.text && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="currentPassword">
          Current Password
        </label>
        <input 
          type="password" 
          id="currentPassword" 
          name="currentPassword" 
          value={passwordForm.currentPassword}
          onChange={handlePasswordChange}
          className="linear-input"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newPassword">
          New Password
        </label>
        <input 
          type="password" 
          id="newPassword" 
          name="newPassword" 
          value={passwordForm.newPassword}
          onChange={handlePasswordChange}
          className="linear-input"
          required
          minLength="8"
        />
        <p className="mt-1 text-xs text-gray-500">
          Must be at least 8 characters long
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
          Confirm New Password
        </label>
        <input 
          type="password" 
          id="confirmPassword" 
          name="confirmPassword" 
          value={passwordForm.confirmPassword}
          onChange={handlePasswordChange}
          className="linear-input"
          required
        />
      </div>
      
      <div className="pt-3">
        <button 
          type="submit" 
          className="linear-btn linear-btn-primary"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </form>
  );
  
  const renderNotificationsTab = () => (
    <form onSubmit={handleNotificationsSubmit} className="space-y-6">
      {message.text && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      <div>
        <h3 className="text-lg font-medium mb-3">Notification Channels</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="email"
                name="email"
                type="checkbox"
                checked={notifications.email}
                onChange={handleNotificationChange}
                className="h-4 w-4"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email notifications</label>
              <p className="text-sm text-gray-500">Get notified via email for important updates</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="browser"
                name="browser"
                type="checkbox"
                checked={notifications.browser}
                onChange={handleNotificationChange}
                className="h-4 w-4"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="browser" className="text-sm font-medium text-gray-700">Browser notifications</label>
              <p className="text-sm text-gray-500">Receive real-time notifications in-app</p>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-3">Notification Preferences</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="taskAssigned"
                name="taskAssigned"
                type="checkbox"
                checked={notifications.taskAssigned}
                onChange={handleNotificationChange}
                className="h-4 w-4"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="taskAssigned" className="text-sm font-medium text-gray-700">Task assignments</label>
              <p className="text-sm text-gray-500">When you are assigned a new task</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="taskStatusChange"
                name="taskStatusChange"
                type="checkbox"
                checked={notifications.taskStatusChange}
                onChange={handleNotificationChange}
                className="h-4 w-4"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="taskStatusChange" className="text-sm font-medium text-gray-700">Task status changes</label>
              <p className="text-sm text-gray-500">When a task's status changes</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="mentions"
                name="mentions"
                type="checkbox"
                checked={notifications.mentions}
                onChange={handleNotificationChange}
                className="h-4 w-4"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="mentions" className="text-sm font-medium text-gray-700">Mentions</label>
              <p className="text-sm text-gray-500">When someone mentions you in a comment</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="projectUpdates"
                name="projectUpdates"
                type="checkbox"
                checked={notifications.projectUpdates}
                onChange={handleNotificationChange}
                className="h-4 w-4"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="projectUpdates" className="text-sm font-medium text-gray-700">Project updates</label>
              <p className="text-sm text-gray-500">When there are updates to projects you're a member of</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-3">
        <button 
          type="submit" 
          className="linear-btn linear-btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  );
  
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile': 
        return renderProfileTab();
      case 'password': 
        return renderPasswordTab();
      case 'notifications': 
        return renderNotificationsTab();
      default: 
        return renderProfileTab();
    }
  };
  
  return (
    <div className="linear-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings navigation */}
        <div className="md:w-64 flex-shrink-0">
          <div className="linear-card">
            <nav className="linear-list">
              <button 
                className={`linear-list-item flex items-center text-left ${activeTab === 'profile' ? 'bg-primary-50 text-primary-600 font-medium' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
              
              <button 
                className={`linear-list-item flex items-center text-left ${activeTab === 'password' ? 'bg-primary-50 text-primary-600 font-medium' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password
              </button>
              
              <button 
                className={`linear-list-item flex items-center text-left ${activeTab === 'notifications' ? 'bg-primary-50 text-primary-600 font-medium' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
              </button>
            </nav>
          </div>
        </div>
        
        {/* Settings content */}
        <div className="linear-card flex-1">
          <div className="linear-card-body">
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
