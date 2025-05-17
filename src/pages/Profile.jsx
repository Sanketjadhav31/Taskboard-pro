import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user, updateProfile, updatePhoto } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: user?.bio || '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Update profile info
      const profileResult = await updateProfile({
        displayName: form.displayName,
        bio: form.bio
      });
      
      // Upload photo if changed
      if (photoFile) {
        try {
          const photoResult = await updatePhoto(photoFile);
          if (!photoResult.success) {
            setError('Failed to update profile photo: ' + photoResult.message);
            // Don't return early - continue with the rest of the function to save other profile changes
          }
        } catch (photoErr) {
          console.error('Error updating photo:', photoErr);
          setError('Failed to update profile photo. Please try again later.');
          // Don't return early - continue with the rest of the function
        }
      }
      
      if (profileResult.success) {
        // Ensure the user context is updated with the new bio
        if (profileResult.user) {
          // Update form with the returned user data to ensure consistent state
          setForm({
            displayName: profileResult.user.displayName || form.displayName,
            email: profileResult.user.email || form.email,
            bio: profileResult.user.bio || form.bio
          });
        }
        
        setSuccess('Profile updated successfully');
        setIsEditing(false);
      } else {
        setError(profileResult.message);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-primary flex items-center justify-center text-white overflow-hidden">
                  {photoPreview || user.photo ? (
                    <img 
                      src={photoPreview || user.photo} 
                      alt={form.displayName} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-semibold">
                      {form.displayName.charAt(0)}
                    </span>
                  )}
                </div>
                
                <label 
                  htmlFor="photo" 
                  className="absolute bottom-0 right-0 h-8 w-8 bg-gray-900 bg-opacity-75 rounded-full flex items-center justify-center cursor-pointer hover:bg-opacity-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Tell us about yourself"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                ></textarea>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-8">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-800">Profile Information</h2>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/4 flex justify-center md:justify-start mb-6 md:mb-0">
                  <div className="h-32 w-32 rounded-full bg-primary flex items-center justify-center text-white overflow-hidden">
                    {user.photo ? (
                      <img 
                        src={user.photo} 
                        alt={user.displayName} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-semibold">
                        {user.displayName.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="md:w-3/4 md:pl-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">{user.displayName}</h3>
                    <button 
                      onClick={() => {
                        setForm({
                          displayName: user.displayName || '',
                          email: user.email || '',
                          bio: user.bio || '',
                        });
                        setPhotoPreview('');
                        setPhotoFile(null);
                        setIsEditing(true);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edit Profile
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="mt-1 text-gray-800">{user.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Member Since</p>
                      <p className="mt-1 text-gray-800">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <p className="text-sm font-medium text-gray-500 mb-2">Bio</p>
                    {user.bio ? (
                      <p className="text-gray-800 whitespace-pre-line">{user.bio}</p>
                    ) : (
                      <p className="text-gray-400 italic">No bio provided</p>
                    )}
                  </div>
                  
                  {/* Badges Section */}
                  <div className="mt-8">
                    <p className="text-sm font-medium text-gray-500 mb-2">Badges</p>
                    {user.badges && user.badges.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.badges.map((badge, index) => (
                          <div key={index} className="linear-badge linear-badge-primary flex items-center px-3 py-1 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {badge}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">No badges earned yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
