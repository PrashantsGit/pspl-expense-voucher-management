package com.prachay.voucher.controller;

import com.prachay.voucher.dto.EmployeeDashboardDto;
import com.prachay.voucher.dto.VoucherCreateRequest;
import com.prachay.voucher.dto.VoucherFilterRequest;
import com.prachay.voucher.dto.VoucherResponse;
import com.prachay.voucher.dto.VoucherUpdateRequest;
import com.prachay.voucher.entity.User;
import com.prachay.voucher.exception.BadRequestException;
import com.prachay.voucher.service.DashboardService;
import com.prachay.voucher.service.UserService;
import com.prachay.voucher.service.VoucherService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/employee/vouchers")
public class EmployeeVoucherController {

    private final VoucherService voucherService;
    private final DashboardService dashboardService;
    private final UserService userService;

    public EmployeeVoucherController(VoucherService voucherService, DashboardService dashboardService, UserService userService) {
        this.voucherService = voucherService;
        this.dashboardService = dashboardService;
        this.userService = userService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<EmployeeDashboardDto> getDashboard() {
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(dashboardService.getEmployeeDashboard(currentUser));
    }

    @GetMapping
    public ResponseEntity<List<VoucherResponse>> getMyVouchers(@ModelAttribute VoucherFilterRequest filter) {
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(voucherService.getVouchersForEmployee(currentUser, filter));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<VoucherResponse> createDraftJson(
            @Valid @RequestBody VoucherCreateRequest request) {
        User currentUser = userService.getCurrentUser();
        VoucherResponse created = voucherService.createDraft(currentUser, request, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VoucherResponse> createDraftMultipart(
            @Valid @RequestPart("voucher") VoucherCreateRequest request,
            @RequestPart(value = "signature", required = false) MultipartFile signature) {
        User currentUser = userService.getCurrentUser();
        VoucherResponse created = voucherService.createDraft(currentUser, request, signature);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VoucherResponse> updateDraft(
            @PathVariable Long id,
            @Valid @RequestBody VoucherUpdateRequest request) {
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(voucherService.updateDraft(currentUser, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDraft(@PathVariable Long id) {
        User currentUser = userService.getCurrentUser();
        voucherService.deleteDraft(currentUser, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/signature", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VoucherResponse> uploadSignature(
            @PathVariable Long id,
            @RequestPart(value = "signature", required = false) MultipartFile signaturePart,
            @RequestParam(value = "signature", required = false) MultipartFile signatureParam) {
        MultipartFile signature = signaturePart != null ? signaturePart : signatureParam;
        if (signature == null || signature.isEmpty()) {
            throw new BadRequestException("Signature file is mandatory");
        }
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(voucherService.uploadEmployeeSignature(currentUser, id, signature));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<VoucherResponse> submitVoucher(@PathVariable Long id) {
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(voucherService.submitVoucher(currentUser, id));
    }
}
