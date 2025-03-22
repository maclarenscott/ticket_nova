import React, { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import '../../styles/MyTickets.css';

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
  event: {
    _id: string;
    title: string;
    image: string;
  };
  performance: {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
  };
}

const MyTicketsPage: React.FC = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('upcoming');

  // Fetch user tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/tickets/my-tickets');
        setTickets(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError('Failed to load your tickets. Please try again later.');
        setLoading(false);
      }
    };

    if (isAuthenticated()) {
      fetchTickets();
    }
  }, [isAuthenticated]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
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

  // Filter tickets based on active filter
  const filteredTickets = tickets.filter(ticket => {
    const performanceDate = new Date(ticket.performance.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (activeFilter === 'upcoming') {
      return performanceDate >= today;
    } else if (activeFilter === 'past') {
      return performanceDate < today;
    } else {
      return true; // 'all' filter
    }
  });

  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: '/account/tickets' }} />;
  }

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
    <div className="my-tickets-page">
      <div className="container">
        <div className="page-header">
          <h1>My Tickets</h1>
          <p>View and manage your event tickets</p>
        </div>
        
        <div className="filter-tabs">
          <button 
            className={activeFilter === 'upcoming' ? 'active' : ''}
            onClick={() => setActiveFilter('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={activeFilter === 'past' ? 'active' : ''}
            onClick={() => setActiveFilter('past')}
          >
            Past
          </button>
          <button 
            className={activeFilter === 'all' ? 'active' : ''}
            onClick={() => setActiveFilter('all')}
          >
            All Tickets
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading your tickets...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : filteredTickets.length === 0 ? (
          <div className="no-tickets">
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7"></path>
                <rect x="6" y="5" width="12" height="8" rx="1"></rect>
                <line x1="12" y1="3" x2="12" y2="5"></line>
                <line x1="8" y1="9" x2="16" y2="9"></line>
              </svg>
              <h2>No Tickets Found</h2>
              <p>You don't have any {activeFilter !== 'all' ? activeFilter : ''} tickets.</p>
              {activeFilter !== 'upcoming' && (
                <Link to="/events" className="btn btn-primary">Browse Events</Link>
              )}
            </div>
          </div>
        ) : (
          <div className="tickets-list">
            {filteredTickets.map(ticket => (
              <div key={ticket._id} className="ticket-card">
                <div className="event-info">
                  <div className="event-image">
                    <img 
                      src={ticket.event.image || '/placeholder-event.jpg'} 
                      alt={ticket.event.title} 
                    />
                  </div>
                  <div className="event-details">
                    <Link to={`/events/${ticket.event._id}`} className="event-title">
                      {ticket.event.title}
                    </Link>
                    <div className="event-meta">
                      <div className="event-date-time">
                        <span className="event-date">{formatDate(ticket.performance.date)}</span>
                        <span className="event-time">{formatTime(ticket.performance.startTime)}</span>
                      </div>
                      <span className={getStatusBadgeClass(ticket.status)}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="ticket-details">
                  <div className="ticket-info">
                    <span className="label">Ticket Number:</span>
                    <span className="value">{ticket.ticketNumber}</span>
                  </div>
                  <div className="ticket-info">
                    <span className="label">Seat:</span>
                    <span className="value">
                      {ticket.seatDetails.section}
                      {ticket.seatDetails.row && `, Row ${ticket.seatDetails.row}`}
                      {ticket.seatDetails.seatNumber && `, Seat ${ticket.seatDetails.seatNumber}`}
                    </span>
                  </div>
                  <div className="ticket-info">
                    <span className="label">Price:</span>
                    <span className="value">${ticket.price.toFixed(2)}</span>
                  </div>
                  <div className="ticket-info">
                    <span className="label">Purchase Date:</span>
                    <span className="value">{formatDate(ticket.purchaseDate)}</span>
                  </div>
                </div>
                
                <div className="ticket-actions">
                  <Link to={`/account/tickets/${ticket._id}`} className="btn btn-primary">
                    View Ticket
                  </Link>
                  {ticket.status === 'purchased' && !ticket.isCheckedIn && (
                    <a 
                      href={`/api/tickets/${ticket._id}/download`} 
                      className="btn btn-secondary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTicketsPage; 