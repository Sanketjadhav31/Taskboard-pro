import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Signup = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Input validation
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Attempting signup with:', form.email);
      const result = await register(form);
      
      if (result.success) {
        console.log('Signup successful, redirecting to dashboard');
        navigate('/dashboard');
      } else {
        console.error('Signup failed:', result.message);
        setError(result.message);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Taskboard-pro</h1>
          <p className="text-gray-600 mt-2">Create your account to get started</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                id="displayName"
                type="text"
                name="displayName"
                placeholder="John Doe"
                value={form.displayName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                minLength="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
            
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-sm text-gray-600">or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            <button
              type="button"
              onClick={googleLogin}
              className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition duration-200 ease-in-out"
            >
              <img
                src="https://cdn.cdnlogo.com/logos/g/35/google-icon.svg"
                alt="Google"
                className="w-5 h-5 mr-2"
              />
              Sign up with Google
            </button>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary-hover">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
