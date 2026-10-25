import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { voucherApi, employeeApi, directorApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import SignatureViewer from '../../components/SignatureViewer';

const VoucherDetail = () => {
  const { id } = useParams();
  const { isEmployee, isDirector, isAccounts } = useAuth();
  const navigate = useNavigate();

  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Director action modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [directorSignatureFile, setDirectorSignatureFile] = useState(null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVoucher = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await voucherApi.getById(id);
      setVoucher(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load voucher details or unauthorized.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVoucher();
  }, [fetchVoucher]);

  // Clean up signature object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (signaturePreviewUrl) {
        URL.revokeObjectURL(signaturePreviewUrl);
      }
    };
  }, [signaturePreviewUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleEmployeeSubmit = async () => {
    if (!voucher.hasEmployeeSignature) {
      setError('Please edit this draft and upload an employee signature before submitting for approval.');
      return;
    }
    setActionLoading(true);
    setError('');
    setActionSuccess('');
    try {
      await employeeApi.submitVoucher(voucher.id);
      setActionSuccess('Voucher submitted successfully for Director approval!');
      fetchVoucher();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit voucher.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenApproveModal = () => {
    setShowApproveModal(true);
    setDirectorSignatureFile(null);
    if (signaturePreviewUrl) {
      URL.revokeObjectURL(signaturePreviewUrl);
      setSignaturePreviewUrl(null);
    }
    setError('');
  };

  const handleCloseApproveModal = () => {
    if (signaturePreviewUrl) {
      URL.revokeObjectURL(signaturePreviewUrl);
      setSignaturePreviewUrl(null);
    }
    setShowApproveModal(false);
    setDirectorSignatureFile(null);
  };

  const handleOpenRejectModal = () => {
    setShowRejectModal(true);
    setRejectionReason('');
    setError('');
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
  };

  const handleSignatureFileChange = (e) => {
    const file = e.target.files?.[0];
    if (signaturePreviewUrl) {
      URL.revokeObjectURL(signaturePreviewUrl);
    }

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Signature file size must not exceed 5MB.');
        return;
      }
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only PNG, JPG, or WebP image formats are supported.');
        return;
      }
      setDirectorSignatureFile(file);
      setSignaturePreviewUrl(URL.createObjectURL(file));
      setError('');
    } else {
      setDirectorSignatureFile(null);
      setSignaturePreviewUrl(null);
    }
  };

  const handleDirectorApprove = async () => {
    if (!directorSignatureFile) {
      setError('Director signature image is required before approving.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await directorApi.approveVoucher(voucher.id, directorSignatureFile);
      setActionSuccess('Voucher approved successfully with Director signature!');
      handleCloseApproveModal();
      fetchVoucher();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve voucher.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectorReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is mandatory.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await directorApi.rejectVoucher(voucher.id, rejectionReason.trim());
      setActionSuccess('Voucher returned with rejection remarks.');
      handleCloseRejectModal();
      fetchVoucher();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject voucher.');
    } finally {
      setActionLoading(false);
    }
  };

  // Determine back navigation link based on role
  const getBackLink = () => {
    if (isDirector) return '/director/vouchers';
    if (isAccounts) return '/accounts/vouchers';
    return '/employee/vouchers';
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div
          className="spinner-border text-primary"
          role="status"
          style={{ width: '2.5rem', height: '2.5rem' }}
        ></div>
        <div className="mt-3 text-muted small fw-medium">Loading voucher document details...</div>
      </div>
    );
  }

  if (error && !voucher) {
    return (
      <div className="container py-5 text-center">
        <div className="card shadow-sm border-0 d-inline-block text-start p-4" style={{ maxWidth: '480px' }}>
          <div className="d-flex align-items-center gap-2 mb-2 text-danger">
            <i className="bi bi-shield-lock-fill fs-4"></i>
            <h5 className="fw-bold mb-0">Access Restriction</h5>
          </div>
          <p className="text-secondary small mb-3">{error}</p>
          <button onClick={() => navigate(-1)} className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-left me-1"></i> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* 1. Top Action & Navigation Bar (Hidden in Print) */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom d-print-none">
        <div className="d-flex align-items-center gap-2">
          <Link to={getBackLink()} className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1.5">
            <i className="bi bi-arrow-left"></i>
            <span>Back</span>
          </Link>
          <div>
            <div className="text-primary small fw-semibold text-uppercase tracking-wider mb-0.5" style={{ fontSize: '0.72rem' }}>
              Voucher Record Inspection
            </div>
            <h3 className="fw-bold text-dark mb-0 font-monospace">
              {voucher.voucherNumber}
            </h3>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Print Action (Available to all roles) */}
          <button
            onClick={handlePrint}
            className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-2"
            title="Print or export as PDF"
          >
            <i className="bi bi-printer"></i>
            <span>Print Document</span>
          </button>

          {/* Employee Draft Actions */}
          {isEmployee && voucher.status === 'DRAFT' && (
            <>
              <Link
                to={`/employee/vouchers/${voucher.id}/edit`}
                className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-2 fw-semibold"
              >
                <i className="bi bi-pencil"></i>
                <span>Edit Draft</span>
              </Link>
              <button
                type="button"
                onClick={handleEmployeeSubmit}
                className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-2 fw-semibold shadow-sm"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-fill"></i>
                    <span>Submit for Approval</span>
                  </>
                )}
              </button>
            </>
          )}

          {/* Director Review Actions */}
          {isDirector && voucher.status === 'PENDING_APPROVAL' && (
            <>
              <button
                type="button"
                onClick={handleOpenRejectModal}
                className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-2 fw-semibold"
                disabled={actionLoading}
              >
                <i className="bi bi-x-circle"></i>
                <span>Reject</span>
              </button>
              <button
                type="button"
                onClick={handleOpenApproveModal}
                className="btn btn-success btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-2 fw-semibold shadow-sm"
                disabled={actionLoading}
              >
                <i className="bi bi-check-circle-fill"></i>
                <span>Approve Claim</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center justify-content-between p-3 mb-4 shadow-sm d-print-none" role="alert">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-check-circle-fill fs-5"></i>
            <div>{actionSuccess}</div>
          </div>
          <button type="button" className="btn-close" onClick={() => setActionSuccess('')} aria-label="Close"></button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center justify-content-between p-3 mb-4 shadow-sm d-print-none" role="alert">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-octagon-fill fs-5"></i>
            <div>{error}</div>
          </div>
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      {/* 2. Visual Workflow Progression Bar (Screen only, d-print-none) */}
      <div className="card shadow-sm border-0 mb-4 bg-white d-print-none">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 text-center align-items-center">
            {/* Step 1: Draft Creation */}
            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                <span className="badge bg-success-subtle text-success rounded-circle p-1 d-inline-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                  <i className="bi bi-check"></i>
                </span>
                <span className="fw-semibold text-dark small">1. Draft Created</span>
              </div>
              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                {voucher.createdDate ? new Date(voucher.createdDate).toISOString().split('T')[0] : 'Created'}
              </div>
            </div>

            {/* Step 2: Employee Submission */}
            <div className="col-12 col-md-4 border-md-start">
              <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                {voucher.status === 'DRAFT' ? (
                  <span className="badge bg-warning-subtle text-warning rounded-circle p-1 d-inline-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                    <i className="bi bi-clock"></i>
                  </span>
                ) : (
                  <span className="badge bg-success-subtle text-success rounded-circle p-1 d-inline-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                    <i className="bi bi-check"></i>
                  </span>
                )}
                <span className="fw-semibold text-dark small">2. Employee Submission</span>
              </div>
              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                {voucher.hasEmployeeSignature ? 'Signed & Submitted' : 'Pending Signature & Submission'}
              </div>
            </div>

            {/* Step 3: Director Decision */}
            <div className="col-12 col-md-4 border-md-start">
              <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                {voucher.status === 'APPROVED' ? (
                  <span className="badge bg-success-subtle text-success rounded-circle p-1 d-inline-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                    <i className="bi bi-check-all"></i>
                  </span>
                ) : voucher.status === 'REJECTED' ? (
                  <span className="badge bg-danger-subtle text-danger rounded-circle p-1 d-inline-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                    <i className="bi bi-x"></i>
                  </span>
                ) : voucher.status === 'PENDING_APPROVAL' ? (
                  <span className="badge bg-primary-subtle text-primary rounded-circle p-1 d-inline-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                    <i className="bi bi-hourglass-split"></i>
                  </span>
                ) : (
                  <span className="badge bg-secondary-subtle text-secondary rounded-circle p-1 d-inline-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                    <i className="bi bi-dash"></i>
                  </span>
                )}
                <span className="fw-semibold text-dark small">3. Director Sign-Off</span>
              </div>
              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                {voucher.status === 'APPROVED'
                  ? `Approved (${voucher.approvalDate || 'Recorded'})`
                  : voucher.status === 'REJECTED'
                  ? 'Returned with Remarks'
                  : voucher.status === 'PENDING_APPROVAL'
                  ? 'Awaiting Director Sign-Off'
                  : 'Pending Submission'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Formal Rejection Notice (Shown only if status is REJECTED) */}
      {voucher.status === 'REJECTED' && (
        <div className="alert alert-danger border border-danger-subtle p-3 mb-4 rounded-3 shadow-sm">
          <div className="d-flex align-items-start gap-2.5">
            <i className="bi bi-x-octagon-fill fs-5 text-danger flex-shrink-0 mt-0.5"></i>
            <div>
              <h6 className="fw-bold mb-1 text-danger">Official Rejection Notice</h6>
              <p className="mb-0 small text-danger-emphasis" style={{ whiteSpace: 'pre-wrap' }}>
                {voucher.rejectionReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Formal Printable Voucher Document */}
      <div className="card shadow-sm border-0 p-4 p-md-5 bg-white mb-4" id="printable-voucher">
        {/* Document Header */}
        <div className="border-bottom pb-4 mb-4">
          <div className="row align-items-center g-3">
            <div className="col-8">
              <div className="d-flex align-items-center gap-3">
                <div className="sidebar-brand-icon" style={{ width: '42px', height: '42px' }}>
                  <i className="bi bi-wallet2 fs-5"></i>
                </div>
                <div>
                  <h4 className="fw-bold mb-0 text-dark">Prachay Securities Private Limited</h4>
                  <div className="text-muted small text-uppercase tracking-wider">
                    Corporate Expense Voucher & Reimbursement Claim
                  </div>
                </div>
              </div>
            </div>
            <div className="col-4 text-end">
              <div className="fs-5 fw-bold text-dark font-monospace tabular-nums">
                {voucher.voucherNumber}
              </div>
              <div className="mt-1">
                <StatusBadge status={voucher.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Voucher & Expense Details */}
        <div className="mb-4">
          <h6 className="fw-bold text-uppercase text-secondary border-bottom pb-2 mb-3 tracking-wider" style={{ fontSize: '0.8rem' }}>
            1. Voucher & Expense Details
          </h6>
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Voucher Date</div>
              <div className="fw-semibold text-dark tabular-nums">{voucher.voucherDate}</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Expense Date</div>
              <div className="fw-semibold text-dark tabular-nums">{voucher.expenseDate}</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Department</div>
              <div className="fw-semibold text-dark">{voucher.departmentName}</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Expense Category</div>
              <span className="badge bg-light text-secondary border">{voucher.expenseCategory}</span>
            </div>

            <div className="col-12 mt-3">
              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Expense Title</div>
              <div className="fs-5 fw-bold text-dark">{voucher.expenseTitle}</div>
            </div>

            <div className="col-12">
              <div className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>
                Business Purpose & Commercial Justification
              </div>
              <div className="p-3 bg-light rounded-3 text-secondary border border-light-subtle small" style={{ whiteSpace: 'pre-wrap' }}>
                {voucher.expenseDescription}
              </div>
            </div>

            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center p-3 bg-primary-subtle rounded-3 border border-primary-subtle mt-1">
                <div>
                  <span className="fw-bold text-primary-emphasis d-block">Total Claimed Amount</span>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>Inclusive of all itemized charges</span>
                </div>
                <div className="fs-3 fw-bold text-primary tabular-nums">
                  ₹{Number(voucher.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Employee Information & Signature */}
        <div className="mb-4">
          <h6 className="fw-bold text-uppercase text-secondary border-bottom pb-2 mb-3 tracking-wider" style={{ fontSize: '0.8rem' }}>
            2. Employee Information & Authorization
          </h6>
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="mb-2">
                <span className="text-muted small">Employee Name: </span>
                <span className="fw-semibold text-dark ms-1">{voucher.employeeName}</span>
              </div>
              <div className="mb-2">
                <span className="text-muted small">Employee ID: </span>
                <span className="fw-semibold text-dark ms-1">{voucher.employeeCustomId || 'N/A'}</span>
              </div>
              <div className="mb-2">
                <span className="text-muted small">Username: </span>
                <span className="text-secondary ms-1">{voucher.employeeUsername}</span>
              </div>
            </div>

            <div className="col-md-6 text-md-end">
              <div className="text-muted small mb-1.5 d-flex align-items-center justify-content-md-end gap-1.5">
                <i className="bi bi-shield-check text-success"></i>
                <span className="fw-semibold text-dark">Employee Digital Signature</span>
              </div>
              {voucher.hasEmployeeSignature ? (
                <div className="d-inline-block">
                  <SignatureViewer
                    voucherId={voucher.id}
                    type="employee"
                    altText={`Signature of ${voucher.employeeName}`}
                  />
                </div>
              ) : (
                <div className="p-3 bg-light border rounded-3 text-center text-muted small d-inline-block">
                  <i className="bi bi-clock me-1"></i> Signature Pending Submission
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Director Approval & Sign-Off */}
        <div className="mb-4">
          <h6 className="fw-bold text-uppercase text-secondary border-bottom pb-2 mb-3 tracking-wider" style={{ fontSize: '0.8rem' }}>
            3. Director Approval & Sign-Off
          </h6>
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="mb-2 d-flex align-items-center gap-2">
                <span className="text-muted small">Approval Status: </span>
                <StatusBadge status={voucher.status} />
              </div>
              <div className="mb-2">
                <span className="text-muted small">Authorizing Director: </span>
                <span className="fw-semibold text-dark ms-1">{voucher.directorName || 'Pending'}</span>
              </div>
              {voucher.approvalDate && (
                <div className="mb-2">
                  <span className="text-muted small">Approval Date: </span>
                  <span className="fw-semibold text-dark ms-1 tabular-nums">{voucher.approvalDate}</span>
                </div>
              )}
            </div>

            <div className="col-md-6 text-md-end">
              <div className="text-muted small mb-1.5 d-flex align-items-center justify-content-md-end gap-1.5">
                <i className="bi bi-shield-check text-primary"></i>
                <span className="fw-semibold text-dark">Director Digital Signature</span>
              </div>
              {voucher.hasDirectorSignature ? (
                <div className="d-inline-block">
                  <SignatureViewer
                    voucherId={voucher.id}
                    type="director"
                    altText="Director Approval Signature"
                  />
                </div>
              ) : (
                <div className="p-3 bg-light border rounded-3 text-center text-muted small d-inline-block">
                  <i className="bi bi-dash-circle me-1"></i> Not Approved Yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: System Audit Timestamps */}
        <div className="border-top pt-3 text-muted" style={{ fontSize: '0.75rem' }}>
          <div className="row g-2">
            <div className="col-6">
              Created Timestamp: <span className="text-dark tabular-nums">{voucher.createdDate ? new Date(voucher.createdDate).toISOString().replace('T', ' ').substring(0, 19) : 'N/A'}</span>
            </div>
            <div className="col-6 text-end">
              Last Updated Timestamp: <span className="text-dark tabular-nums">{voucher.lastUpdatedDate ? new Date(voucher.lastUpdatedDate).toISOString().replace('T', ' ').substring(0, 19) : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Director Approve Modal */}
      {showApproveModal && (
        <div className="pspl-modal-backdrop" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom py-3 px-4 bg-white">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="metric-icon-box bg-success-subtle-box" style={{ width: '36px', height: '36px' }}>
                    <i className="bi bi-check2-circle fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">Authorize Voucher</h5>
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Executive digital signature sign-off</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseApproveModal}
                  disabled={actionLoading}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span className="text-muted small text-uppercase tracking-wider d-block" style={{ fontSize: '0.72rem' }}>
                        Voucher #
                      </span>
                      <span className="fw-bold text-primary font-monospace">{voucher.voucherNumber}</span>
                    </div>
                    <div className="text-end">
                      <span className="text-muted small text-uppercase tracking-wider d-block" style={{ fontSize: '0.72rem' }}>
                        Approved Amount
                      </span>
                      <span className="fs-5 fw-bold text-success tabular-nums">
                        ₹{Number(voucher.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="small text-secondary pt-2 border-top">
                    <span className="text-muted">Employee:</span> <strong className="text-dark">{voucher.employeeName}</strong> • {voucher.departmentName}
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label fw-semibold small text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>Director Digital Signature <span className="text-danger">*</span></span>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.7rem' }}>Mandatory</span>
                  </label>

                  {signaturePreviewUrl ? (
                    <div className="border rounded-3 p-3 bg-light text-center">
                      <div className="text-muted small mb-2 d-flex align-items-center justify-content-between">
                        <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: '240px' }}>
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
                          style={{ maxHeight: '100px', maxWidth: '300px', objectFit: 'contain' }}
                        />
                      </div>
                      <div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger py-1 px-2.5 d-inline-flex align-items-center gap-1"
                          onClick={() => {
                            if (signaturePreviewUrl) URL.revokeObjectURL(signaturePreviewUrl);
                            setDirectorSignatureFile(null);
                            setSignaturePreviewUrl(null);
                          }}
                          disabled={actionLoading}
                        >
                          <i className="bi bi-trash"></i>
                          <span>Remove & Choose Another</span>
                        </button>
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>

              <div className="modal-footer bg-light border-top py-3 px-4 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleCloseApproveModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm px-3"
                  onClick={handleDirectorApprove}
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

      {/* Director Reject Modal */}
      {showRejectModal && (
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
                  onClick={handleCloseRejectModal}
                  disabled={actionLoading}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="alert alert-danger-subtle border border-danger-subtle text-danger-emphasis small p-2.5 rounded-3 mb-3 d-flex align-items-start gap-2">
                  <i className="bi bi-exclamation-triangle-fill flex-shrink-0 mt-0.5"></i>
                  <span>
                    Rejecting this voucher will return it to the employee with your remarks. This decision will be permanently logged.
                  </span>
                </div>

                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span className="text-muted small text-uppercase tracking-wider d-block" style={{ fontSize: '0.72rem' }}>
                        Voucher #
                      </span>
                      <span className="fw-bold text-primary font-monospace">{voucher.voucherNumber}</span>
                    </div>
                    <div className="text-end">
                      <span className="text-muted small text-uppercase tracking-wider d-block" style={{ fontSize: '0.72rem' }}>
                        Claim Amount
                      </span>
                      <span className="fs-5 fw-bold text-danger tabular-nums">
                        ₹{Number(voucher.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="small text-secondary pt-2 border-top">
                    <span className="text-muted">Employee:</span> <strong className="text-dark">{voucher.employeeName}</strong> • {voucher.departmentName}
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label fw-semibold small text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>Rejection Remarks <span className="text-danger">*</span></span>
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '0.7rem' }}>Mandatory</span>
                  </label>
                  <textarea
                    rows="4"
                    className="form-control"
                    placeholder="Enter explicit reason for rejection (e.g. Non-compliant category, missing tax invoices, exceeds budget limits)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    disabled={actionLoading}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer bg-light border-top py-3 px-4 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleCloseRejectModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm px-3"
                  onClick={handleDirectorReject}
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

export default VoucherDetail;