import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/linearUI.css';
import App from './App';
import axios from 'axios';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { NotificationProvider } from './context/NotificationContext';
import reportWebVitals from './reportWebVitals';

// Import Font Awesome script to ensure icons work correctly
import '@fortawesome/fontawesome-free/css/all.min.css';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.withCredentials = true;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <ProjectProvider>
      <App />
        </ProjectProvider>
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
