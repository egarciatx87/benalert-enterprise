import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get('http://127.0.0.1:5000/api/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Session expired or invalid token');
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post('http://127.0.0.1:5000/api/auth/login', {
      email,
      password,
    });
    const { token: jwtToken, user: userData } = response.data;

    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
    return response.data;
  };

  const register = async (email, password) => {
    const response = await axios.post('http://127.0.0.1:5000/api/auth/register', {
      email,
      password,
    });
    const { token: jwtToken, user: userData } = response.data;

    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};