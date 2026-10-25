import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { voucherApi, employeeApi, directorApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import SignatureViewer from '../../components/SignatureViewer';

const VoucherDetail = () => {
  const { id } = useParams();
  const { user, isEmployee, isDirector } = useAuth();
  const navigate = useNavigate();

  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Director action modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [directorSignatureFile, setDirectorSignatureFile] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVoucher = async () => {
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
  };

  useEffect(() => {
    fetchVoucher();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleEmployeeSubmit = async () => {
    if (!voucher.hasEmployeeSignature) {
      setError('Please edit this draft and upload an employee signature before submitting.');
      return;
    }
    setActionLoading(true);
    setError('');
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

  const handleDirectorApprove = async () => {
    if (!directorSignatureFile) {
      setError('Director signature image is required before approving.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await directorApi.approveVoucher(voucher.id, directorSignatureFile);
      setActionSuccess('Voucher approved successfully!');
      setShowApproveModal(false);
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
      setActionSuccess('Voucher rejected with remarks.');
      setShowRejectModal(false);
      fetchVoucher();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject voucher.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="mt-2 text-muted">Loading voucher details...</div>
      </div>
    );
  }

  if (error && !voucher) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger d-inline-block text-start p-4 shadow-sm">
          <h5 className="fw-bold mb-2">
            <i className="bi bi-shield-lock-fill me-2"></i>Access Restriction
          </h5>
          <p className="mb-3">{error}</p>
          <button onClick={() => navigate(-1)} className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-left me-1"></i> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Top action bar (hidden on print) */}
      <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
        <button onClick={() => navigate(-1)} className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1"></i> Back
        </button>

        <div className="d-flex gap-2">
          <button onClick={handlePrint} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-printer"></i>
            <span>Print / Save as PDF</span>
          </button>

          {/* Employee Draft Actions */}
          {isEmployee && voucher.status === 'DRAFT' && (
            <>
              <Link to={`/employee/vouchers/${voucher.id}/edit`} className="btn btn-primary btn-sm">
                <i className="bi bi-pencil me-1"></i> Edit Draft
              </Link>
              <button
                onClick={handleEmployeeSubmit}
                className="btn btn-success btn-sm"
                disabled={actionLoading}
              >
                <i className="bi bi-send me-1"></i> Submit for Approval
              </button>
            </>
          )}

          {/* Director Actions */}
          {isDirector && voucher.status === 'PENDING_APPROVAL' && (
            <>
              <button
                onClick={() => setShowRejectModal(true)}
                className="btn btn-danger btn-sm"
              >
                <i className="bi bi-x-circle me-1"></i> Reject
              </button>
              <button
                onClick={() => setShowApproveModal(true)}
                className="btn btn-success btn-sm"
              >
                <i className="bi bi-check-circle me-1"></i> Approve
              </button>
            </>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success alert-dismissible fade show d-print-none" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {actionSuccess}
          <button type="button" className="btn-close" onClick={() => setActionSuccess('')}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show d-print-none" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Main Voucher Document (Printable) */}
      <div className="card shadow border-0 p-4 bg-white" id="printable-voucher">
        {/* Document Header */}
        <div className="border-bottom pb-4 mb-4">
          <div className="row align-items-center">
            <div className="col-8">
              <div className="d-flex align-items-center gap-2 mb-1">
                <div className="p-2 bg-primary text-white rounded">
                  <i className="bi bi-wallet2 fs-4"></i>
                </div>
                <div>
                  <h3 className="fw-bold mb-0 text-dark">Prachay Securities Private Limited</h3>
                  <div className="text-muted small">Corporate Expense Voucher & Reimbursement Claim</div>
                </div>
              </div>
            </div>
            <div className="col-4 text-end">
              <div className="fs-5 fw-bold text-dark">{voucher.voucherNumber}</div>
              <div className="mt-1">
                <StatusBadge status={voucher.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Rejection Alert if rejected */}
        {voucher.status === 'REJECTED' && (
          <div className="alert alert-danger mb-4">
            <h6 className="fw-bold mb-1">
              <i className="bi bi-x-octagon-fill me-2"></i>Rejection Notice
            </h6>
            <p className="mb-0 small">{voucher.rejectionReason}</p>
          </div>
        )}

        {/* Section 1: Basic Information */}
        <div className="mb-4">
          <h6 className="fw-bold text-uppercase text-secondary border-bottom pb-2 mb-3">
            1. Voucher & Expense Details
          </h6>
          <div className="row g-3">
            <div className="col-md-3 col-6">
              <div className="text-muted small">Voucher Date</div>
              <div className="fw-semibold">{voucher.voucherDate}</div>
            </div>
            <div className="col-md-3 col-6">
              <div className="text-muted small">Expense Date</div>
              <div className="fw-semibold">{voucher.expenseDate}</div>
            </div>
            <div className="col-md-3 col-6">
              <div className="text-muted small">Department</div>
              <div className="fw-semibold">{voucher.departmentName}</div>
            </div>
            <div className="col-md-3 col-6">
              <div className="text-muted small">Category</div>
              <div className="fw-semibold">
                <span className="badge bg-light text-dark border">{voucher.expenseCategory}</span>
              </div>
            </div>

            <div className="col-12 mt-3">
              <div className="text-muted small">Expense Title</div>
              <div className="fs-5 fw-bold text-dark">{voucher.expenseTitle}</div>
            </div>

            <div className="col-12">
              <div className="text-muted small">Expense Description & Justification</div>
              <div className="p-3 bg-light rounded text-dark mt-1" style={{ whiteSpace: 'pre-line' }}>
                {voucher.expenseDescription}
              </div>
            </div>

            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center p-3 bg-primary-subtle rounded border border-primary-subtle mt-2">
                <div className="fw-bold text-primary-emphasis fs-5">Total Claimed Amount</div>
                <div className="fs-3 fw-bold text-primary">
                  ₹{Number(voucher.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Employee Information & Signature */}
        <div className="mb-4">
          <h6 className="fw-bold text-uppercase text-secondary border-bottom pb-2 mb-3">
            2. Employee Information & Authorization
          </h6>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="mb-2">
                <span className="text-muted small">Employee Name: </span>
                <span className="fw-semibold ms-1">{voucher.employeeName}</span>
              </div>
              <div className="mb-2">
                <span className="text-muted small">Employee ID: </span>
                <span className="fw-semibold ms-1">{voucher.employeeCustomId || 'N/A'}</span>
              </div>
              <div className="mb-2">
                <span className="text-muted small">Username: </span>
                <span className="text-muted ms-1">{voucher.employeeUsername}</span>
              </div>
            </div>

            <div className="col-md-6 text-md-end">
              <div className="text-muted small mb-2">Employee Signature</div>
              {voucher.hasEmployeeSignature ? (
                <SignatureViewer
                  voucherId={voucher.id}
                  type="employee"
                  altText="Employee Signature"
                />
              ) : (
                <div className="p-3 bg-light border rounded text-center text-muted small d-inline-block">
                  <i className="bi bi-clock me-1"></i> Signature Pending Submission
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Approval Information & Director Signature */}
        <div className="mb-4">
          <h6 className="fw-bold text-uppercase text-secondary border-bottom pb-2 mb-3">
            3. Director Approval & Sign-Off
          </h6>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="mb-2">
                <span className="text-muted small">Approval Status: </span>
                <span className="ms-1">
                  <StatusBadge status={voucher.status} />
                </span>
              </div>
              <div className="mb-2">
                <span className="text-muted small">Director Name: </span>
                <span className="fw-semibold ms-1">{voucher.directorName || 'Pending'}</span>
              </div>
              {voucher.approvalDate && (
                <div className="mb-2">
                  <span className="text-muted small">Approval Date: </span>
                  <span className="fw-semibold ms-1">{voucher.approvalDate}</span>
                </div>
              )}
            </div>

            <div className="col-md-6 text-md-end">
              <div className="text-muted small mb-2">Director Approval Signature</div>
              {voucher.hasDirectorSignature ? (
                <SignatureViewer
                  voucherId={voucher.id}
                  type="director"
                  altText="Director Signature"
                />
              ) : (
                <div className="p-3 bg-light border rounded text-center text-muted small d-inline-block">
                  <i className="bi bi-dash-circle me-1"></i> Not Approved Yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Audit Information */}
        <div className="border-top pt-3 text-muted" style={{ fontSize: '0.8rem' }}>
          <div className="row">
            <div className="col-6">
              Created Timestamp: {new Date(voucher.createdDate).toLocaleString()}
            </div>
            <div className="col-6 text-end">
              Last Updated Timestamp: {new Date(voucher.lastUpdatedDate).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">Approve Voucher {voucher.voucherNumber}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowApproveModal(false)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label fw-semibold small">
                  Upload Director Signature (PNG, JPG, WebP) <span className="text-danger">*</span>
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setDirectorSignatureFile(e.target.files[0])}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApproveModal(false)} disabled={actionLoading}>
                  Cancel
                </button>
                <button type="button" className="btn btn-success fw-semibold" onClick={handleDirectorApprove} disabled={actionLoading}>
                  {actionLoading ? 'Approving...' : 'Confirm Approval'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Reject Voucher {voucher.voucherNumber}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRejectModal(false)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label fw-semibold small">
                  Rejection Reason <span className="text-danger">*</span>
                </label>
                <textarea
                  rows="3"
                  className="form-control"
                  placeholder="Explain why this claim cannot be approved..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRejectModal(false)} disabled={actionLoading}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger fw-semibold" onClick={handleDirectorReject} disabled={actionLoading}>
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
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
