import React, { useState } from 'react';

const VoucherFilterBar = ({ onFilter, onReset, showEmployeeFilter = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    voucherNumber: '',
    employeeName: '',
    department: '',
    expenseCategory: '',
    status: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
  });

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = (e) => {
    e.preventDefault();
    const cleanFilters = {};
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== '' && filters[key] !== null) {
        cleanFilters[key] = filters[key];
      }
    });
    onFilter(cleanFilters);
  };

  const handleReset = () => {
    const cleared = {
      voucherNumber: '',
      employeeName: '',
      department: '',
      expenseCategory: '',
      status: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
    };
    setFilters(cleared);
    onReset();
  };

  return (
    <div className="card shadow-sm mb-4 border-0">
      <div className="card-body p-3">
        <form onSubmit={handleApply}>
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Voucher Number..."
                  name="voucherNumber"
                  value={filters.voucherNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                name="status"
                value={filters.status}
                onChange={handleChange}
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                name="expenseCategory"
                value={filters.expenseCategory}
                onChange={handleChange}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2 d-flex gap-2">
              <button type="submit" className="btn btn-primary flex-fill">
                Filter
              </button>
              <button
                type="button"
                className={`btn btn-outline-secondary ${isExpanded ? 'active' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
                title="Advanced Filters"
              >
                <i className="bi bi-sliders"></i>
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleReset}
                title="Reset Filters"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Filters */}
          {isExpanded && (
            <div className="row g-3 mt-2 pt-3 border-top">
              {showEmployeeFilter && (
                <div className="col-md-3">
                  <label className="form-label small text-muted">Employee Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Rahul Sharma"
                    name="employeeName"
                    value={filters.employeeName}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="col-md-3">
                <label className="form-label small text-muted">Department</label>
                <select
                  className="form-select form-select-sm"
                  name="department"
                  value={filters.department}
                  onChange={handleChange}
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted">Expense Date From</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted">Expense Date To</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted">Min Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control form-control-sm"
                  placeholder="0.00"
                  name="minAmount"
                  value={filters.minAmount}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted">Max Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control form-control-sm"
                  placeholder="100000.00"
                  name="maxAmount"
                  value={filters.maxAmount}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default VoucherFilterBar;
