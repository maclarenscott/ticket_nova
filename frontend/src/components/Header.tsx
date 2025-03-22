import React, { useState, useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import '../styles/Header.css';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <header className="main-header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <Link to="/">
              <h1>Dalhousie Arts Centre</h1>
              <span>Box Office</span>
            </Link>
          </div>

          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`} 
            onClick={toggleMobileMenu}
            aria-label="Toggle Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav className={`main-nav ${mobileMenuOpen ? 'open' : ''}`}>
            <ul className="nav-links">
              <li>
                <NavLink 
                  to="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => isActive ? 'active' : ''}
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/events" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => isActive ? 'active' : ''}
                >
                  Events
                </NavLink>
              </li>
              {isAuthenticated() ? (
                <>
                  <li>
                    <NavLink 
                      to="/account/tickets" 
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => isActive ? 'active' : ''}
                    >
                      My Tickets
                    </NavLink>
                  </li>
                  {user && (user.role === 'admin' || user.role === 'manager') && (
                    <li>
                      <NavLink 
                        to="/admin" 
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) => isActive ? 'active' : ''}
                      >
                        Admin
                      </NavLink>
                    </li>
                  )}
                  <li className="dropdown">
                    <button className="dropdown-toggle">
                      {user?.firstName || 'Account'} <span className="arrow-down">▼</span>
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <Link 
                          to="/account/profile" 
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Profile
                        </Link>
                      </li>
                      <li>
                        <button 
                          className="logout-button" 
                          onClick={handleLogout}
                        >
                          Logout
                        </button>
                      </li>
                    </ul>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <NavLink 
                      to="/login" 
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => isActive ? 'active' : ''}
                    >
                      Login
                    </NavLink>
                  </li>
                  <li>
                    <NavLink 
                      to="/register" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="register-button"
                    >
                      Register
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 