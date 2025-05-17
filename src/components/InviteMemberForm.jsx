import React, { useState } from 'react';
import axios from 'axios';

const InviteMemberForm = ({ projectId, onSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const roles = [
    { value: 'member', label: 'Member', description: 'Can view and comment' },
    { value: 'editor', label: 'Editor', description: 'Can edit tasks and content' },
    { value: 'admin', label: 'Admin', description: 'Can manage project settings' }
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/projects/${projectId}/members`, 
        { email, role },
        {
          headers: { 'Authorization': `Bearer ${token}` },
          withCredentials: true
        }
      );
      
      setSuccess(`Successfully invited ${email} as ${role}`);
      setEmail('');
      if (onSuccess && res.data) {
        onSuccess(res.data);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`No user found with email: ${email}`);
      } else {
        setError(err.response?.data?.message || 'Failed to send invitation');
      }
      console.error('Error sending invitation:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="invite-member-form">
      <h3 className="text-lg font-semibold mb-4">Invite by Email</h3>
      
      {error && (
        <div className="alert-error mb-4 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md mb-4 text-sm">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="form-group">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <div className="grid grid-cols-1 gap-2">
              {roles.map((roleOption) => (
                <label 
                  key={roleOption.value}
                  className={`flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition ${
                    role === roleOption.value 
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={roleOption.value}
                    checked={role === roleOption.value}
                    onChange={() => setRole(roleOption.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{roleOption.label}</div>
                    <div className="text-sm text-gray-500">{roleOption.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-5 flex justify-between">
          <p className="text-xs text-gray-500">
            The user will need to be registered in the system to join the project.
          </p>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                !email || loading
                  ? 'bg-indigo-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InviteMemberForm; 