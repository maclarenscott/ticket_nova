import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import '../../styles/Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    console.log("Navbar - Auth State:", { 
      isAuthenticated: isAuthenticated(),
      userExists: !!user,
      userRole: user?.role,
      userEmail: user?.email
    });
  }, [isAuthenticated, user]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const handleAdminClick = () => {
    console.log("Admin link clicked - Auth State:", {
      isAuthenticated: isAuthenticated(), 
      userRole: user?.role,
      userEmail: user?.email
    });
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">Arts Centre</span>
        </Link>

        <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <ul className="navbar-links">
            <li>
              <Link 
                to="/" 
                className={isActive('/') ? 'active' : ''} 
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/events" 
                className={isActive('/events') ? 'active' : ''} 
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </Link>
            </li>
            {isAuthenticated() ? (
              <>
                <li>
                  <Link 
                    to="/my-tickets" 
                    className={isActive('/my-tickets') ? 'active' : ''} 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Tickets
                  </Link>
                </li>
                {user && (user.role === 'Admin' || user.role === 'Manager') && (
                  <li>
                    <Link 
                      to="/admin" 
                      className={isActive('/admin') ? 'active' : ''} 
                      onClick={handleAdminClick}
                    >
                      Admin
                    </Link>
                  </li>
                )}
                <li className="auth-links">
                  <span onClick={handleLogout} className="auth-button">Logout</span>
                </li>
              </>
            ) : (
              <li className="auth-links">
                <Link 
                  to="/login" 
                  className={`auth-button ${isActive('/login') ? 'active' : ''}`} 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className={`auth-button auth-button-secondary ${isActive('/register') ? 'active' : ''}`} 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 