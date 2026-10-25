import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { employeeApi, voucherApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const VoucherForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    departmentName: user?.department || '',
    expenseTitle: '',
    expenseCategory: 'Travel & Transport',
    expenseDescription: '',
    amount: '',
    employeeCustomId: user?.employeeId || '',
  });

  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [existingSignature, setExistingSignature] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

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

  useEffect(() => {
    if (isEditMode) {
      const loadVoucher = async () => {
        try {
          const res = await voucherApi.getById(id);
          const v = res.data;
          if (v.status !== 'DRAFT') {
            setError('Only vouchers in Draft status can be edited.');
            return;
          }
          setFormData({
            expenseDate: v.expenseDate,
            departmentName: v.departmentName,
            expenseTitle: v.expenseTitle,
            expenseCategory: v.expenseCategory,
            expenseDescription: v.expenseDescription,
            amount: v.amount,
            employeeCustomId: v.employeeCustomId || '',
          });
          setExistingSignature(v.hasEmployeeSignature);
        } catch (err) {
          setError('Failed to load draft voucher details.');
        } finally {
          setLoading(false);
        }
      };
      loadVoucher();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Signature file size must not exceed 5MB.');
        return;
      }
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.departmentName.trim()) errors.departmentName = 'Department is mandatory';
    if (!formData.expenseTitle.trim()) errors.expenseTitle = 'Expense title is mandatory';
    if (!formData.expenseCategory.trim()) errors.expenseCategory = 'Expense category is mandatory';
    if (!formData.expenseDate) errors.expenseDate = 'Expense date is mandatory';
    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than zero';
    }
    if (!formData.expenseDescription.trim()) {
      errors.expenseDescription = 'Expense description is mandatory';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');

    try {
      if (isEditMode) {
        await employeeApi.updateDraft(id, formData);
        if (signatureFile) {
          await employeeApi.uploadSignature(id, signatureFile);
        }
      } else {
        // Create draft with multipart payload (DTO + signature file)
        const formPayload = new FormData();
        const jsonBlob = new Blob([JSON.stringify(formData)], { type: 'application/json' });
        formPayload.append('voucher', jsonBlob);
        if (signatureFile) {
          formPayload.append('signature', signatureFile);
        }
        await employeeApi.createDraft(formPayload, true);
      }

      navigate('/employee/vouchers');
    } catch (err) {
      if (err.response?.data?.fieldErrors) {
        setFieldErrors(err.response.data.fieldErrors);
      } else {
        setError(err.response?.data?.message || 'Failed to save voucher.');
      }
    } finally {
      setSubmitting(false);
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

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">
                {isEditMode ? 'Edit Draft Voucher' : 'Create Expense Voucher'}
              </h2>
              <p className="text-muted mb-0 small">
                Every new voucher is automatically generated and saved initially as Draft
              </p>
            </div>
            <Link to="/employee/vouchers" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-1"></i> Back to My Vouchers
            </Link>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
            </div>
          )}

          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Basic Information */}
                  <div className="col-12">
                    <h5 className="fw-bold text-primary border-bottom pb-2 mb-3">
                      <i className="bi bi-info-circle me-2"></i>Expense Information
                    </h5>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">
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

                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">
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

                  <div className="col-md-12">
                    <label className="form-label fw-semibold small">
                      Expense Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${fieldErrors.expenseTitle ? 'is-invalid' : ''}`}
                      placeholder="e.g. Flight tickets to Mumbai for client deployment"
                      name="expenseTitle"
                      value={formData.expenseTitle}
                      onChange={handleChange}
                      required
                    />
                    {fieldErrors.expenseTitle && (
                      <div className="invalid-feedback">{fieldErrors.expenseTitle}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">
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

                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">
                      Amount (₹) <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
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

                  <div className="col-12">
                    <label className="form-label fw-semibold small">
                      Expense Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      rows="4"
                      className={`form-control ${fieldErrors.expenseDescription ? 'is-invalid' : ''}`}
                      placeholder="Provide detailed justification, attendees, business purpose, and vendor references..."
                      name="expenseDescription"
                      value={formData.expenseDescription}
                      onChange={handleChange}
                      required
                    ></textarea>
                    {fieldErrors.expenseDescription && (
                      <div className="invalid-feedback">{fieldErrors.expenseDescription}</div>
                    )}
                  </div>

                  {/* Employee & Signature Section */}
                  <div className="col-12 mt-4">
                    <h5 className="fw-bold text-primary border-bottom pb-2 mb-3">
                      <i className="bi bi-pen me-2"></i>Employee Signature
                    </h5>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Employee ID (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. EMP-1001"
                      name="employeeCustomId"
                      value={formData.employeeCustomId}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">
                      Signature Image (PNG, JPG, WebP)
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleSignatureChange}
                    />
                    <div className="form-text small">
                      {existingSignature
                        ? 'A signature is already attached. Upload a new file to replace it.'
                        : 'Upload signature now, or upload it later before submitting.'}
                    </div>
                  </div>

                  {/* Signature Preview */}
                  {signaturePreview && (
                    <div className="col-12 text-center p-3 bg-light rounded border">
                      <div className="small fw-semibold text-muted mb-2">Signature Preview:</div>
                      <img
                        src={signaturePreview}
                        alt="Signature Preview"
                        style={{ maxHeight: '90px', maxWidth: '300px', objectFit: 'contain' }}
                        className="border bg-white rounded p-1"
                      />
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="col-12 d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                    <Link to="/employee/vouchers" className="btn btn-secondary">
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      className="btn btn-primary px-4 fw-semibold"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : isEditMode ? (
                        'Save Changes'
                      ) : (
                        'Save as Draft'
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
