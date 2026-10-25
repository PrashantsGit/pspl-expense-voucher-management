package com.prachay.voucher.dto;

import java.math.BigDecimal;
import java.util.List;

public class AccountsDashboardDto {
    private long totalVouchers;
    private long pendingApproval;
    private long approvedVouchers;
    private long rejectedVouchers;
    private BigDecimal totalApprovedExpenseAmount;
    private List<VoucherResponse> recentApprovedVouchers;

    public AccountsDashboardDto() {
    }

    public AccountsDashboardDto(long totalVouchers, long pendingApproval, long approvedVouchers, long rejectedVouchers, BigDecimal totalApprovedExpenseAmount, List<VoucherResponse> recentApprovedVouchers) {
        this.totalVouchers = totalVouchers;
        this.pendingApproval = pendingApproval;
        this.approvedVouchers = approvedVouchers;
        this.rejectedVouchers = rejectedVouchers;
        this.totalApprovedExpenseAmount = totalApprovedExpenseAmount != null ? totalApprovedExpenseAmount : BigDecimal.ZERO;
        this.recentApprovedVouchers = recentApprovedVouchers;
    }

    public long getTotalVouchers() {
        return totalVouchers;
    }

    public void setTotalVouchers(long totalVouchers) {
        this.totalVouchers = totalVouchers;
    }

    public long getPendingApproval() {
        return pendingApproval;
    }

    public void setPendingApproval(long pendingApproval) {
        this.pendingApproval = pendingApproval;
    }

    public long getApprovedVouchers() {
        return approvedVouchers;
    }

    public void setApprovedVouchers(long approvedVouchers) {
        this.approvedVouchers = approvedVouchers;
    }

    public long getRejectedVouchers() {
        return rejectedVouchers;
    }

    public void setRejectedVouchers(long rejectedVouchers) {
        this.rejectedVouchers = rejectedVouchers;
    }

    public BigDecimal getTotalApprovedExpenseAmount() {
        return totalApprovedExpenseAmount;
    }

    public void setTotalApprovedExpenseAmount(BigDecimal totalApprovedExpenseAmount) {
        this.totalApprovedExpenseAmount = totalApprovedExpenseAmount;
    }

    public List<VoucherResponse> getRecentApprovedVouchers() {
        return recentApprovedVouchers;
    }

    public void setRecentApprovedVouchers(List<VoucherResponse> recentApprovedVouchers) {
        this.recentApprovedVouchers = recentApprovedVouchers;
    }
}
