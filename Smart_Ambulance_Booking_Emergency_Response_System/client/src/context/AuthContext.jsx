import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setUser(res.data.user);
        })
        .catch(err => {
          console.error('Auth verification failed', err);
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password, role) => {
    const res = await axios.post('/api/auth/login', { email, password, role });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('token', res.data.token);
    return res.data.user;
  };

  const register = async (userData) => {
    const res = await axios.post('/api/auth/register', userData);
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('token', res.data.token);
    return res.data.user;
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
  };

  // Quick role override helper for presentation/testing demo
  const switchDemoRole = async (targetRole, customEmail) => {
    let email = customEmail;
    if (!email) {
      if (targetRole === 'patient') email = 'patient@emergency.com';
      if (targetRole === 'driver') email = 'driver1@ambulance.com';
      if (targetRole === 'admin') email = 'admin@hospital.com';
    }
    return await login(email, 'password123', targetRole);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};
