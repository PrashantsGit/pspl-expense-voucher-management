package com.prachay.voucher.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers", indexes = {
    @Index(name = "idx_voucher_number", columnList = "voucherNumber", unique = true),
    @Index(name = "idx_voucher_status", columnList = "status"),
    @Index(name = "idx_voucher_department", columnList = "departmentName"),
    @Index(name = "idx_voucher_employee", columnList = "employee_id")
})
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 32)
    private String voucherNumber;

    @Column(nullable = false)
    private LocalDate voucherDate;

    @Column(nullable = false)
    private LocalDate expenseDate;

    @Column(nullable = false, length = 100)
    private String departmentName;

    @Column(nullable = false, length = 150)
    private String expenseTitle;

    @Column(nullable = false, length = 80)
    private String expenseCategory;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String expenseDescription;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private VoucherStatus status;

    // Employee information
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Column(nullable = false, length = 100)
    private String employeeName;

    @Column(length = 50)
    private String employeeCustomId;

    @Column(length = 255)
    private String employeeSignaturePath;

    // Director / Approval information
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "director_id")
    private User director;

    @Column(length = 100)
    private String directorName;

    @Column(length = 255)
    private String directorSignaturePath;

    private LocalDate approvalDate;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    // Audit Information
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @Column(nullable = false)
    private LocalDateTime lastUpdatedDate;

    public Voucher() {
    }

    @PrePersist
    protected void onCreate() {
        if (this.voucherDate == null) {
            this.voucherDate = LocalDate.now();
        }
        if (this.status == null) {
            this.status = VoucherStatus.DRAFT;
        }
        this.createdDate = LocalDateTime.now();
        this.lastUpdatedDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.lastUpdatedDate = LocalDateTime.now();
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

    public User getEmployee() {
        return employee;
    }

    public void setEmployee(User employee) {
        this.employee = employee;
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

    public String getEmployeeSignaturePath() {
        return employeeSignaturePath;
    }

    public void setEmployeeSignaturePath(String employeeSignaturePath) {
        this.employeeSignaturePath = employeeSignaturePath;
    }

    public User getDirector() {
        return director;
    }

    public void setDirector(User director) {
        this.director = director;
    }

    public String getDirectorName() {
        return directorName;
    }

    public void setDirectorName(String directorName) {
        this.directorName = directorName;
    }

    public String getDirectorSignaturePath() {
        return directorSignaturePath;
    }

    public void setDirectorSignaturePath(String directorSignaturePath) {
        this.directorSignaturePath = directorSignaturePath;
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
