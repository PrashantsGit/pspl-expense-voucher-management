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
      setVouchers(res.data);
    } catch (err) {
      setError('Failed to fetch vouchers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers(filterParams);
  }, [filterParams]);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">All Organization Vouchers</h2>
          <p className="text-muted mb-0 small">
            Master repository of all employee expense claims across PSPL
          </p>
        </div>
        <Link to="/director/pending" className="btn btn-warning btn-sm fw-semibold">
          <i className="bi bi-hourglass-split me-1"></i> Review Pending Approvals
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <VoucherFilterBar
        onFilter={(filters) => setFilterParams(filters)}
        onReset={() => setFilterParams({})}
        showEmployeeFilter={true}
      />

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Voucher #</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Expense Title</th>
                <th>Expense Date</th>
                <th className="text-end">Amount</th>
                <th>Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Loading organization vouchers...
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No vouchers match your filter criteria.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link to={`/vouchers/${v.id}`} className="fw-bold text-decoration-none">
                        {v.voucherNumber}
                      </Link>
                    </td>
                    <td>
                      <div className="fw-semibold">{v.employeeName}</div>
                      <div className="text-muted small">{v.employeeCustomId || ''}</div>
                    </td>
                    <td>{v.departmentName}</td>
                    <td>
                      <div className="fw-medium text-truncate" style={{ maxWidth: '220px' }}>
                        {v.expenseTitle}
                      </div>
                      <span className="badge bg-light text-dark border small">
                        {v.expenseCategory}
                      </span>
                    </td>
                    <td>{v.expenseDate}</td>
                    <td className="text-end fw-bold">
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

export default DirectorVouchers;
