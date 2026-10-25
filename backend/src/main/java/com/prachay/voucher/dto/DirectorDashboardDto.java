package com.prachay.voucher.dto;

import java.math.BigDecimal;
import java.util.List;

public class DirectorDashboardDto {
    private long pendingApprovalCount;
    private long approvedToday;
    private long rejectedToday;
    private BigDecimal totalPendingAmount;
    private List<VoucherResponse> recentVoucherActivity;

    public DirectorDashboardDto() {
    }

    public DirectorDashboardDto(long pendingApprovalCount, long approvedToday, long rejectedToday, BigDecimal totalPendingAmount, List<VoucherResponse> recentVoucherActivity) {
        this.pendingApprovalCount = pendingApprovalCount;
        this.approvedToday = approvedToday;
        this.rejectedToday = rejectedToday;
        this.totalPendingAmount = totalPendingAmount != null ? totalPendingAmount : BigDecimal.ZERO;
        this.recentVoucherActivity = recentVoucherActivity;
    }

    public long getPendingApprovalCount() {
        return pendingApprovalCount;
    }

    public void setPendingApprovalCount(long pendingApprovalCount) {
        this.pendingApprovalCount = pendingApprovalCount;
    }

    public long getApprovedToday() {
        return approvedToday;
    }

    public void setApprovedToday(long approvedToday) {
        this.approvedToday = approvedToday;
    }

    public long getRejectedToday() {
        return rejectedToday;
    }

    public void setRejectedToday(long rejectedToday) {
        this.rejectedToday = rejectedToday;
    }

    public BigDecimal getTotalPendingAmount() {
        return totalPendingAmount;
    }

    public void setTotalPendingAmount(BigDecimal totalPendingAmount) {
        this.totalPendingAmount = totalPendingAmount;
    }

    public List<VoucherResponse> getRecentVoucherActivity() {
        return recentVoucherActivity;
    }

    public void setRecentVoucherActivity(List<VoucherResponse> recentVoucherActivity) {
        this.recentVoucherActivity = recentVoucherActivity;
    }
}
