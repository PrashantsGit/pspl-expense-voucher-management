import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = await login(username, password);
      if (user.role === 'ROLE_DIRECTOR') {
        navigate('/director/dashboard');
      } else if (user.role === 'ROLE_ACCOUNTS') {
        navigate('/accounts/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to login. Please verify your credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="login-card-wrapper py-2">
      {/* Brand Header */}
      <div className="text-center mb-4">
        <div
          className="sidebar-brand-icon mx-auto mb-3 shadow-sm"
          style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}
        >
          <i className="bi bi-wallet2"></i>
        </div>
        <h3 className="fw-bold text-dark mb-1">Prachay Securities</h3>
        <p className="text-muted small mb-0">
          Expense Voucher Management System (PSPL)
        </p>
      </div>

      {/* Login Card */}
      <div className="card shadow-sm border-0 mb-3 bg-white">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
            <h5 className="card-title fw-bold text-dark mb-0">Sign In</h5>
            <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
              Enterprise Portal
            </span>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2 p-2.5 mb-3 small"
              role="alert"
            >
              <i className="bi bi-exclamation-octagon-fill flex-shrink-0 text-danger"></i>
              <div>{error}</div>
              <button
                type="button"
                className="btn-close btn-sm p-2"
                onClick={() => setError('')}
                aria-label="Close"
              ></button>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Username Input */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-dark">
                Corporate Username
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-1"
                  placeholder="e.g. employee1, director"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input with Visibility Toggle */}
            <div className="mb-4">
              <label className="form-label small fw-semibold text-dark">
                Account Password
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control border-start-0 border-end-0 ps-1"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0 bg-light text-muted"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex="-1"
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="btn btn-primary w-100 py-2.5 fw-semibold d-inline-flex align-items-center justify-content-center gap-2 shadow-sm text-nowrap"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <i className="bi bi-box-arrow-in-right"></i>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Shortcuts */}
          <div className="mt-4 pt-3 border-top">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase tracking-wider" style={{ fontSize: '0.72rem' }}>
                Quick Demo Credentials
              </span>
              <span className="badge bg-light text-secondary border" style={{ fontSize: '0.7rem' }}>
                Click to autofill
              </span>
            </div>

            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center flex-wrap gap-2 py-2 px-2.5"
                onClick={() => handleQuickLogin('employee1', 'password123')}
              >
                <div className="d-flex align-items-center gap-2 min-w-0">
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle flex-shrink-0">
                    Employee
                  </span>
                  <span className="small fw-semibold text-dark text-truncate">
                    Rahul Sharma (Tech)
                  </span>
                </div>
                <span className="font-monospace text-muted small ms-auto">employee1</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center flex-wrap gap-2 py-2 px-2.5"
                onClick={() => handleQuickLogin('employee2', 'password123')}
              >
                <div className="d-flex align-items-center gap-2 min-w-0">
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle flex-shrink-0">
                    Employee
                  </span>
                  <span className="small fw-semibold text-dark text-truncate">
                    Priya Patel (Mktg)
                  </span>
                </div>
                <span className="font-monospace text-muted small ms-auto">employee2</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center flex-wrap gap-2 py-2 px-2.5"
                onClick={() => handleQuickLogin('director', 'password123')}
              >
                <div className="d-flex align-items-center gap-2 min-w-0">
                  <span className="badge bg-success-subtle text-success border border-success-subtle flex-shrink-0">
                    Director
                  </span>
                  <span className="small fw-semibold text-dark text-truncate">
                    Vikram Malhotra
                  </span>
                </div>
                <span className="font-monospace text-muted small ms-auto">director</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center flex-wrap gap-2 py-2 px-2.5"
                onClick={() => handleQuickLogin('accounts', 'password123')}
              >
                <div className="d-flex align-items-center gap-2 min-w-0">
                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle flex-shrink-0">
                    Accounts
                  </span>
                  <span className="small fw-semibold text-dark text-truncate">
                    Anjali Gupta
                  </span>
                </div>
                <span className="font-monospace text-muted small ms-auto">accounts</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-muted small">
        Secured corporate login • PSPL Internal Network
      </div>
    </div>
  );
};

export default Login;
