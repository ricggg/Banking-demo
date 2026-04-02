import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import config from '../config';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'checking',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[-\s\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage('');
    setErrors({});

    try {
      // Register user
      const response = await fetch(`${config.API_BASE_URL}/register.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.fullName.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          account_type: formData.accountType,
          phone: formData.phone.trim() || null
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('✅ Account created successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please log in with your credentials.',
              username: formData.username 
            }
          });
        }, 2000);
      } else {
        // Handle specific error cases
        if (data.error) {
          if (data.error.includes('username')) {
            setErrors({ username: 'Username already exists' });
          } else if (data.error.includes('email')) {
            setErrors({ email: 'Email already exists' });
          } else {
            setMessage(`❌ ${data.error}`);
          }
        } else {
          setMessage('❌ Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('❌ Network error. Please check your connection and try again.');
    }

    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <h1>🏦 Skylark Bank</h1>
        <h2>Create Your Account</h2>
        <p>Join thousands of satisfied customers worldwide</p>
      </div>
      
      <form onSubmit={handleSubmit} className="register-form">
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="form-group">
          <input 
            type="text" 
            name="fullName"
            placeholder="Full Name *" 
            value={formData.fullName}
            onChange={handleChange}
            className={errors.fullName ? 'error' : ''}
            required 
          />
          {errors.fullName && <span className="error-text">{errors.fullName}</span>}
        </div>

        <div className="form-group">
          <input 
            type="text" 
            name="username"
            placeholder="Username *" 
            value={formData.username}
            onChange={handleChange}
            className={errors.username ? 'error' : ''}
            required 
          />
          {errors.username && <span className="error-text">{errors.username}</span>}
        </div>

        <div className="form-group">
          <input 
            type="email" 
            name="email"
            placeholder="Email Address *" 
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
            required 
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <input 
            type="tel" 
            name="phone"
            placeholder="Phone Number (Optional)" 
            value={formData.phone}
            onChange={handleChange}
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="error-text">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <select 
            name="accountType"
            value={formData.accountType}
            onChange={handleChange}
            required
          >
            <option value="checking">Checking Account</option>
            <option value="savings">Savings Account</option>
          </select>
        </div>

        <div className="form-group">
          <input 
            type="password" 
            name="password"
            placeholder="Password *" 
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? 'error' : ''}
            required 
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <div className="form-group">
          <input 
            type="password" 
            name="confirmPassword"
            placeholder="Confirm Password *" 
            value={formData.confirmPassword}
            onChange={handleChange}
            className={errors.confirmPassword ? 'error' : ''}
            required 
          />
          {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={loading ? 'loading' : ''}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p>
          <Link to="/">← Back to Home</Link>
        </p>
      </div>

      <style jsx>{`
        .register-container {
          max-width: 400px;
          margin: 2rem auto;
          padding: 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .register-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .register-header h1 {
          color: #1e3c7d;
          margin-bottom: 0.5rem;
          font-size: 1.8rem;
        }

        .register-header h2 {
          color: #333;
          margin-bottom: 0.5rem;
          font-size: 1.4rem;
        }

        .register-header p {
          color: #666;
          font-size: 0.9rem;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .register-form input, 
        .register-form select {
          padding: 12px 16px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: white;
        }

        .register-form input:focus, 
        .register-form select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .register-form input.error, 
        .register-form select.error {
          border-color: #dc3545;
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
        }

        .error-text {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-weight: 500;
          text-align: center;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .register-form button {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .register-form button:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .register-form button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .auth-footer {
          text-align: center;
          margin-top: 2rem;
          color: #666;
        }

        .auth-footer p {
          margin: 0.5rem 0;
        }

        .auth-footer a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }

        .auth-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .register-container {
            margin: 1rem;
            padding: 1.5rem;
          }
          
          .register-header h1 {
            font-size: 1.5rem;
          }
          
          .register-header h2 {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}
