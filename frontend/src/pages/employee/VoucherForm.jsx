import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { employeeApi, voucherApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SignatureViewer from '../../components/SignatureViewer';

const VoucherForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(() => ({
    expenseDate: new Date().toISOString().split('T')[0],
    departmentName: user?.department || '',
    expenseTitle: '',
    expenseCategory: 'Travel & Transport',
    expenseDescription: '',
    amount: '',
    employeeCustomId: user?.employeeId || '',
  }));

  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [existingSignature, setExistingSignature] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [submittingAction, setSubmittingAction] = useState(null); // 'DRAFT' | 'SUBMIT' | null
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const categories = [
    'Travel & Transport',
    'Meals & Entertainment',
    'Office Supplies & Stationery',
    'Software & Tools',
    'Training & Certification',
    'Client Hospitality',
    'Telecom & Internet',
    'Other',
  ];

  const departments = [
    'Technology',
    'Marketing',
    'Finance & Accounts',
    'Human Resources',
    'Operations',
    'Legal & Compliance',
    'Executive Management',
  ];

  // Load existing voucher if editing
  useEffect(() => {
    if (isEditMode) {
      const loadVoucher = async () => {
        try {
          setLoading(true);
          setError('');
          const res = await voucherApi.getById(id);
          const v = res.data;
          if (v.status !== 'DRAFT') {
            setError('Only vouchers in Draft status can be edited.');
            return;
          }
          setFormData({
            expenseDate: v.expenseDate || '',
            departmentName: v.departmentName || '',
            expenseTitle: v.expenseTitle || '',
            expenseCategory: v.expenseCategory || 'Travel & Transport',
            expenseDescription: v.expenseDescription || '',
            amount: v.amount ? String(v.amount) : '',
            employeeCustomId: v.employeeCustomId || '',
          });
          setExistingSignature(Boolean(v.hasEmployeeSignature));
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to load draft voucher details.');
        } finally {
          setLoading(false);
        }
      };
      loadVoucher();
    }
  }, [id, isEditMode]);

  // Clean up signature object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (signaturePreview) {
        URL.revokeObjectURL(signaturePreview);
      }
    };
  }, [signaturePreview]);

  // Warn on accidental browser tab closure if unsaved edits exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && !submittingAction) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, submittingAction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files?.[0];
    if (signaturePreview) {
      URL.revokeObjectURL(signaturePreview);
      setSignaturePreview(null);
    }

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Signature file size must not exceed 5MB.');
        return;
      }
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only PNG, JPEG, or WebP image formats are supported for signatures.');
        return;
      }
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
      setIsDirty(true);
      setError('');
    } else {
      setSignatureFile(null);
      setSignaturePreview(null);
    }
  };

  const handleClearSelectedSignature = () => {
    if (signaturePreview) {
      URL.revokeObjectURL(signaturePreview);
    }
    setSignatureFile(null);
    setSignaturePreview(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.departmentName.trim()) {
      errors.departmentName = 'Department is mandatory';
    }
    if (!formData.expenseCategory.trim()) {
      errors.expenseCategory = 'Expense category is mandatory';
    }
    if (!formData.expenseTitle.trim()) {
      errors.expenseTitle = 'Expense title is mandatory';
    } else if (formData.expenseTitle.trim().length > 255) {
      errors.expenseTitle = 'Expense title must not exceed 255 characters';
    }
    if (!formData.expenseDate) {
      errors.expenseDate = 'Expense date is mandatory';
    }
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than zero';
    }
    if (!formData.expenseDescription.trim()) {
      errors.expenseDescription = 'Expense description is mandatory';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (targetAction) => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Rule: Employee signature is mandatory before submitting for approval
    const hasSignature = signatureFile || existingSignature;
    if (targetAction === 'SUBMIT' && !hasSignature) {
      setError('Employee digital signature is mandatory before submitting for Director approval. Please upload your signature below or save as Draft.');
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }

    setSubmittingAction(targetAction);
    setError('');

    try {
      if (isEditMode) {
        await employeeApi.updateDraft(id, formData);
        if (signatureFile) {
          await employeeApi.uploadSignature(id, signatureFile);
        }
        if (targetAction === 'SUBMIT') {
          await employeeApi.submitVoucher(id);
        }
      } else {
        // Create draft with multipart payload (DTO + signature file)
        const formPayload = new FormData();
        const jsonBlob = new Blob([JSON.stringify(formData)], { type: 'application/json' });
        formPayload.append('voucher', jsonBlob);
        if (signatureFile) {
          formPayload.append('signature', signatureFile);
        }
        const createRes = await employeeApi.createDraft(formPayload, true);
        if (targetAction === 'SUBMIT' && createRes?.data?.id) {
          await employeeApi.submitVoucher(createRes.data.id);
        }
      }

      setIsDirty(false);
      navigate('/employee/vouchers');
    } catch (err) {
      if (err.response?.data?.fieldErrors) {
        setFieldErrors(err.response.data.fieldErrors);
      } else {
        setError(err.response?.data?.message || 'Failed to process voucher submission.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmittingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}></div>
        <div className="mt-3 text-muted small fw-medium">Loading voucher form details...</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          {/* 1. Page Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom">
            <div>
              <div className="text-primary small fw-semibold text-uppercase tracking-wider mb-1 d-flex align-items-center gap-1.5">
                <i className="bi bi-receipt"></i>
                <span>Employee Portal • {isEditMode ? 'Draft Modification' : 'New Reimbursement Claim'}</span>
              </div>
              <h2 className="fw-bold text-dark mb-1">
                {isEditMode ? 'Edit Draft Voucher' : 'Create Expense Voucher'}
              </h2>
              <p className="text-muted small mb-0">
                {isEditMode
                  ? 'Update expense details or replace digital signature. Only draft vouchers can be modified.'
                  : 'Submit corporate expense claims for departmental review and Director authorization.'}
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Link
                to="/employee/vouchers"
                className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2 btn-sm"
              >
                <i className="bi bi-arrow-left"></i>
                <span>Back to My Vouchers</span>
              </Link>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center justify-content-between p-3 mb-4 shadow-sm" role="alert">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-octagon-fill fs-5"></i>
                <div>{error}</div>
              </div>
              <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
            </div>
          )}

          {/* Main Form Container */}
          <div className="card shadow-sm border-0 mb-4 bg-white">
            <div className="card-body p-4 p-md-5">
              <form onSubmit={(e) => e.preventDefault()} noValidate>
                {/* Section 1: Expense Information & Categorization */}
                <div className="mb-4 pb-3 border-bottom">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="metric-icon-box bg-primary-subtle-box" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>
                      <i className="bi bi-tag-fill"></i>
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark mb-0">1. Expense Information & Categorization</h5>
                      <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Specify department, category, expense date, and title</span>
                    </div>
                  </div>

                  <div className="row g-3">
                    {/* Department */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small text-dark">
                        Department <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${fieldErrors.departmentName ? 'is-invalid' : ''}`}
                        name="departmentName"
                        value={formData.departmentName}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.departmentName && (
                        <div className="invalid-feedback">{fieldErrors.departmentName}</div>
                      )}
                    </div>

                    {/* Category */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small text-dark">
                        Expense Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${fieldErrors.expenseCategory ? 'is-invalid' : ''}`}
                        name="expenseCategory"
                        value={formData.expenseCategory}
                        onChange={handleChange}
                        required
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.expenseCategory && (
                        <div className="invalid-feedback">{fieldErrors.expenseCategory}</div>
                      )}
                    </div>

                    {/* Expense Title */}
                    <div className="col-12">
                      <label className="form-label fw-semibold small text-dark">
                        Expense Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${fieldErrors.expenseTitle ? 'is-invalid' : ''}`}
                        placeholder="e.g. Flight tickets to Mumbai for client deployment"
                        name="expenseTitle"
                        value={formData.expenseTitle}
                        onChange={handleChange}
                        maxLength={255}
                        required
                      />
                      {fieldErrors.expenseTitle ? (
                        <div className="invalid-feedback">{fieldErrors.expenseTitle}</div>
                      ) : (
                        <div className="form-text small text-muted">A concise summary of the expenditure.</div>
                      )}
                    </div>

                    {/* Expense Date */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small text-dark">
                        Expense Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className={`form-control ${fieldErrors.expenseDate ? 'is-invalid' : ''}`}
                        name="expenseDate"
                        value={formData.expenseDate}
                        onChange={handleChange}
                        required
                      />
                      {fieldErrors.expenseDate && (
                        <div className="invalid-feedback">{fieldErrors.expenseDate}</div>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small text-dark">
                        Claim Amount (INR) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light fw-bold text-secondary">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className={`form-control ${fieldErrors.amount ? 'is-invalid' : ''}`}
                          placeholder="0.00"
                          name="amount"
                          value={formData.amount}
                          onChange={handleChange}
                          required
                        />
                        {fieldErrors.amount && (
                          <div className="invalid-feedback">{fieldErrors.amount}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Business Purpose & Justification */}
                <div className="mb-4 pb-3 border-bottom">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="metric-icon-box bg-slate-subtle-box" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>
                      <i className="bi bi-file-text-fill"></i>
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark mb-0">2. Business Purpose & Justification</h5>
                      <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Provide context, attendees, vendor details, and commercial justification</span>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold small text-dark d-flex justify-content-between align-items-center">
                        <span>Expense Description & Narrative <span className="text-danger">*</span></span>
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {formData.expenseDescription.length} characters
                        </span>
                      </label>
                      <textarea
                        rows="4"
                        className={`form-control ${fieldErrors.expenseDescription ? 'is-invalid' : ''}`}
                        placeholder="Detail the business context, meeting purpose, clients involved, hotel/vendor references, and any tax invoice breakdowns..."
                        name="expenseDescription"
                        value={formData.expenseDescription}
                        onChange={handleChange}
                        required
                      ></textarea>
                      {fieldErrors.expenseDescription && (
                        <div className="invalid-feedback">{fieldErrors.expenseDescription}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Employee Identification & Digital Signature */}
                <div className="mb-4">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="metric-icon-box bg-success-subtle-box" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>
                      <i className="bi bi-pen-fill"></i>
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark mb-0">3. Employee Authorization & Digital Signature</h5>
                      <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Attach your official digital signature for Director authorization</span>
                    </div>
                  </div>

                  <div className="row g-3">
                    {/* Employee Custom ID */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small text-dark">
                        Employee ID (Optional)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. EMP-1001"
                        name="employeeCustomId"
                        value={formData.employeeCustomId}
                        onChange={handleChange}
                      />
                      <div className="form-text small text-muted">
                        Your corporate identifier as registered with PSPL.
                      </div>
                    </div>

                    {/* Signature Upload / Preview Block */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small text-dark d-flex align-items-center justify-content-between mb-1">
                        <span>Employee Signature Image</span>
                        <span className="badge bg-light text-secondary border" style={{ fontSize: '0.7rem' }}>PNG, JPG, WebP (Max 5MB)</span>
                      </label>

                      {signaturePreview ? (
                        <div className="border rounded-3 p-3 bg-light text-center">
                          <div className="small fw-semibold text-dark mb-2 d-flex align-items-center justify-content-between">
                            <span className="text-truncate" style={{ maxWidth: '200px' }}>
                              <i className="bi bi-image text-primary me-1"></i>
                              {signatureFile?.name}
                            </span>
                            <span className="text-muted small">
                              ({(signatureFile?.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded border d-inline-block shadow-sm mb-2">
                            <img
                              src={signaturePreview}
                              alt="Selected Signature Preview"
                              className="img-fluid"
                              style={{ maxHeight: '90px', maxWidth: '260px', objectFit: 'contain' }}
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger py-1 px-2.5 d-inline-flex align-items-center gap-1"
                              onClick={handleClearSelectedSignature}
                            >
                              <i className="bi bi-trash"></i>
                              <span>Remove & Reselect</span>
                            </button>
                          </div>
                        </div>
                      ) : existingSignature && isEditMode ? (
                        <div className="border rounded-3 p-3 bg-light text-center">
                          <div className="small fw-semibold text-success mb-2 d-flex align-items-center justify-content-center gap-1.5">
                            <i className="bi bi-patch-check-fill"></i>
                            <span>Existing Digital Signature Attached</span>
                          </div>
                          <div className="bg-white p-2 rounded border d-inline-block shadow-sm mb-2">
                            <SignatureViewer voucherId={id} type="employee" altText="Existing Employee Signature" />
                          </div>
                          <div>
                            <label className="btn btn-sm btn-outline-primary py-1 px-2.5 mb-0 d-inline-flex align-items-center gap-1" style={{ cursor: 'pointer' }}>
                              <i className="bi bi-arrow-repeat"></i>
                              <span>Replace Signature</span>
                              <input
                                type="file"
                                className="d-none"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleSignatureChange}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="upload-dropzone d-block text-center p-3">
                          <i className="bi bi-cloud-arrow-up fs-3 text-primary d-block mb-1"></i>
                          <span className="fw-semibold text-dark d-block small">Click to browse or drop signature image</span>
                          <span className="text-muted d-block mt-0.5" style={{ fontSize: '0.72rem' }}>
                            Mandatory before submitting for approval
                          </span>
                          <input
                            type="file"
                            className="d-none"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleSignatureChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Action Controls */}
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 pt-3 border-top mt-4">
                  <Link
                    to="/employee/vouchers"
                    className="btn btn-outline-secondary w-100 w-sm-auto px-3 py-2"
                  >
                    Cancel
                  </Link>

                  <div className="d-flex align-items-center gap-2 w-100 w-sm-auto justify-content-end">
                    {/* Save Draft Button */}
                    <button
                      type="button"
                      className="btn btn-outline-primary px-3 py-2 fw-semibold d-inline-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto"
                      onClick={() => handleSubmit('DRAFT')}
                      disabled={Boolean(submittingAction)}
                    >
                      {submittingAction === 'DRAFT' ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>Saving Draft...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save"></i>
                          <span>{isEditMode ? 'Save Changes' : 'Save as Draft'}</span>
                        </>
                      )}
                    </button>

                    {/* Submit for Approval Button */}
                    <button
                      type="button"
                      className="btn btn-primary px-4 py-2 fw-semibold d-inline-flex align-items-center justify-content-center gap-2 shadow-sm w-100 w-sm-auto"
                      onClick={() => handleSubmit('SUBMIT')}
                      disabled={Boolean(submittingAction)}
                    >
                      {submittingAction === 'SUBMIT' ? (
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
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherForm;