import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/HomePage.css';

interface Event {
  _id: string;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
  category: string;
}

const HomePage: React.FC = () => {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/events', { 
          params: { 
            featured: true,
            limit: 4
          } 
        });
        
        console.log('Featured Events API Response:', response.data);
        
        // Check if events data exists and is an array
        if (response.data && Array.isArray(response.data.events)) {
          setFeaturedEvents(response.data.events);
          setError(null);
        } else if (response.data && response.data.status === 'success' && Array.isArray(response.data.events)) {
          setFeaturedEvents(response.data.events);
          setError(null);
        } else {
          console.error('Invalid featured events data format:', response.data);
          setError('Failed to parse featured events data. Please try again later.');
          setFeaturedEvents([]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching featured events:', err);
        setError('Failed to load featured events. Please try again later.');
        setFeaturedEvents([]);
        setLoading(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Dalhousie Arts Centre</h1>
          <p>Discover world-class performances, exhibitions, and cultural events</p>
          <div className="hero-buttons">
            <Link to="/events" className="btn btn-primary">Browse Events</Link>
            {/* <Link to="/about" className="btn btn-secondary">Learn More</Link> */}
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="featured-events-section">
        <div className="container">
          <div className="section-header">
            <h2>Featured Events</h2>
            <Link to="/events" className="view-all">View All Events</Link>
          </div>

          {loading ? (
            <div className="loading">Loading featured events...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : featuredEvents.length > 0 ? (
            <div className="featured-events-grid">
              {featuredEvents.map(event => (
                <div key={event._id} className="event-card">
                  <Link to={`/events/${event._id}`} className="event-image">
                    <img src={event.image || '/placeholder-event.jpg'} alt={event.title} />
                    <div className="event-category">{event.category}</div>
                  </Link>
                  <div className="event-details">
                    <h3 className="event-title">
                      <Link to={`/events/${event._id}`}>{event.title}</Link>
                    </h3>
                    <p className="event-date">
                      {formatDate(event.startDate)}
                      {event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
                    </p>
                    <p className="event-description">
                      {event.description && event.description.length > 100
                        ? `${event.description.substring(0, 100)}...`
                        : event.description}
                    </p>
                    <Link to={`/events/${event._id}`} className="btn btn-text">View Details</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-events">
              <p>No featured events available at the moment. Check back soon!</p>
              <Link to="/events" className="btn btn-primary">Browse All Events</Link>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>About Dalhousie Arts Centre</h2>
              <p>
                The Dalhousie Arts Centre is the cultural hub of Dalhousie University and the premier 
                performing arts venue in Halifax. Home to the Rebecca Cohn Auditorium, the Dalhousie Art 
                Gallery, and the Fountain School of Performing Arts, we offer a wide range of cultural
                experiences for everyone.
              </p>
              <p>
                Our mission is to enrich the cultural life of our community through arts, performances,
                and education, fostering creativity and artistic expression for all.
              </p>
              <Link to="/about" className="btn btn-primary">Learn More About Us</Link>
            </div>
            <div className="about-image">
              <img src="/images/arts-centre.jpg" alt="Dalhousie Arts Centre" />
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Experience the Arts?</h2>
            <p>Browse upcoming events and secure your tickets today</p>
            <Link to="/events" className="btn btn-primary btn-large">Find Your Next Event</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 