import React from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const getBreadcrumb = (pathname) => {
  if (pathname.includes('/employee/dashboard')) return { section: 'Employee', page: 'Dashboard' };
  if (pathname.includes('/employee/vouchers/new')) return { section: 'Employee', page: 'Create Voucher' };
  if (pathname.includes('/employee/vouchers/') && pathname.includes('/edit')) return { section: 'Employee', page: 'Edit Draft' };
  if (pathname.includes('/employee/vouchers')) return { section: 'Employee', page: 'My Vouchers' };
  if (pathname.includes('/director/dashboard')) return { section: 'Director', page: 'Approval Dashboard' };
  if (pathname.includes('/director/pending')) return { section: 'Director', page: 'Pending Approvals' };
  if (pathname.includes('/director/vouchers')) return { section: 'Director', page: 'All Vouchers' };
  if (pathname.includes('/accounts/dashboard')) return { section: 'Accounts', page: 'Financial Dashboard' };
  if (pathname.includes('/accounts/vouchers')) return { section: 'Accounts', page: 'All Vouchers' };
  if (pathname.includes('/vouchers/')) return { section: 'Vouchers', page: 'Voucher Details' };
  return { section: 'PSPL', page: 'Expense Management' };
};

/**
 * Modern Deep Navy Application Sidebar Component
 */
export const AppSidebar = ({
  isCollapsed = false,
  mobileOpen = false,
  onCloseMobile = () => {},
}) => {
  const { user, isAuthenticated, isEmployee, isDirector, isAccounts } = useAuth();

  if (!isAuthenticated) return null;

  const initials = getInitials(user?.fullName);

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="app-sidebar-backdrop d-lg-none"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Deep Navy Application Sidebar */}
      <aside
        className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${
          mobileOpen ? 'mobile-open' : ''
        } d-print-none`}
        aria-label="Sidebar Navigation"
      >
        {/* Brand Area */}
        <Link to="/" className="sidebar-brand-header" onClick={onCloseMobile}>
          <div className="sidebar-brand-icon">
            <i className="bi bi-wallet2"></i>
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">PSPL VoucherHub</span>
            <span className="sidebar-brand-subtitle">Expense System</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="sidebar-nav-container">
          <div className="sidebar-heading">Navigation</div>

          {/* Employee Navigation */}
          {isEmployee && (
            <>
              <NavLink
                to="/employee/dashboard"
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'active' : ''}`
                }
                onClick={onCloseMobile}
                title="Dashboard"
              >
                <span className="sidebar-nav-icon">
                  <i className="bi bi-grid-1x2-fill"></i>
                </span>
                <span className="sidebar-nav-label">Dashboard</span>
              </NavLink>

              <NavLink
                to="/employee/vouchers"
                end
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'active' : ''}`
                }
                onClick={onCloseMobile}
                title="My Vouchers"
              >
                <span className="sidebar-nav-icon">
                  <i className="bi bi-receipt"></i>
                </span>
                <span className="sidebar-nav-label">My Vouchers</span>
              </NavLink>

              <NavLink
                to="/employee/vouchers/new"
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'active' : ''}`
                }
                onClick={onCloseMobile}
                title="Create Voucher"
              >
                <span className="sidebar-nav-icon">
                  <i className="bi bi-plus-circle-fill"></i>
                </span>
                <span className="sidebar-nav-label">Create Voucher</span>
              </NavLink>
            </>
          )}

          {/* Director Navigation */}
          {isDirector && (
            <>
              <NavLink
                to="/director/dashboard"
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'active' : ''}`
                }
                onClick={onCloseMobile}
                title="Dashboard"
              >
                <span className="sidebar-nav-icon">
                  <i className="bi bi-grid-1x2-fill"></i>
                </span>
                <span className="sidebar-nav-label">Dashboard</span>
              </NavLink>

              <NavLink
                to="/director/pending"
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'active' : ''}`
                }
                onClick={onCloseMobile}
                title="Pending Approvals"
              >
                <span className="sidebar-nav-icon">
                  <i className="bi bi-hourglass-split"></i>
                </span>
                <span className="sidebar-nav-label">Pending Approvals</span>
              </NavLink>

              <NavLink
                to="/director/vouchers"
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'active' : ''}`
                }
                onClick={onCloseMobile}
                title="All Vouchers"
              >
                <span className="sidebar-nav-icon">
                  <i className="bi bi-files"></i>
                </span>
                <span className="sidebar-nav-label">All Vouchers</span>
              </NavLink>
            </>
          )}

          {/* Accounts Navigation */}
          {isAccounts && (
            <>
              <NavLink
                to="/accounts/dashboard"
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'active' : ''}`
                }
                onClick={onCloseMobile}
                title="Dashboard"
              >
                <span className="sidebar-nav-icon">
                  <i className="bi bi-grid-1x2-fill"></i>
                </span>
                <span className="sidebar-nav-label">Dashboard</span>
              </NavLink>

              <NavLink
                to="/accounts/vouchers"
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'active' : ''}`
                }
                onClick={onCloseMobile}
                title="All Vouchers"
              >
                <span className="sidebar-nav-icon">
                  <i className="bi bi-journal-check"></i>
                </span>
                <span className="sidebar-nav-label">All Vouchers</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar" title={user?.fullName}>
              {initials}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name text-truncate" style={{ maxWidth: '160px' }}>
                {user?.fullName}
              </span>
              <span className="sidebar-user-role text-truncate" style={{ maxWidth: '160px' }}>
                {user?.role === 'ROLE_EMPLOYEE' && 'Employee'}
                {user?.role === 'ROLE_DIRECTOR' && 'Director'}
                {user?.role === 'ROLE_ACCOUNTS' && 'Accounts'}
                {user?.department ? ` • ${user.department}` : ''}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

/**
 * Top Application Header Component
 */
export const AppHeader = ({
  isCollapsed = false,
  onToggleCollapse = () => {},
  onToggleMobile = () => {},
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumb = getBreadcrumb(location.pathname);
  const initials = getInitials(user?.fullName);

  return (
    <header className="app-topbar d-print-none">
      <div className="d-flex align-items-center gap-3">
        {/* Desktop Toggle Button */}
        <button
          type="button"
          className="topbar-toggle-btn d-none d-lg-flex"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label="Toggle Desktop Sidebar"
        >
          <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
        </button>

        {/* Mobile Drawer Toggle */}
        <button
          type="button"
          className="topbar-toggle-btn d-lg-none"
          onClick={onToggleMobile}
          title="Open Menu"
          aria-label="Toggle Mobile Navigation"
        >
          <i className="bi bi-list fs-5"></i>
        </button>

        {/* Contextual Breadcrumb */}
        <nav aria-label="breadcrumb" className="topbar-breadcrumb mb-0">
          <span className="text-muted small">{breadcrumb.section}</span>
          <i className="bi bi-chevron-right text-muted small" style={{ fontSize: '0.65rem' }}></i>
          <span className="topbar-breadcrumb-title small">{breadcrumb.page}</span>
        </nav>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Status Indicator */}
        <div className="topbar-status-indicator d-none d-md-inline-flex">
          <span className="topbar-status-dot"></span>
          <span>Live System</span>
        </div>

        {/* User Profile Pill */}
        <div className="d-flex align-items-center gap-2 border-start ps-3">
          <div
            className="rounded-circle bg-light border text-primary fw-bold d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}
          >
            {initials}
          </div>
          <div className="d-none d-sm-block text-start">
            <div className="fw-semibold text-dark small" style={{ lineHeight: 1.2 }}>
              {user?.fullName}
            </div>
            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
              {user?.role === 'ROLE_EMPLOYEE' && 'Employee'}
              {user?.role === 'ROLE_DIRECTOR' && 'Director'}
              {user?.role === 'ROLE_ACCOUNTS' && 'Accounts'}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 px-2.5 py-1"
          title="Sign out of system"
        >
          <i className="bi bi-box-arrow-right"></i>
          <span className="d-none d-md-inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

const Navbar = (props) => <AppSidebar {...props} />;
export default Navbar;
