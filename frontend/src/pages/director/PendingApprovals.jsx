import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { directorApi } from '../../services/api';
import SignatureViewer from '../../components/SignatureViewer';

const PendingApprovals = () => {
  const [pendingVouchers, setPendingVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'APPROVE' | 'REJECT'
  const [directorSignatureFile, setDirectorSignatureFile] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await directorApi.getPendingVouchers();
      setPendingVouchers(res.data);
    } catch (err) {
      setError('Failed to fetch pending approval vouchers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleOpenApproveModal = (voucher) => {
    setSelectedVoucher(voucher);
    setModalMode('APPROVE');
    setDirectorSignatureFile(null);
    setError('');
  };

  const handleOpenRejectModal = (voucher) => {
    setSelectedVoucher(voucher);
    setModalMode('REJECT');
    setRejectionReason('');
    setError('');
  };

  const handleCloseModal = () => {
    setSelectedVoucher(null);
    setModalMode(null);
    setDirectorSignatureFile(null);
    setRejectionReason('');
  };

  const handleApprove = async () => {
    if (!directorSignatureFile) {
      setError('Director signature image is mandatory for approving a voucher.');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      await directorApi.approveVoucher(selectedVoucher.id, directorSignatureFile);
      setSuccess(`Voucher ${selectedVoucher.voucherNumber} approved successfully!`);
      handleCloseModal();
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve voucher.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is mandatory when rejecting a voucher.');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      await directorApi.rejectVoucher(selectedVoucher.id, rejectionReason.trim());
      setSuccess(`Voucher ${selectedVoucher.voucherNumber} rejected with remarks.`);
      handleCloseModal();
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject voucher.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Pending Approval Queue</h2>
          <p className="text-muted mb-0 small">
            Review submitted vouchers, examine employee signatures, and approve or reject claims
          </p>
        </div>
        <button onClick={fetchPending} className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh Queue
        </button>
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

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="mt-2 text-muted">Loading pending approvals...</div>
        </div>
      ) : pendingVouchers.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5">
          <div className="card-body">
            <i className="bi bi-check-circle text-success fs-1 mb-2"></i>
            <h4 className="fw-semibold">All Caught Up!</h4>
            <p className="text-muted mb-3">There are currently no vouchers awaiting Director approval.</p>
            <Link to="/director/vouchers" className="btn btn-outline-primary">
              View All Vouchers Archive
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {pendingVouchers.map((voucher) => (
            <div key={voucher.id} className="col-lg-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
                  <div>
                    <span className="badge bg-warning text-dark me-2">
                      <i className="bi bi-clock-history me-1"></i> Pending Approval
                    </span>
                    <span className="fw-bold text-dark">{voucher.voucherNumber}</span>
                  </div>
                  <div className="fs-5 fw-bold text-primary">
                    ₹{Number(voucher.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="card-body">
                  <h5 className="fw-bold mb-1">{voucher.expenseTitle}</h5>
                  <div className="d-flex gap-2 mb-3">
                    <span className="badge bg-light text-dark border">{voucher.expenseCategory}</span>
                    <span className="badge bg-light text-dark border">{voucher.departmentName}</span>
                  </div>

                  <p className="text-muted small mb-3 bg-light p-2 rounded">
                    {voucher.expenseDescription}
                  </p>

                  <div className="row g-2 mb-3 small">
                    <div className="col-6">
                      <div className="text-muted">Employee:</div>
                      <div className="fw-semibold">{voucher.employeeName}</div>
                      <div className="text-muted small">{voucher.employeeCustomId || ''}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted">Expense Date:</div>
                      <div className="fw-semibold">{voucher.expenseDate}</div>
                    </div>
                  </div>

                  {/* Employee Signature Preview */}
                  <div className="mb-3">
                    <div className="small fw-semibold text-muted mb-1">
                      Verified Employee Signature:
                    </div>
                    {voucher.hasEmployeeSignature ? (
                      <SignatureViewer
                        voucherId={voucher.id}
                        type="employee"
                        altText="Employee Signature"
                      />
                    ) : (
                      <div className="alert alert-warning py-1 small mb-0">
                        <i className="bi bi-exclamation-circle me-1"></i> No signature attached
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-footer bg-white border-top py-3 d-flex justify-content-between align-items-center">
                  <Link to={`/vouchers/${voucher.id}`} className="btn btn-sm btn-outline-secondary">
                    <i className="bi bi-eye me-1"></i> View Full Details
                  </Link>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                      onClick={() => handleOpenRejectModal(voucher)}
                    >
                      <i className="bi bi-x-circle"></i> Reject
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-success d-flex align-items-center gap-1"
                      onClick={() => handleOpenApproveModal(voucher)}
                    >
                      <i className="bi bi-check-circle"></i> Approve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {selectedVoucher && modalMode === 'APPROVE' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-check-circle-fill me-2"></i> Approve Voucher
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
              </div>

              <div className="modal-body">
                <p>
                  You are approving voucher <strong>{selectedVoucher.voucherNumber}</strong> for{' '}
                  <strong>{selectedVoucher.employeeName}</strong> totaling{' '}
                  <strong className="text-success">
                    ₹{Number(selectedVoucher.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>.
                </p>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">
                    Director Signature Image <span className="text-danger">*</span> (Mandatory)
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => setDirectorSignatureFile(e.target.files[0])}
                    required
                  />
                  <div className="form-text small">
                    Please upload your digital approval signature (PNG, JPG, or WebP up to 5MB).
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={actionLoading}>
                  Cancel
                </button>
                <button type="button" className="btn btn-success fw-semibold" onClick={handleApprove} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Approving...
                    </>
                  ) : (
                    'Confirm Approval'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedVoucher && modalMode === 'REJECT' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-x-circle-fill me-2"></i> Reject Voucher
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
              </div>

              <div className="modal-body">
                <p>
                  Rejecting voucher <strong>{selectedVoucher.voucherNumber}</strong>. The employee will be able to review your rejection reason.
                </p>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">
                    Rejection Reason <span className="text-danger">*</span> (Mandatory)
                  </label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Enter detailed reason for rejection (e.g. Non-compliant category, missing tax invoices, budget exceed)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={actionLoading}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger fw-semibold" onClick={handleReject} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Rejecting...
                    </>
                  ) : (
                    'Confirm Rejection'
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

export default PendingApprovals;
