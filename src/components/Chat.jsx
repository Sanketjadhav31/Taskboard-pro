import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Chat = ({ chatId, title, height = '500px', fullWidth = false }) => {
  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const { 
    getChatMessages, 
    sendMessage, 
    deleteMessage, 
    fetchMessages, 
    joinChatRoom, 
    leaveChatRoom,
    connectionStatus,
    error: chatError,
    reconnect
  } = useContext(ChatContext);
  
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reconnecting, setReconnecting] = useState(false);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const messages = getChatMessages(chatId);
  const previousChatIdRef = useRef(chatId);
  
  // Load messages and join chat room
  useEffect(() => {
    let isMounted = true;
    
    const initChat = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      setError('');
      
      try {
        if (chatId && chatId !== previousChatIdRef.current) {
          // Leave previous room if different
          if (previousChatIdRef.current) {
            leaveChatRoom(previousChatIdRef.current);
          }
          // Join new room
          joinChatRoom(chatId);
          previousChatIdRef.current = chatId;
          await fetchMessages(chatId);
        } else if (chatId && !messages.length) {
          // If same room but no messages (first load), join and fetch
          joinChatRoom(chatId);
          await fetchMessages(chatId);
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
        if (isMounted) {
          setError('Failed to load chat. Please try reloading the page.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          // Focus the input field
          messageInputRef.current?.focus();
        }
      }
    };
    
    initChat();
    
    // Clean up when unmounting or changing chat
    return () => {
      isMounted = false;
      // Only leave if component is unmounting or chat is changing
      if (chatId && chatId === previousChatIdRef.current) {
        leaveChatRoom(chatId);
      }
      
      // Clear any reconnect timers
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [chatId]);

  // Watch for connection status changes
  useEffect(() => {
    if (connectionStatus === 'connecting') {
      setReconnecting(true);
    } else if (connectionStatus === 'connected') {
      setReconnecting(false);
      if (error && error.includes('connection')) {
        setError('');
      }
    } else if (connectionStatus === 'disconnected' && !reconnecting) {
      setReconnecting(true);
    }
  }, [connectionStatus, error, reconnecting]);
  
  // Update error from context
  useEffect(() => {
    if (chatError) {
      setError(chatError);
    }
  }, [chatError]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const messageText = newMessage.trim();
    
    if (!messageText || sending || connectionStatus !== 'connected') return;
    
    try {
      setSending(true);
      setError('');
      
      // Clear input immediately for better UX
      setNewMessage('');
      
      // Send the message
      await sendMessage(chatId, messageText);
      
      // Focus back on input field
      messageInputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }
    
    try {
      setError('');
      await deleteMessage(chatId, messageId);
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError(err.message || 'Failed to delete message. Please try again.');
    }
  };
  
  const formatMessageTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return '';
    }
  };
  
  // Check if a message was sent by the current user
  const isOwnMessage = (message) => {
    return message.userId?._id === user?._id;
  };
  
  // Connection status indicator
  const getConnectionStatusIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="text-xs flex items-center text-green-600 dark:text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400 mr-1"></span>
            Connected
          </div>
        );
      case 'connecting':
        return (
          <div className="text-xs flex items-center text-yellow-600 dark:text-yellow-400">
            <span className="h-2 w-2 rounded-full bg-yellow-600 dark:bg-yellow-400 mr-1 animate-pulse"></span>
            Connecting...
          </div>
        );
      case 'disconnected':
        return (
          <div className="text-xs flex items-center text-red-600 dark:text-red-400">
            <span className={`h-2 w-2 rounded-full bg-red-600 dark:bg-red-400 mr-1 ${reconnecting ? 'animate-pulse' : ''}`}></span>
            {reconnecting ? 'Reconnecting...' : 'Disconnected'}
          </div>
        );
      case 'error':
        return (
          <div className="text-xs flex items-center text-red-600 dark:text-red-400">
            <span className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400 mr-1"></span>
            Connection Error
            <button 
              onClick={handleRetryConnection}
              className="ml-2 underline text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
            >
              Retry
            </button>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Handle retry connection
  const handleRetryConnection = useCallback(() => {
    setReconnecting(true);
    setError('');
    reconnect();
  }, [reconnect]);
  
  return (
    <div 
      className={`flex flex-col rounded-lg shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden ${
        fullWidth ? 'w-full' : 'max-w-3xl'
      }`}
      style={{ height }}
    >
      {/* Chat header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
        <h3 className="font-medium dark:text-white">{title || 'Chat'}</h3>
        {getConnectionStatusIndicator()}
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="linear-spinner dark:border-gray-600 dark:border-t-primary-400"></div>
          </div>
        ) : connectionStatus === 'error' ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-center mb-2">Connection lost to the chat server</p>
            <button 
              onClick={handleRetryConnection}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors duration-150 flex items-center"
            >
              {reconnecting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Reconnecting...
                </>
              ) : (
                'Reconnect'
              )}
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message._id} 
                className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[80%] ${isOwnMessage(message) ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="linear-avatar linear-avatar-sm dark:bg-gray-700">
                      {message.userId && message.userId.photo ? (
                        <img 
                          src={message.userId.photo} 
                          alt={message.userId.displayName || 'User'} 
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <span>{message.userId?.displayName?.charAt(0) || '?'}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Message content */}
                  <div className={`mx-2 ${isOwnMessage(message) ? 'text-right' : ''}`}>
                    <div className="flex items-center mb-1">
                      <p className={`text-xs text-gray-500 dark:text-gray-400 ${isOwnMessage(message) ? 'mr-2' : 'ml-0 mr-2'}`}>
                        {formatMessageTime(message.createdAt)}
                      </p>
                      <p className="text-sm font-medium dark:text-white">
                        {message.userId?.displayName || 'Anonymous'}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 ${isOwnMessage(message)
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-gray-900 dark:text-gray-100'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      } ${message.isOptimistic ? 'opacity-70' : ''}`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                    </div>
                    
                    {/* Delete option for own messages */}
                    {isOwnMessage(message) && !message.isOptimistic && (
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        className="text-xs text-gray-500 dark:text-gray-400 mt-1 hover:text-red-500 dark:hover:text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {error && connectionStatus !== 'error' && (
          <div className="p-2 mt-2 text-center text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded-md flex justify-between items-center">
            <span>{error}</span>
            {error.includes('connection') && (
              <button 
                onClick={handleRetryConnection}
                className="ml-2 text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={connectionStatus === 'connected' ? "Type a message..." : "Connection lost..."}
            className="flex-1 rounded-l-md py-2 px-3 border-r-0 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
            disabled={sending || loading || connectionStatus !== 'connected'}
            ref={messageInputRef}
          />
          <button
            type="submit"
            className="bg-primary-600 dark:bg-primary-700 hover:bg-primary-700 dark:hover:bg-primary-800 text-white font-medium py-2 px-4 rounded-r-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={sending || !newMessage.trim() || loading || connectionStatus !== 'connected'}
          >
            {sending ? (
              <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span>Send</span>
            )}
          </button>
        </form>
      </div>
      
      {/* Overlay for reconnecting state */}
      {reconnecting && connectionStatus === 'connecting' && (
        <div className="absolute inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center">
            <svg className="animate-spin mb-3 h-8 w-8 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-800 dark:text-gray-200 font-medium">Reconnecting to chat...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat; 