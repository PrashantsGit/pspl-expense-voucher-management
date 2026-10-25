package com.prachay.voucher.dto;

import com.prachay.voucher.entity.Voucher;
import com.prachay.voucher.entity.VoucherStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class VoucherResponse {

    private Long id;
    private String voucherNumber;
    private LocalDate voucherDate;
    private LocalDate expenseDate;
    private String departmentName;
    private String expenseTitle;
    private String expenseCategory;
    private String expenseDescription;
    private BigDecimal amount;
    private VoucherStatus status;

    private Long employeeId;
    private String employeeUsername;
    private String employeeName;
    private String employeeCustomId;
    private boolean hasEmployeeSignature;

    private Long directorId;
    private String directorName;
    private boolean hasDirectorSignature;
    private LocalDate approvalDate;
    private String rejectionReason;

    private LocalDateTime createdDate;
    private LocalDateTime lastUpdatedDate;

    public VoucherResponse() {
    }

    public static VoucherResponse fromEntity(Voucher voucher) {
        VoucherResponse dto = new VoucherResponse();
        dto.setId(voucher.getId());
        dto.setVoucherNumber(voucher.getVoucherNumber());
        dto.setVoucherDate(voucher.getVoucherDate());
        dto.setExpenseDate(voucher.getExpenseDate());
        dto.setDepartmentName(voucher.getDepartmentName());
        dto.setExpenseTitle(voucher.getExpenseTitle());
        dto.setExpenseCategory(voucher.getExpenseCategory());
        dto.setExpenseDescription(voucher.getExpenseDescription());
        dto.setAmount(voucher.getAmount());
        dto.setStatus(voucher.getStatus());

        if (voucher.getEmployee() != null) {
            dto.setEmployeeId(voucher.getEmployee().getId());
            dto.setEmployeeUsername(voucher.getEmployee().getUsername());
        }
        dto.setEmployeeName(voucher.getEmployeeName());
        dto.setEmployeeCustomId(voucher.getEmployeeCustomId());
        dto.setHasEmployeeSignature(voucher.getEmployeeSignaturePath() != null && !voucher.getEmployeeSignaturePath().isBlank());

        if (voucher.getDirector() != null) {
            dto.setDirectorId(voucher.getDirector().getId());
        }
        dto.setDirectorName(voucher.getDirectorName());
        dto.setHasDirectorSignature(voucher.getDirectorSignaturePath() != null && !voucher.getDirectorSignaturePath().isBlank());
        dto.setApprovalDate(voucher.getApprovalDate());
        dto.setRejectionReason(voucher.getRejectionReason());

        dto.setCreatedDate(voucher.getCreatedDate());
        dto.setLastUpdatedDate(voucher.getLastUpdatedDate());
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getVoucherNumber() {
        return voucherNumber;
    }

    public void setVoucherNumber(String voucherNumber) {
        this.voucherNumber = voucherNumber;
    }

    public LocalDate getVoucherDate() {
        return voucherDate;
    }

    public void setVoucherDate(LocalDate voucherDate) {
        this.voucherDate = voucherDate;
    }

    public LocalDate getExpenseDate() {
        return expenseDate;
    }

    public void setExpenseDate(LocalDate expenseDate) {
        this.expenseDate = expenseDate;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public String getExpenseTitle() {
        return expenseTitle;
    }

    public void setExpenseTitle(String expenseTitle) {
        this.expenseTitle = expenseTitle;
    }

    public String getExpenseCategory() {
        return expenseCategory;
    }

    public void setExpenseCategory(String expenseCategory) {
        this.expenseCategory = expenseCategory;
    }

    public String getExpenseDescription() {
        return expenseDescription;
    }

    public void setExpenseDescription(String expenseDescription) {
        this.expenseDescription = expenseDescription;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public VoucherStatus getStatus() {
        return status;
    }

    public void setStatus(VoucherStatus status) {
        this.status = status;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeUsername() {
        return employeeUsername;
    }

    public void setEmployeeUsername(String employeeUsername) {
        this.employeeUsername = employeeUsername;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getEmployeeCustomId() {
        return employeeCustomId;
    }

    public void setEmployeeCustomId(String employeeCustomId) {
        this.employeeCustomId = employeeCustomId;
    }

    public boolean isHasEmployeeSignature() {
        return hasEmployeeSignature;
    }

    public void setHasEmployeeSignature(boolean hasEmployeeSignature) {
        this.hasEmployeeSignature = hasEmployeeSignature;
    }

    public Long getDirectorId() {
        return directorId;
    }

    public void setDirectorId(Long directorId) {
        this.directorId = directorId;
    }

    public String getDirectorName() {
        return directorName;
    }

    public void setDirectorName(String directorName) {
        this.directorName = directorName;
    }

    public boolean isHasDirectorSignature() {
        return hasDirectorSignature;
    }

    public void setHasDirectorSignature(boolean hasDirectorSignature) {
        this.hasDirectorSignature = hasDirectorSignature;
    }

    public LocalDate getApprovalDate() {
        return approvalDate;
    }

    public void setApprovalDate(LocalDate approvalDate) {
        this.approvalDate = approvalDate;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public LocalDateTime getLastUpdatedDate() {
        return lastUpdatedDate;
    }

    public void setLastUpdatedDate(LocalDateTime lastUpdatedDate) {
        this.lastUpdatedDate = lastUpdatedDate;
    }
}
