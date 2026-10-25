import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { directorApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

const DirectorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await directorApi.getDashboard();
      setStats(res.data);
    } catch (err) {
      setError('Failed to load Director dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="mt-2 text-muted">Loading Director dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Director Approval Dashboard</h2>
          <p className="text-muted mb-0 small">
            Executive oversight, voucher review, and approval workflow management
          </p>
        </div>
        <Link to="/director/pending" className="btn btn-warning fw-semibold d-flex align-items-center gap-2">
          <i className="bi bi-hourglass-split"></i>
          <span>Pending Approvals Queue</span>
          {stats?.pendingApprovalCount > 0 && (
            <span className="badge bg-danger rounded-pill">
              {stats.pendingApprovalCount}
            </span>
          )}
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Metrics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm border-0 border-start border-4 border-warning h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Pending Approval</div>
              <div className="fs-2 fw-bold text-warning">{stats?.pendingApprovalCount || 0}</div>
              <div className="small text-muted">Awaiting your review</div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm border-0 border-start border-4 border-danger h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Total Pending Amount</div>
              <div className="fs-3 fw-bold text-danger">
                ₹{Number(stats?.totalPendingAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="small text-muted">Awaiting sign-off</div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm border-0 border-start border-4 border-success h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Approved Today</div>
              <div className="fs-2 fw-bold text-success">{stats?.approvedToday || 0}</div>
              <div className="small text-muted">Signed & processed today</div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm border-0 border-start border-4 border-secondary h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Rejected Today</div>
              <div className="fs-2 fw-bold text-secondary">{stats?.rejectedToday || 0}</div>
              <div className="small text-muted">Returned with remarks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-semibold">Recent Voucher Activity</h5>
          <Link to="/director/vouchers" className="btn btn-sm btn-outline-primary">
            View All Vouchers <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Voucher #</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Expense Title</th>
                <th className="text-end">Amount</th>
                <th>Status</th>
                <th>Updated</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentVoucherActivity?.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No recent voucher activity found.
                  </td>
                </tr>
              ) : (
                stats?.recentVoucherActivity?.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link to={`/vouchers/${v.id}`} className="fw-bold text-decoration-none">
                        {v.voucherNumber}
                      </Link>
                    </td>
                    <td>
                      <div className="fw-medium">{v.employeeName}</div>
                      <div className="text-muted small">{v.employeeCustomId || ''}</div>
                    </td>
                    <td>{v.departmentName}</td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '200px' }}>
                        {v.expenseTitle}
                      </div>
                    </td>
                    <td className="text-end fw-bold">
                      ₹{Number(v.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="small text-muted">
                      {new Date(v.lastUpdatedDate).toLocaleDateString()}
                    </td>
                    <td className="text-center">
                      {v.status === 'PENDING_APPROVAL' ? (
                        <Link to="/director/pending" className="btn btn-sm btn-warning">
                          Review
                        </Link>
                      ) : (
                        <Link to={`/vouchers/${v.id}`} className="btn btn-sm btn-outline-secondary">
                          View
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
