import React, { createContext, useState, useRef, useEffect, useContext, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [messages, setMessages] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const socketRef = useRef(null);
  const [error, setError] = useState('');
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 10;
  
  // Connect to socket when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      connectSocket();
    }
    
    return () => {
      cleanupReconnectTimer();
      disconnectSocket();
    };
  }, [isAuthenticated, user]);
  
  // Cleanup reconnect timer
  const cleanupReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);
  
  // Manual reconnection logic
  const reconnect = useCallback(() => {
    console.log('Manual reconnection attempt');
    cleanupReconnectTimer();
    reconnectAttemptRef.current = 0;
    connectSocket();
  }, [cleanupReconnectTimer]);
  
  // Schedule automatic reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    cleanupReconnectTimer();
    
    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Maximum reconnection attempts reached');
      setConnectionStatus('error');
      setError('Connection failed after multiple attempts. Please try refreshing the page or check your network connection.');
      return;
    }
    
    reconnectAttemptRef.current += 1;
    const delay = Math.min(1000 * (2 ** reconnectAttemptRef.current), 30000); // Max 30 seconds
    
    console.log(`Scheduling reconnect attempt ${reconnectAttemptRef.current} in ${delay}ms`);
    setConnectionStatus('disconnected');
    
    reconnectTimerRef.current = setTimeout(() => {
      console.log(`Executing scheduled reconnect attempt ${reconnectAttemptRef.current}`);
      connectSocket();
    }, delay);
  }, [cleanupReconnectTimer]);
  
  // Connect socket
  const connectSocket = useCallback(() => {
    try {
      // First, cleanup any existing socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setConnectionStatus('connecting');
      
      // Fix: Use the correct backend API URL with port 5000 instead of frontend port
      const apiUrl = 'http://localhost:5000'; // Backend server runs on port 5000
      
      console.log('Connecting to socket at:', apiUrl);
      
      // Fix: More robust socket configuration with increased timeout
      const socket = io(apiUrl, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 60000, // Increased timeout to 60 seconds
        transports: ['websocket', 'polling'],
        withCredentials: true,
        forceNew: true,
        auth: {
          token: localStorage.getItem('token')
        },
        autoConnect: true // Ensure auto-connection is enabled
      });
      
      socketRef.current = socket;
      
      // Connection event handlers
      socket.on('connect', () => {
        console.log('Socket connected successfully:', socket.id);
        reconnectAttemptRef.current = 0;
        setConnectionStatus('connected');
        setError('');
        
        // Authenticate socket connection
        if (user) {
          socket.emit('authenticate', { userId: user._id });
          console.log('Authentication sent for user:', user._id);
        }
      });
      
      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setConnectionStatus('error');
        
        // Special handling for timeout errors
        if (err.message === 'timeout') {
          setError(`Connection timed out. Server may be down or unreachable. Reconnecting...`);
          console.log('Timeout detected, attempting immediate reconnect...');
          // Reset reconnect attempts for timeouts to give more chances
          reconnectAttemptRef.current = Math.max(0, reconnectAttemptRef.current - 2);
        } else {
          setError(`Connection error: ${err.message}. Reconnecting...`);
        }
        
        scheduleReconnect();
      });
      
      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected. Reason:', reason);
        
        // If the server closed the connection, we should attempt reconnect
        if (reason === 'io server disconnect' || reason === 'transport close') {
          setConnectionStatus('disconnected');
          scheduleReconnect();
        } else {
          // For other cases, socket.io will try to reconnect automatically
          setConnectionStatus('disconnected');
        }
      });
      
      socket.on('reconnect', (attempt) => {
        console.log(`Socket reconnected after ${attempt} attempts`);
        reconnectAttemptRef.current = 0;
        setConnectionStatus('connected');
        setError('');
        
        // Re-authenticate after reconnection
        if (user) {
          socket.emit('authenticate', { userId: user._id });
          
          // Rejoin active chat if any
          if (activeChat) {
            socket.emit('join:project', activeChat);
          }
        }
      });
      
      socket.on('reconnect_error', (err) => {
        console.error('Socket reconnection error:', err);
        setError(`Reconnection error: ${err.message}. Retrying...`);
        scheduleReconnect();
      });
      
      socket.on('reconnect_failed', () => {
        console.log('Socket reconnection failed');
        setConnectionStatus('error');
        setError('Connection failed. Please use the reconnect button or refresh the page.');
      });
      
      socket.on('error', (err) => {
        console.error('Socket error:', err);
        setError(`Socket error: ${err.message || 'Unknown error'}`);
      });
      
      // Listen for online users updates
      socket.on('users:online', (users) => {
        console.log('Online users updated:', users);
        setOnlineUsers(users);
      });
      
      // Listen for new messages
      socket.on('chat:message', (message) => {
        console.log('Received message:', message);
        setMessages(prevMessages => {
          const chatId = message.projectId;
          const updatedMessages = { ...prevMessages };
          
          if (!updatedMessages[chatId]) {
            updatedMessages[chatId] = [];
          }
          
          // Check if message already exists (avoid duplicates)
          const messageExists = updatedMessages[chatId].some(m => m._id === message._id);
          if (!messageExists) {
            // Ensure the userId field is properly structured
            const safeMessage = {
              ...message,
              userId: message.userId && typeof message.userId === 'object' 
                ? message.userId 
                : { 
                    _id: message.userId || user?._id,
                    displayName: message.userName || 'Unknown User',
                    photo: message.userAvatar || null
                  }
            };
            
            updatedMessages[chatId] = [...updatedMessages[chatId], safeMessage];
          }
          
          return updatedMessages;
        });
        
        // Update unread count if message is not from current user and not in active chat
        if (message.userId?._id !== user?._id && activeChat !== message.projectId) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.projectId]: (prev[message.projectId] || 0) + 1
          }));
        }
      });
      
      // Listen for message deletions
      socket.on('chat:message:delete', ({ messageId, projectId }) => {
        setMessages(prevMessages => {
          const updatedMessages = { ...prevMessages };
          
          if (updatedMessages[projectId]) {
            updatedMessages[projectId] = updatedMessages[projectId].filter(m => m._id !== messageId);
          }
          
          return updatedMessages;
        });
      });
      
    } catch (err) {
      console.error('Error setting up socket connection:', err);
      setConnectionStatus('error');
      setError('Failed to establish connection. Please try reconnecting.');
      scheduleReconnect();
    }
  }, [user, activeChat, scheduleReconnect]);
  
  // Disconnect socket
  const disconnectSocket = useCallback(() => {
    const socket = socketRef.current;
    if (socket) {
      console.log('Cleaning up socket connection');
      
      // Remove all event listeners
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('reconnect');
      socket.off('reconnect_error');
      socket.off('reconnect_failed');
      socket.off('error');
      socket.off('chat:message');
      socket.off('chat:message:delete');
      socket.off('users:online');
      
      // Leave active chat room if any
      if (activeChat) {
        socket.emit('leave:project', activeChat);
      }
      
      // Disconnect socket
      socket.disconnect();
      socketRef.current = null;
    }
  }, [activeChat]);
  
  // Join a chat room
  const joinChatRoom = useCallback((chatId) => {
    const socket = socketRef.current;
    if (socket && chatId) {
      console.log('Joining chat room:', chatId);
      socket.emit('join:project', chatId);
      setActiveChat(chatId);
      
      // Reset unread count for this chat
      setUnreadCounts(prev => ({
        ...prev,
        [chatId]: 0
      }));
    } else if (!socket && chatId) {
      // If no socket but trying to join a room, attempt reconnection
      console.log('No active socket when trying to join room. Attempting reconnect...');
      setActiveChat(chatId); // Set activeChat first so it can be rejoined after connection
      reconnect();
    }
  }, [reconnect]);
  
  // Leave a chat room
  const leaveChatRoom = useCallback((chatId) => {
    const socket = socketRef.current;
    if (socket && chatId) {
      // Only leave the room if it's actually valid
      if (typeof chatId === 'string' && chatId.trim() !== '') {
        console.log('Leaving chat room:', chatId);
        socket.emit('leave:project', chatId);
        if (activeChat === chatId) {
          setActiveChat(null);
        }
      }
    }
  }, [activeChat]);
  
  // Fetch messages for a specific chat
  const fetchMessages = useCallback(async (chatId) => {
    try {
      setError('');
      
      // If we already have messages for this chat, don't fetch again
      if (messages[chatId] && messages[chatId].length > 0) {
        return messages[chatId];
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return [];
      }
      
      const res = await axios.get(`/api/chat/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000 // 10 seconds timeout
      });
      
      if (Array.isArray(res.data)) {
        setMessages(prev => ({
          ...prev,
          [chatId]: res.data
        }));
        return res.data;
      } else {
        console.error('Unexpected message format:', res.data);
        return [];
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
      return [];
    }
  }, [messages]);
  
  // Send a message
  const sendMessage = useCallback(async (chatId, messageText) => {
    try {
      setError('');
      
      if (!messageText || messageText.trim() === '') {
        return false;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return false;
      }
      
      // Create optimistic message
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        projectId: chatId,
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
      setMessages(prev => {
        const updatedMessages = { ...prev };
        
        if (!updatedMessages[chatId]) {
          updatedMessages[chatId] = [];
        }
        
        updatedMessages[chatId] = [...updatedMessages[chatId], optimisticMessage];
        return updatedMessages;
      });
      
      // Send to server
      const response = await axios.post(`/api/chat/${chatId}/messages`, {
        message: messageText,
        attachments: []
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      // If successful, remove optimistic message
      if (response.status === 201 || response.status === 200) {
        setMessages(prev => {
          const updatedMessages = { ...prev };
          
          if (updatedMessages[chatId]) {
            updatedMessages[chatId] = updatedMessages[chatId].filter(m => m._id !== optimisticMessage._id);
          }
          
          return updatedMessages;
        });
        // The real message will be added via socket.io
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Remove optimistic message on error
      setMessages(prev => {
        const updatedMessages = { ...prev };
        
        if (updatedMessages[chatId]) {
          updatedMessages[chatId] = updatedMessages[chatId].filter(m => !m.isOptimistic);
        }
        
        return updatedMessages;
      });
      
      if (err.response) {
        setError(`Failed to send message: ${err.response.data.message || err.response.statusText}`);
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to send message. Please try again.');
      }
      
      return false;
    }
  }, [user]);
  
  // Delete a message
  const deleteMessage = useCallback(async (chatId, messageId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return false;
      }
      
      // Find the message before trying to delete it
      const msgToDelete = messages[chatId]?.find(m => m._id === messageId);
      if (!msgToDelete) {
        setError('Message not found');
        return false;
      }
      
      // Optimistically remove message
      setMessages(prev => {
        const updatedMessages = { ...prev };
        
        if (updatedMessages[chatId]) {
          updatedMessages[chatId] = updatedMessages[chatId].filter(m => m._id !== messageId);
        }
        
        return updatedMessages;
      });
      
      await axios.delete(`/api/chat/${chatId}/messages/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      
      // Add the message back if deletion failed
      setMessages(prev => {
        const updatedMessages = { ...prev };
        const msgToDelete = messages[chatId]?.find(m => m._id === messageId);
        
        if (updatedMessages[chatId] && msgToDelete) {
          updatedMessages[chatId] = [...updatedMessages[chatId], msgToDelete]
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        
        return updatedMessages;
      });
      
      setError('Failed to delete message. Please try again.');
      return false;
    }
  }, [messages]);
  
  // Total unread count
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  
  // Get chat messages
  const getChatMessages = useCallback((chatId) => {
    return messages[chatId] || [];
  }, [messages]);
  
  // Mark chat as read
  const markChatAsRead = useCallback((chatId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [chatId]: 0
    }));
  }, []);
  
  return (
    <ChatContext.Provider value={{
      messages,
      activeChat,
      connectionStatus,
      error,
      onlineUsers,
      unreadCounts,
      totalUnreadCount,
      getChatMessages,
      joinChatRoom,
      leaveChatRoom,
      sendMessage: user ? sendMessage : () => Promise.reject('User not authenticated'),
      deleteMessage,
      fetchMessages,
      markChatAsRead,
      isOnline: (userId) => onlineUsers.includes(userId),
      reconnect // Exposing manual reconnect function
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider; 