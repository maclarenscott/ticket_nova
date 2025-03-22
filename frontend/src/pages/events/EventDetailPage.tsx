import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import '../../styles/EventDetail.css';

interface Performance {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  ticketPricing: {
    category: string;
    price: number;
    availableSeats: number;
    _id: string;
  }[];
  isSoldOut: boolean;
  isCancelled: boolean;
}

interface Venue {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  capacity: number;
  description: string;
  seatMap?: string; // URL to seat map image
  sections?: string[]; // Array of section names
}

interface Event {
  _id: string;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
  category: string;
  venue: Venue;
  performances: Performance[];
  isFeatured: boolean;
  isPublished: boolean;
}

// New interface for seat selection
interface SeatSelectionProps {
  performance: Performance;
  selectedTickets: {[key: string]: number};
  onSeatSelect: (section: string, row: string, seat: string, category: string) => void;
  selectedSeats: SelectedSeat[];
  venue: Venue;
}

interface SelectedSeat {
  section: string;
  row: string;
  seat: string;
  category: string;
}

// Seat Selection Component
const SeatSelection: React.FC<SeatSelectionProps> = ({ 
  performance, 
  selectedTickets, 
  onSeatSelect,
  selectedSeats,
  venue
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [showSeatMap, setShowSeatMap] = useState<boolean>(false);
  
  // Only show seat selection if there are categories with tickets selected
  const shouldShowSeatSelection = Object.values(selectedTickets).some(quantity => quantity > 0);
  
  // Get total tickets selected
  const totalTicketsSelected = Object.values(selectedTickets).reduce((sum, quantity) => sum + quantity, 0);
  
  // Get remaining seats to select
  const remainingSeats = totalTicketsSelected - selectedSeats.length;
  
  // Check if venue has sections defined
  const hasVenueSections = venue.sections && venue.sections.length > 0;
  
  // Generate rows (A-Z)
  const rows = Array.from({ length: 10 }, (_, i) => String.fromCharCode(65 + i));
  
  // Generate seats per row (1-20)
  const seatsPerRow = 20;
  
  // Function to generate an array of seat numbers
  const getSeats = (count: number) => Array.from({ length: count }, (_, i) => (i + 1).toString());
  
  // Check if a seat is already selected
  const isSeatSelected = (section: string, row: string, seat: string) => {
    return selectedSeats.some(s => 
      s.section === section && s.row === row && s.seat === seat
    );
  };
  
  if (!shouldShowSeatSelection) {
    return null;
  }
  
  return (
    <div className="seat-selection">
      <h3>Select Your Seats</h3>
      <p>You have {remainingSeats} {remainingSeats === 1 ? 'seat' : 'seats'} left to select</p>
      
      {/* Category Selection */}
      <div className="category-selection">
        <p>First, select the ticket category:</p>
        <div className="category-buttons">
          {performance.ticketPricing.map(pricing => (
            selectedTickets[pricing.category] > 0 && (
              <button
                key={pricing._id}
                className={`category-btn ${activeCategory === pricing.category ? 'active' : ''}`}
                onClick={() => setActiveCategory(pricing.category)}
              >
                {pricing.category.charAt(0).toUpperCase() + pricing.category.slice(1)}
                <span className="count">
                  ({selectedSeats.filter(s => s.category === pricing.category).length}/{selectedTickets[pricing.category]})
                </span>
              </button>
            )
          ))}
        </div>
      </div>
      
      {/* Toggle between seat map and grid view */}
      {venue.seatMap && (
        <div className="view-toggle">
          <button
            className={`toggle-btn ${!showSeatMap ? 'active' : ''}`}
            onClick={() => setShowSeatMap(false)}
          >
            Grid View
          </button>
          <button
            className={`toggle-btn ${showSeatMap ? 'active' : ''}`}
            onClick={() => setShowSeatMap(true)}
          >
            Seat Map
          </button>
        </div>
      )}
      
      {/* Seat Selection Interface */}
      {activeCategory && (
        <div className="seats-container">
          {showSeatMap && venue.seatMap ? (
            // Seat Map View
            <div className="seat-map">
              <img src={venue.seatMap} alt="Venue Seat Map" />
              <p className="helper-text">Click on the seat map to select your seats</p>
            </div>
          ) : (
            // Grid View
            <div className="seating-grid">
              {hasVenueSections ? (
                // If venue has defined sections
                venue.sections!.map(section => (
                  <div key={section} className="section">
                    <h4>{section}</h4>
                    <div className="rows">
                      {rows.map(row => (
                        <div key={row} className="row">
                          <span className="row-label">{row}</span>
                          <div className="seats">
                            {getSeats(seatsPerRow).map(seat => (
                              <button
                                key={seat}
                                className={`seat ${isSeatSelected(section, row, seat) ? 'selected' : ''}`}
                                onClick={() => onSeatSelect(section, row, seat, activeCategory)}
                                disabled={isSeatSelected(section, row, seat) && !selectedSeats.some(s => 
                                  s.section === section && s.row === row && s.seat === seat && s.category === activeCategory
                                )}
                              >
                                {seat}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // If venue doesn't have defined sections, use a simple grid
                <div className="section">
                  <h4>Main</h4>
                  <div className="rows">
                    {rows.map(row => (
                      <div key={row} className="row">
                        <span className="row-label">{row}</span>
                        <div className="seats">
                          {getSeats(seatsPerRow).map(seat => (
                            <button
                              key={seat}
                              className={`seat ${isSeatSelected('Main', row, seat) ? 'selected' : ''}`}
                              onClick={() => onSeatSelect('Main', row, seat, activeCategory)}
                              disabled={isSeatSelected('Main', row, seat) && !selectedSeats.some(s => 
                                s.section === 'Main' && s.row === row && s.seat === seat && s.category === activeCategory
                              )}
                            >
                              {seat}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Selected Seats List */}
      {selectedSeats.length > 0 && (
        <div className="selected-seats">
          <h4>Selected Seats</h4>
          <ul>
            {selectedSeats.map((seat, index) => (
              <li key={index}>
                {seat.section} - Row {seat.row}, Seat {seat.seat} ({seat.category})
                <button
                  className="remove-seat"
                  onClick={() => {
                    const newSelectedSeats = [...selectedSeats];
                    newSelectedSeats.splice(index, 1);
                    // Call onSeatSelect to update parent state
                    onSeatSelect(seat.section, seat.row, seat.seat, seat.category);
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedPerformance, setSelectedPerformance] = useState<string>('');
  const [selectedTickets, setSelectedTickets] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch event details from API
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/events/${id}`);
        setEvent(response.data.event);
        
        // If event has performances, select the first one by default
        if (response.data.event.performances && response.data.event.performances.length > 0) {
          setSelectedPerformance(response.data.event.performances[0]._id);
          
          // Initialize selectedTickets object with 0 for each category
          const initialSelectedTickets: {[key: string]: number} = {};
          response.data.event.performances[0].ticketPricing.forEach((pricing: { category: string }) => {
            initialSelectedTickets[pricing.category] = 0;
          });
          setSelectedTickets(initialSelectedTickets);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details. Please try again later.');
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  // Handle seat selection
  const handleSeatSelect = (section: string, row: string, seat: string, category: string) => {
    // Check if seat is already selected
    const existingIndex = selectedSeats.findIndex(s => 
      s.section === section && s.row === row && s.seat === seat
    );
    
    if (existingIndex !== -1) {
      // Deselect seat
      const newSelectedSeats = [...selectedSeats];
      newSelectedSeats.splice(existingIndex, 1);
      setSelectedSeats(newSelectedSeats);
    } else {
      // Check if we can select more seats for this category
      const categorySeatsSelected = selectedSeats.filter(s => s.category === category).length;
      const categoryTotalSelected = selectedTickets[category] || 0;
      
      if (categorySeatsSelected < categoryTotalSelected) {
        // Select seat
        setSelectedSeats([...selectedSeats, { section, row, seat, category }]);
      }
    }
  };

  // Calculate total price based on selected tickets
  const calculateTotal = () => {
    if (!event || !selectedPerformance) return 0;
    
    const performance = event.performances.find(p => p._id === selectedPerformance);
    if (!performance) return 0;
    
    let total = 0;
    Object.entries(selectedTickets).forEach(([category, quantity]) => {
      const pricing = performance.ticketPricing.find(p => p.category === category);
      if (pricing) {
        total += pricing.price * quantity;
      }
    });
    
    return total;
  };

  // Check if any tickets are selected
  const hasSelectedTickets = () => {
    return Object.values(selectedTickets).some(quantity => quantity > 0);
  };

  // Handle performance selection
  const handlePerformanceChange = (performanceId: string) => {
    setSelectedPerformance(performanceId);
    
    // Reset selected tickets when performance changes
    const performance = event?.performances.find(p => p._id === performanceId);
    if (performance) {
      const initialSelectedTickets: {[key: string]: number} = {};
      performance.ticketPricing.forEach(pricing => {
        initialSelectedTickets[pricing.category] = 0;
      });
      setSelectedTickets(initialSelectedTickets);
      setSelectedSeats([]);
    }
  };

  // Handle ticket quantity change
  const handleTicketChange = (category: string, action: 'increment' | 'decrement') => {
    const performance = event?.performances.find(p => p._id === selectedPerformance);
    if (!performance) return;
    
    const pricing = performance.ticketPricing.find(p => p.category === category);
    if (!pricing) return;
    
    setSelectedTickets(prev => {
      const currentValue = prev[category] || 0;
      let newValue = currentValue;
      
      if (action === 'increment' && currentValue < pricing.availableSeats) {
        newValue = currentValue + 1;
      } else if (action === 'decrement' && currentValue > 0) {
        newValue = currentValue - 1;
        
        // If reducing ticket quantity, remove any selected seats for this category
        if (newValue < selectedSeats.filter(s => s.category === category).length) {
          // Remove excess seats from this category
          const categorySeats = selectedSeats.filter(s => s.category === category);
          const seatsToKeep = categorySeats.slice(0, newValue);
          const otherSeats = selectedSeats.filter(s => s.category !== category);
          setSelectedSeats([...otherSeats, ...seatsToKeep]);
        }
      }
      
      return { ...prev, [category]: newValue };
    });
  };

  // Handle checkout
  const handleCheckout = () => {
    // Redirect to login if user is not authenticated
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    
    // Validate that seats are selected for all tickets
    const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
    if (totalTickets !== selectedSeats.length) {
      alert(`Please select seats for all ${totalTickets} tickets before proceeding to checkout.`);
      return;
    }
    
    // Proceed to checkout with selected tickets
    navigate('/checkout', { 
      state: { 
        eventId: id, 
        performanceId: selectedPerformance, 
        tickets: selectedTickets,
        selectedSeats: selectedSeats,
        total: calculateTotal() 
      } 
    });
  };

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

  return (
    <div className="event-detail-page">
      {loading ? (
        <div className="container">
          <div className="loading">Loading event details...</div>
        </div>
      ) : error ? (
        <div className="container">
          <div className="error">{error}</div>
        </div>
      ) : event ? (
        <>
          <div className="event-hero" style={{backgroundImage: `url(${event.image || '/placeholder-event-large.jpg'})`}}>
            <div className="container">
              <div className="event-hero-content">
                <h1>{event.title}</h1>
                <div className="event-meta">
                  <span className="event-dates">
                    {formatDate(event.startDate)}
                    {event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
                  </span>
                  <span className="event-detail-category">{event.category}</span>
                  {event.isFeatured && <span className="event-featured">Featured</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="container">
            <div className="event-detail-content">
              <div className="event-main">
                <div className="event-description card">
                  <h2>About this Event</h2>
                  <p>{event.description}</p>
                </div>

                <div className="event-venue card">
                  <h2>Venue Information</h2>
                  <h3>{event.venue.name}</h3>
                  <p className="venue-address">
                    {event.venue.address.street}, {event.venue.address.city}, {event.venue.address.state} {event.venue.address.zipCode}, {event.venue.address.country}
                  </p>
                  <p className="venue-description">{event.venue.description}</p>
                </div>
              </div>

              <div className="event-sidebar">
                <div className="booking-card card">
                  <h2>Book Tickets</h2>
                  
                  {event.performances.length > 0 ? (
                    <>
                      <div className="form-group">
                        <label htmlFor="performance">Select Date & Time</label>
                        <select 
                          id="performance" 
                          value={selectedPerformance} 
                          onChange={(e) => handlePerformanceChange(e.target.value)}
                        >
                          {event.performances.map(performance => (
                            <option 
                              key={performance._id} 
                              value={performance._id}
                              disabled={performance.isSoldOut || performance.isCancelled}
                            >
                              {formatDate(performance.date)} at {formatTime(performance.startTime)}
                              {performance.isSoldOut && ' - SOLD OUT'}
                              {performance.isCancelled && ' - CANCELLED'}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {selectedPerformance && (
                        <>
                          <div className="ticket-selection">
                            <h3>Select Tickets</h3>
                            {event.performances
                              .find(p => p._id === selectedPerformance)
                              ?.ticketPricing.map(pricing => (
                                <div key={pricing._id} className="ticket-type">
                                  <div className="ticket-info">
                                    <span className="ticket-category">
                                      {pricing.category.charAt(0).toUpperCase() + pricing.category.slice(1)}
                                    </span>
                                    <span className="ticket-price">${pricing.price.toFixed(2)}</span>
                                    <span className="ticket-availability">
                                      {pricing.availableSeats} {pricing.availableSeats === 1 ? 'seat' : 'seats'} available
                                    </span>
                                  </div>
                                  <div className="ticket-quantity">
                                    <button 
                                      className="quantity-btn"
                                      onClick={() => handleTicketChange(pricing.category, 'decrement')}
                                      disabled={selectedTickets[pricing.category] <= 0}
                                    >
                                      -
                                    </button>
                                    <span className="quantity-value">{selectedTickets[pricing.category] || 0}</span>
                                    <button 
                                      className="quantity-btn"
                                      onClick={() => handleTicketChange(pricing.category, 'increment')}
                                      disabled={selectedTickets[pricing.category] >= pricing.availableSeats}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                          
                          {/* Seat Selection Component */}
                          {hasSelectedTickets() && (
                            <SeatSelection
                              performance={event.performances.find(p => p._id === selectedPerformance)!}
                              selectedTickets={selectedTickets}
                              onSeatSelect={handleSeatSelect}
                              selectedSeats={selectedSeats}
                              venue={event.venue}
                            />
                          )}
                          
                          {hasSelectedTickets() && (
                            <div className="ticket-total">
                              <span>Total:</span>
                              <span className="total-price">${calculateTotal().toFixed(2)}</span>
                            </div>
                          )}
                          
                          <button 
                            className="checkout-btn"
                            onClick={handleCheckout}
                            disabled={!hasSelectedTickets() || Object.values(selectedTickets).reduce((sum, quantity) => sum + quantity, 0) !== selectedSeats.length}
                          >
                            Proceed to Checkout
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="no-performances">
                      <p>No performances scheduled at this time.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="container">
          <div className="not-found">
            <h2>Event Not Found</h2>
            <p>The event you're looking for does not exist or has been removed.</p>
            <Link to="/events" className="btn btn-primary">Browse All Events</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage; 