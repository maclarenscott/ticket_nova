import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NotFound.css';

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <h1>404</h1>
          <h2>Page Not Found</h2>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">Go to Homepage</Link>
            <Link to="/events" className="btn btn-secondary">Browse Events</Link>
          </div>
        </div>
        <div className="not-found-image">
          <img src="/not-found-illustration.svg" alt="Page not found" />
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 