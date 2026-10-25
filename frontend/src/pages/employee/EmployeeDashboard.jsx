import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

const EmployeeDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentVouchers, setRecentVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, vouchersRes] = await Promise.all([
        employeeApi.getDashboard(),
        employeeApi.getMyVouchers(),
      ]);
      setStats(dashRes.data);
      setRecentVouchers(vouchersRes.data.slice(0, 5));
    } catch (err) {
      setError('Failed to load dashboard metrics.');
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
        <div className="mt-2 text-muted">Loading employee dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Employee Dashboard</h2>
          <p className="text-muted mb-0 small">
            Manage your expense vouchers and monitor approval statuses
          </p>
        </div>
        <Link to="/employee/vouchers/new" className="btn btn-primary d-flex align-items-center gap-2">
          <i className="bi bi-plus-lg"></i>
          <span>Create New Voucher</span>
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Metrics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-2">
          <div className="card shadow-sm border-0 border-start border-4 border-primary h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Total</div>
              <div className="fs-3 fw-bold text-dark">{stats?.totalVouchers || 0}</div>
              <div className="small text-muted">All vouchers</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-2">
          <div className="card shadow-sm border-0 border-start border-4 border-secondary h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Drafts</div>
              <div className="fs-3 fw-bold text-secondary">{stats?.draftVouchers || 0}</div>
              <div className="small text-muted">Editable</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-2">
          <div className="card shadow-sm border-0 border-start border-4 border-warning h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Pending</div>
              <div className="fs-3 fw-bold text-warning">{stats?.pendingApproval || 0}</div>
              <div className="small text-muted">In review</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-2">
          <div className="card shadow-sm border-0 border-start border-4 border-success h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Approved</div>
              <div className="fs-3 fw-bold text-success">{stats?.approvedVouchers || 0}</div>
              <div className="small text-muted">For payout</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-2">
          <div className="card shadow-sm border-0 border-start border-4 border-danger h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Rejected</div>
              <div className="fs-3 fw-bold text-danger">{stats?.rejectedVouchers || 0}</div>
              <div className="small text-muted">Action needed</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-2">
          <div className="card shadow-sm border-0 border-start border-4 border-info h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Claimed</div>
              <div className="fs-5 fw-bold text-info">
                ₹{Number(stats?.totalAmountClaimed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="small text-muted">Total sum</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Vouchers Section */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-semibold">Recent Vouchers</h5>
          <Link to="/employee/vouchers" className="btn btn-sm btn-outline-primary">
            View All My Vouchers <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Voucher #</th>
                <th>Expense Date</th>
                <th>Department</th>
                <th>Expense Title</th>
                <th>Category</th>
                <th className="text-end">Amount</th>
                <th>Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentVouchers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No vouchers found. Click "Create New Voucher" to create your first claim.
                  </td>
                </tr>
              ) : (
                recentVouchers.map((v) => (
                  <tr key={v.id}>
                    <td className="fw-semibold">
                      <Link to={`/vouchers/${v.id}`} className="text-decoration-none">
                        {v.voucherNumber}
                      </Link>
                    </td>
                    <td>{v.expenseDate}</td>
                    <td>{v.departmentName}</td>
                    <td>
                      <div className="fw-medium text-truncate" style={{ maxWidth: '200px' }}>
                        {v.expenseTitle}
                      </div>
                    </td>
                    <td><span className="badge bg-light text-dark border">{v.expenseCategory}</span></td>
                    <td className="text-end fw-semibold">
                      ₹{Number(v.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="text-center">
                      <Link to={`/vouchers/${v.id}`} className="btn btn-sm btn-outline-secondary">
                        View
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

export default EmployeeDashboard;
