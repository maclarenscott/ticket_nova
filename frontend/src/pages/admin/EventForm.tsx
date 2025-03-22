import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/EventForm.css';

interface EventFormData {
  title: string;
  description: string;
  venue: string;
  category: string;
  startDate: string;
  endDate: string;
  duration: number;
  image: string;
  isPublished: boolean;
  isFeatured: boolean;
  tags: string[];
}

interface Venue {
  _id: string;
  name: string;
}

const EventForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    venue: '',
    category: 'other',
    startDate: '',
    endDate: '',
    duration: 120,
    image: '',
    isPublished: false,
    isFeatured: false,
    tags: []
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [categories, setCategories] = useState<string[]>([
    'theater', 'concert', 'comedy', 'dance', 'family', 'other'
  ]);
  const [currentTag, setCurrentTag] = useState<string>('');
  
  useEffect(() => {
    fetchVenues();
    
    if (isEditMode) {
      fetchEventData();
    }
  }, [id]);
  
  const fetchVenues = async () => {
    try {
      const response = await axios.get('/api/venues');
      setVenues(response.data.venues);
    } catch (err: any) {
      console.error('Error fetching venues:', err.message);
    }
  };
  
  const fetchEventData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/events/${id}`);
      const eventData = response.data.event;
      
      // Format dates for form inputs
      const formattedStartDate = new Date(eventData.startDate)
        .toISOString()
        .split('T')[0];
        
      const formattedEndDate = new Date(eventData.endDate)
        .toISOString()
        .split('T')[0];
      
      setFormData({
        title: eventData.title,
        description: eventData.description,
        venue: eventData.venue._id || eventData.venue,
        category: eventData.category,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        duration: eventData.duration,
        image: eventData.image || '',
        isPublished: eventData.isPublished,
        isFeatured: eventData.isFeatured,
        tags: eventData.tags || []
      });
      
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching event data');
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleTagAdd = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()]
      });
      setCurrentTag('');
    }
  };
  
  const handleTagRemove = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const submitData = {
        ...formData,
        // Ensure dates are properly formatted
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };
      
      if (isEditMode) {
        await axios.put(`/api/events/${id}`, submitData);
      } else {
        await axios.post('/api/events', submitData);
      }
      
      // Redirect back to events list
      navigate('/admin/events');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving event');
      setLoading(false);
    }
  };
  
  if (loading && isEditMode) {
    return (
      <div className="event-form-container">
        <div className="spinner"></div>
        <p className="text-center">Loading event data...</p>
      </div>
    );
  }
  
  return (
    <div className="event-form-container">
      <h1>{isEditMode ? 'Edit Event' : 'Create New Event'}</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-group">
          <label htmlFor="title">Event Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="venue">Venue *</label>
            <select
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              required
            >
              <option value="">Select a venue</option>
              {venues.map(venue => (
                <option key={venue._id} value={venue._id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date *</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">End Date *</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="duration">Duration (minutes) *</label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="image">Image URL</label>
          <input
            type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>
        
        <div className="form-row checkboxes">
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
              />
              Publish Event
            </label>
          </div>
          
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
              />
              Feature Event
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label>Tags</label>
          <div className="tags-input">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              placeholder="Add tag and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTagAdd();
                }
              }}
            />
            <button 
              type="button" 
              onClick={handleTagAdd}
              className="add-tag-btn"
            >
              Add
            </button>
          </div>
          
          <div className="tags-container">
            {formData.tags.map(tag => (
              <div key={tag} className="tag">
                {tag}
                <button 
                  type="button" 
                  onClick={() => handleTagRemove(tag)}
                  className="remove-tag-btn"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="cancel-btn"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm; 