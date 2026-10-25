import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { directorApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

const DirectorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await directorApi.getDashboard();
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Director dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div
          className="spinner-border text-primary"
          role="status"
          style={{ width: '2.5rem', height: '2.5rem' }}
        ></div>
        <div className="mt-3 text-muted small fw-medium">Loading Director dashboard metrics...</div>
      </div>
    );
  }

  const pendingCount = stats?.pendingApprovalCount || 0;
  const pendingAmount = Number(stats?.totalPendingAmount || 0);
  const approvedToday = stats?.approvedToday || 0;
  const rejectedToday = stats?.rejectedToday || 0;
  const recentActivity = stats?.recentVoucherActivity || [];

  return (
    <div className="container py-4">
      {/* 1. Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom">
        <div>
          <div className="text-primary small fw-semibold text-uppercase tracking-wider mb-1 d-flex align-items-center gap-1.5">
            <i className="bi bi-shield-check"></i>
            <span>Executive Review Portal • Director Oversight</span>
          </div>
          <h2 className="fw-bold text-dark mb-1">
            {getGreeting()}, {user?.fullName || 'Director'}
          </h2>
          <p className="text-muted small mb-0">
            Overview of corporate reimbursement requests, pending approvals workload, and daily processing history.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link
            to="/director/vouchers"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2 btn-sm"
          >
            <i className="bi bi-files"></i>
            <span>All Vouchers</span>
          </Link>
          <Link
            to="/director/pending"
            className={`btn ${
              pendingCount > 0 ? 'btn-warning text-dark' : 'btn-outline-primary'
            } d-inline-flex align-items-center gap-2 px-3 py-2 btn-sm fw-semibold shadow-sm`}
          >
            <i className="bi bi-hourglass-split"></i>
            <span>Pending Approvals Queue</span>
            {pendingCount > 0 && (
              <span className="badge bg-danger rounded-pill px-2 py-0.5" style={{ fontSize: '0.75rem' }}>
                {pendingCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Error Feedback with Retry */}
      {error && (
        <div
          className="alert alert-danger d-flex align-items-center justify-content-between p-3 mb-4 shadow-sm"
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-octagon-fill fs-5"></i>
            <span>{error}</span>
          </div>
          <button onClick={fetchDashboardData} className="btn btn-outline-danger btn-sm">
            <i className="bi bi-arrow-clockwise me-1"></i> Retry
          </button>
        </div>
      )}

      {/* 2. Executive Financial & Metric Summary */}
      <div className="row g-3 mb-4">
        {/* Hero Urgency Card */}
        <div className="col-12 col-xl-5">
          <div className="card shadow-sm border-0 h-100 p-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="text-muted small fw-semibold text-uppercase tracking-wider">
                  Total Value Awaiting Sign-Off
                </span>
                <div className="fs-2 fw-bold text-dark tabular-nums mt-1">
                  ₹{pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className={`metric-icon-box ${pendingCount > 0 ? 'bg-warning-subtle-box' : 'bg-success-subtle-box'}`}>
                <i className={`bi ${pendingCount > 0 ? 'bi-hourglass-split' : 'bi-check-all'}`}></i>
              </div>
            </div>

            <div className="small text-muted mb-3">
              {pendingCount > 0 ? (
                <>
                  You have <span className="fw-bold text-dark">{pendingCount}</span> {pendingCount === 1 ? 'voucher' : 'vouchers'} awaiting your digital signature and review.
                </>
              ) : (
                'All caught up! Zero employee expense claims are currently awaiting your signature.'
              )}
            </div>

            <div className="mt-auto pt-3 border-top">
              {pendingCount > 0 ? (
                <Link
                  to="/director/pending"
                  className="btn btn-warning text-dark w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2 fw-semibold"
                >
                  <span>Review {pendingCount} Pending {pendingCount === 1 ? 'Voucher' : 'Vouchers'}</span>
                  <i className="bi bi-arrow-right"></i>
                </Link>
              ) : (
                <div className="d-flex align-items-center gap-2 text-success small fw-medium py-1">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>No pending action required at this time</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3 Executive Metric Cards in Right Sub-Grid */}
        <div className="col-12 col-xl-7">
          <div className="row g-3 h-100">
            {/* Pending Count Card */}
            <div className="col-sm-4">
              <div className="card shadow-sm border-0 h-100 p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase tracking-wider">
                      Pending Queue
                    </div>
                    <div className="fs-3 fw-bold text-warning tabular-nums mt-1">
                      {pendingCount}
                    </div>
                  </div>
                  <div className="metric-icon-box bg-warning-subtle-box">
                    <i className="bi bi-clock-history"></i>
                  </div>
                </div>
                <div className="small text-muted mt-auto pt-2">
                  Awaiting review & signature
                </div>
              </div>
            </div>

            {/* Approved Today */}
            <div className="col-sm-4">
              <div className="card shadow-sm border-0 h-100 p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase tracking-wider">
                      Approved Today
                    </div>
                    <div className="fs-3 fw-bold text-success tabular-nums mt-1">
                      {approvedToday}
                    </div>
                  </div>
                  <div className="metric-icon-box bg-success-subtle-box">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                </div>
                <div className="small text-muted mt-auto pt-2">
                  Signed & authorized today
                </div>
              </div>
            </div>

            {/* Rejected Today */}
            <div className="col-sm-4">
              <div className="card shadow-sm border-0 h-100 p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase tracking-wider">
                      Rejected Today
                    </div>
                    <div className="fs-3 fw-bold text-secondary tabular-nums mt-1">
                      {rejectedToday}
                    </div>
                  </div>
                  <div className="metric-icon-box bg-slate-subtle-box">
                    <i className="bi bi-x-circle-fill"></i>
                  </div>
                </div>
                <div className="small text-muted mt-auto pt-2">
                  Returned with remarks today
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recent Activity Section */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
          <div>
            <h5 className="mb-0 fw-semibold text-dark">Recent Voucher Activity</h5>
            <span className="text-muted small">Displaying the most recent submissions and state updates across the company</span>
          </div>
          <Link
            to="/director/vouchers"
            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5"
          >
            <span>View All Vouchers</span>
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col" style={{ width: '160px' }}>Voucher #</th>
                <th scope="col">Employee & Dept</th>
                <th scope="col">Expense Title</th>
                <th scope="col" className="text-end" style={{ width: '140px' }}>Amount</th>
                <th scope="col" className="text-center" style={{ width: '140px' }}>Status</th>
                <th scope="col" style={{ width: '130px' }}>Updated</th>
                <th scope="col" className="text-end" style={{ width: '120px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-2 text-muted d-block mb-2"></i>
                    No recent voucher activity found.
                  </td>
                </tr>
              ) : (
                recentActivity.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link
                        to={`/vouchers/${v.id}`}
                        className="fw-bold text-primary text-decoration-none d-inline-flex align-items-center gap-1.5"
                      >
                        <i className="bi bi-file-earmark-text text-muted"></i>
                        <span className="tabular-nums">{v.voucherNumber}</span>
                      </Link>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{v.employeeName}</div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        {v.departmentName} {v.employeeCustomId ? `• ${v.employeeCustomId}` : ''}
                      </div>
                    </td>
                    <td>
                      <div
                        className="text-truncate text-dark"
                        style={{ maxWidth: '240px' }}
                        title={v.expenseTitle}
                      >
                        {v.expenseTitle}
                      </div>
                    </td>
                    <td className="text-end">
                      <span className="fw-bold text-dark tabular-nums">
                        ₹{Number(v.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="text-center">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="small text-muted tabular-nums">
                      {v.lastUpdatedDate ? new Date(v.lastUpdatedDate).toISOString().split('T')[0] : ''}
                    </td>
                    <td className="text-end">
                      {v.status === 'PENDING_APPROVAL' ? (
                        <Link
                          to="/director/pending"
                          className="btn btn-sm btn-warning text-dark py-1 px-2.5 fw-semibold d-inline-flex align-items-center gap-1"
                          title="Review & Approve"
                        >
                          <i className="bi bi-pencil-square"></i>
                          <span>Review</span>
                        </Link>
                      ) : (
                        <Link
                          to={`/vouchers/${v.id}`}
                          className="btn btn-sm btn-outline-secondary py-1 px-2.5 d-inline-flex align-items-center gap-1"
                          title="View Voucher"
                        >
                          <i className="bi bi-eye"></i>
                          <span>View</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DirectorDashboard;
