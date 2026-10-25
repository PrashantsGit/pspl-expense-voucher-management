import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="text-center mb-4">
            <div className="d-inline-flex p-3 rounded-circle bg-primary text-white mb-2 shadow">
              <i className="bi bi-wallet2 fs-2"></i>
            </div>
            <h2 className="fw-bold text-dark">Prachay Securities</h2>
            <p className="text-muted small">
              Expense Voucher Management System (PSPL)
            </p>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h4 className="card-title fw-bold text-center mb-3">Sign In</h4>

              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i> {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Username</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-semibold"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Quick Demo Credentials */}
              <div className="mt-4 pt-3 border-top">
                <div className="small text-muted text-center mb-2 fw-semibold">
                  Quick Demo Logins (Click to autofill)
                </div>
                <div className="d-grid gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center"
                    onClick={() => handleQuickLogin('employee1', 'password123')}
                  >
                    <span>
                      <i className="bi bi-person-badge text-primary me-2"></i>
                      <strong>Employee 1:</strong> Rahul Sharma (Tech)
                    </span>
                    <span className="badge bg-light text-dark">employee1</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center"
                    onClick={() => handleQuickLogin('employee2', 'password123')}
                  >
                    <span>
                      <i className="bi bi-person-badge text-primary me-2"></i>
                      <strong>Employee 2:</strong> Priya Patel (Marketing)
                    </span>
                    <span className="badge bg-light text-dark">employee2</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center"
                    onClick={() => handleQuickLogin('director', 'password123')}
                  >
                    <span>
                      <i className="bi bi-shield-check text-success me-2"></i>
                      <strong>Director (Admin):</strong> Vikram Malhotra
                    </span>
                    <span className="badge bg-light text-dark">director</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center"
                    onClick={() => handleQuickLogin('accounts', 'password123')}
                  >
                    <span>
                      <i className="bi bi-cash-stack text-warning me-2"></i>
                      <strong>Accounts Team:</strong> Anjali Gupta
                    </span>
                    <span className="badge bg-light text-dark">accounts</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
