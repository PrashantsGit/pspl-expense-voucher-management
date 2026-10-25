package com.prachay.voucher.controller;

import com.prachay.voucher.dto.AccountsDashboardDto;
import com.prachay.voucher.dto.VoucherFilterRequest;
import com.prachay.voucher.dto.VoucherResponse;
import com.prachay.voucher.service.DashboardService;
import com.prachay.voucher.service.VoucherService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/accounts/vouchers")
public class AccountsVoucherController {

    private final VoucherService voucherService;
    private final DashboardService dashboardService;

    public AccountsVoucherController(VoucherService voucherService, DashboardService dashboardService) {
        this.voucherService = voucherService;
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AccountsDashboardDto> getDashboard() {
        return ResponseEntity.ok(dashboardService.getAccountsDashboard());
    }

    @GetMapping
    public ResponseEntity<List<VoucherResponse>> getAllVouchers(@ModelAttribute VoucherFilterRequest filter) {
        return ResponseEntity.ok(voucherService.getAllVouchers(filter));
    }
}
