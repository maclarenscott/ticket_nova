import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useFormik, Formik } from 'formik';
import * as Yup from 'yup';
import AuthContext from '../../context/AuthContext';
import '../../styles/Checkout.css';

interface TicketSummaryItem {
  category: string;
  quantity: number;
  pricePerTicket: number;
  seats?: Array<{
    section: string;
    row: string;
    seat: string;
  }>;
}

interface LocationState {
  eventId: string;
  performanceId: string;
  tickets: { [key: string]: number };
  selectedSeats: Array<{
    section: string;
    row: string;
    seat: string;
    category: string;
  }>;
  total: number;
}

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketSummary, setTicketSummary] = useState<TicketSummaryItem[]>([]);
  const [processing, setProcessing] = useState<boolean>(false);
  const [orderConfirmed, setOrderConfirmed] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Define validation schema for checkout form
  const validationSchema = Yup.object({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    cardNumber: Yup.string()
      .required('Card number is required')
      .matches(/^\d{16}$/, 'Card number must be 16 digits'),
    expiryMonth: Yup.string()
      .required('Expiry month is required')
      .matches(/^(0[1-9]|1[0-2])$/, 'Must be valid month (01-12)'),
    expiryYear: Yup.string()
      .required('Expiry year is required')
      .matches(/^\d{2}$/, 'Must be valid 2-digit year'),
    cvv: Yup.string()
      .required('CVV is required')
      .matches(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
    billingAddress: Yup.object().shape({
      street: Yup.string().required('Street address is required'),
      city: Yup.string().required('City is required'),
      state: Yup.string().required('State is required'),
      zipCode: Yup.string().required('ZIP code is required'),
      country: Yup.string().required('Country is required'),
    }),
  });

  // Initialize form with Formik
  const formik = useFormik({
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      billingAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
      },
    },
    validationSchema,
    onSubmit: handleSubmit,
  });

  // Load event and performance details
  useEffect(() => {
    const state = location.state as LocationState;
    
    if (!state || !state.eventId || !state.performanceId) {
      setError('Invalid checkout session. Please try booking again.');
      setLoading(false);
      return;
    }

    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/events/${state.eventId}`);
        setEvent(response.data.event);
        
        // Find the specific performance
        const performanceData = response.data.event.performances.find(
          (p: any) => p._id === state.performanceId
        );
        
        if (!performanceData) {
          throw new Error('Performance not found');
        }
        
        setPerformance(performanceData);
        
        // Generate ticket summary with selected seats grouped by category
        const summary: TicketSummaryItem[] = [];
        Object.entries(state.tickets).forEach(([category, quantity]) => {
          if (quantity > 0) {
            const pricing = performanceData.ticketPricing.find(
              (p: any) => p.category === category
            );
            
            if (pricing) {
              // Get all seats for this category
              const categorySeats = state.selectedSeats
                .filter(seat => seat.category === category)
                .map(seat => ({
                  section: seat.section,
                  row: seat.row,
                  seat: seat.seat
                }));
              
              summary.push({
                category,
                quantity,
                pricePerTicket: pricing.price,
                seats: categorySeats
              });
            }
          }
        });
        
        setTicketSummary(summary);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details. Please try again later.');
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [location.state]);

  // Handle form submission
  async function handleSubmit(values: any) {
    try {
      const state = location.state as LocationState;
      
      if (!state || !state.eventId || !state.performanceId) {
        setError('Invalid checkout session. Please try booking again.');
        return;
      }
      
      setProcessing(true);
      
      // Process payment first
      const paymentData = {
        amount: state.total,
        currency: 'USD',
        paymentMethod: {
          cardNumber: values.cardNumber,
          expiryMonth: values.expiryMonth,
          expiryYear: values.expiryYear,
          cvv: values.cvv,
          billingAddress: values.billingAddress
        }
      };
      
      // Make payment request
      const paymentResponse = await axios.post('/api/payments', paymentData);
      
      if (!paymentResponse.data.success) {
        throw new Error('Payment failed');
      }
      
      // Create order with tickets
      const orderPayload = {
        paymentId: paymentResponse.data.payment._id,
        eventId: state.eventId,
        performanceId: state.performanceId,
        tickets: state.selectedSeats.map(seat => ({
          category: seat.category,
          section: seat.section,
          row: seat.row,
          seatNumber: seat.seat,
          price: ticketSummary.find(item => item.category === seat.category)?.pricePerTicket || 0
        })),
        customerDetails: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email
        }
      };
      
      // Submit order
      const orderResponse = await axios.post('/api/orders', orderPayload);
      
      // Set order confirmed and store ID
      setOrderConfirmed(true);
      setOrderId(orderResponse.data.order._id);
      setProcessing(false);
      
      // Clean up location state to prevent accidental resubmission
      window.history.replaceState({}, document.title);
      
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Payment processing failed. Please try again or contact support.');
      setProcessing(false);
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="checkout-page loading-state">
          <div className="loading">Loading checkout details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="checkout-page error-state">
          <div className="error">
            <h2>Error</h2>
            <p>{error}</p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orderConfirmed) {
    return (
      <div className="container">
        <div className="checkout-page confirmation-state">
          <div className="order-confirmation">
            <div className="confirmation-icon">✓</div>
            <h2>Order Confirmed!</h2>
            <p>Thank you for your purchase. Your tickets have been booked successfully.</p>
            <div className="confirmation-details">
              <p><strong>Order ID:</strong> {orderId}</p>
              <p><strong>Event:</strong> {event?.title}</p>
              <p><strong>Date:</strong> {formatDate(performance?.date)} at {formatTime(performance?.startTime)}</p>
              <p>A confirmation email has been sent to {formik.values.email}</p>
            </div>
            <div className="confirmation-actions">
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/tickets/my-tickets')}
              >
                View My Tickets
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate('/')}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="checkout-page">
        <div className="checkout-header">
          <h1>Complete Your Purchase</h1>
        </div>
        
        <div className="checkout-content">
          <div className="order-summary">
            <div className="event-details card">
              <h2>Event Details</h2>
              {event && (
                <>
                  <h3>{event.title}</h3>
                  <p className="event-meta">
                    <span className="event-date">
                      {formatDate(performance?.date)} at {formatTime(performance?.startTime)}
                    </span>
                    <span className="event-venue">{event.venue.name}</span>
                  </p>
                </>
              )}
            </div>
            
            <div className="ticket-summary card">
              <h2>Ticket Summary</h2>
              <div className="tickets-list">
                {ticketSummary.map((item, index) => (
                  <div key={index} className="ticket-item">
                    <div className="ticket-info">
                      <span className="ticket-category">
                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                      </span>
                      <span className="ticket-quantity">× {item.quantity}</span>
                      <span className="ticket-price">{formatCurrency(item.pricePerTicket)} each</span>
                    </div>
                    
                    {item.seats && item.seats.length > 0 && (
                      <div className="ticket-seats">
                        <h4>Selected Seats</h4>
                        <ul>
                          {item.seats.map((seat, seatIndex) => (
                            <li key={seatIndex}>
                              {seat.section} - Row {seat.row}, Seat {seat.seat}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="order-total">
                <span>Total:</span>
                <span className="total-price">
                  {formatCurrency((location.state as LocationState)?.total || 0)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="payment-form card">
            <h2>Payment Information</h2>
            <form onSubmit={formik.handleSubmit}>
              <div className="form-section">
                <h3>Customer Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.firstName}
                      className={formik.touched.firstName && formik.errors.firstName ? 'error' : ''}
                    />
                    {formik.touched.firstName && formik.errors.firstName && (
                      <div className="error-message">{formik.errors.firstName}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.lastName}
                      className={formik.touched.lastName && formik.errors.lastName ? 'error' : ''}
                    />
                    {formik.touched.lastName && formik.errors.lastName && (
                      <div className="error-message">{formik.errors.lastName}</div>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.email}
                    className={formik.touched.email && formik.errors.email ? 'error' : ''}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <div className="error-message">{formik.errors.email}</div>
                  )}
                </div>
              </div>
              
              <div className="form-section">
                <h3>Card Details</h3>
                <div className="form-group">
                  <label htmlFor="cardNumber">Card Number</label>
                  <input
                    id="cardNumber"
                    name="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.cardNumber}
                    className={formik.touched.cardNumber && formik.errors.cardNumber ? 'error' : ''}
                  />
                  {formik.touched.cardNumber && formik.errors.cardNumber && (
                    <div className="error-message">{formik.errors.cardNumber}</div>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="expiryMonth">Expiry Month</label>
                    <input
                      id="expiryMonth"
                      name="expiryMonth"
                      type="text"
                      placeholder="MM"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.expiryMonth}
                      className={formik.touched.expiryMonth && formik.errors.expiryMonth ? 'error' : ''}
                    />
                    {formik.touched.expiryMonth && formik.errors.expiryMonth && (
                      <div className="error-message">{formik.errors.expiryMonth}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="expiryYear">Expiry Year</label>
                    <input
                      id="expiryYear"
                      name="expiryYear"
                      type="text"
                      placeholder="YY"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.expiryYear}
                      className={formik.touched.expiryYear && formik.errors.expiryYear ? 'error' : ''}
                    />
                    {formik.touched.expiryYear && formik.errors.expiryYear && (
                      <div className="error-message">{formik.errors.expiryYear}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="cvv">CVV</label>
                    <input
                      id="cvv"
                      name="cvv"
                      type="text"
                      placeholder="123"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.cvv}
                      className={formik.touched.cvv && formik.errors.cvv ? 'error' : ''}
                    />
                    {formik.touched.cvv && formik.errors.cvv && (
                      <div className="error-message">{formik.errors.cvv}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3>Billing Address</h3>
                <div className="form-group">
                  <label htmlFor="billingAddress.street">Street Address</label>
                  <input
                    id="billingAddress.street"
                    name="billingAddress.street"
                    type="text"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.billingAddress.street}
                    className={
                      formik.touched.billingAddress?.street && formik.errors.billingAddress?.street
                        ? 'error'
                        : ''
                    }
                  />
                  {formik.touched.billingAddress?.street && formik.errors.billingAddress?.street && (
                    <div className="error-message">{formik.errors.billingAddress.street}</div>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="billingAddress.city">City</label>
                    <input
                      id="billingAddress.city"
                      name="billingAddress.city"
                      type="text"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.billingAddress.city}
                      className={
                        formik.touched.billingAddress?.city && formik.errors.billingAddress?.city
                          ? 'error'
                          : ''
                      }
                    />
                    {formik.touched.billingAddress?.city && formik.errors.billingAddress?.city && (
                      <div className="error-message">{formik.errors.billingAddress.city}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="billingAddress.state">State</label>
                    <input
                      id="billingAddress.state"
                      name="billingAddress.state"
                      type="text"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.billingAddress.state}
                      className={
                        formik.touched.billingAddress?.state && formik.errors.billingAddress?.state
                          ? 'error'
                          : ''
                      }
                    />
                    {formik.touched.billingAddress?.state && formik.errors.billingAddress?.state && (
                      <div className="error-message">{formik.errors.billingAddress.state}</div>
                    )}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="billingAddress.zipCode">ZIP Code</label>
                    <input
                      id="billingAddress.zipCode"
                      name="billingAddress.zipCode"
                      type="text"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.billingAddress.zipCode}
                      className={
                        formik.touched.billingAddress?.zipCode && formik.errors.billingAddress?.zipCode
                          ? 'error'
                          : ''
                      }
                    />
                    {formik.touched.billingAddress?.zipCode && formik.errors.billingAddress?.zipCode && (
                      <div className="error-message">{formik.errors.billingAddress.zipCode}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="billingAddress.country">Country</label>
                    <select
                      id="billingAddress.country"
                      name="billingAddress.country"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.billingAddress.country}
                      className={
                        formik.touched.billingAddress?.country && formik.errors.billingAddress?.country
                          ? 'error'
                          : ''
                      }
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                      <option value="Other">Other</option>
                    </select>
                    {formik.touched.billingAddress?.country && formik.errors.billingAddress?.country && (
                      <div className="error-message">{formik.errors.billingAddress.country}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="checkout-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate(-1)}
                  disabled={processing}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Complete Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage; 