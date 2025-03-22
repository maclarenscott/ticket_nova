import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import '../../styles/AdminDashboard.css';

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalTickets: number;
  totalSales: number;
  upcomingPerformances: number;
  totalUsers: number;
}

interface RecentTicket {
  id: string;
  eventName: string;
  customerName: string;
  purchaseDate: string;
  price: number;
  status: string;
}

interface SystemStatus {
  database: string;
  api: string;
  paymentGateway: string;
  emailService: string;
  lastBackup: string;
}

const AdminDashboard: React.FC = () => {
  const { isAuthenticated, user } = React.useContext(AuthContext);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from the dashboard endpoints directly
        const statsResponse = await axios.get('/api/dashboard/stats');
        console.log('Stats response:', statsResponse.data);
        setStats(statsResponse.data.data);
        
        const ticketsResponse = await axios.get('/api/dashboard/recent-tickets');
        console.log('Tickets response:', ticketsResponse.data);
        setRecentTickets(ticketsResponse.data.data);
        
        const statusResponse = await axios.get('/api/dashboard/system-status');
        console.log('System status response:', statusResponse.data);
        setSystemStatus(statusResponse.data.data);
        
        setLoading(false);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err.response?.data || err.message);
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="spinner"></div>
        <p className="text-center">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h1>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Events</h3>
          <p className="stat-value">{stats?.totalEvents}</p>
          <Link to="/admin/events" className="stat-link">View all events</Link>
        </div>
        
        <div className="stat-card">
          <h3>Active Events</h3>
          <p className="stat-value">{stats?.activeEvents}</p>
          <Link to="/admin/events" className="stat-link">Manage events</Link>
        </div>
        
        <div className="stat-card">
          <h3>Total Tickets</h3>
          <p className="stat-value">{stats?.totalTickets}</p>
          <Link to="/admin/tickets" className="stat-link">View all tickets</Link>
        </div>
        
        <div className="stat-card highlight">
          <h3>Total Sales</h3>
          <p className="stat-value">${stats?.totalSales.toLocaleString()}</p>
          <Link to="/admin/reports" className="stat-link">View sales report</Link>
        </div>
        
        <div className="stat-card">
          <h3>Upcoming Performances</h3>
          <p className="stat-value">{stats?.upcomingPerformances}</p>
          <Link to="/admin/performances" className="stat-link">View schedule</Link>
        </div>
        
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-value">{stats?.totalUsers}</p>
          <Link to="/admin/users" className="stat-link">Manage users</Link>
        </div>
      </div>
      
      <div className="dashboard-row">
        <div className="dashboard-column">
          <div className="card">
            <div className="card-header">
              <h2>Recent Tickets</h2>
              <Link to="/admin/tickets" className="view-all">View all</Link>
            </div>
            
            <div className="recent-tickets">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Event</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.length > 0 ? (
                    recentTickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>{ticket.id}</td>
                        <td>{ticket.eventName}</td>
                        <td>{ticket.customerName}</td>
                        <td>{new Date(ticket.purchaseDate).toLocaleDateString()}</td>
                        <td>${ticket.price}</td>
                        <td>
                          <span className={`status ${ticket.status.toLowerCase()}`}>
                            {ticket.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center">No recent tickets found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="dashboard-column">
          <div className="card">
            <div className="card-header">
              <h2>Quick Actions</h2>
            </div>
            
            <div className="quick-actions">
              <Link to="/admin/events/new" className="action-button">
                Create New Event
              </Link>
              <Link to="/admin/performances/new" className="action-button">
                Add Performance
              </Link>
              <Link to="/admin/users/new" className="action-button">
                Add User
              </Link>
              <Link to="/admin/reports/sales" className="action-button">
                View Sales Report
              </Link>
              <Link to="/admin/settings" className="action-button">
                System Settings
              </Link>
            </div>
          </div>
          
          <div className="card mt-3">
            <div className="card-header">
              <h2>System Status</h2>
            </div>
            
            <div className="system-status">
              {systemStatus && (
                <>
                  <p className="status-item">
                    <span className="status-label">Database:</span>
                    <span className="status-value">
                      <span className={`status-indicator ${systemStatus.database}`}></span> 
                      {systemStatus.database === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </p>
                  <p className="status-item">
                    <span className="status-label">API:</span>
                    <span className="status-value">
                      <span className={`status-indicator ${systemStatus.api}`}></span> 
                      {systemStatus.api === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </p>
                  <p className="status-item">
                    <span className="status-label">Payment Gateway:</span>
                    <span className="status-value">
                      <span className={`status-indicator ${systemStatus.paymentGateway}`}></span> 
                      {systemStatus.paymentGateway === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </p>
                  <p className="status-item">
                    <span className="status-label">Email Service:</span>
                    <span className="status-value">
                      <span className={`status-indicator ${systemStatus.emailService}`}></span> 
                      {systemStatus.emailService === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </p>
                  <p className="status-item">
                    <span className="status-label">Last Backup:</span>
                    <span className="status-value">
                      {new Date(systemStatus.lastBackup).toLocaleString()}
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 