package com.prachay.voucher.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class VoucherCreateRequest {

    @NotNull(message = "Expense date is mandatory")
    private LocalDate expenseDate;

    @NotBlank(message = "Department is mandatory")
    private String departmentName;

    @NotBlank(message = "Expense title is mandatory")
    private String expenseTitle;

    @NotBlank(message = "Expense category is mandatory")
    private String expenseCategory;

    @NotBlank(message = "Expense description is mandatory")
    private String expenseDescription;

    @NotNull(message = "Amount is mandatory")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    private String employeeCustomId;

    public VoucherCreateRequest() {
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

    public String getEmployeeCustomId() {
        return employeeCustomId;
    }

    public void setEmployeeCustomId(String employeeCustomId) {
        this.employeeCustomId = employeeCustomId;
    }
}
