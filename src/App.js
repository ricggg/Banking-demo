import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import './App.css';

// Loading component
function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-text">Loading...</div>
    </div>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <div className="error-content">
            <h1>🏦 Skylark Bank</h1>
            <h2>Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Home/Landing Page Component
function HomePage({ user, onNavigate }) {
  useEffect(() => {
    if (user) {
      onNavigate('/app/dashboard');
    }
  }, [user, onNavigate]);

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>🏦 Skylark Bank</h1>
        <h2>Your Trusted Financial Partner</h2>
        <p>Experience secure, modern banking with cutting-edge technology</p>
      </div>
      
      <div className="home-features">
        <div className="feature-highlight">
          <div className="feature-icon">🔒</div>
          <h3>Secure Banking</h3>
          <p>Bank-grade security with 256-bit SSL encryption</p>
        </div>
        <div className="feature-highlight">
          <div className="feature-icon">🌐</div>
          <h3>Global Access</h3>
          <p>Access your account from anywhere in the world</p>
        </div>
        <div className="feature-highlight">
          <div className="feature-icon">📱</div>
          <h3>Mobile Ready</h3>
          <p>Optimized for all devices and screen sizes</p>
        </div>
      </div>

      <div className="home-actions">
        <button 
          onClick={() => onNavigate('/app/login')}
          className="btn btn-primary"
        >
          Sign In to Your Account
        </button>
        <button 
          onClick={() => onNavigate('/app/register')}
          className="btn btn-secondary"
        >
          Open New Account
        </button>
      </div>

      <div className="home-footer">
        <p>&copy; 2024 Skylark Bank. All rights reserved.</p>
        <p>FDIC Insured | Equal Housing Lender</p>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children, user, redirectTo = "/login" }) {
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

// Public Route Component
function PublicRoute({ children, user, redirectTo = "/dashboard" }) {
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log('Restored user session:', userData);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = (userData) => {
    console.log('Login successful:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    console.log('Logging out user');
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('darkMode');
    // ← FIXED: redirect to /app/ not /
    window.location.href = '/index.html';
  };

  const handleNavigate = (path) => {
    window.location.href = path;
  };

  if (initializing || loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      {/* ← ONLY CHANGE: added basename="/app" */}
      <Router basename="/app">
        <div className="App">
          <AppContent 
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

// App Content Component
function AppContent({ user, onLogin, onLogout, onNavigate }) {
  const location = useLocation();

  useEffect(() => {
    const page = location.pathname.split('/')[1] || 'home';
    document.body.className = `page-${page}`;
    
    const titles = {
      '': 'Skylark Bank - Your Trusted Financial Partner',
      'login': 'Sign In - Skylark Bank',
      'register': 'Create Account - Skylark Bank',
      'dashboard': 'Dashboard - Skyskylark Bank'
    };
    
    document.title = titles[page] || 'Skylark Bank';
    
    return () => {
      document.body.className = '';
    };
  }, [location]);

  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error('Global error:', event.error);
    };

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <Routes>
      {/* Home/Landing Page */}
      <Route 
        path="/" 
        element={
          <PublicRoute user={user}>
            <HomePage user={user} onNavigate={onNavigate} />
          </PublicRoute>
        } 
      />

      {/* Login Page */}
      <Route 
        path="/login" 
        element={
          <PublicRoute user={user}>
            <Login onLogin={onLogin} />
          </PublicRoute>
        } 
      />

      {/* Register Page */}
      <Route 
        path="/register" 
        element={
          <PublicRoute user={user}>
            <Register />
          </PublicRoute>
        } 
      />

      {/* Dashboard - Protected Route */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute user={user}>
            <Dashboard user={user} onLogout={onLogout} />
          </ProtectedRoute>
        } 
      />

      {/* 404 Page */}
      <Route 
        path="*" 
        element={<NotFoundPage onNavigate={onNavigate} />} 
      />
    </Routes>
  );
}

// 404 Not Found Page
function NotFoundPage({ onNavigate }) {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>🏦 Skylark Bank</h1>
        <div className="error-code">404</div>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div className="not-found-actions">
          <button 
            onClick={() => onNavigate('/app/')}
            className="btn btn-primary"
          >
            Go to Home
          </button>
          <button 
            onClick={() => onNavigate('/app/login')}
            className="btn btn-secondary"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;