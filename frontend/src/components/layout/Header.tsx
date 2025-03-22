import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import '../../styles/Header.css';

const Header: React.FC = () => {
  const { isAuthenticated, isAdmin, isManager, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <Link to="/">
            <h1>Dalhousie Arts Centre</h1>
          </Link>
        </div>
        
        <nav className="main-nav">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/events">Events</Link>
            </li>
            
            {isAuthenticated() ? (
              <>
                <li>
                  <Link to="/tickets">My Tickets</Link>
                </li>
                
                {(isAdmin() || isManager()) && (
                  <li className="dropdown">
                    <span>Admin</span>
                    <div className="dropdown-content">
                      <Link to="/admin/dashboard">Dashboard</Link>
                      <Link to="/admin/events">Events</Link>
                      <Link to="/admin/venues">Venues</Link>
                      <Link to="/admin/tickets">Tickets</Link>
                      <Link to="/admin/reports">Reports</Link>
                      {isAdmin() && (
                        <Link to="/admin/users">Users</Link>
                      )}
                    </div>
                  </li>
                )}
                
                <li className="dropdown">
                  <span>{user?.firstName}</span>
                  <div className="dropdown-content">
                    <Link to="/profile">My Profile</Link>
                    <button onClick={handleLogout}>Logout</button>
                  </div>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 