package com.prachay.voucher.controller;

import com.prachay.voucher.dto.VoucherResponse;
import com.prachay.voucher.entity.Role;
import com.prachay.voucher.entity.User;
import com.prachay.voucher.entity.Voucher;
import com.prachay.voucher.exception.ResourceNotFoundException;
import com.prachay.voucher.exception.UnauthorizedActionException;
import com.prachay.voucher.service.SignatureStorageService;
import com.prachay.voucher.service.UserService;
import com.prachay.voucher.service.VoucherService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/vouchers")
public class VoucherCommonController {

    private final VoucherService voucherService;
    private final SignatureStorageService signatureStorageService;
    private final UserService userService;

    public VoucherCommonController(VoucherService voucherService, SignatureStorageService signatureStorageService, UserService userService) {
        this.voucherService = voucherService;
        this.signatureStorageService = signatureStorageService;
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<VoucherResponse> getVoucherById(@PathVariable Long id) {
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(voucherService.getVoucherById(id, currentUser));
    }

    @GetMapping("/{id}/signatures/employee")
    public ResponseEntity<Resource> getEmployeeSignature(@PathVariable Long id) throws IOException {
        User currentUser = userService.getCurrentUser();
        Voucher voucher = voucherService.getVoucherEntity(id);

        // Security check: Employee can only see their own voucher signature
        if (currentUser.getRole() == Role.ROLE_EMPLOYEE && !voucher.getEmployee().getId().equals(currentUser.getId())) {
            throw new UnauthorizedActionException("You are not authorized to view this signature");
        }

        if (voucher.getEmployeeSignaturePath() == null || voucher.getEmployeeSignaturePath().isBlank()) {
            throw new ResourceNotFoundException("No employee signature attached to this voucher");
        }

        Resource resource = signatureStorageService.loadAsResource(voucher.getEmployeeSignaturePath());
        String contentType = Files.probeContentType(Paths.get(resource.getFile().getAbsolutePath()));
        if (contentType == null) {
            contentType = MediaType.IMAGE_PNG_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/signatures/director")
    public ResponseEntity<Resource> getDirectorSignature(@PathVariable Long id) throws IOException {
        User currentUser = userService.getCurrentUser();
        Voucher voucher = voucherService.getVoucherEntity(id);

        if (currentUser.getRole() == Role.ROLE_EMPLOYEE && !voucher.getEmployee().getId().equals(currentUser.getId())) {
            throw new UnauthorizedActionException("You are not authorized to view this signature");
        }

        if (voucher.getDirectorSignaturePath() == null || voucher.getDirectorSignaturePath().isBlank()) {
            throw new ResourceNotFoundException("No director signature attached to this voucher");
        }

        Resource resource = signatureStorageService.loadAsResource(voucher.getDirectorSignaturePath());
        String contentType = Files.probeContentType(Paths.get(resource.getFile().getAbsolutePath()));
        if (contentType == null) {
            contentType = MediaType.IMAGE_PNG_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
