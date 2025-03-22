import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section about">
            <h3>Dalhousie Arts Centre</h3>
            <p>
              Home to the Dalhousie University's performing arts, featuring the Rebecca Cohn Auditorium,
              the Art Gallery, and the Fountain School of Performing Arts.
            </p>
            <div className="contact-info">
              <p><strong>Address:</strong> 6101 University Avenue, Halifax, NS</p>
              <p><strong>Phone:</strong> (902) 494-3820</p>
              <p><strong>Email:</strong> arts.centre@dal.ca</p>
            </div>
          </div>

          <div className="footer-section links">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/events">Events</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
          </div>

          <div className="footer-section resources">
            <h3>Resources</h3>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/faq">FAQs</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="footer-section newsletter">
            <h3>Stay Connected</h3>
            <p>Subscribe to our newsletter for updates on upcoming performances and events.</p>
            <form className="newsletter-form">
              <input type="email" placeholder="Your email address" required />
              <button type="submit">Subscribe</button>
            </form>
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Dalhousie Arts Centre. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 