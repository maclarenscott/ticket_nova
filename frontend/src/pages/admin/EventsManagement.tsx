import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/AdminEvents.css';

interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  isFeatured: boolean;
  isActive: boolean;
}

const EventsManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filterPublished, setFilterPublished] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchEvents();
  }, [currentPage, searchTerm, selectedCategory, filterPublished]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/events/categories');
      setCategories(response.data.categories);
    } catch (err: any) {
      console.error('Error fetching categories:', err.message);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let url = `/api/events?page=${currentPage}&limit=10`;
      
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }
      
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      
      if (filterPublished === 'published') {
        url += '&isPublished=true';
      } else if (filterPublished === 'unpublished') {
        url += '&isPublished=false';
      }
      
      const response = await axios.get(url);
      setEvents(response.data.events);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching events');
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents();
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/events/${id}/publish`);
      
      // Update the local state without refetching
      setEvents(events.map(event => 
        event._id === id ? { ...event, isPublished: !currentStatus } : event
      ));
    } catch (err: any) {
      console.error('Error toggling publish status:', err.message);
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/events/${id}/feature`);
      
      // Update the local state without refetching
      setEvents(events.map(event => 
        event._id === id ? { ...event, isFeatured: !currentStatus } : event
      ));
    } catch (err: any) {
      console.error('Error toggling featured status:', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/events/${id}`);
        
        // Remove from local state
        setEvents(events.filter(event => event._id !== id));
      } catch (err: any) {
        console.error('Error deleting event:', err.message);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderPagination = () => {
    const pages = [];
    
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={currentPage === i ? 'active' : ''}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="pagination">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        
        {pages}
        
        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-events">
        <div className="spinner"></div>
        <p className="text-center">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-events">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchEvents}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-events">
      <div className="header-actions">
        <h1>Events Management</h1>
        <Link to="/admin/events/new" className="btn-primary">
          Create New Event
        </Link>
      </div>
      
      <div className="filters">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        
        <div className="filter-options">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          
          <select
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value)}
          >
            <option value="">All Events</option>
            <option value="published">Published Only</option>
            <option value="unpublished">Unpublished Only</option>
          </select>
        </div>
      </div>
      
      <div className="events-table-container">
        {events.length === 0 ? (
          <div className="no-events">
            <p>No events found.</p>
          </div>
        ) : (
          <table className="events-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event._id} className={!event.isActive ? 'inactive-event' : ''}>
                  <td>
                    <Link to={`/admin/events/edit/${event._id}`}>
                      {event.title}
                    </Link>
                    {event.isFeatured && <span className="featured-badge">Featured</span>}
                  </td>
                  <td>{event.category}</td>
                  <td>{formatDate(event.startDate)}</td>
                  <td>{formatDate(event.endDate)}</td>
                  <td>
                    <span className={`status ${event.isPublished ? 'published' : 'unpublished'}`}>
                      {event.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="edit-btn"
                      onClick={() => window.location.href = `/admin/events/edit/${event._id}`}
                    >
                      Edit
                    </button>
                    
                    <button 
                      className={`publish-btn ${event.isPublished ? 'unpublish' : 'publish'}`}
                      onClick={() => handleTogglePublish(event._id, event.isPublished)}
                    >
                      {event.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    
                    <button 
                      className={`feature-btn ${event.isFeatured ? 'unfeature' : 'feature'}`}
                      onClick={() => handleToggleFeatured(event._id, event.isFeatured)}
                    >
                      {event.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                    
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(event._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {totalPages > 1 && renderPagination()}
    </div>
  );
};

export default EventsManagement; 