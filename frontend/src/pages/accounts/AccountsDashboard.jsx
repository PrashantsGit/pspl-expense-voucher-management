import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { accountsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AccountsDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await accountsApi.getDashboard();
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Accounts dashboard metrics.');
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
        <div className="mt-3 text-muted small fw-medium">Loading Accounts dashboard metrics...</div>
      </div>
    );
  }

  const totalVouchers = stats?.totalVouchers || 0;
  const pendingCount = stats?.pendingApproval || 0;
  const approvedCount = stats?.approvedVouchers || 0;
  const rejectedCount = stats?.rejectedVouchers || 0;
  const totalApprovedAmount = Number(stats?.totalApprovedExpenseAmount || 0);
  const recentApprovedVouchers = stats?.recentApprovedVouchers || [];

  return (
    <div className="container py-4">
      {/* 1. Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom">
        <div>
          <div className="text-primary small fw-semibold text-uppercase tracking-wider mb-1 d-flex align-items-center gap-1.5">
            <i className="bi bi-shield-check"></i>
            <span>Financial Operations • Accounts Overview</span>
          </div>
          <h2 className="fw-bold text-dark mb-1">
            {getGreeting()}, {user?.fullName || 'Accounts Team'}
          </h2>
          <p className="text-muted small mb-0">
            Corporate expense claims monitoring, approved voucher tracking, and financial audit verification.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2 btn-sm"
            title="Refresh dashboard metrics"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>
          <Link
            to="/accounts/vouchers"
            className="btn btn-primary d-inline-flex align-items-center gap-2 px-3 py-2 btn-sm fw-semibold shadow-sm"
          >
            <i className="bi bi-receipt-cutoff"></i>
            <span>Voucher Processing Workspace</span>
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
        {/* Hero Card: Total Approved Claim Value */}
        <div className="col-12 col-xl-5">
          <div className="card shadow-sm border-0 h-100 p-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="text-muted small fw-semibold text-uppercase tracking-wider">
                  Total Approved Claim Value
                </span>
                <div className="fs-2 fw-bold text-dark tabular-nums mt-1">
                  ₹{totalApprovedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="metric-icon-box bg-success-subtle-box">
                <i className="bi bi-cash-stack"></i>
              </div>
            </div>

            <div className="small text-muted mb-3">
              Total cumulative value of corporate expense vouchers authorized by Director sign-off across all departments.
            </div>

            <div className="mt-auto pt-3 border-top">
              <Link
                to="/accounts/vouchers"
                className="btn btn-outline-success w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2 fw-semibold"
              >
                <span>Inspect Approved Vouchers</span>
                <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards in Right Sub-Grid */}
        <div className="col-12 col-xl-7">
          <div className="row g-3 h-100">
            {/* Total Vouchers */}
            <div className="col-sm-6">
              <div className="card shadow-sm border-0 h-100 p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase tracking-wider">
                      Total Vouchers
                    </div>
                    <div className="fs-3 fw-bold text-dark tabular-nums mt-1">
                      {totalVouchers}
                    </div>
                  </div>
                  <div className="metric-icon-box bg-primary-subtle-box">
                    <i className="bi bi-files"></i>
                  </div>
                </div>
                <div className="small text-muted mt-auto pt-2">
                  System-wide submissions
                </div>
              </div>
            </div>

            {/* Approved Claims */}
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
                  Authorized by Director
                </div>
              </div>
            </div>

            {/* Pending Approval */}
            <div className="col-sm-6">
              <div className="card shadow-sm border-0 h-100 p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase tracking-wider">
                      Pending Review
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
                  Awaiting Director sign-off
                </div>
              </div>
            </div>

            {/* Rejected Claims */}
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
                  Returned with remarks
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Operational Overview: Recent Approved Vouchers Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom flex-wrap gap-2">
          <div>
            <div className="d-flex align-items-center gap-2 mb-0.5">
              <h5 className="mb-0 fw-semibold text-dark">Recent Approved Claims</h5>
              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                Authorized
              </span>
            </div>
            <span className="text-muted small">
              Vouchers authorized with Director digital signatures, ready for accounting review and audit records
            </span>
          </div>
          <Link
            to="/accounts/vouchers"
            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5"
          >
            <span>All Vouchers Workspace</span>
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
                <th scope="col" className="text-end" style={{ width: '150px' }}>Approved Amount</th>
                <th scope="col" style={{ width: '130px' }}>Approval Date</th>
                <th scope="col" className="text-center" style={{ width: '140px' }}>Director Sign</th>
                <th scope="col" className="text-end" style={{ width: '110px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentApprovedVouchers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-2 text-muted d-block mb-2"></i>
                    No approved vouchers found yet.
                  </td>
                </tr>
              ) : (
                recentApprovedVouchers.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link
                        to={`/vouchers/${v.id}`}
                        className="fw-bold text-primary text-decoration-none d-inline-flex align-items-center gap-1.5"
                      >
                        <i className="bi bi-file-earmark-check text-success"></i>
                        <span className="tabular-nums font-monospace">{v.voucherNumber}</span>
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
                        className="text-truncate text-dark fw-medium"
                        style={{ maxWidth: '240px' }}
                        title={v.expenseTitle}
                      >
                        {v.expenseTitle}
                      </div>
                      <span className="badge bg-light text-secondary border small mt-0.5">
                        {v.expenseCategory}
                      </span>
                    </td>
                    <td className="text-end">
                      <span className="fw-bold text-dark tabular-nums">
                        ₹{Number(v.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="small text-muted tabular-nums">
                      {v.approvalDate || (v.lastUpdatedDate ? new Date(v.lastUpdatedDate).toISOString().split('T')[0] : 'N/A')}
                    </td>
                    <td className="text-center">
                      {v.hasDirectorSignature ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 d-inline-flex align-items-center gap-1">
                          <i className="bi bi-patch-check-fill"></i>
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-secondary px-2 py-1">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <Link
                        to={`/vouchers/${v.id}`}
                        className="btn btn-sm btn-outline-secondary py-1 px-2.5 d-inline-flex align-items-center gap-1"
                        title="Inspect Voucher Details"
                      >
                        <i className="bi bi-eye"></i>
                        <span>Details</span>
                      </Link>
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

export default AccountsDashboard;