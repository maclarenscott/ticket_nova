import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import '../../styles/AdminLayout.css';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h1>Admin Dashboard</h1>
          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        
        <nav className={`admin-nav ${mobileMenuOpen ? 'active' : ''}`}>
          <ul>
            <li>
              <Link 
                to="/admin" 
                className={isActive('/admin') ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/events" 
                className={isActive('/admin/events') ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/performances" 
                className={isActive('/admin/performances') ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                Performances
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/tickets" 
                className={isActive('/admin/tickets') ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                Tickets
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/users" 
                className={isActive('/admin/users') ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                Users
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/reports" 
                className={isActive('/admin/reports') ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                Reports
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/settings" 
                className={isActive('/admin/settings') ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="admin-sidebar-footer">
          <button className="back-to-site" onClick={() => navigate('/')}>
            Back to Site
          </button>
        </div>
      </div>
      
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout; 