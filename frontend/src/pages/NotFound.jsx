import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const { isAuthenticated, getDashboardRoute } = useAuth();

  return (
    <div className="container py-5 text-center">
      <div className="py-5">
        <h1 className="display-1 fw-bold text-muted">404</h1>
        <h3 className="fw-semibold mb-3">Page Not Found</h3>
        <p className="text-muted mb-4">
          The page or voucher resource you are looking for does not exist or has been moved.
        </p>
        <Link
          to={isAuthenticated ? getDashboardRoute() : '/login'}
          className="btn btn-primary"
        >
          <i className="bi bi-house-door me-1"></i> Return to Safety
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
