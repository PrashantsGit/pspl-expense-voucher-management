import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { accountsApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

const AccountsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await accountsApi.getDashboard();
      setStats(res.data);
    } catch (err) {
      setError('Failed to load Accounts dashboard metrics.');
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
        <div className="mt-2 text-muted">Loading Accounts dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Accounts Team Dashboard</h2>
          <p className="text-muted mb-0 small">
            Expense disbursement monitoring, approved reimbursement tracking, and audit verification
          </p>
        </div>
        <Link to="/accounts/vouchers" className="btn btn-primary d-flex align-items-center gap-2">
          <i className="bi bi-receipt-cutoff"></i>
          <span>View All Vouchers</span>
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Metrics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-2">
          <div className="card shadow-sm border-0 border-start border-4 border-primary h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Total Vouchers</div>
              <div className="fs-3 fw-bold text-dark">{stats?.totalVouchers || 0}</div>
              <div className="small text-muted">System-wide</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-2">
          <div className="card shadow-sm border-0 border-start border-4 border-warning h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Pending</div>
              <div className="fs-3 fw-bold text-warning">{stats?.pendingApproval || 0}</div>
              <div className="small text-muted">Awaiting Director</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-2">
          <div className="card shadow-sm border-0 border-start border-4 border-success h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Approved</div>
              <div className="fs-3 fw-bold text-success">{stats?.approvedVouchers || 0}</div>
              <div className="small text-muted">Ready for payout</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-2">
          <div className="card shadow-sm border-0 border-start border-4 border-danger h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Rejected</div>
              <div className="fs-3 fw-bold text-danger">{stats?.rejectedVouchers || 0}</div>
              <div className="small text-muted">Disallowed</div>
            </div>
          </div>
        </div>

        <div className="col-sm-12 col-lg-4">
          <div className="card shadow-sm border-0 border-start border-4 border-info h-100 bg-light">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">
                Total Approved Expense Amount
              </div>
              <div className="fs-3 fw-bold text-success">
                ₹{Number(stats?.totalApprovedExpenseAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="small text-muted">Total cleared for reimbursement</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Approved Vouchers Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-semibold text-success">
            <i className="bi bi-check-circle me-2"></i> Recent Approved Vouchers (Ready for Reimbursement)
          </h5>
          <Link to="/accounts/vouchers" className="btn btn-sm btn-outline-primary">
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
                <th className="text-end">Approved Amount</th>
                <th>Approval Date</th>
                <th>Director Sign</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentApprovedVouchers?.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No approved vouchers yet.
                  </td>
                </tr>
              ) : (
                stats?.recentApprovedVouchers?.map((v) => (
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
                      <div className="fw-semibold text-truncate" style={{ maxWidth: '200px' }}>
                        {v.expenseTitle}
                      </div>
                    </td>
                    <td className="text-end fw-bold text-success">
                      ₹{Number(v.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>{v.approvalDate || 'Today'}</td>
                    <td>
                      {v.hasDirectorSignature ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          <i className="bi bi-check2-circle me-1"></i> Verified
                        </span>
                      ) : (
                        <span className="badge bg-secondary">Pending</span>
                      )}
                    </td>
                    <td className="text-center">
                      <Link to={`/vouchers/${v.id}`} className="btn btn-sm btn-outline-secondary">
                        <i className="bi bi-eye me-1"></i> Details
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
