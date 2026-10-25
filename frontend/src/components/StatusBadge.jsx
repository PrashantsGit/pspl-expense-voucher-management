import React from 'react';

const StatusBadge = ({ status }) => {
  switch (status) {
    case 'DRAFT':
      return (
        <span className="status-pill status-pill-draft">
          <i className="bi bi-pencil-square"></i>
          <span>Draft</span>
        </span>
      );
    case 'PENDING_APPROVAL':
      return (
        <span className="status-pill status-pill-pending">
          <i className="bi bi-clock-history"></i>
          <span>Pending Approval</span>
        </span>
      );
    case 'APPROVED':
      return (
        <span className="status-pill status-pill-approved">
          <i className="bi bi-check-circle-fill"></i>
          <span>Approved</span>
        </span>
      );
    case 'REJECTED':
      return (
        <span className="status-pill status-pill-rejected">
          <i className="bi bi-x-circle-fill"></i>
          <span>Rejected</span>
        </span>
      );
    default:
      return <span className="status-pill status-pill-draft">{status}</span>;
  }
};

export default StatusBadge;
