import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  useEffect(() => {
    document.title = 'Taskboard-pro - Team Collaboration Platform';
  }, []);

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center">
            <div className="logo text-primary-600 mr-2 text-3xl">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.5 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm13-7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM12 19.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0-14a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-6.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                <path d="M12 17a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H8a1 1 0 0 0 0 2h3v3a1 1 0 0 0 1 1z" />
              </svg>
            </div>
            <span>Taskboard-pro</span>
          </div>
          
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="hover:text-primary-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary-600 transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-primary-600 transition-colors">Pricing</a>
          </div>
          
          <div className="flex space-x-4">
            <Link to="/login" className="btn-secondary">Log in</Link>
            <Link to="/signup" className="btn-primary">Sign up free</Link>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container mx-auto px-4 py-20 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Organize projects.<br />Get more done.
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Simple, flexible, and powerful. All the tools your team needs in one place.
            </p>
            
            <div>
              <Link to="/signup" className="btn-primary-lg mr-4">
                Get Started
              </Link>
              <a href="#demo" className="btn-text-lg">
                Watch a demo
              </a>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <img
              src="/image.jpg"
              alt="Taskboard-pro Dashboard"
              className="w-full rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </section>
      
      {/* How it Works */}
      <section id="how-it-works" className="how-it-works py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2>How Taskboard-pro Works</h2>
            <p className="text-xl text-gray-600 mt-4">
              A simple, intuitive workflow that helps your team stay on track
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Projects</h3>
              <p className="text-gray-600">
                Organize work into projects, add team members, and set milestones
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Collaborate</h3>
              <p className="text-gray-600">
                Discuss tasks, share files, and keep everyone aligned
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-600">
                Visualize progress, identify bottlenecks, and celebrate wins
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="cta-section py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to transform how your team works?
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
            Join hundreds of teams already using Taskboard-pro to collaborate better and deliver results.
          </p>
          <Link to="/signup" className="btn-white-lg">
            Start for free
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="footer-section py-10 bg-gray-800 text-gray-300">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0 flex items-center">
              <span>Taskboard-pro</span>
              <p>© {new Date().getFullYear()} Taskboard-pro. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 