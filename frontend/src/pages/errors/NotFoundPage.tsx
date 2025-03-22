import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ErrorPages.css';

const NotFoundPage: React.FC = () => {
  return (
    <div className="error-page">
      <div className="container">
        <div className="error-content">
          <h1>404</h1>
          <h2>Page Not Found</h2>
          <p>Sorry, the page you are looking for doesn't exist or has been moved.</p>
          <div className="error-actions">
            <Link to="/" className="btn-primary">
              Go to Homepage
            </Link>
            <Link to="/events" className="btn-secondary">
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 