import React, { useState, useContext } from 'react';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';

const InviteUserModal = ({ onClose, setUsers }) => {
  const { darkMode } = useContext(ThemeContext);
  const [form, setForm] = useState({
    email: '',
    role: 'Member'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post('/api/users/invite', form);
      setSuccess(true);
      
      // Update users list
      const usersRes = await axios.get('/api/users');
      setUsers(usersRes.data.users);
      
      // Reset form
      setForm({
        email: '',
        role: 'Member'
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="modal">
      <div className="modal-content dark:bg-gray-800 dark:border-gray-700">
        <div className="modal-header dark:border-gray-700">
          <h2 className="modal-title dark:text-gray-100">Invite Team Member</h2>
          <button onClick={onClose} className="btn-close dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="alert-error dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}
        
        {success && (
          <div className="alert-success dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
            Invitation sent successfully!
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="dark:text-gray-300">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="colleague@example.com"
              value={form.email}
              onChange={handleChange}
              required
              className="input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="role" className="dark:text-gray-300">Role</label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Member">Member</option>
            </select>
          </div>
          
          <div className="modal-footer dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary dark:bg-primary-600 dark:hover:bg-primary-700"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteUserModal;
