import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const CreateTaskModal = ({ projectId, onClose, onSave, projectMembers }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'to_do',
    priority: 'medium',
    assignedTo: '',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef(null);
  const titleInputRef = useRef(null);
  
  // Focus on title input when modal opens
  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);
  
  // Handle click outside to prevent unintentional closing
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Only close if clicking directly on the overlay, not the modal content
      if (modalRef.current && !modalRef.current.contains(e.target) && 
          e.target.classList.contains('linear-modal-overlay')) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation
    
    if (!form.title.trim()) {
      setError('Task title is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Call onSave with the form data instead of using addTask
      if (onSave) {
        await onSave(form);
      } else {
      const res = await axios.post(`/api/projects/${projectId}/tasks`, form);
      // Close the modal
      onClose();
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };
  
  // Stop propagation for all click events within the modal
  const handleModalClick = (e) => {
    e.stopPropagation();
  };
  
  return (
    <div className="linear-card-body pt-0" onClick={handleModalClick} ref={modalRef}>
        {error && (
        <div className="bg-red-50 border-red-200 p-3 rounded-md text-red-700 text-sm mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Title</label>
            <input
            ref={titleInputRef}
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
            className="linear-input w-full"
            placeholder="Task title"
            disabled={loading}
            />
          </div>
          
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
            className="linear-input w-full"
            placeholder="Task description"
            rows="3"
            disabled={loading}
            ></textarea>
          </div>
          
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              className="linear-input w-full"
              disabled={loading}
              >
              <option value="to_do">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="backlog">Backlog</option>
              </select>
            </div>
            
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
              className="linear-input w-full"
              disabled={loading}
              >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              </select>
            </div>
          </div>
          
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Assigned To</label>
              <select
              name="assignedTo"
              value={form.assignedTo}
                onChange={handleChange}
              className="linear-input w-full"
              disabled={loading}
              >
                <option value="">Unassigned</option>
              {projectMembers.map(member => (
                <option key={member._id} value={member._id}>
                  {member.displayName || member.email}
                  </option>
                ))}
              </select>
            </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              className="linear-input w-full"
              disabled={loading}
            />
          </div>
          </div>
          
        <div className="linear-card-footer flex justify-end space-x-3">
            <button
              type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="linear-btn linear-btn-secondary"
            disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
            className="linear-btn linear-btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
    </div>
  );
};

export default CreateTaskModal;
