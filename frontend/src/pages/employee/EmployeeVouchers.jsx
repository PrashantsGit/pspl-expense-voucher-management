import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { employeeApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import VoucherFilterBar from '../../components/VoucherFilterBar';

const EmployeeVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterParams, setFilterParams] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Submit / Delete Modal State
  const [actionVoucher, setActionVoucher] = useState(null);
  const [actionType, setActionType] = useState(null); // 'SUBMIT' | 'DELETE' | 'UPLOAD_SIG'
  const [signatureFile, setSignatureFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();

  const fetchVouchers = async (params = {}) => {
    try {
      setLoading(true);
      setError('');
      const res = await employeeApi.getMyVouchers(params);
      setVouchers(res.data);
    } catch (err) {
      setError('Failed to fetch your vouchers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers(filterParams);
  }, [filterParams]);

  const handleFilter = (filters) => {
    setFilterParams(filters);
  };

  const handleReset = () => {
    setFilterParams({});
  };

  const handleOpenSubmitModal = (voucher) => {
    setActionVoucher(voucher);
    if (!voucher.hasEmployeeSignature) {
      setActionType('UPLOAD_SIG');
    } else {
      setActionType('SUBMIT');
    }
    setSignatureFile(null);
  };

  const handleOpenDeleteModal = (voucher) => {
    setActionVoucher(voucher);
    setActionType('DELETE');
  };

  const handleExecuteAction = async () => {
    if (!actionVoucher) return;
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      if (actionType === 'UPLOAD_SIG') {
        if (!signatureFile) {
          setError('Please select an employee signature image file to proceed.');
          setActionLoading(false);
          return;
        }
        await employeeApi.uploadSignature(actionVoucher.id, signatureFile);
        // Automatically submit after signature is uploaded
        await employeeApi.submitVoucher(actionVoucher.id);
        setSuccess(`Voucher ${actionVoucher.voucherNumber} submitted successfully for approval!`);
      } else if (actionType === 'SUBMIT') {
        await employeeApi.submitVoucher(actionVoucher.id);
        setSuccess(`Voucher ${actionVoucher.voucherNumber} submitted successfully for approval!`);
      } else if (actionType === 'DELETE') {
        await employeeApi.deleteDraft(actionVoucher.id);
        setSuccess(`Draft voucher ${actionVoucher.voucherNumber} deleted successfully.`);
      }

      setActionVoucher(null);
      setActionType(null);
      fetchVouchers(filterParams);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Operation failed. Please check requirements.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">My Expense Vouchers</h2>
          <p className="text-muted mb-0 small">
            View, track, and manage all your submitted and draft vouchers
          </p>
        </div>
        <Link to="/employee/vouchers/new" className="btn btn-primary d-flex align-items-center gap-2">
          <i className="bi bi-plus-lg"></i>
          <span>Create Voucher</span>
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {/* Filter Component */}
      <VoucherFilterBar
        onFilter={handleFilter}
        onReset={handleReset}
        showEmployeeFilter={false}
      />

      {/* Vouchers Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Voucher #</th>
                <th>Expense Date</th>
                <th>Title / Category</th>
                <th>Department</th>
                <th className="text-end">Amount</th>
                <th>Signature</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Loading your vouchers...
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No vouchers match your criteria.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link to={`/vouchers/${v.id}`} className="fw-bold text-decoration-none">
                        {v.voucherNumber}
                      </Link>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Created: {new Date(v.createdDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td>{v.expenseDate}</td>
                    <td>
                      <div className="fw-semibold text-truncate" style={{ maxWidth: '220px' }}>
                        {v.expenseTitle}
                      </div>
                      <span className="badge bg-light text-dark border small">
                        {v.expenseCategory}
                      </span>
                    </td>
                    <td>{v.departmentName}</td>
                    <td className="text-end fw-bold text-dark">
                      ₹{Number(v.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      {v.hasEmployeeSignature ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          <i className="bi bi-check me-1"></i> Attached
                        </span>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                          <i className="bi bi-dash-circle me-1"></i> Missing
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <Link
                          to={`/vouchers/${v.id}`}
                          className="btn btn-outline-secondary"
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>

                        {v.status === 'DRAFT' && (
                          <>
                            <Link
                              to={`/employee/vouchers/${v.id}/edit`}
                              className="btn btn-outline-primary"
                              title="Edit Draft"
                            >
                              <i className="bi bi-pencil"></i>
                            </Link>

                            <button
                              type="button"
                              className="btn btn-outline-success"
                              onClick={() => handleOpenSubmitModal(v)}
                              title="Submit for Approval"
                            >
                              <i className="bi bi-send"></i>
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleOpenDeleteModal(v)}
                              title="Delete Draft"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {actionVoucher && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {actionType === 'DELETE' && 'Confirm Delete Draft'}
                  {actionType === 'SUBMIT' && 'Submit Voucher for Approval'}
                  {actionType === 'UPLOAD_SIG' && 'Upload Signature & Submit'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setActionVoucher(null);
                    setActionType(null);
                  }}
                  disabled={actionLoading}
                ></button>
              </div>

              <div className="modal-body">
                {actionType === 'DELETE' && (
                  <p className="mb-0">
                    Are you sure you want to delete draft voucher{' '}
                    <strong>{actionVoucher.voucherNumber}</strong>? This action cannot be undone.
                  </p>
                )}

                {actionType === 'SUBMIT' && (
                  <div>
                    <p>
                      Are you sure you want to submit voucher{' '}
                      <strong>{actionVoucher.voucherNumber}</strong> for Director approval?
                    </p>
                    <div className="alert alert-info py-2 small mb-0">
                      <i className="bi bi-info-circle me-1"></i> Once submitted, this voucher
                      becomes read-only and cannot be edited.
                    </div>
                  </div>
                )}

                {actionType === 'UPLOAD_SIG' && (
                  <div>
                    <div className="alert alert-warning py-2 small mb-3">
                      <i className="bi bi-exclamation-triangle me-1"></i> A valid Employee
                      Signature is <strong>mandatory</strong> before submission.
                    </div>
                    <label className="form-label small fw-semibold">
                      Upload Signature Image (PNG, JPG, WebP - Max 5MB):
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => setSignatureFile(e.target.files[0])}
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setActionVoucher(null);
                    setActionType(null);
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${actionType === 'DELETE' ? 'btn-danger' : 'btn-primary'}`}
                  onClick={handleExecuteAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : actionType === 'DELETE' ? (
                    'Delete Draft'
                  ) : (
                    'Submit Voucher'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeVouchers;
