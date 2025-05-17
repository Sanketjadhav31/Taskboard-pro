import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';

const ProjectChat = ({ projectId }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const messageInputRef = useRef(null);
  
  // Fetch messages on component mount
  useEffect(() => {
    let isMounted = true;
    
    const initializeChat = async () => {
      if (!isMounted) return;
      
      try {
        // Fetch existing messages first
        await fetchMessages();
        
        // Then set up socket connection
        setupSocketConnection();
      } catch (err) {
        console.error('Chat initialization error:', err);
        if (isMounted) {
          setError('Failed to initialize chat. Please refresh the page.');
        }
      }
    };
    
    if (user && projectId) {
      initializeChat();
    }
    
    // Clean up on unmount
    return () => {
      isMounted = false;
      cleanupSocketConnection();
    };
  }, [projectId, user]);
  
  // Set up socket connection
  const setupSocketConnection = () => {
    try {
      // Connect to socket.io server
      const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
        timeout: 10000
      });
      socketRef.current = socket;
      
      // Connection event handlers
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        setConnectionStatus('connected');
        
        // Authenticate socket connection
        if (user) {
          socket.emit('authenticate', { userId: user._id });
          
          // Join project room
          socket.emit('join:project', projectId);
        }
      });
      
      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setConnectionStatus('error');
        setError('Connection error. Please refresh the page.');
      });
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnectionStatus('disconnected');
      });
      
      socket.on('reconnect', (attempt) => {
        console.log(`Socket reconnected after ${attempt} attempts`);
        setConnectionStatus('connected');
        setError('');
        
        // Re-authenticate and join rooms after reconnection
        if (user) {
          socket.emit('authenticate', { userId: user._id });
          socket.emit('join:project', projectId);
        }
      });
      
      socket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
        setConnectionStatus('error');
        setError('Connection failed. Please refresh the page.');
      });
      
      // Listen for new messages from server
      socket.on('chat:message', (message) => {
        console.log('Received message:', message);
        setMessages(prevMessages => [...prevMessages, message]);
      });
      
      // Listen for deleted messages
      socket.on('chat:message:delete', ({ messageId }) => {
        setMessages(prevMessages => prevMessages.filter(m => m._id !== messageId));
      });
    } catch (err) {
      console.error('Error setting up socket connection:', err);
      setError('Failed to establish connection. Please refresh the page.');
    }
  };
  
  // Clean up socket connection
  const cleanupSocketConnection = () => {
    const socket = socketRef.current;
    if (socket) {
      console.log('Cleaning up socket connection');
      
      // Remove all event listeners
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('reconnect');
      socket.off('reconnect_failed');
      socket.off('chat:message');
      socket.off('chat:message:delete');
      
      // Leave project room
      if (projectId) {
        socket.emit('leave:project', projectId);
      }
      
      // Disconnect socket
      socket.disconnect();
      socketRef.current = null;
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Focus message input when modal opens
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, []);
  
  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }
      
      const res = await axios.get(`/api/chat/${projectId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000 // 10 seconds timeout
      });
      
      if (Array.isArray(res.data)) {
        setMessages(res.data);
      } else {
        console.error('Unexpected message format:', res.data);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your connection and try again.');
      } else if (err.response) {
        setError(`Failed to load messages: ${err.response.data.message || err.response.statusText}`);
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to load messages. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const messageText = newMessage.trim();
    if (!messageText || sending) return;
    
    try {
      setSending(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setSending(false);
        return;
      }
      
      // Send message optimistically for better UX
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        projectId,
        userId: {
          _id: user._id,
          displayName: user.displayName,
          photo: user.photo
        },
        message: messageText,
        createdAt: new Date().toISOString(),
        isOptimistic: true
      };
      
      // Add to messages immediately
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Clear input
      setNewMessage('');
      
      // Focus back on input for better UX
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
      
      // Send to server
      const response = await axios.post(`/api/chat/${projectId}/messages`, {
        message: messageText,
        attachments: []
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      // If successful, remove optimistic message and add real one
      if (response.status === 201 || response.status === 200) {
        setMessages(prev => 
          prev.filter(m => m._id !== optimisticMessage._id)
        );
        // The real message will be added via socket.io
      } else {
        // This shouldn't happen with axios, but just in case
        setError('Failed to send message. Please try again.');
        
        // Remove optimistic message
        setMessages(prev => 
          prev.filter(m => m._id !== optimisticMessage._id)
        );
      }
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Remove optimistic message
      setMessages(prev => 
        prev.filter(m => m._id !== `temp-${Date.now()}`)
      );
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your connection and try again.');
      } else if (err.response) {
        setError(`Failed to send message: ${err.response.data.message || err.response.statusText}`);
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to send message. Please try again.');
      }
      
      // Re-add the message to the input box
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };
  
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }
    
    // Find the message before trying to delete it
    const removedMessage = messages.find(m => m._id === messageId);
    if (!removedMessage) {
      setError('Message not found');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      // Optimistically remove message
      setMessages(prev => prev.filter(m => m._id !== messageId));
      
      await axios.delete(`/api/chat/${projectId}/messages/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Message will be removed by the socket event listener
    } catch (err) {
      console.error('Error deleting message:', err);
      
      // Add the message back if deletion failed
      if (removedMessage) {
        setMessages(prev => [...prev, removedMessage].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        ));
      }
      
      setError('Failed to delete message. Please try again.');
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Connection status indicator
  const ConnectionIndicator = () => {
    if (connectionStatus === 'connected') {
      return (
        <span className="text-xs flex items-center text-green-600">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
          Connected
        </span>
      );
    } else if (connectionStatus === 'disconnected') {
      return (
        <span className="text-xs flex items-center text-yellow-600">
          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
          Disconnected
        </span>
      );
    } else {
      return (
        <span className="text-xs flex items-center text-red-600">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
          Connection Error
        </span>
      );
    }
  };
  
  // Loading state
  if (loading && messages.length === 0) {
    return (
      <div className="linear-card h-full flex flex-col">
        <div className="linear-card-header flex justify-between items-center">
          <h3 className="font-semibold">Project Chat</h3>
          <ConnectionIndicator />
        </div>
        
        <div className="flex-grow flex justify-center items-center">
          <div className="linear-spinner"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="linear-card h-full flex flex-col">
      <div className="linear-card-header flex justify-between items-center">
        <h3 className="font-semibold">Project Chat</h3>
        <ConnectionIndicator />
      </div>
      
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button 
            onClick={() => setError('')}
            className="ml-2 text-red-700"
          >
            &times;
          </button>
        </div>
      )}
      
      <div className="linear-card-body p-0 flex-grow overflow-y-auto">
        <div className="p-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 my-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start the conversation now!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message._id} 
                  className={`flex ${message.userId._id === user?._id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] rounded-lg p-3 ${
                    message.isOptimistic ? 'bg-gray-100 opacity-70' :
                    message.userId._id === user?._id 
                      ? 'bg-primary-100 text-primary-800 rounded-tr-none' 
                      : 'bg-gray-100 rounded-tl-none'
                  }`}>
                    {message.userId._id !== user?._id && (
                      <div className="flex items-center mb-1">
                        <div className="linear-avatar linear-avatar-xs mr-2">
                          {message.userId.photo ? (
                            <img src={message.userId.photo} alt={message.userId.displayName} />
                          ) : (
                            <span>{message.userId.displayName.charAt(0)}</span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          {message.userId.displayName}
                        </span>
                      </div>
                    )}
                    
                    <p className="text-sm">{message.message}</p>
                    
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(message.createdAt)}
                        {message.isOptimistic && ' (sending...)'}
                      </span>
                      
                      {message.userId._id === user?._id && !message.isOptimistic && (
                        <button
                          onClick={() => handleDeleteMessage(message._id)}
                          className="text-gray-400 hover:text-red-500 text-xs"
                          title="Delete message"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      
      <div className="linear-card-footer p-3">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            ref={messageInputRef}
            type="text"
            className="linear-input flex-grow mr-2"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending || connectionStatus !== 'connected'}
          />
          <button
            type="submit"
            className={`linear-btn linear-btn-primary ${
              (sending || !newMessage.trim() || connectionStatus !== 'connected') 
                ? 'opacity-60 cursor-not-allowed' 
                : ''
            }`}
            disabled={sending || !newMessage.trim() || connectionStatus !== 'connected'}
          >
            {sending ? (
              <div className="linear-spinner w-4 h-4"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProjectChat; 