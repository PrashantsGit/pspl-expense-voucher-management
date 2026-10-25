package com.prachay.voucher.controller;

import com.prachay.voucher.dto.DirectorDashboardDto;
import com.prachay.voucher.dto.RejectionRequest;
import com.prachay.voucher.dto.VoucherFilterRequest;
import com.prachay.voucher.dto.VoucherResponse;
import com.prachay.voucher.entity.User;
import com.prachay.voucher.exception.BadRequestException;
import com.prachay.voucher.service.DashboardService;
import com.prachay.voucher.service.UserService;
import com.prachay.voucher.service.VoucherService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/director/vouchers")
public class DirectorVoucherController {

    private final VoucherService voucherService;
    private final DashboardService dashboardService;
    private final UserService userService;

    public DirectorVoucherController(VoucherService voucherService, DashboardService dashboardService, UserService userService) {
        this.voucherService = voucherService;
        this.dashboardService = dashboardService;
        this.userService = userService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DirectorDashboardDto> getDashboard() {
        return ResponseEntity.ok(dashboardService.getDirectorDashboard());
    }

    @GetMapping
    public ResponseEntity<List<VoucherResponse>> getAllVouchers(@ModelAttribute VoucherFilterRequest filter) {
        return ResponseEntity.ok(voucherService.getAllVouchers(filter));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<VoucherResponse>> getPendingVouchers() {
        return ResponseEntity.ok(voucherService.getPendingVouchersForDirector());
    }

    @PostMapping(value = "/{id}/approve", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VoucherResponse> approveVoucher(
            @PathVariable Long id,
            @RequestPart(value = "signature", required = false) MultipartFile signaturePart,
            @RequestParam(value = "signature", required = false) MultipartFile signatureParam) {
        MultipartFile signature = signaturePart != null ? signaturePart : signatureParam;
        if (signature == null || signature.isEmpty()) {
            throw new BadRequestException("Director signature is mandatory before approval.");
        }
        User currentDirector = userService.getCurrentUser();
        return ResponseEntity.ok(voucherService.approveVoucher(currentDirector, id, signature));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<VoucherResponse> rejectVoucher(
            @PathVariable Long id,
            @Valid @RequestBody RejectionRequest request) {
        User currentDirector = userService.getCurrentUser();
        return ResponseEntity.ok(voucherService.rejectVoucher(currentDirector, id, request));
    }
}
