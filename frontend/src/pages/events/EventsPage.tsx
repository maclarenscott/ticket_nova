import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Events.css';

interface Event {
  _id: string;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
  category: string;
  venue: {
    _id: string;
    name: string;
  };
  isFeatured: boolean;
  isPublished: boolean;
}

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/events');
        
        console.log('API Response:', response.data);
        
        // Check if events data exists and is an array
        if (response.data && Array.isArray(response.data.events)) {
          setEvents(response.data.events);
          setFilteredEvents(response.data.events);
          setError(null);
        } else if (response.data && response.data.status === 'success' && Array.isArray(response.data.events)) {
          setEvents(response.data.events);
          setFilteredEvents(response.data.events);
          setError(null);
        } else {
          console.error('Invalid events data format:', response.data);
          setError('Failed to parse events data. Please try again later.');
          setEvents([]);
          setFilteredEvents([]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
        setEvents([]);
        setFilteredEvents([]);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events when search term, category, or date changes
  useEffect(() => {
    const filterEvents = () => {
      let filtered = [...events];

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(event => 
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          event.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply category filter
      if (categoryFilter && categoryFilter !== 'all') {
        filtered = filtered.filter(event => 
          event.category === categoryFilter
        );
      }

      // Apply date range filter
      if (startDateFilter || endDateFilter) {
        filtered = filtered.filter(event => {
          const eventStart = new Date(event.startDate);
          const eventEnd = new Date(event.endDate);
          
          // If only start date is provided
          if (startDateFilter && !endDateFilter) {
            const filterStart = new Date(startDateFilter);
            return eventStart >= filterStart || eventEnd >= filterStart;
          }
          
          // If only end date is provided
          if (endDateFilter && !startDateFilter) {
            const filterEnd = new Date(endDateFilter);
            return eventStart <= filterEnd;
          }
          
          // If both dates are provided
          if (startDateFilter && endDateFilter) {
            const filterStart = new Date(startDateFilter);
            const filterEnd = new Date(endDateFilter);
            
            // Check if event overlaps with the filter date range
            return (
              (eventStart >= filterStart && eventStart <= filterEnd) || // Event starts within range
              (eventEnd >= filterStart && eventEnd <= filterEnd) || // Event ends within range
              (eventStart <= filterStart && eventEnd >= filterEnd) // Event spans the entire range
            );
          }
          
          return true;
        });
      }

      setFilteredEvents(filtered);
    };

    filterEvents();
  }, [searchTerm, categoryFilter, startDateFilter, endDateFilter, events]);

  // Get unique categories from events
  const categories = Array.from(new Set((events || []).map(event => event.category)));

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

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  return (
    <div className="events-page">
      <div className="events-hero">
        <div className="container">
          <h1>Events & Performances</h1>
          <p>Discover upcoming events at Dalhousie Arts Centre</p>
        </div>
      </div>

      <div className="container">
        <div className="events-filters">
          <div className="search-box">
            <i className="search-icon">🔍</i>
            <input 
              type="text" 
              placeholder="Search events..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div className="filter-item">
              <label htmlFor="category-filter">Category</label>
              <select 
                id="category-filter"
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label htmlFor="start-date">From</label>
              <input 
                type="date" 
                id="start-date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
              />
            </div>

            <div className="filter-item">
              <label htmlFor="end-date">To</label>
              <input 
                type="date" 
                id="end-date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
              />
            </div>

            <button 
              className="btn-clear-filters"
              onClick={clearFilters}
              title="Clear all filters"
            >
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading events...</div>
        ) : error ? (
          <div className="error">
            {error}
            <br />
            <small>Please check the browser console for more details.</small>
          </div>
        ) : (
          <>
            <div className="events-count">
              <p>Showing {filteredEvents.length} events</p>
            </div>
            
            {events.length === 0 ? (
              <div className="no-events">
                <p>There are no events available at this time. Please check back later.</p>
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="events-grid">
                {filteredEvents.map(event => (
                  <div key={event._id} className="event-card">
                    <div className="event-image">
                      <img src={event.image || '/placeholder-event.jpg'} alt={event.title} />
                      {event.isFeatured && <span className="featured-label">Featured</span>}
                      <p className="event-category">{event.category}</p>
                    </div>
                    <div className="event-details">
                      <h3>{event.title}</h3>
                      <p className="event-venue">{event.venue?.name || 'Venue TBA'}</p>
                      <p className="event-date">
                        {formatDate(event.startDate)}
                        {event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
                      </p>
                      <p className="event-description">
                        {event.description.length > 120 
                          ? `${event.description.substring(0, 120)}...` 
                          : event.description}
                      </p>
                      <Link to={`/events/${event._id}`} className="btn btn-primary btn-sm">View Details</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-events">
                <p>No events found matching your criteria. Please try a different search or filter.</p>
                <button 
                  className="btn btn-outline"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventsPage; 