import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import AddMemberModal from './AddMemberModal';
import InviteMemberForm from './InviteMemberForm';

const ProjectMembers = ({ project, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [members, setMembers] = useState(project.members || []);
  const [error, setError] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const inviteFormRef = useRef(null);
  
  // Close invite form when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (inviteFormRef.current && !inviteFormRef.current.contains(event.target)) {
        setIsInviteOpen(false);
      }
    }
    
    if (isInviteOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isInviteOpen]);
  
  const roles = ["member", "editor", "admin"];
  
  const isOwner = currentUser && project.owner && 
    (project.owner._id === currentUser.id || project.owner._id === currentUser._id);
  
  const removeMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/projects/${project._id}/members/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      
      setMembers(members.filter(member => member._id !== userId));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error removing member');
      console.error('Error removing member:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddMembers = (newMembers) => {
    if (Array.isArray(newMembers)) {
      setMembers([...members, ...newMembers]);
    } else if (newMembers) {
      setMembers([...members, newMembers]);
    }
    // Close forms after successful add
    setIsInviteOpen(false);
    setIsModalOpen(false);
  };
  
  const updateMemberRole = async (userId, newRole) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/projects/${project._id}/members/${userId}/role`, 
        { role: newRole },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        }
      );
      
      // Update member in local state
      setMembers(members.map(member => 
        member._id === userId ? { ...member, role: newRole } : member
      ));
      
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating member role');
      console.error('Error updating member role:', err);
    } finally {
      setLoading(false);
      setEditingMember(null);
    }
  };

  // Get role badge class
  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'admin':
        return 'linear-badge linear-badge-primary dark:bg-primary-900/30 dark:text-primary-400';
      case 'editor':
        return 'linear-badge linear-badge-success dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'linear-badge dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  return (
    <div className="linear-card dark:bg-gray-800 dark:border-gray-700">
      <div className="linear-card-header dark:border-gray-700">
        <h3 className="linear-modal-title dark:text-white">Team Members</h3>
        
        {isOwner && (
          <div className="flex space-x-3 relative">
            <div className="relative">
              <button 
                onClick={() => {
                  setIsInviteOpen(!isInviteOpen);
                  setIsModalOpen(false);
                }}
                className={`linear-btn linear-btn-sm ${isInviteOpen 
                  ? 'linear-btn-primary-active dark:bg-primary-700' 
                  : 'linear-btn-primary dark:bg-primary-600 dark:text-white dark:hover:bg-primary-700'}`}
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Invite
              </button>
              
              {isInviteOpen && (
                <div 
                  ref={inviteFormRef}
                  className="absolute right-0 top-full mt-2 z-50 w-80 shadow-lg rounded-lg animate-fade-in"
                  style={{animation: 'fadeIn 0.3s ease-in-out'}}
                >
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h4 className="text-sm font-medium mb-3 dark:text-white">Invite Team Member</h4>
                    <InviteMemberForm 
                      projectId={project._id} 
                      onSuccess={handleAddMembers} 
                      onCancel={() => setIsInviteOpen(false)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => {
                setIsModalOpen(!isModalOpen);
                setIsInviteOpen(false);
              }}
              className={`linear-btn linear-btn-sm ${isModalOpen 
                ? 'linear-btn-secondary-active dark:bg-gray-600' 
                : 'linear-btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'}`}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add
            </button>
            
            {isModalOpen && (
              <AddMemberModal
                projectId={project._id}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleAddMembers}
                position="right"
              />
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="mx-5 mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-md text-sm linear-fade-in">
          {error}
          <button 
            className="float-right text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
            onClick={() => setError('')}
          >
            &times;
          </button>
        </div>
      )}
      
      <div className="linear-card-body dark:bg-gray-800">
        {loading && (
          <div className="linear-loading my-4">
            <div className="linear-pulse dark:border-t-gray-300"></div>
          </div>
        )}
        
        {members.length > 0 ? (
          <ul className="linear-member-list dark:divide-gray-700">
            {members.map(member => (
              <li key={member._id} className="linear-member-card dark:border-gray-700 dark:hover:bg-gray-700/50">
                <div className="linear-member-info">
                  <div className="linear-avatar linear-avatar-md dark:bg-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600">
                    {member.photo ? (
                      <img src={member.photo} alt={member.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="linear-avatar-md">
                        {member.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="linear-member-details">
                    <span className="linear-member-name dark:text-white">{member.displayName}</span>
                    <span className="linear-member-email dark:text-gray-400">{member.email}</span>
                    {project.owner && member._id === project.owner._id ? (
                      <span className="linear-badge linear-badge-primary dark:bg-primary-900/30 dark:text-primary-400 mt-1">
                        Owner
                      </span>
                    ) : (
                      <span className={`${getRoleBadgeClass(member.role)} mt-1`}>
                        {member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Member'}
                      </span>
                    )}
                  </div>
                </div>
                
                {isOwner && project.owner && member._id !== project.owner._id && (
                  <div className="linear-member-actions">
                    {editingMember === member._id ? (
                      <div className="flex items-center border rounded-md overflow-hidden shadow-sm dark:border-gray-600">
                        <select 
                          value={member.role || 'member'} 
                          onChange={(e) => updateMemberRole(member._id, e.target.value)}
                          className="py-1 px-2 text-sm border-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 focus:border-transparent dark:bg-gray-700 dark:text-gray-300"
                          disabled={loading}
                        >
                          {roles.map(role => (
                            <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => setEditingMember(null)} 
                          className="bg-gray-200 dark:bg-gray-600 py-1 px-2 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                          disabled={loading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingMember(member._id)}
                          className="linear-action-btn linear-action-edit dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-700"
                          title="Edit role"
                          disabled={loading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => removeMember(member._id)}
                          className="linear-action-btn linear-action-delete dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-700"
                          title="Remove member"
                          disabled={loading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-300 mt-4 text-lg">No members in this project yet</p>
            <p className="text-gray-400 dark:text-gray-400 mt-1">Start building your team by inviting members</p>
            {isOwner && (
              <div className="flex justify-center mt-6 space-x-4">
                <button 
                  onClick={() => setIsInviteOpen(true)}
                  className="linear-btn linear-btn-primary dark:bg-primary-600 dark:text-white"
                >
                  Invite by Email
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="linear-btn linear-btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                >
                  Add Existing Users
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectMembers;
