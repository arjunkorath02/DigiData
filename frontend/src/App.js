import React, { useState, useEffect } from 'react';
import './App.css';
import { LoginPage, Dashboard } from './components';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// Simple API service for auth check
const checkAuthToken = async () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      localStorage.removeItem('token');
      return null;
    }
  } catch (error) {
    localStorage.removeItem('token');
    return null;
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthToken().then(userData => {
      if (userData) {
        setUser(userData);
      }
      setLoading(false);
    });
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;