import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddMemberModal = ({ onClose, projectId, currentMembers, setMembers }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roles, setRoles] = useState({});
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication required. Please log in again.');
          setLoading(false);
          return;
        }
        
        const res = await axios.get('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
          timeout: 10000
        });
        
        if (res.data && Array.isArray(res.data.users)) {
          const currentMemberIds = currentMembers.map(member => 
            typeof member === 'object' && member._id ? member._id : member
          );
          
          const availableUsers = res.data.users.filter(
            user => !currentMemberIds.includes(user._id)
          );
          
          setUsers(availableUsers);
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.response?.data?.message || 'Failed to load users. Please try again.');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [currentMembers]);
  
  const handleRetry = () => {
    setError('');
    
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication required. Please log in again.');
          setLoading(false);
          return;
        }
        
        const res = await axios.get('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        if (res.data && Array.isArray(res.data.users)) {
          const memberIds = currentMembers.map(member => 
            typeof member === 'object' && member._id ? member._id : member
          );
          
          const availableUsers = res.data.users.filter(
            user => !memberIds.includes(user._id)
          );
          
          setUsers(availableUsers);
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        console.error('Error fetching users on retry:', err);
        setError(err.response?.data?.message || 'Failed to load users. Please try again.');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  };
  
  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
      
      const updatedRoles = { ...roles };
      delete updatedRoles[userId];
      setRoles(updatedRoles);
    } else {
      setSelectedUsers([...selectedUsers, userId]);
      
      setRoles({
        ...roles,
        [userId]: 'member'
      });
    }
  };
  
  const handleRoleChange = (userId, role) => {
    setRoles({
      ...roles,
      [userId]: role
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      const memberData = {
        userIds: selectedUsers,
        roles: roles
      };
      
      const res = await axios.post(
        `/api/projects/${projectId}/members`, 
        memberData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        }
      );
      
      if (res.data && res.data.addedMembers) {
        setMembers([...currentMembers, ...res.data.addedMembers]);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add members');
    } finally {
      setSubmitting(false);
    }
  };
  
  const filteredUsers = users.filter(user => {
    if (!user) return false;
    
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const displayName = user.displayName || '';
    const email = user.email || '';
    const role = user.role || '';
    
    return displayName.toLowerCase().includes(query) || 
           email.toLowerCase().includes(query) ||
           role.toLowerCase().includes(query);
  });
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Add Team Members</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800 flex justify-between items-center">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
              <button 
                onClick={handleRetry}
                className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 ml-4 font-medium"
              >
                Retry
              </button>
            </div>
          )}
          
          <div className="mb-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              {searchQuery && (
                <button 
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setSearchQuery('')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="linear-spinner dark:border-gray-600 dark:border-t-primary-400"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading users...</span>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredUsers.map(user => (
                    <li 
                      key={user._id} 
                      className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition cursor-pointer ${selectedUsers.includes(user._id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                      onClick={() => toggleUserSelection(user._id)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => {}}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded-sm dark:bg-gray-700 dark:border-gray-600"
                          />
                          <div className="flex-shrink-0 h-10 w-10 mr-3 ml-3">
                            {user.photo ? (
                              <img src={user.photo} alt={user.displayName} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary-500 text-white flex items-center justify-center">
                                {user.displayName?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{user.displayName || 'Unnamed User'}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email || 'No email'}</p>
                          </div>
                        </div>
                        
                        {selectedUsers.includes(user._id) && (
                          <select
                            value={roles[user._id] || 'member'}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleRoleChange(user._id, e.target.value);
                            }}
                            onClick={e => e.stopPropagation()}
                            className="ml-2 text-sm border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="member">Member</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {error ? 'Error loading users. Please try again.' : 
                     searchQuery ? 'No users found matching your search' : 'No available users to add'}
                  </p>
                  {!searchQuery && users.length === 0 && !error && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">All team members have already been added to this project</p>
                  )}
                  {error && (
                    <button 
                      onClick={handleRetry}
                      className="mt-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                    >
                      Refresh
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedUsers.length === 0}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
              selectedUsers.length === 0
                ? 'bg-primary-400 cursor-not-allowed dark:bg-primary-700'
                : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700'
            }`}
          >
            {submitting ? 'Adding...' : `Add ${selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
