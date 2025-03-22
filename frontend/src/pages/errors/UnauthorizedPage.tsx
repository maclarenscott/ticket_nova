import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ErrorPages.css';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="error-page">
      <div className="container">
        <div className="error-content">
          <h1>401</h1>
          <h2>Unauthorized Access</h2>
          <p>Sorry, you don't have permission to access this page.</p>
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

export default UnauthorizedPage; 