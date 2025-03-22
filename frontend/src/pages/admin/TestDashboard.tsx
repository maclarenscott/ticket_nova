import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface DashboardTestData {
  totalEvents?: number;
  activeEvents?: number;
  totalTickets?: number;
  totalUsers?: number;
}

const TestDashboard: React.FC = () => {
  const [testData, setTestData] = useState<DashboardTestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true);
        
        // Try original test endpoint
        const response = await axios.get('/api/test/dashboard');
        console.log('Original Test API response:', response.data);
        
        // Try our unprotected dashboard endpoint
        const response2 = await axios.get('/api/dashboard/test-stats');
        console.log('Unprotected Dashboard API response:', response2.data);
        
        // Use the unprotected dashboard data for display
        setTestData(response2.data.data);
        setError(null);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching test data:', err.response?.data || err.message);
        setError('Failed to load test data');
        setLoading(false);
      }
    };

    fetchTestData();
  }, []);

  if (loading) {
    return <div>Loading test data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard Test Page</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold">Total Events</h2>
          <p className="text-3xl mt-2">{testData?.totalEvents || 0}</p>
        </div>
        
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold">Active Events</h2>
          <p className="text-3xl mt-2">{testData?.activeEvents || 0}</p>
        </div>
        
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold">Total Tickets</h2>
          <p className="text-3xl mt-2">{testData?.totalTickets || 0}</p>
        </div>
        
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold">Total Users</h2>
          <p className="text-3xl mt-2">{testData?.totalUsers || 0}</p>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Complete API Response:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(testData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestDashboard; 