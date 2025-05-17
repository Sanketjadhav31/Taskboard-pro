import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import InviteUserModal from '../components/InviteUserModal';
import { ThemeContext } from '../context/ThemeContext';

const Team = () => {
  const { darkMode } = useContext(ThemeContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const dropdownRef = useRef(null);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/users');
        // Initialize each user with status property if it doesn't exist
        const enrichedUsers = res.data.users.map(user => ({
          ...user,
          status: user.status || 'active', // Default to active
          projects: user.projects || [],
          role: user.role || 'Member',
        }));
        setUsers(enrichedUsers);
      } catch (err) {
        setError('Failed to load team members');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null);
        setConfirmDelete(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Auto-dismiss success message
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => {
        setActionSuccess('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);
  
  const filteredUsers = users.filter(user => {
    // Text search filter
    const matchesSearch = 
      (user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.role && user.role.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Status filter
    if (activeFilter !== 'all' && user.status !== activeFilter) {
      return false;
    }
    
    // Role filter
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }
    
    return matchesSearch;
  });
  
  const handleDeleteUser = async (userId) => {
    try {
      setUserActionLoading(true);
      // Uncomment to use the real API call
      const token = localStorage.getItem('token');
      await axios.delete(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      
      // Update local state
      setUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
      setActionSuccess('User deleted successfully!');
      setConfirmDelete(null);
      setDropdownOpen(null);
    } catch (err) {
      setError('Failed to delete user');
      console.error('Error deleting user:', err);
    } finally {
      setUserActionLoading(false);
    }
  };
  
  const handleChangeUserStatus = async (userId, newStatus) => {
    try {
      setUserActionLoading(true);
      // Get token for authorization
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setUserActionLoading(false);
        return;
      }

      // Make API call with proper headers
      const response = await axios.patch(
        `/api/users/${userId}`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      // Check if response is successful
      if (response.data) {
        // Update local state
        setUsers(prevUsers => prevUsers.map(u => 
          u._id === userId ? { ...u, status: newStatus } : u
        ));
        setActionSuccess(`User status changed to ${newStatus}!`);
        setDropdownOpen(null);
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      setError(err.response?.data?.message || 'Failed to update user status. Please try again.');
    } finally {
      setUserActionLoading(false);
    }
  };
  
  const handleChangeRole = async (userId, newRole) => {
    try {
      setUserActionLoading(true);
      // Get token for authorization
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setUserActionLoading(false);
        return;
      }

      // Make API call with proper headers
      const response = await axios.patch(
        `/api/users/${userId}`, 
        { role: newRole },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      // Check if response is successful
      if (response.data) {
        // Update local state 
        setUsers(prevUsers => prevUsers.map(u => 
          u._id === userId ? { ...u, role: newRole } : u
        ));
        setActionSuccess(`User role updated to ${newRole}!`);
        setDropdownOpen(null);
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err.response?.data?.message || 'Failed to update user role. Please try again.');
    } finally {
      setUserActionLoading(false);
    }
  };
  
  const openEditModal = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
    setDropdownOpen(null);
  };
  
  const TeamMemberCard = ({ member, onEdit, onDelete }) => {
    return (
      <div className="p-4 border rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 transition-all duration-200 hover:shadow-md dark:hover:shadow-gray-900/30">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {member.photo ? (
              <img className="h-12 w-12 rounded-full border-2 border-gray-200 dark:border-gray-700" src={member.photo} alt={member.displayName} />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                <span className="text-xl font-medium text-primary-600 dark:text-primary-300">
                  {member.displayName ? member.displayName.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {member.displayName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {member.email}
            </p>
            <div className="mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                ${member.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                {member.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 ml-2">
                {member.role}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-2">
            <button
              onClick={() => onEdit(member)}
              className="bg-transparent text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(member._id)}
              className="bg-transparent text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return <div className="linear-loading"><div className="linear-spinner dark:border-gray-600 dark:border-t-primary-400"></div></div>;
  }
  
  if (error) {
    return (
      <div className="linear-card linear-card-body dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="linear-btn linear-btn-primary mt-3"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Team Members</h1>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="linear-btn linear-btn-primary dark:bg-primary-600 dark:hover:bg-primary-700"
        >
          Add Team Member
        </button>
      </div>
      
      {actionSuccess && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-3 rounded-md flex items-center justify-between linear-fade-in">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {actionSuccess}
          </div>
          <button 
            onClick={() => setActionSuccess('')}
            className="text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-md flex items-center justify-between linear-fade-in">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
          <button 
            onClick={() => setError('')}
            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(member => (
          <div key={member._id} className="dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <TeamMemberCard member={member} onEdit={openEditModal} onDelete={handleDeleteUser} />
          </div>
        ))}
      </div>
      
      {/* Invite User Modal */}
      {isInviteModalOpen && (
        <div className="linear-modal-overlay">
          <div className="linear-modal">
            <InviteUserModal 
              onClose={() => setIsInviteModalOpen(false)} 
              setUsers={(newUsers) => {
                // Make sure each user has the required properties
                setUsers(newUsers.map(user => ({
                  ...user,
                  status: user.status || 'active',
                  role: user.role || 'Member',
                  projects: user.projects || [],
                })));
              }}
            />
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="linear-modal-overlay dark:bg-gray-900/80">
          <div className="linear-modal dark:bg-gray-800">
            <div className="linear-card dark:bg-gray-800 dark:border-gray-700">
              <div className="linear-card-header flex justify-between dark:border-gray-700">
                <h3 className="font-medium dark:text-gray-100">Edit User</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="linear-card-body dark:bg-gray-800">
                <div className="mb-4 flex items-center">
                  <div className="linear-avatar linear-avatar-lg mr-4 dark:bg-gray-700 dark:text-gray-300">
                    {selectedUser.photo ? (
                      <img src={selectedUser.photo} alt={selectedUser.displayName} />
                    ) : (
                      <span>{selectedUser.displayName?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium dark:text-gray-100">{selectedUser.displayName || "User"}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Role</label>
                  <div className="space-y-2">
                    <button 
                      className={`w-full text-left px-3 py-2 rounded-md ${selectedUser.role === 'Admin' 
                        ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-800 text-primary-700 dark:text-primary-300' 
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                      onClick={() => handleChangeRole(selectedUser._id, 'Admin')}
                      disabled={userActionLoading}
                    >
                      <div className="flex items-center">
                        <span className="font-medium">Admin</span>
                            </div>
                      <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">Can manage all aspects of the workspace</p>
                    </button>
                    
                    <button 
                      className={`w-full text-left px-3 py-2 rounded-md ${selectedUser.role === 'Manager' 
                        ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-800 text-primary-700 dark:text-primary-300' 
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                      onClick={() => handleChangeRole(selectedUser._id, 'Manager')}
                      disabled={userActionLoading}
                    >
                      <div className="flex items-center">
                        <span className="font-medium">Manager</span>
                        </div>
                      <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">Can manage projects and team members</p>
                    </button>
                    
                    <button 
                      className={`w-full text-left px-3 py-2 rounded-md ${selectedUser.role === 'Member' 
                        ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-800 text-primary-700 dark:text-primary-300' 
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                      onClick={() => handleChangeRole(selectedUser._id, 'Member')}
                      disabled={userActionLoading}
                    >
                      <div className="flex items-center">
                        <span className="font-medium">Member</span>
                      </div>
                      <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">Can participate in projects they are assigned to</p>
                    </button>
                  </div>
                            </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Status</label>
                  <div className="space-y-2">
                    <button 
                      className={`w-full text-left px-3 py-2 rounded-md ${selectedUser.status !== 'inactive' 
                        ? 'bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-400' 
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                      onClick={() => handleChangeUserStatus(selectedUser._id, 'active')}
                      disabled={userActionLoading}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Active</span>
                        </div>
                    </button>
                    
                    <button 
                      className={`w-full text-left px-3 py-2 rounded-md ${selectedUser.status === 'inactive' 
                        ? 'bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400' 
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                      onClick={() => handleChangeUserStatus(selectedUser._id, 'inactive')}
                      disabled={userActionLoading}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span className="font-medium">Inactive</span>
                      </div>
                      </button>
                  </div>
        </div>
      </div>
      
              <div className="linear-card-footer flex justify-end space-x-2 dark:border-gray-700">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="linear-btn linear-btn-secondary dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  disabled={userActionLoading}
                >
                  {userActionLoading ? 'Processing...' : 'Cancel'}
                </button>
                <button 
                  onClick={() => {
                    // Save and update the user in the database
                    const updateUser = async () => {
                      try {
                        setUserActionLoading(true);
                        const token = localStorage.getItem('token');
                        const response = await axios.patch(
                          `/api/users/${selectedUser._id}`,
                          {
                            role: selectedUser.role,
                            status: selectedUser.status
                          },
                          {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            },
                            withCredentials: true
                          }
                        );
                        
                        if (response.data) {
                          setActionSuccess('User updated successfully!');
                        }
                        setIsEditModalOpen(false);
                      } catch (err) {
                        setError('Failed to update user');
                        console.error('Error updating user:', err);
                      } finally {
                        setUserActionLoading(false);
                      }
                    };
                    
                    updateUser();
                  }}
                  className="linear-btn linear-btn-primary dark:bg-primary-600 dark:hover:bg-primary-700 dark:text-white"
                  disabled={userActionLoading}
                >
                  {userActionLoading ? 'Saving...' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
