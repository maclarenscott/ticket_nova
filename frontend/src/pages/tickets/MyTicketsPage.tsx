import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import '../../styles/MyTicketsPage.css';

interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  performanceId: string;
  performanceDate: string;
  seat: string;
  price: number;
  status: string;
  purchaseDate: string;
  paymentStatus: string;
}

const MyTicketsPage: React.FC = () => {
  const { token } = useContext(AuthContext);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get('/api/tickets', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setTickets(res.data.tickets);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [token]);

  const filterTickets = (filter: string) => {
    setActiveFilter(filter);
  };

  const getFilteredTickets = () => {
    if (activeFilter === 'all') {
      return tickets;
    } else if (activeFilter === 'upcoming') {
      return tickets.filter(ticket => 
        new Date(ticket.performanceDate) > new Date() && 
        ticket.status !== 'Cancelled'
      );
    } else if (activeFilter === 'past') {
      return tickets.filter(ticket => 
        new Date(ticket.performanceDate) < new Date() || 
        ticket.status === 'Used'
      );
    }
    return tickets;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Purchased':
        return 'status-purchased';
      case 'Used':
        return 'status-used';
      case 'Cancelled':
        return 'status-cancelled';
      case 'Reserved':
        return 'status-reserved';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
        <p className="text-center">Loading your tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  const filteredTickets = getFilteredTickets();

  return (
    <div className="my-tickets-page">
      <div className="container">
        <h1>My Tickets</h1>
        
        <div className="ticket-filters">
          <button 
            className={activeFilter === 'all' ? 'active' : ''} 
            onClick={() => filterTickets('all')}
          >
            All Tickets
          </button>
          <button 
            className={activeFilter === 'upcoming' ? 'active' : ''} 
            onClick={() => filterTickets('upcoming')}
          >
            Upcoming Events
          </button>
          <button 
            className={activeFilter === 'past' ? 'active' : ''} 
            onClick={() => filterTickets('past')}
          >
            Past Events
          </button>
        </div>
        
        {filteredTickets.length === 0 ? (
          <div className="no-tickets">
            <p>You don't have any tickets yet.</p>
            <Link to="/events" className="btn-primary">Browse Events</Link>
          </div>
        ) : (
          <div className="tickets-list">
            {filteredTickets.map((ticket) => (
              <div className="ticket-card" key={ticket.id}>
                <div className="ticket-header">
                  <h2>{ticket.eventName}</h2>
                  <span className={`ticket-status ${getStatusClass(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                
                <div className="ticket-details">
                  <div className="ticket-info">
                    <p>
                      <strong>Date & Time:</strong> {formatDate(ticket.performanceDate)}
                    </p>
                    <p>
                      <strong>Seat:</strong> {ticket.seat}
                    </p>
                    <p>
                      <strong>Price:</strong> ${ticket.price.toFixed(2)}
                    </p>
                    <p>
                      <strong>Purchase Date:</strong> {new Date(ticket.purchaseDate).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Payment Status:</strong> {ticket.paymentStatus}
                    </p>
                  </div>
                  
                  <div className="ticket-actions">
                    <Link to={`/tickets/${ticket.id}`} className="btn-primary">
                      View Details
                    </Link>
                  </div>
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