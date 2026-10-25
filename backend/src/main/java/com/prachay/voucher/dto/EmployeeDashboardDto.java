package com.prachay.voucher.dto;

import java.math.BigDecimal;

public class EmployeeDashboardDto {
    private long totalVouchers;
    private long draftVouchers;
    private long pendingApproval;
    private long approvedVouchers;
    private long rejectedVouchers;
    private BigDecimal totalAmountClaimed;

    public EmployeeDashboardDto() {
    }

    public EmployeeDashboardDto(long totalVouchers, long draftVouchers, long pendingApproval, long approvedVouchers, long rejectedVouchers, BigDecimal totalAmountClaimed) {
        this.totalVouchers = totalVouchers;
        this.draftVouchers = draftVouchers;
        this.pendingApproval = pendingApproval;
        this.approvedVouchers = approvedVouchers;
        this.rejectedVouchers = rejectedVouchers;
        this.totalAmountClaimed = totalAmountClaimed != null ? totalAmountClaimed : BigDecimal.ZERO;
    }

    public long getTotalVouchers() {
        return totalVouchers;
    }

    public void setTotalVouchers(long totalVouchers) {
        this.totalVouchers = totalVouchers;
    }

    public long getDraftVouchers() {
        return draftVouchers;
    }

    public void setDraftVouchers(long draftVouchers) {
        this.draftVouchers = draftVouchers;
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

    public BigDecimal getTotalAmountClaimed() {
        return totalAmountClaimed;
    }

    public void setTotalAmountClaimed(BigDecimal totalAmountClaimed) {
        this.totalAmountClaimed = totalAmountClaimed;
    }
}
