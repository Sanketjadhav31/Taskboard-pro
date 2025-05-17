import React from 'react';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project, currentUser }) => {
  // Calculate project completion percentage
  const calculateCompletion = () => {
    if (!project.taskCount) return 0;
    const completedPercentage = (project.completedTaskCount / project.taskCount) * 100;
    return Math.round(completedPercentage);
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if current user is the owner
  const isOwner = project.owner._id === currentUser._id;

  return (
    <div className="card project-card">
      <div className="card-body project-card-body">
        <h3 className="card-title mb-2">{project.name}</h3>
        <p className="project-description">{project.description}</p>
        
        {project.taskCount > 0 && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${calculateCompletion()}%` }}
              ></div>
            </div>
            <span className="progress-text">{calculateCompletion()}% complete</span>
          </div>
        )}
        
        <div className="project-meta">
          <div className="project-members">
            <div className="member-avatars">
              <div className="avatar avatar-sm member-avatar">
                <span className="avatar-text avatar-text-sm">
                  {project.owner.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {project.members.slice(0, 2).map((member, index) => (
                <div key={member._id} className="avatar avatar-sm member-avatar">
                  <span className="avatar-text avatar-text-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {project.members.length > 2 && (
                <div className="avatar avatar-sm member-avatar more-members">
                  <span className="avatar-text avatar-text-sm">
                    +{project.members.length - 2}
                  </span>
                </div>
              )}
            </div>
            <span className="member-count">
              {project.members.length + 1} members
            </span>
          </div>
          <div className="project-stats">
            <div className="stat">
              <svg className="icon-sm stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
              {project.taskCount || 0} tasks
            </div>
            <div className="stat">
              <svg className="icon-sm stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              {formatDate(project.createdAt)}
            </div>
          </div>
        </div>
      </div>
      <div className="card-footer">
        <Link to={`/projects/${project._id}`} className="btn btn-outline">View Project</Link>
        {isOwner && (
          <button className="btn btn-icon ml-2" title="Project Settings">
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
