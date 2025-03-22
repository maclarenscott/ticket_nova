const axios = require('axios');

// Base URL for API
const API_URL = 'http://localhost:5001/api';

// Test the health endpoint
async function testHealthEndpoint() {
  try {
    const response = await axios.get(`${API_URL}/health`);
    console.log('Health Endpoint Response:', response.data);
    return true;
  } catch (error) {
    console.error('Health Endpoint Error:', error.response?.data || error.message);
    return false;
  }
}

// Test the dashboard test endpoint
async function testDashboardTestEndpoint() {
  try {
    const response = await axios.get(`${API_URL}/test/dashboard`);
    console.log('Dashboard Test Endpoint Response:', response.data);
    return true;
  } catch (error) {
    console.error('Dashboard Test Endpoint Error:', error.response?.data || error.message);
    return false;
  }
}

// Test the alternative dashboard test endpoint
async function testDashboardTest2Endpoint() {
  try {
    const response = await axios.get(`${API_URL}/test/dashboard2`);
    console.log('Dashboard Test 2 Endpoint Response:', response.data);
    return true;
  } catch (error) {
    console.error('Dashboard Test 2 Endpoint Error:', error.response?.data || error.message);
    return false;
  }
}

// Test the unprotected dashboard endpoint
async function testUnprotectedDashboardEndpoint() {
  try {
    const response = await axios.get(`${API_URL}/dashboard/test-stats`);
    console.log('Unprotected Dashboard Endpoint Response:', response.data);
    return true;
  } catch (error) {
    console.error('Unprotected Dashboard Endpoint Error:', error.response?.data || error.message);
    return false;
  }
}

// Test the real dashboard endpoint
async function testRealDashboardEndpoint() {
  try {
    const response = await axios.get(`${API_URL}/dashboard/stats`);
    console.log('Real Dashboard Endpoint Response:', response.data);
    return true;
  } catch (error) {
    console.error('Real Dashboard Endpoint Error:', error.response?.data || error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('==== Starting API Tests ====');
  
  // Test health endpoint
  const healthCheck = await testHealthEndpoint();
  console.log('Health Check:', healthCheck ? 'PASSED' : 'FAILED');
  
  // Test dashboard test endpoint
  const dashboardTest = await testDashboardTestEndpoint();
  console.log('Dashboard Test:', dashboardTest ? 'PASSED' : 'FAILED');
  
  // Test dashboard test 2 endpoint
  const dashboardTest2 = await testDashboardTest2Endpoint();
  console.log('Dashboard Test 2:', dashboardTest2 ? 'PASSED' : 'FAILED');
  
  // Test unprotected dashboard endpoint
  const unprotectedDashboardTest = await testUnprotectedDashboardEndpoint();
  console.log('Unprotected Dashboard Check:', unprotectedDashboardTest ? 'PASSED' : 'FAILED');
  
  // Test real dashboard endpoint
  const realDashboardTest = await testRealDashboardEndpoint();
  console.log('Real Dashboard Check:', realDashboardTest ? 'PASSED' : 'FAILED');
  
  console.log('==== Tests Completed ====');
}

// Run the tests
runTests(); 