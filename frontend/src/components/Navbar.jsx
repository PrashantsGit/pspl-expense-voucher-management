import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout, isEmployee, isDirector, isAccounts } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
      <div className="container-fluid px-4">
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold" to="/">
          <span className="badge bg-primary text-white p-2">
            <i className="bi bi-wallet2 fs-5"></i>
          </span>
          <span>PSPL VoucherHub</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {/* Employee Links */}
            {isEmployee && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/employee/dashboard">
                    <i className="bi bi-speedometer2 me-1"></i> Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/employee/vouchers" end>
                    <i className="bi bi-receipt me-1"></i> My Vouchers
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/employee/vouchers/new">
                    <i className="bi bi-plus-circle me-1"></i> Create Voucher
                  </NavLink>
                </li>
              </>
            )}

            {/* Director Links */}
            {isDirector && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/director/dashboard">
                    <i className="bi bi-speedometer2 me-1"></i> Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/director/pending">
                    <i className="bi bi-hourglass-split me-1"></i> Pending Approvals
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/director/vouchers">
                    <i className="bi bi-files me-1"></i> All Vouchers
                  </NavLink>
                </li>
              </>
            )}

            {/* Accounts Links */}
            {isAccounts && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/accounts/dashboard">
                    <i className="bi bi-speedometer2 me-1"></i> Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/accounts/vouchers">
                    <i className="bi bi-journal-check me-1"></i> All Vouchers
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-md-block">
              <div className="text-white fw-semibold small">{user?.fullName}</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                <span className="badge bg-secondary me-1">
                  {user?.role === 'ROLE_EMPLOYEE' && 'Employee'}
                  {user?.role === 'ROLE_DIRECTOR' && 'Director'}
                  {user?.role === 'ROLE_ACCOUNTS' && 'Accounts'}
                </span>
                {user?.department}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
