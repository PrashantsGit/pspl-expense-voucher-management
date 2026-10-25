package com.prachay.voucher.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RejectionRequest {

    @NotBlank(message = "Rejection reason is mandatory")
    @Size(min = 3, max = 1000, message = "Rejection reason must be between 3 and 1000 characters")
    private String rejectionReason;

    public RejectionRequest() {
    }

    public RejectionRequest(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}
