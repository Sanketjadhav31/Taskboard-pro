import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-dark text-white">
      <header className="container mx-auto py-6 px-4">
        <nav className="flex justify-between items-center">
          <div className="logo font-bold text-xl">CollabEase</div>
          <div className="nav-links">
            <Link to="/login" className="btn-ghost mr-4">Log in</Link>
            <Link to="/signup" className="btn-primary">Sign up</Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="hero text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            Issue tracking for <span className="text-primary">modern</span> teams
          </h1>
          <p className="text-xl text-gray mb-8 max-w-2xl mx-auto">
            CollabEase helps teams plan, build and ship the next great product with streamlined workflows.
          </p>
          <div className="flex justify-center">
            <Link to="/signup" className="btn-lg btn-primary mr-4">
              Get started for free
            </Link>
            <a href="#features" className="btn-lg btn-outline">
              Learn more
            </a>
          </div>
        </div>

        <div className="preview-img text-center mb-24">
          <div className="img-container relative mx-auto">
            <div className="img-glow absolute"></div>
            <img 
              src="https://linear.app/static/home/hero@2x.webp" 
              alt="CollabEase Dashboard Preview" 
              className="rounded-lg shadow-xl mx-auto relative z-10"
            />
          </div>
        </div>

        <div id="features" className="features grid grid-cols-1 md:grid-cols-3 gap-8 py-16">
          <div className="feature-card">
            <div className="icon-box mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Team Collaboration</h3>
            <p className="text-gray">Work together seamlessly with your team members on projects and tasks.</p>
          </div>
          
          <div className="feature-card">
            <div className="icon-box mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Project Planning</h3>
            <p className="text-gray">Plan your projects with intuitive boards, lists, and calendar views.</p>
          </div>
          
          <div className="feature-card">
            <div className="icon-box mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Workflow Automation</h3>
            <p className="text-gray">Automate repetitive tasks and focus on what matters most.</p>
          </div>
        </div>
      </main>

      <footer className="container mx-auto py-8 px-4 border-t border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray">
              &copy; {new Date().getFullYear()} CollabEase. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="text-sm text-gray hover:text-white">Terms</a>
            <a href="#" className="text-sm text-gray hover:text-white">Privacy</a>
            <a href="#" className="text-sm text-gray hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
