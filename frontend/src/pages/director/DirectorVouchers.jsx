import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { directorApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import VoucherFilterBar from '../../components/VoucherFilterBar';

const DirectorVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterParams, setFilterParams] = useState({});
  const [error, setError] = useState('');

  const fetchVouchers = async (params = {}) => {
    try {
      setLoading(true);
      setError('');
      const res = await directorApi.getAllVouchers(params);
      setVouchers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch vouchers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers(filterParams);
  }, [filterParams]);

  return (
    <div className="container py-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom">
        <div>
          <div className="text-primary small fw-semibold text-uppercase tracking-wider mb-1 d-flex align-items-center gap-1.5">
            <i className="bi bi-shield-check"></i>
            <span>Executive Review Portal • Master Repository</span>
          </div>
          <h2 className="fw-bold text-dark mb-1">All Organization Vouchers</h2>
          <p className="text-muted small mb-0">
            Master repository of all employee expense claims across Prachay Securities.
          </p>
        </div>
        <Link
          to="/director/pending"
          className="btn btn-warning text-dark btn-sm fw-semibold d-inline-flex align-items-center gap-1.5 px-3 py-2 shadow-sm"
        >
          <i className="bi bi-hourglass-split"></i>
          <span>Pending Approvals Queue</span>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center justify-content-between p-3 mb-4 shadow-sm" role="alert">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-octagon-fill fs-5"></i>
            <div>{error}</div>
          </div>
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      {/* Filter Component */}
      <VoucherFilterBar
        onFilter={(filters) => setFilterParams(filters)}
        onReset={() => setFilterParams({})}
        showEmployeeFilter={true}
      />

      {/* Vouchers Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col" style={{ width: '150px' }}>Voucher #</th>
                <th scope="col">Employee</th>
                <th scope="col">Department</th>
                <th scope="col">Expense Title & Category</th>
                <th scope="col" style={{ width: '120px' }}>Expense Date</th>
                <th scope="col" className="text-end" style={{ width: '140px' }}>Amount</th>
                <th scope="col" className="text-center" style={{ width: '140px' }}>Status</th>
                <th scope="col" className="text-end" style={{ width: '100px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Loading organization vouchers...
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <i className="bi bi-search fs-2 text-muted d-block mb-2"></i>
                    No vouchers match your filter criteria.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link
                        to={`/vouchers/${v.id}`}
                        className="fw-bold text-primary font-monospace text-decoration-none d-inline-flex align-items-center gap-1.5"
                      >
                        <i className="bi bi-file-earmark-text text-muted"></i>
                        <span>{v.voucherNumber}</span>
                      </Link>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{v.employeeName}</div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        {v.employeeCustomId ? `ID: ${v.employeeCustomId}` : ''}
                      </div>
                    </td>
                    <td className="text-secondary">{v.departmentName}</td>
                    <td>
                      <div className="fw-medium text-dark text-truncate" style={{ maxWidth: '220px' }} title={v.expenseTitle}>
                        {v.expenseTitle}
                      </div>
                      <span className="badge bg-light text-secondary border small mt-0.5">
                        {v.expenseCategory}
                      </span>
                    </td>
                    <td className="small text-muted tabular-nums">{v.expenseDate}</td>
                    <td className="text-end">
                      <span className="fw-bold text-dark tabular-nums">
                        ₹{Number(v.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="text-center">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="text-end">
                      <Link
                        to={`/vouchers/${v.id}`}
                        className="btn btn-sm btn-outline-secondary py-1 px-2.5 d-inline-flex align-items-center gap-1"
                        title="View Full Voucher Details"
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

export default DirectorVouchers;