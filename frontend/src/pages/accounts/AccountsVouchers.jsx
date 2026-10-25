import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { accountsApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import VoucherFilterBar from '../../components/VoucherFilterBar';

const AccountsVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterParams, setFilterParams] = useState({});
  const [error, setError] = useState('');

  const fetchVouchers = async (params = {}) => {
    try {
      setLoading(true);
      setError('');
      const res = await accountsApi.getAllVouchers(params);
      setVouchers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch organization vouchers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers(filterParams);
  }, [filterParams]);

  // Compute total amount of currently filtered vouchers
  const totalFilteredAmount = useMemo(() => {
    return vouchers.reduce((acc, v) => acc + (Number(v.amount) || 0), 0);
  }, [vouchers]);

  // Check if any filter is active
  const hasActiveFilters = Object.keys(filterParams).length > 0;

  return (
    <div className="container py-4">
      {/* 1. Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom">
        <div>
          <div className="text-primary small fw-semibold text-uppercase tracking-wider mb-1 d-flex align-items-center gap-1.5">
            <i className="bi bi-shield-check"></i>
            <span>Financial Operations • Organization Voucher Repository</span>
          </div>
          <h2 className="fw-bold text-dark mb-1">Voucher Processing Workspace</h2>
          <p className="text-muted small mb-0">
            Comprehensive repository of company-wide expense vouchers for accounting review, audit verification, and financial monitoring.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 d-print-none">
          <button
            onClick={() => fetchVouchers(filterParams)}
            disabled={loading}
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2 btn-sm"
            title="Refresh voucher records"
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            <span>Refresh</span>
          </button>
          <button
            onClick={() => window.print()}
            className="btn btn-outline-primary d-inline-flex align-items-center gap-2 px-3 py-2 btn-sm"
            title="Print summary list"
          >
            <i className="bi bi-printer"></i>
            <span>Print Records</span>
          </button>
        </div>
      </div>

      {/* Error Feedback with Retry */}
      {error && (
        <div
          className="alert alert-danger d-flex align-items-center justify-content-between p-3 mb-4 shadow-sm d-print-none"
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-octagon-fill fs-5"></i>
            <span>{error}</span>
          </div>
          <button onClick={() => fetchVouchers(filterParams)} className="btn btn-outline-danger btn-sm">
            <i className="bi bi-arrow-clockwise me-1"></i> Retry
          </button>
        </div>
      )}

      {/* 2. Filter Bar (Hidden on print) */}
      <div className="d-print-none">
        <VoucherFilterBar
          onFilter={(filters) => setFilterParams(filters)}
          onReset={() => setFilterParams({})}
          showEmployeeFilter={true}
        />
      </div>

      {/* 3. Summary Strip */}
      <div className="card shadow-sm border-0 mb-3 bg-white">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-sm-6 col-md-4">
              <span className="text-muted small fw-semibold text-uppercase tracking-wider d-block">
                Matching Records
              </span>
              <div className="fs-5 fw-bold text-dark tabular-nums">
                {vouchers.length} {vouchers.length === 1 ? 'Voucher' : 'Vouchers'} Found
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-4 border-sm-start ps-sm-3">
              <span className="text-muted small fw-semibold text-uppercase tracking-wider d-block">
                Total Value
              </span>
              <div className="fs-5 fw-bold text-dark tabular-nums">
                ₹{totalFilteredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="col-12 col-md-4 text-md-end">
              {hasActiveFilters && (
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5">
                  <i className="bi bi-funnel-fill"></i>
                  <span>Active Filters Applied</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Voucher Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col" style={{ width: '150px' }}>Voucher #</th>
                <th scope="col">Employee & Dept</th>
                <th scope="col">Expense Title & Category</th>
                <th scope="col" style={{ width: '120px' }}>Expense Date</th>
                <th scope="col" className="text-end" style={{ width: '140px' }}>Amount</th>
                <th scope="col" className="text-center" style={{ width: '140px' }}>Signatures</th>
                <th scope="col" className="text-center" style={{ width: '140px' }}>Status</th>
                <th scope="col" className="text-end d-print-none" style={{ width: '100px' }}>Action</th>
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
                    No vouchers found matching your filter criteria.
                    {hasActiveFilters && (
                      <div className="mt-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setFilterParams({})}
                        >
                          Clear All Filters
                        </button>
                      </div>
                    )}
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
                    <td className="small text-muted tabular-nums">
                      {v.expenseDate}
                    </td>
                    <td className="text-end">
                      <span className="fw-bold text-dark tabular-nums">
                        ₹{Number(v.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-inline-flex align-items-center gap-1.5">
                        {v.hasEmployeeSignature ? (
                          <span
                            className="badge bg-success-subtle text-success border border-success-subtle px-1.5 py-0.5"
                            title="Employee Signature Verified"
                            style={{ fontSize: '0.7rem' }}
                          >
                            <i className="bi bi-check-circle-fill me-0.5"></i> Emp
                          </span>
                        ) : (
                          <span
                            className="badge bg-secondary-subtle text-secondary px-1.5 py-0.5"
                            title="Employee Signature Missing"
                            style={{ fontSize: '0.7rem' }}
                          >
                            <i className="bi bi-dash-circle me-0.5"></i> Emp
                          </span>
                        )}
                        {v.hasDirectorSignature ? (
                          <span
                            className="badge bg-primary-subtle text-primary border border-primary-subtle px-1.5 py-0.5"
                            title="Director Signature Verified"
                            style={{ fontSize: '0.7rem' }}
                          >
                            <i className="bi bi-check-circle-fill me-0.5"></i> Dir
                          </span>
                        ) : (
                          <span
                            className="badge bg-secondary-subtle text-secondary px-1.5 py-0.5"
                            title="Director Signature Pending"
                            style={{ fontSize: '0.7rem' }}
                          >
                            <i className="bi bi-dash-circle me-0.5"></i> Dir
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="text-end d-print-none">
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

export default AccountsVouchers;
