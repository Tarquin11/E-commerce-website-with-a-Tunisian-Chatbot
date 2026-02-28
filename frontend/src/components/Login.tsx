import React, { useState } from 'react';
import { LoginCredentials, User } from '../types';
import { login } from '../api/api';

interface LoginProps {
  setToken: (token: string, user: User) => void;
}
const Login: React.FC<LoginProps> = ({ setToken }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await login(credentials);
      console.log('[LOGIN_FORM] Response:', response);
      const loginResponse = response as any;
      if (loginResponse.token && loginResponse.user) {
        console.log('[LOGIN_FORM] Login successful, calling setToken');
        setSuccess('Login successful');
        setError(null);
        setToken(loginResponse.token, loginResponse.user);
      } else {
        setError(loginResponse.message || 'Login failed');
        setSuccess(null);
      }
    } catch (err) {
      setError('An error occurred during login');
      setSuccess(null);
      console.error('Login error:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="login-container">
      <div className="card form-card">
        <h2 className="text-center">Sign in to your account</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              className="form-control"
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              className="form-control"
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <div className="my-4">
            <button type="submit" className="btn btn-primary">Login</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;