import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import AuthContext from '../../context/AuthContext';
import '../../styles/TicketDetail.css';

interface Ticket {
  _id: string;
  ticketNumber: string;
  status: string;
  seatDetails: {
    section: string;
    row?: string;
    seatNumber?: string;
  };
  price: number;
  purchaseDate: string;
  isCheckedIn: boolean;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  event: {
    _id: string;
    title: string;
    description: string;
    image: string;
    category: string;
  };
  performance: {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
    venue: {
      name: string;
      address: string;
      city: string;
    };
  };
}

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ticket details
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/tickets/${id}`);
        setTicket(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError('Failed to load ticket details. Please try again later.');
        setLoading(false);
      }
    };

    if (isAuthenticated() && id) {
      fetchTicket();
    } else {
      navigate('/login', { state: { from: `/account/tickets/${id}` } });
    }
  }, [id, isAuthenticated, navigate]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'purchased':
        return 'status-badge status-purchased';
      case 'cancelled':
        return 'status-badge status-cancelled';
      case 'refunded':
        return 'status-badge status-refunded';
      case 'reserved':
        return 'status-badge status-reserved';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="ticket-detail-page">
      <div className="container">
        {loading ? (
          <div className="loading">Loading ticket details...</div>
        ) : error ? (
          <div className="error-container">
            <div className="error">{error}</div>
            <Link to="/account/tickets" className="btn btn-primary">Back to My Tickets</Link>
          </div>
        ) : ticket ? (
          <>
            <div className="page-header">
              <h1>Ticket Details</h1>
              <p>View your ticket information</p>
            </div>
            
            <div className="ticket-container">
              <div className="ticket">
                <div className="ticket-header">
                  <div className="event-info">
                    <h2>{ticket.event.title}</h2>
                    <p className="event-category">{ticket.event.category}</p>
                  </div>
                  <div className="ticket-status">
                    <span className={getStatusBadgeClass(ticket.status)}>
                      {ticket.status}
                    </span>
                    {ticket.isCheckedIn && (
                      <span className="checked-in-badge">Checked In</span>
                    )}
                  </div>
                </div>
                
                <div className="ticket-body">
                  <div className="ticket-section ticket-details">
                    <h3>Ticket Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Ticket Number</span>
                        <span className="value">{ticket.ticketNumber}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Section</span>
                        <span className="value">{ticket.seatDetails.section}</span>
                      </div>
                      {ticket.seatDetails.row && (
                        <div className="info-item">
                          <span className="label">Row</span>
                          <span className="value">{ticket.seatDetails.row}</span>
                        </div>
                      )}
                      {ticket.seatDetails.seatNumber && (
                        <div className="info-item">
                          <span className="label">Seat</span>
                          <span className="value">{ticket.seatDetails.seatNumber}</span>
                        </div>
                      )}
                      <div className="info-item">
                        <span className="label">Price</span>
                        <span className="value">${ticket.price.toFixed(2)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Purchase Date</span>
                        <span className="value">{formatDate(ticket.purchaseDate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ticket-section event-details">
                    <h3>Event Details</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Date</span>
                        <span className="value">{formatDate(ticket.performance.date)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Time</span>
                        <span className="value">
                          {formatTime(ticket.performance.startTime)} - {formatTime(ticket.performance.endTime)}
                        </span>
                      </div>
                      <div className="info-item full-width">
                        <span className="label">Venue</span>
                        <span className="value">
                          {ticket.performance.venue.name}, {ticket.performance.venue.address}, {ticket.performance.venue.city}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ticket-section customer-details">
                    <h3>Customer Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Name</span>
                        <span className="value">
                          {ticket.customer.firstName} {ticket.customer.lastName}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Email</span>
                        <span className="value">{ticket.customer.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="ticket-footer">
                  <div className="qr-code-container">
                    <h3>Ticket QR Code</h3>
                    <p>Present this QR code at the venue for entry</p>
                    <div className="qr-code">
                      <QRCodeSVG 
                        value={`${window.location.origin}/api/tickets/validate/${ticket._id}`} 
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="qr-code-note">Scan this code at event entrance</p>
                  </div>
                </div>
              </div>
              
              <div className="ticket-actions">
                <Link to="/account/tickets" className="btn btn-secondary">Back to My Tickets</Link>
                {ticket.status === 'purchased' && !ticket.isCheckedIn && (
                  <a 
                    href={`/api/tickets/${ticket._id}/download`} 
                    className="btn btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download Ticket
                  </a>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="not-found">
            <h2>Ticket Not Found</h2>
            <p>The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link to="/account/tickets" className="btn btn-primary">Back to My Tickets</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetailPage; 