import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import config from '../config';

export default function Login({ onLogin }) {
  var location = useLocation();
  var navigate = useNavigate();
  var formState = useState({ username: '', password: '' });
  var formData = formState[0];
  var setFormData = formState[1];

  var errState = useState({});
  var errors = errState[0];
  var setErrors = errState[1];

  var loadState = useState(false);
  var loading = loadState[0];
  var setLoading = loadState[1];

  var msgState = useState('');
  var message = msgState[0];
  var setMessage = msgState[1];

  var modalState = useState(false);
  var showResetModal = modalState[0];
  var setShowResetModal = modalState[1];

  useEffect(function() {
    if (location.state && location.state.message) {
      setMessage(location.state.message);
      if (location.state.username) {
        setFormData(function(prev) { return Object.assign({}, prev, { username: location.state.username }); });
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  var handleChange = function(e) {
    var name = e.target.name;
    var value = e.target.value;
    setFormData(function(prev) {
      var update = {};
      update[name] = value;
      return Object.assign({}, prev, update);
    });
    if (errors[name]) {
      setErrors(function(prev) {
        var update = {};
        update[name] = '';
        return Object.assign({}, prev, update);
      });
    }
  };

  var validateForm = function() {
    var newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  var handleSubmit = async function(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage('');
    setErrors({});

    try {
      var response = await fetch(config.API_BASE_URL + '/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password
        }),
      });

      var data = await response.json();

      if (response.ok && data.success) {
        var userData = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          full_name: data.user.full_name,
          phone: data.user.phone,
          active: data.user.active,
          created_at: data.user.created_at
        };

        localStorage.setItem('user', JSON.stringify(userData));
        onLogin(userData);
        setMessage('✅ Login successful! Redirecting...');
      } else {
        if (data.error) {
          if (data.error.indexOf('Invalid username') >= 0 || data.error.indexOf('User not found') >= 0) {
            setErrors({ username: 'Username not found' });
          } else if (data.error.indexOf('Invalid password') >= 0 || data.error.indexOf('password') >= 0) {
            setErrors({ password: 'Incorrect password' });
          } else if (data.error.indexOf('account is disabled') >= 0 || data.error.indexOf('inactive') >= 0) {
            setMessage('❌ Your account has been disabled. Please contact support.');
          } else {
            setMessage('❌ ' + data.error);
          }
        } else {
          setMessage('❌ Login failed. Please check your credentials.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('❌ Network error. Please check your connection and try again.');
    }

    setLoading(false);
  };

  var handleForgotPassword = function(e) {
    e.preventDefault();
    setShowResetModal(true);
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h1>🏦 Skylark Bank</h1>
        <h2>Sign In to Your Account</h2>
        <p>Secure access to your financial dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        {message && (
          <div className={'message ' + (message.indexOf('✅') >= 0 ? 'success' : 'error')}>
            {message}
          </div>
        )}

        <div className="form-group">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className={errors.username ? 'error' : ''}
            required
          />
          {errors.username && <span className="error-text">{errors.username}</span>}
        </div>

        <div className="form-group">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? 'error' : ''}
            required
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        {/* Forgot Password Link */}
        <div className="forgot-password-row">
          <a href="#" onClick={handleForgotPassword} className="forgot-password-link">
            🔒 Forgot Password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={loading ? 'loading' : ''}
        >
          {loading ? (
            <React.Fragment>
              <span className="spinner"></span>
              Signing In...
            </React.Fragment>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
        <p>
          <Link to="/">← Back to Home</Link>
        </p>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={function() { setShowResetModal(false); }}>
          <div className="modal-content" onClick={function(e) { e.stopPropagation(); }}>
            <div className="modal-icon">🔐</div>
            <h3 className="modal-title">Account Recovery</h3>
            <p className="modal-text">
              For your security, password resets are handled by our support team.
              Please contact us through one of the following channels:
            </p>

            <div className="modal-info-cards">
              <div className="modal-info-card">
                <span className="modal-info-icon">📧</span>
                <div>
                  <div className="modal-info-label">Email Support</div>
                  <div className="modal-info-value">support@skylarkcb.com</div>
                </div>
              </div>
              <div className="modal-info-card">
                <span className="modal-info-icon">📞</span>
                <div>
                  <div className="modal-info-label">Phone Support</div>
                  <div className="modal-info-value">1-708-667-6099</div>
                </div>
              </div>
              <div className="modal-info-card">
                <span className="modal-info-icon">💬</span>
                <div>
                  <div className="modal-info-label">Live Chat</div>
                  <div className="modal-info-value">Available 24/7 on our website</div>
                </div>
              </div>
            </div>

            <div className="modal-note">
              <span className="modal-note-icon">🛡️</span>
              <span>Please have your account details and a valid ID ready for verification.</span>
            </div>

            <button
              className="modal-close-btn"
              onClick={function() { setShowResetModal(false); }}
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      <style>{`
        .login-container {
          max-width: 420px;
          margin: 2rem auto;
          padding: 2.5rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          position: relative;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header h1 {
          color: #1e3c7d;
          margin-bottom: 0.5rem;
          font-size: 1.8rem;
        }

        .login-header h2 {
          color: #333;
          margin-bottom: 0.5rem;
          font-size: 1.4rem;
        }

        .login-header p {
          color: #666;
          font-size: 0.9rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .login-form input {
          padding: 12px 16px;
          border: 2px solid #e1e5e9;
          border-radius: 10px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: white;
        }

        .login-form input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
        }

        .login-form input.error {
          border-color: #dc3545;
          box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.08);
        }

        .error-text {
          color: #dc3545;
          font-size: 0.85rem;
          margin-top: 0.25rem;
          font-weight: 500;
        }

        .message {
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 0.5rem;
          font-weight: 500;
          text-align: center;
          font-size: 14px;
          animation: fadeSlideUp 0.3s ease;
        }

        .message.success {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .message.error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* Forgot Password */
        .forgot-password-row {
          text-align: right;
          margin-top: -4px;
          margin-bottom: 4px;
        }

        .forgot-password-link {
          color: #6b7280;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .forgot-password-link:hover {
          color: #2563eb;
          text-decoration: none;
        }

        .login-form button[type="submit"] {
          background: linear-gradient(135deg, #1e3c7d, #2563eb);
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          box-shadow: 0 4px 15px rgba(37, 99, 235, 0.25);
        }

        .login-form button[type="submit"]:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.35);
        }

        .login-form button[type="submit"]:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes modalPop {
          0% { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }

        .auth-footer {
          text-align: center;
          margin-top: 2rem;
          color: #666;
        }

        .auth-footer p {
          margin: 0.5rem 0;
          font-size: 14px;
        }

        .auth-footer a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
        }

        .auth-footer a:hover {
          text-decoration: underline;
        }

        /* ═══ Password Reset Modal ═══ */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: fadeSlideUp 0.2s ease;
        }

        .modal-content {
          background: #fff;
          border-radius: 24px;
          padding: 36px;
          max-width: 440px;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
          animation: modalPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
        }

        .modal-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1e3c7d, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 36px;
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.35);
        }

        .modal-title {
          font-size: 22px;
          font-weight: 800;
          color: #1a1a2a;
          margin: 0 0 10px;
        }

        .modal-text {
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 0 24px;
        }

        .modal-info-cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .modal-info-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: #f8fafc;
          border: 1px solid #e8ecf0;
          border-radius: 14px;
          text-align: left;
          transition: all 0.2s ease;
        }

        .modal-info-card:hover {
          border-color: #2563eb;
          background: #f0f7ff;
          transform: translateX(4px);
        }

        .modal-info-icon {
          font-size: 24px;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(37,99,235,0.1), rgba(30,60,125,0.08));
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-info-label {
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .modal-info-value {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a2a;
        }

        .modal-note {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 12px;
          margin-bottom: 24px;
          text-align: left;
          font-size: 12px;
          color: #92400e;
          font-weight: 500;
          line-height: 1.5;
        }

        .modal-note-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .modal-close-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #1e3c7d, #2563eb);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
          transition: all 0.2s ease;
        }

        .modal-close-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
        }

        @media (max-width: 480px) {
          .login-container {
            margin: 1rem;
            padding: 1.5rem;
          }

          .login-header h1 {
            font-size: 1.5rem;
          }

          .login-header h2 {
            font-size: 1.2rem;
          }

          .modal-content {
            padding: 28px 24px;
          }

          .modal-icon {
            width: 64px;
            height: 64px;
            font-size: 28px;
          }

          .modal-title {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}