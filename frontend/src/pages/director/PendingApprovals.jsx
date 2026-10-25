import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { directorApi } from '../../services/api';
import SignatureViewer from '../../components/SignatureViewer';
import StatusBadge from '../../components/StatusBadge';

const PendingApprovals = () => {
  const [pendingVouchers, setPendingVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'APPROVE' | 'REJECT'
  const [directorSignatureFile, setDirectorSignatureFile] = useState(null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await directorApi.getPendingVouchers();
      setPendingVouchers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending approval vouchers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // Calculate total pending claim amount
  const totalPendingAmount = useMemo(() => {
    return pendingVouchers.reduce((acc, v) => acc + (Number(v.amount) || 0), 0);
  }, [pendingVouchers]);

  // Initials generator for employee avatar
  const getInitials = (name) => {
    if (!name) return 'EM';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleOpenApproveModal = (voucher) => {
    setSelectedVoucher(voucher);
    setModalMode('APPROVE');
    setDirectorSignatureFile(null);
    if (signaturePreviewUrl) {
      URL.revokeObjectURL(signaturePreviewUrl);
      setSignaturePreviewUrl(null);
    }
    setError('');
  };

  const handleOpenRejectModal = (voucher) => {
    setSelectedVoucher(voucher);
    setModalMode('REJECT');
    setRejectionReason('');
    setError('');
  };

  const handleCloseModal = () => {
    if (signaturePreviewUrl) {
      URL.revokeObjectURL(signaturePreviewUrl);
    }
    setSelectedVoucher(null);
    setModalMode(null);
    setDirectorSignatureFile(null);
    setSignaturePreviewUrl(null);
    setRejectionReason('');
  };

  const handleSignatureFileChange = (e) => {
    const file = e.target.files?.[0];
    if (signaturePreviewUrl) {
      URL.revokeObjectURL(signaturePreviewUrl);
    }

    if (file) {
      setDirectorSignatureFile(file);
      setSignaturePreviewUrl(URL.createObjectURL(file));
    } else {
      setDirectorSignatureFile(null);
      setSignaturePreviewUrl(null);
    }
  };

  const handleClearSelectedSignature = () => {
    if (signaturePreviewUrl) {
      URL.revokeObjectURL(signaturePreviewUrl);
    }
    setDirectorSignatureFile(null);
    setSignaturePreviewUrl(null);
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
      setSuccess(`Voucher ${selectedVoucher.voucherNumber} approved successfully with Director signature.`);
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
      setSuccess(`Voucher ${selectedVoucher.voucherNumber} was returned with rejection remarks.`);
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
      {/* 1. Header & Summary Strip */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom">
        <div>
          <div className="text-primary small fw-semibold text-uppercase tracking-wider mb-1 d-flex align-items-center gap-1.5">
            <i className="bi bi-shield-check"></i>
            <span>Executive Review Portal • Pending Approvals Queue</span>
          </div>
          <h2 className="fw-bold text-dark mb-1">Pending Approval Queue</h2>
          <p className="text-muted small mb-0">
            Review submitted employee expense claims, inspect verified digital signatures, and execute approval or rejection.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link
            to="/director/vouchers"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2 btn-sm"
          >
            <i className="bi bi-archive"></i>
            <span>All Vouchers</span>
          </Link>
          <button
            onClick={fetchPending}
            disabled={loading}
            className="btn btn-outline-primary d-inline-flex align-items-center gap-2 px-3 py-2 btn-sm"
            title="Refresh queue"
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* 2. Overview Banner / Metrics Pill Strip */}
      <div className="card shadow-sm border-0 mb-4 bg-white">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-5 border-md-end">
              <div className="d-flex align-items-center gap-3">
                <div className="metric-icon-box bg-warning-subtle-box">
                  <i className="bi bi-hourglass-split"></i>
                </div>
                <div>
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider d-block">
                    Queue Volume
                  </span>
                  <div className="fs-4 fw-bold text-dark tabular-nums">
                    {pendingVouchers.length} {pendingVouchers.length === 1 ? 'Voucher' : 'Vouchers'} Pending
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4 border-md-end">
              <div className="d-flex align-items-center gap-3">
                <div className="metric-icon-box bg-primary-subtle-box">
                  <i className="bi bi-currency-rupee"></i>
                </div>
                <div>
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider d-block">
                    Total Awaiting Sign-Off
                  </span>
                  <div className="fs-4 fw-bold text-dark tabular-nums">
                    ₹{totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-3">
              <div className="d-flex align-items-center gap-2 text-secondary small">
                <i className="bi bi-pen text-primary fs-5"></i>
                <div>
                  <span className="fw-semibold text-dark d-block">Digital Signature</span>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>Mandatory for approvals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center justify-content-between p-3 mb-4 shadow-sm" role="alert">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-octagon-fill fs-5"></i>
            <div>{error}</div>
          </div>
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      {/* Success Feedback */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center justify-content-between p-3 mb-4 shadow-sm" role="alert">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-check-circle-fill fs-5"></i>
            <div>{success}</div>
          </div>
          <button type="button" className="btn-close" onClick={() => setSuccess('')} aria-label="Close"></button>
        </div>
      )}

      {/* 3. Main Queue State */}
      {loading ? (
        <div className="card shadow-sm border-0 text-center py-5">
          <div className="card-body">
            <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}></div>
            <div className="mt-3 text-muted small fw-medium">Loading pending approval queue...</div>
          </div>
        </div>
      ) : pendingVouchers.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5 px-3">
          <div className="card-body py-4">
            <div className="metric-icon-box bg-success-subtle-box mx-auto mb-3" style={{ width: '56px', height: '56px', fontSize: '1.75rem' }}>
              <i className="bi bi-check-lg"></i>
            </div>
            <h4 className="fw-bold text-dark mb-1">All Caught Up!</h4>
            <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '440px' }}>
              There are currently zero employee expense vouchers awaiting Director review or signature. All claims have been processed.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <Link to="/director/vouchers" className="btn btn-outline-primary d-inline-flex align-items-center gap-2">
                <i className="bi bi-files"></i>
                <span>Explore All Vouchers Archive</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {pendingVouchers.map((voucher) => (
            <div key={voucher.id} className="col-12 col-xl-6">
              <div className="card shadow-sm border-0 h-100 d-flex flex-column">
                {/* Voucher Card Header */}
                <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <StatusBadge status={voucher.status} />
                    <Link
                      to={`/vouchers/${voucher.id}`}
                      className="fw-bold text-primary font-monospace text-decoration-none"
                      title="View voucher details"
                    >
                      {voucher.voucherNumber}
                    </Link>
                  </div>
                  <div className="text-end">
                    <span className="text-muted small d-block" style={{ fontSize: '0.72rem' }}>
                      Claim Amount
                    </span>
                    <span className="fs-5 fw-bold text-dark tabular-nums">
                      ₹{Number(voucher.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Voucher Card Body */}
                <div className="card-body p-4 d-flex flex-column">
                  {/* Expense Title & Category Pills */}
                  <div className="mb-3">
                    <h5 className="fw-bold text-dark mb-2 text-truncate" title={voucher.expenseTitle}>
                      {voucher.expenseTitle}
                    </h5>
                    <div className="d-flex flex-wrap gap-1.5 align-items-center">
                      <span className="badge bg-light text-secondary border d-inline-flex align-items-center gap-1">
                        <i className="bi bi-tag"></i>
                        <span>{voucher.expenseCategory}</span>
                      </span>
                      <span className="badge bg-light text-secondary border d-inline-flex align-items-center gap-1">
                        <i className="bi bi-building"></i>
                        <span>{voucher.departmentName}</span>
                      </span>
                    </div>
                  </div>

                  {/* Expense Description */}
                  <div
                    className="p-3 bg-light rounded-3 border border-light-subtle small text-secondary mb-3"
                    style={{ whiteSpace: 'pre-wrap', maxHeight: '110px', overflowY: 'auto' }}
                  >
                    {voucher.expenseDescription}
                  </div>

                  {/* Employee & Submission Details */}
                  <div className="row g-2 mb-3 pb-3 border-bottom align-items-center">
                    <div className="col-sm-7 d-flex align-items-center gap-2.5">
                      <div className="avatar-circle-sm">
                        {getInitials(voucher.employeeName)}
                      </div>
                      <div className="text-truncate">
                        <div className="fw-semibold text-dark text-truncate small">
                          {voucher.employeeName}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {voucher.employeeCustomId ? `Employee ID: ${voucher.employeeCustomId}` : 'Employee'}
                        </div>
                      </div>
                    </div>

                    <div className="col-sm-5 text-sm-end">
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Expense Date</div>
                      <div className="fw-semibold text-dark small tabular-nums">
                        <i className="bi bi-calendar3 me-1 text-muted"></i>
                        {voucher.expenseDate}
                      </div>
                    </div>
                  </div>

                  {/* Verified Employee Digital Signature */}
                  <div className="mb-2">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="small fw-semibold text-dark d-inline-flex align-items-center gap-1.5">
                        <i className="bi bi-shield-check text-success"></i>
                        <span>Verified Employee Digital Signature</span>
                      </span>
                      {voucher.hasEmployeeSignature ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
                          Verified
                        </span>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
                          Missing
                        </span>
                      )}
                    </div>

                    <div className="p-2 bg-light rounded-3 border border-subtle text-center">
                      {voucher.hasEmployeeSignature ? (
                        <SignatureViewer
                          voucherId={voucher.id}
                          type="employee"
                          altText={`Signature of ${voucher.employeeName}`}
                        />
                      ) : (
                        <div className="py-2 text-muted small">
                          <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>
                          No signature attached by employee
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="card-footer bg-white border-top py-3 px-4 d-flex justify-content-between align-items-center mt-auto flex-wrap gap-2">
                  <Link
                    to={`/vouchers/${voucher.id}`}
                    className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5"
                  >
                    <i className="bi bi-eye"></i>
                    <span>Full Details</span>
                  </Link>

                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 fw-semibold"
                      onClick={() => handleOpenRejectModal(voucher)}
                    >
                      <i className="bi bi-x-circle"></i>
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-success d-inline-flex align-items-center gap-1.5 fw-semibold shadow-sm"
                      onClick={() => handleOpenApproveModal(voucher)}
                    >
                      <i className="bi bi-check-circle-fill"></i>
                      <span>Approve Claim</span>
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
        <div className="pspl-modal-backdrop" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom py-3 px-4 bg-white">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="metric-icon-box bg-success-subtle-box" style={{ width: '36px', height: '36px' }}>
                    <i className="bi bi-check2-circle fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">Authorize & Approve Voucher</h5>
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Executive digital sign-off</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  disabled={actionLoading}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4">
                {/* Voucher Highlight Callout */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span className="text-muted small text-uppercase tracking-wider d-block" style={{ fontSize: '0.72rem' }}>
                        Voucher #
                      </span>
                      <span className="fw-bold text-primary font-monospace">{selectedVoucher.voucherNumber}</span>
                    </div>
                    <div className="text-end">
                      <span className="text-muted small text-uppercase tracking-wider d-block" style={{ fontSize: '0.72rem' }}>
                        Approved Amount
                      </span>
                      <span className="fs-5 fw-bold text-success tabular-nums">
                        ₹{Number(selectedVoucher.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="small text-secondary pt-2 border-top">
                    <span className="text-muted">Employee:</span> <strong className="text-dark">{selectedVoucher.employeeName}</strong> • {selectedVoucher.departmentName}
                  </div>
                </div>

                {/* Director Signature Upload Dropzone */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>Director Digital Signature <span className="text-danger">*</span></span>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.7rem' }}>Mandatory</span>
                  </label>

                  {signaturePreviewUrl ? (
                    <div className="border rounded-3 p-3 bg-light text-center">
                      <div className="text-muted small mb-2 d-flex align-items-center justify-content-between">
                        <span className="fw-semibold text-dark">
                          <i className="bi bi-image text-primary me-1"></i>
                          {directorSignatureFile?.name}
                        </span>
                        <span className="text-muted">
                          ({(directorSignatureFile?.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded border d-inline-block shadow-sm mb-2">
                        <img
                          src={signaturePreviewUrl}
                          alt="Director Signature Preview"
                          className="img-fluid"
                          style={{ maxHeight: '110px', maxWidth: '300px', objectFit: 'contain' }}
                        />
                      </div>
                      <div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger py-1 px-2.5 d-inline-flex align-items-center gap-1"
                          onClick={handleClearSelectedSignature}
                          disabled={actionLoading}
                        >
                          <i className="bi bi-trash"></i>
                          <span>Remove & Choose Another</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="upload-dropzone d-block mb-1">
                        <i className="bi bi-cloud-arrow-up fs-2 text-primary d-block mb-2"></i>
                        <span className="fw-semibold text-dark d-block">Click to browse or drop signature image</span>
                        <span className="text-muted small d-block mt-1">PNG, JPG, or WebP up to 5MB</span>
                        <input
                          type="file"
                          className="d-none"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleSignatureFileChange}
                          required
                          disabled={actionLoading}
                        />
                      </label>
                    </div>
                  )}

                  <div className="small text-muted d-flex align-items-start gap-1.5 mt-2">
                    <i className="bi bi-info-circle text-primary flex-shrink-0 mt-0.5"></i>
                    <span>
                      Your signature will be permanently watermarked on the official voucher audit trail and the voucher will advance to Approved status.
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light border-top py-3 px-4 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleCloseModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm px-3"
                  onClick={handleApprove}
                  disabled={actionLoading || !directorSignatureFile}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-check"></i>
                      <span>Confirm & Sign Approval</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedVoucher && modalMode === 'REJECT' && (
        <div className="pspl-modal-backdrop" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom py-3 px-4 bg-white">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="metric-icon-box bg-danger-subtle-box" style={{ width: '36px', height: '36px' }}>
                    <i className="bi bi-x-circle fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">Reject Voucher Claim</h5>
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Return claim with formal remarks</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  disabled={actionLoading}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4">
                {/* Warning Banner */}
                <div className="alert alert-danger-subtle border border-danger-subtle text-danger-emphasis small p-2.5 rounded-3 mb-3 d-flex align-items-start gap-2">
                  <i className="bi bi-exclamation-triangle-fill flex-shrink-0 mt-0.5"></i>
                  <span>
                    Rejecting this voucher will return it to the employee with your remarks. This decision will be permanently logged.
                  </span>
                </div>

                {/* Voucher Highlight Callout */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span className="text-muted small text-uppercase tracking-wider d-block" style={{ fontSize: '0.72rem' }}>
                        Voucher #
                      </span>
                      <span className="fw-bold text-primary font-monospace">{selectedVoucher.voucherNumber}</span>
                    </div>
                    <div className="text-end">
                      <span className="text-muted small text-uppercase tracking-wider d-block" style={{ fontSize: '0.72rem' }}>
                        Claim Amount
                      </span>
                      <span className="fs-5 fw-bold text-danger tabular-nums">
                        ₹{Number(selectedVoucher.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="small text-secondary pt-2 border-top">
                    <span className="text-muted">Employee:</span> <strong className="text-dark">{selectedVoucher.employeeName}</strong> • {selectedVoucher.departmentName}
                  </div>
                </div>

                {/* Mandatory Remarks Textarea */}
                <div className="mb-2">
                  <label className="form-label fw-semibold small text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>Rejection Remarks <span className="text-danger">*</span></span>
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '0.7rem' }}>Mandatory</span>
                  </label>
                  <textarea
                    rows="4"
                    className="form-control"
                    placeholder="Enter explicit reason for rejection (e.g. Non-compliant expense category, missing itemized tax invoices, exceeding travel budget threshold)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    disabled={actionLoading}
                  ></textarea>
                  <div className="form-text small text-muted mt-1">
                    The employee will be informed of this reason to enable them to make required corrections.
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light border-top py-3 px-4 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleCloseModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm px-3"
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-x-circle"></i>
                      <span>Confirm Rejection</span>
                    </>
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