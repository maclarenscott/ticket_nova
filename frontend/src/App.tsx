import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/routing/PrivateRoute';
import Navbar from './components/navigation/Navbar';
import Footer from './components/navigation/Footer';
import HomePage from './pages/home/HomePage';
import EventsPage from './pages/events/EventsPage';
import EventDetailPage from './pages/events/EventDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import MyTicketsPage from './pages/tickets/MyTicketsPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import NotFoundPage from './pages/errors/NotFoundPage';
import UnauthorizedPage from './pages/errors/UnauthorizedPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import EventsManagement from './pages/admin/EventsManagement';
import EventForm from './pages/admin/EventForm';
import TestDashboard from './pages/admin/TestDashboard';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/test-dashboard" element={<TestDashboard />} />
              
              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/my-tickets" element={<MyTicketsPage />} />
                <Route path="/tickets/:id" element={<TicketDetailPage />} />
                <Route path="/checkout/:eventId/:performanceId" element={<CheckoutPage />} />
              </Route>
              
              {/* Admin Routes */}
              <Route element={<PrivateRoute allowedRoles={['Admin', 'Manager']} />}>
                <Route path="/admin/*" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="events" element={<EventsManagement />} />
                  <Route path="events/new" element={<EventForm />} />
                  <Route path="events/edit/:id" element={<EventForm />} />
                  <Route path="performances" element={<div>Performances Management</div>} />
                  <Route path="tickets" element={<div>Tickets Management</div>} />
                  <Route path="users" element={<div>Users Management</div>} />
                  <Route path="reports" element={<div>Reports</div>} />
                  <Route path="settings" element={<div>Settings</div>} />
                </Route>
              </Route>
              
              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
