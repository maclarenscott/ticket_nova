import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextProps {
  user: User | null;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

// Utility to set the auth token in axios headers
const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log("Token set in axios headers:", token.substring(0, 15) + "...");
  } else {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    console.log("Token removed from axios headers");
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthState, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define isAuthenticated as a function that returns a boolean
  const isAuthenticated = () => {
    console.log("isAuthenticated called, current state:", isAuthState);
    return isAuthState;
  };
  
  // Define isAdmin function
  const isAdmin = () => {
    const result = !!user && user.role === 'Admin';
    console.log("isAdmin check:", { result, userRole: user?.role });
    return result;
  };
  
  // Define isManager function
  const isManager = () => {
    const result = !!user && (user.role === 'Manager' || user.role === 'Admin');
    console.log("isManager check:", { result, userRole: user?.role });
    return result;
  };

  // Load user if token exists in localStorage
  useEffect(() => {
    const loadUser = async () => {
      console.log('Attempting to load user from token');
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, skipping user load');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Set token in axios headers
      setAuthToken(token);
      
      try {
        const res = await axios.get('/api/auth/me');
        console.log('User data response:', res.data);
        
        // Handle different response structures
        const userData = res.data.user || (res.data.data && res.data.data.user) || res.data;
        
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
          console.log('User loaded successfully:', userData);
        } else {
          console.log('User data not found in response');
          setAuthToken(null);
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err: any) {
        console.error('Error loading user:', err.response?.data || err.message);
        setAuthToken(null);
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('Attempting login with email:', email);
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      console.log('Login response:', res.data);
      
      // Check if response has the expected structure
      if (res.data.status === 'success' && res.data.data) {
        // Get token from response
        const token = res.data.data.token;
        if (!token) {
          throw new Error('No token received from server');
        }
        
        // Set token in localStorage and axios headers
        setAuthToken(token);
        
        // Get user data from response
        const userData = res.data.data.user;
        if (!userData) {
          throw new Error('No user data received from server');
        }
        
        setUser(userData);
        setIsAuthenticated(true);
        console.log('Login successful for user:', userData);
      } else {
        // Handle unexpected response structure
        console.error('Unexpected API response structure:', res.data);
        throw new Error('Unexpected response from server');
      }
    } catch (err: any) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || 'Failed to login. Please check your credentials.');
    }
    
    setIsLoading(false);
  };

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    console.log('Attempting registration for email:', email);
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await axios.post('/api/auth/register', { firstName, lastName, email, password });
      console.log('Registration response:', res.data);
      
      // Get token from response
      const token = res.data.token;
      if (!token) {
        throw new Error('No token received from server');
      }
      
      // Set token in localStorage and axios headers
      setAuthToken(token);
      
      // Get user data from response
      const userData = res.data.user || (res.data.data && res.data.data.user);
      if (!userData) {
        throw new Error('No user data received from server');
      }
      
      setUser(userData);
      setIsAuthenticated(true);
      console.log('Registration successful for user:', userData);
    } catch (err: any) {
      console.error('Registration error:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || 'Failed to register. Please try again.');
    }
    
    setIsLoading(false);
  };

  const logout = () => {
    // Clear authentication state
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
    console.log('User logged out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isManager,
        isLoading,
        error,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext; 