import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {QRCodeSVG} from 'qrcode.react';
import { AuthContext } from '../../contexts/AuthContext';
import '../../styles/TicketDetailPage.css';

interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  performanceId: string;
  performanceDate: string;
  venueName: string;
  seat: string;
  price: number;
  status: string;
  purchaseDate: string;
  paymentStatus: string;
}

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await axios.get(`/api/tickets/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setTicket(res.data.ticket);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch ticket details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTicket();
    }
  }, [id, token]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
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

  const downloadTicket = () => {
    const svgElement = document.getElementById('ticket-qr');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `ticket-${ticket?.eventName.replace(/\s+/g, '-').toLowerCase()}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
        <p className="text-center">Loading ticket details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container">
        <div className="error-message">
          <p>Ticket not found</p>
          <button onClick={() => navigate('/my-tickets')}>View All Tickets</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-detail-page">
      <div className="container">
        <div className="back-link">
          <Link to="/my-tickets">&larr; Back to My Tickets</Link>
        </div>
        
        <div className="ticket-container">
          <div className="ticket">
            <div className="ticket-header">
              <h1>{ticket.eventName}</h1>
              <span className={`ticket-status ${getStatusClass(ticket.status)}`}>
                {ticket.status}
              </span>
            </div>
            
            <div className="ticket-body">
              <div className="ticket-info">
                <div className="info-group">
                  <h2>Performance Details</h2>
                  <p>
                    <span>Date & Time:</span> 
                    <strong>{formatDate(ticket.performanceDate)}</strong>
                  </p>
                  <p>
                    <span>Venue:</span> 
                    <strong>{ticket.venueName}</strong>
                  </p>
                  <p>
                    <span>Seat:</span> 
                    <strong>{ticket.seat}</strong>
                  </p>
                </div>
                
                <div className="info-group">
                  <h2>Ticket Information</h2>
                  <p>
                    <span>Ticket ID:</span> 
                    <strong>{ticket.id}</strong>
                  </p>
                  <p>
                    <span>Price:</span> 
                    <strong>${ticket.price.toFixed(2)}</strong>
                  </p>
                  <p>
                    <span>Purchase Date:</span> 
                    <strong>{new Date(ticket.purchaseDate).toLocaleDateString()}</strong>
                  </p>
                  <p>
                    <span>Payment Status:</span> 
                    <strong>{ticket.paymentStatus}</strong>
                  </p>
                </div>
              </div>
              
              <div className="ticket-qr">
                <QRCodeSVG
                  id="ticket-qr"
                  value={`TICKET:${ticket.id}`}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
                <p>Present this QR code at the venue</p>
                <button className="btn-secondary" onClick={downloadTicket}>
                  Download QR Code
                </button>
              </div>
            </div>
            
            <div className="ticket-footer">
              <Link to={`/events/${ticket.eventId}`} className="btn-secondary">
                View Event
              </Link>
              {ticket.status === 'Reserved' && (
                <Link to={`/checkout/${ticket.eventId}/${ticket.performanceId}`} className="btn-primary">
                  Complete Purchase
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage; 