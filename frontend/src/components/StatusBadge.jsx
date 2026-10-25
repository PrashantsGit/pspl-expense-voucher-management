import React from 'react';

const StatusBadge = ({ status }) => {
  switch (status) {
    case 'DRAFT':
      return (
        <span className="badge bg-secondary text-white px-2 py-1">
          <i className="bi bi-pencil-square me-1"></i> Draft
        </span>
      );
    case 'PENDING_APPROVAL':
      return (
        <span className="badge bg-warning text-dark px-2 py-1">
          <i className="bi bi-clock-history me-1"></i> Pending Approval
        </span>
      );
    case 'APPROVED':
      return (
        <span className="badge bg-success text-white px-2 py-1">
          <i className="bi bi-check-circle-fill me-1"></i> Approved
        </span>
      );
    case 'REJECTED':
      return (
        <span className="badge bg-danger text-white px-2 py-1">
          <i className="bi bi-x-circle-fill me-1"></i> Rejected
        </span>
      );
    default:
      return <span className="badge bg-light text-dark">{status}</span>;
  }
};

export default StatusBadge;
