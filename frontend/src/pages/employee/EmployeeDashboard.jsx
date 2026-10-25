import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentVouchers, setRecentVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [dashRes, vouchersRes] = await Promise.all([
        employeeApi.getDashboard(),
        employeeApi.getMyVouchers(),
      ]);
      setStats(dashRes.data);
      setRecentVouchers(vouchersRes.data.slice(0, 5));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
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
        <div className="mt-3 text-muted small fw-medium">Loading employee dashboard...</div>
      </div>
    );
  }

  // Safe percentage calculations for status distribution
  const total = stats?.totalVouchers || 0;
  const approvedCount = stats?.approvedVouchers || 0;
  const pendingCount = stats?.pendingApproval || 0;
  const draftCount = stats?.draftVouchers || 0;
  const rejectedCount = stats?.rejectedVouchers || 0;

  const approvedPct = total > 0 ? (approvedCount / total) * 100 : 0;
  const pendingPct = total > 0 ? (pendingCount / total) * 100 : 0;
  const draftPct = total > 0 ? (draftCount / total) * 100 : 0;
  const rejectedPct = total > 0 ? (rejectedCount / total) * 100 : 0;

  const totalAmount = Number(stats?.totalAmountClaimed || 0);

  return (
    <div className="container py-4">
      {/* 1. Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom">
        <div>
          <div className="text-primary small fw-semibold text-uppercase tracking-wider mb-1 d-flex align-items-center gap-1.5">
            <i className="bi bi-person-badge"></i>
            <span>Employee Portal • {user?.department || 'General'}</span>
          </div>
          <h2 className="fw-bold text-dark mb-1">
            {getGreeting()}, {user?.fullName || 'Employee'}
          </h2>
          <p className="text-muted small mb-0">
            Monitor reimbursement statuses, review recent voucher claims, and submit new expenses.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link
            to="/employee/vouchers"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2 btn-sm"
          >
            <i className="bi bi-receipt"></i>
            <span>My Vouchers</span>
          </Link>
          <Link
            to="/employee/vouchers/new"
            className="btn btn-primary d-inline-flex align-items-center gap-2 px-3 py-2 btn-sm fw-semibold shadow-sm"
          >
            <i className="bi bi-plus-circle-fill"></i>
            <span>Create New Voucher</span>
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

      {/* 2. Intentional Financial & Status Summary Grid */}
      <div className="row g-3 mb-4">
        {/* Financial Hero Card with Status Breakdown */}
        <div className="col-12 col-xl-5">
          <div className="card shadow-sm border-0 h-100 p-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="text-muted small fw-semibold text-uppercase tracking-wider">
                  Total Claimed Expenses
                </span>
                <div className="fs-2 fw-bold text-dark tabular-nums mt-1">
                  ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="metric-icon-box bg-primary-subtle-box">
                <i className="bi bi-currency-rupee"></i>
              </div>
            </div>

            <div className="small text-muted mb-3">
              Across <span className="fw-semibold text-dark">{total}</span> total expense {total === 1 ? 'voucher' : 'vouchers'} registered in the system.
            </div>

            {/* Visual Lifecycle Distribution Bar */}
            <div className="mt-auto pt-2 border-top">
              <div className="d-flex justify-content-between align-items-center mb-1.5 small">
                <span className="fw-semibold text-dark">Lifecycle Distribution</span>
                <span className="text-muted">{total} Total</span>
              </div>

              {total === 0 ? (
                <div className="progress" style={{ height: '7px' }}>
                  <div
                    className="progress-bar bg-light"
                    role="progressbar"
                    style={{ width: '100%' }}
                    aria-valuenow="100"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              ) : (
                <div className="progress" style={{ height: '7px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${approvedPct}%` }}
                    title={`Approved: ${approvedCount}`}
                  ></div>
                  <div
                    className="progress-bar bg-warning"
                    style={{ width: `${pendingPct}%` }}
                    title={`Pending Review: ${pendingCount}`}
                  ></div>
                  <div
                    className="progress-bar bg-secondary"
                    style={{ width: `${draftPct}%` }}
                    title={`Drafts: ${draftCount}`}
                  ></div>
                  <div
                    className="progress-bar bg-danger"
                    style={{ width: `${rejectedPct}%` }}
                    title={`Rejected: ${rejectedCount}`}
                  ></div>
                </div>
              )}

              {/* Status Breakdown Legend */}
              <div className="d-flex flex-wrap gap-3 mt-2.5 pt-1 small text-muted">
                <span className="d-flex align-items-center gap-1.5">
                  <span className="badge-dot bg-success"></span> Approved ({approvedCount})
                </span>
                <span className="d-flex align-items-center gap-1.5">
                  <span className="badge-dot bg-warning"></span> In Review ({pendingCount})
                </span>
                <span className="d-flex align-items-center gap-1.5">
                  <span className="badge-dot bg-secondary"></span> Drafts ({draftCount})
                </span>
                <span className="d-flex align-items-center gap-1.5">
                  <span className="badge-dot bg-danger"></span> Rejected ({rejectedCount})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Status Metric Cards in a Responsive Sub-Grid */}
        <div className="col-12 col-xl-7">
          <div className="row g-3 h-100">
            {/* Drafts */}
            <div className="col-sm-6">
              <div className="card shadow-sm border-0 h-100 p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase tracking-wider">
                      Draft Vouchers
                    </div>
                    <div className="fs-3 fw-bold text-dark tabular-nums mt-1">
                      {draftCount}
                    </div>
                  </div>
                  <div className="metric-icon-box bg-slate-subtle-box">
                    <i className="bi bi-pencil-square"></i>
                  </div>
                </div>
                <div className="small text-muted mt-auto pt-2">
                  Saved locally, editable and ready for submission
                </div>
              </div>
            </div>

            {/* Pending Approval */}
            <div className="col-sm-6">
              <div className="card shadow-sm border-0 h-100 p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase tracking-wider">
                      In Review
                    </div>
                    <div className="fs-3 fw-bold text-warning tabular-nums mt-1">
                      {pendingCount}
                    </div>
                  </div>
                  <div className="metric-icon-box bg-warning-subtle-box">
                    <i className="bi bi-hourglass-split"></i>
                  </div>
                </div>
                <div className="small text-muted mt-auto pt-2">
                  Awaiting review and signature from Director
                </div>
              </div>
            </div>

            {/* Approved Vouchers */}
            <div className="col-sm-6">
              <div className="card shadow-sm border-0 h-100 p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase tracking-wider">
                      Approved Claims
                    </div>
                    <div className="fs-3 fw-bold text-success tabular-nums mt-1">
                      {approvedCount}
                    </div>
                  </div>
                  <div className="metric-icon-box bg-success-subtle-box">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                </div>
                <div className="small text-muted mt-auto pt-2">
                  Signed off by Director, ready for payout
                </div>
              </div>
            </div>

            {/* Rejected Vouchers */}
            <div className="col-sm-6">
              <div className="card shadow-sm border-0 h-100 p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase tracking-wider">
                      Rejected Claims
                    </div>
                    <div className="fs-3 fw-bold text-danger tabular-nums mt-1">
                      {rejectedCount}
                    </div>
                  </div>
                  <div className="metric-icon-box bg-danger-subtle-box">
                    <i className="bi bi-x-circle-fill"></i>
                  </div>
                </div>
                <div className="small text-muted mt-auto pt-2">
                  Requires correction based on remarks
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recent Vouchers Table Section */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
          <div>
            <h5 className="mb-0 fw-semibold text-dark">Recent Vouchers</h5>
            <span className="text-muted small">Displaying your 5 most recently created or updated claims</span>
          </div>
          <Link
            to="/employee/vouchers"
            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5"
          >
            <span>View All My Vouchers</span>
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col" style={{ width: '160px' }}>Voucher #</th>
                <th scope="col" style={{ width: '120px' }}>Expense Date</th>
                <th scope="col">Title & Department</th>
                <th scope="col">Category</th>
                <th scope="col" className="text-end" style={{ width: '140px' }}>Amount</th>
                <th scope="col" className="text-center" style={{ width: '140px' }}>Status</th>
                <th scope="col" className="text-end" style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentVouchers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="py-4">
                      <div className="d-inline-flex p-3 rounded-circle bg-light text-primary mb-3 shadow-sm">
                        <i className="bi bi-receipt-cutoff fs-2"></i>
                      </div>
                      <h6 className="fw-bold text-dark mb-1">No expense vouchers created yet</h6>
                      <p className="text-muted small mb-3" style={{ maxWidth: '360px', margin: '0 auto' }}>
                        You have not created any expense claims. Draft a new voucher to request corporate reimbursement.
                      </p>
                      <Link
                        to="/employee/vouchers/new"
                        className="btn btn-primary btn-sm px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5"
                      >
                        <i className="bi bi-plus-lg"></i>
                        <span>Create Your First Voucher</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                recentVouchers.map((v) => (
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
                      <span className="text-secondary small tabular-nums">{v.expenseDate}</span>
                    </td>
                    <td>
                      <div
                        className="fw-semibold text-dark text-truncate"
                        style={{ maxWidth: '240px' }}
                        title={v.expenseTitle}
                      >
                        {v.expenseTitle}
                      </div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        {v.departmentName}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-secondary border px-2 py-1 small fw-normal">
                        {v.expenseCategory}
                      </span>
                    </td>
                    <td className="text-end">
                      <span className="fw-bold text-dark tabular-nums">
                        ₹{Number(v.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="text-center">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1.5">
                        {v.status === 'DRAFT' && (
                          <Link
                            to={`/employee/vouchers/${v.id}/edit`}
                            className="btn btn-sm btn-outline-primary py-1 px-2"
                            title="Edit Draft"
                          >
                            <i className="bi bi-pencil me-1"></i>Edit
                          </Link>
                        )}
                        <Link
                          to={`/vouchers/${v.id}`}
                          className="btn btn-sm btn-outline-secondary py-1 px-2"
                          title="View Details"
                        >
                          <i className="bi bi-eye me-1"></i>View
                        </Link>
                      </div>
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

export default EmployeeDashboard;
