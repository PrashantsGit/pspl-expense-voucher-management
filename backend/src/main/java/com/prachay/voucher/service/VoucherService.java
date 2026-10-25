package com.prachay.voucher.service;

import com.prachay.voucher.dto.RejectionRequest;
import com.prachay.voucher.dto.VoucherCreateRequest;
import com.prachay.voucher.dto.VoucherFilterRequest;
import com.prachay.voucher.dto.VoucherResponse;
import com.prachay.voucher.dto.VoucherUpdateRequest;
import com.prachay.voucher.entity.Role;
import com.prachay.voucher.entity.User;
import com.prachay.voucher.entity.Voucher;
import com.prachay.voucher.entity.VoucherStatus;
import com.prachay.voucher.exception.BadRequestException;
import com.prachay.voucher.exception.ResourceNotFoundException;
import com.prachay.voucher.exception.UnauthorizedActionException;
import com.prachay.voucher.repository.VoucherRepository;
import com.prachay.voucher.repository.VoucherSpecification;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final SignatureStorageService signatureStorageService;

    public VoucherService(VoucherRepository voucherRepository, SignatureStorageService signatureStorageService) {
        this.voucherRepository = voucherRepository;
        this.signatureStorageService = signatureStorageService;
    }

    private synchronized String generateNextVoucherNumber() {
        String yearMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        long nextId = voucherRepository.findTopByOrderByIdDesc()
                .map(v -> v.getId() + 1)
                .orElse(1L);
        return String.format("VCH-%s-%04d", yearMonth, nextId);
    }

    public VoucherResponse createDraft(User employee, VoucherCreateRequest request, MultipartFile signatureFile) {
        Voucher voucher = new Voucher();
        voucher.setVoucherNumber(generateNextVoucherNumber());
        voucher.setVoucherDate(LocalDate.now());
        voucher.setExpenseDate(request.getExpenseDate());
        voucher.setDepartmentName(request.getDepartmentName().trim());
        voucher.setExpenseTitle(request.getExpenseTitle().trim());
        voucher.setExpenseCategory(request.getExpenseCategory().trim());
        voucher.setExpenseDescription(request.getExpenseDescription().trim());
        voucher.setAmount(request.getAmount());
        voucher.setStatus(VoucherStatus.DRAFT);

        voucher.setEmployee(employee);
        voucher.setEmployeeName(employee.getFullName());
        voucher.setEmployeeCustomId(request.getEmployeeCustomId() != null && !request.getEmployeeCustomId().isBlank()
                ? request.getEmployeeCustomId().trim()
                : employee.getEmployeeId());

        if (signatureFile != null && !signatureFile.isEmpty()) {
            String storedName = signatureStorageService.store(signatureFile, "emp_" + employee.getId());
            voucher.setEmployeeSignaturePath(storedName);
        }

        Voucher saved = voucherRepository.save(voucher);
        return VoucherResponse.fromEntity(saved);
    }

    public VoucherResponse updateDraft(User employee, Long id, VoucherUpdateRequest request) {
        Voucher voucher = getVoucherEntity(id);

        // Security check: Employee can only edit their own draft
        validateVoucherOwnership(voucher, employee);

        if (voucher.getStatus() != VoucherStatus.DRAFT) {
            throw new UnauthorizedActionException("Only Draft vouchers can be edited. Submitted, approved, or rejected vouchers are read-only.");
        }

        voucher.setExpenseDate(request.getExpenseDate());
        voucher.setDepartmentName(request.getDepartmentName().trim());
        voucher.setExpenseTitle(request.getExpenseTitle().trim());
        voucher.setExpenseCategory(request.getExpenseCategory().trim());
        voucher.setExpenseDescription(request.getExpenseDescription().trim());
        voucher.setAmount(request.getAmount());

        if (request.getEmployeeCustomId() != null && !request.getEmployeeCustomId().isBlank()) {
            voucher.setEmployeeCustomId(request.getEmployeeCustomId().trim());
        }

        Voucher updated = voucherRepository.save(voucher);
        return VoucherResponse.fromEntity(updated);
    }

    public void deleteDraft(User employee, Long id) {
        Voucher voucher = getVoucherEntity(id);

        validateVoucherOwnership(voucher, employee);

        if (voucher.getStatus() != VoucherStatus.DRAFT) {
            throw new UnauthorizedActionException("Only Draft vouchers can be deleted.");
        }

        if (voucher.getEmployeeSignaturePath() != null) {
            String path = voucher.getEmployeeSignaturePath();
            long count = voucherRepository.countByEmployeeSignaturePath(path);
            if (count <= 1) {
                signatureStorageService.deleteIfExists(path);
            }
        }

        voucherRepository.delete(voucher);
    }

    public VoucherResponse uploadEmployeeSignature(User employee, Long id, MultipartFile signatureFile) {
        Voucher voucher = getVoucherEntity(id);

        validateVoucherOwnership(voucher, employee);

        if (voucher.getStatus() != VoucherStatus.DRAFT) {
            throw new UnauthorizedActionException("Cannot modify signatures for vouchers that have already been submitted.");
        }

        if (signatureFile == null || signatureFile.isEmpty()) {
            throw new BadRequestException("Signature file is required");
        }

        // Delete old signature if exists and not referenced elsewhere
        if (voucher.getEmployeeSignaturePath() != null) {
            String path = voucher.getEmployeeSignaturePath();
            long count = voucherRepository.countByEmployeeSignaturePath(path);
            if (count <= 1) {
                signatureStorageService.deleteIfExists(path);
            }
        }

        String storedName = signatureStorageService.store(signatureFile, "emp_" + employee.getId());
        voucher.setEmployeeSignaturePath(storedName);

        Voucher saved = voucherRepository.save(voucher);
        return VoucherResponse.fromEntity(saved);
    }

    public VoucherResponse submitVoucher(User employee, Long id) {
        Voucher voucher = getVoucherEntity(id);

        validateVoucherOwnership(voucher, employee);

        if (voucher.getStatus() != VoucherStatus.DRAFT) {
            throw new BadRequestException("Only vouchers in Draft status can be submitted for approval.");
        }

        // Rule 9: Employee Signature is mandatory before submission
        if (voucher.getEmployeeSignaturePath() == null || voucher.getEmployeeSignaturePath().isBlank()) {
            throw new BadRequestException("Employee signature is mandatory before submitting a voucher for approval.");
        }

        voucher.setStatus(VoucherStatus.PENDING_APPROVAL);
        Voucher saved = voucherRepository.save(voucher);
        return VoucherResponse.fromEntity(saved);
    }

    public VoucherResponse approveVoucher(User director, Long id, MultipartFile directorSignatureFile) {
        if (director.getRole() != Role.ROLE_DIRECTOR) {
            throw new UnauthorizedActionException("Only the Director can approve vouchers.");
        }

        Voucher voucher = getVoucherEntity(id);

        if (voucher.getStatus() != VoucherStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Only vouchers in Pending Approval status can be approved.");
        }

        // Rule 9: Director Signature is mandatory before approval
        if (directorSignatureFile == null || directorSignatureFile.isEmpty()) {
            throw new BadRequestException("Director signature is mandatory before approving a voucher.");
        }

        String storedName = signatureStorageService.store(directorSignatureFile, "dir_" + director.getId());
        voucher.setDirectorSignaturePath(storedName);
        voucher.setDirector(director);
        voucher.setDirectorName(director.getFullName());
        voucher.setApprovalDate(LocalDate.now());
        voucher.setStatus(VoucherStatus.APPROVED);
        voucher.setRejectionReason(null); // Clear any previous rejection reason if re-approved

        Voucher saved = voucherRepository.save(voucher);
        return VoucherResponse.fromEntity(saved);
    }

    public VoucherResponse rejectVoucher(User director, Long id, RejectionRequest request) {
        if (director.getRole() != Role.ROLE_DIRECTOR) {
            throw new UnauthorizedActionException("Only the Director can reject vouchers.");
        }

        Voucher voucher = getVoucherEntity(id);

        if (voucher.getStatus() != VoucherStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Only vouchers in Pending Approval status can be rejected.");
        }

        // Rule 9: Rejection Reason is mandatory if a voucher is rejected
        if (request == null || request.getRejectionReason() == null || request.getRejectionReason().trim().isBlank()) {
            throw new BadRequestException("Rejection reason is mandatory when rejecting a voucher.");
        }

        voucher.setDirector(director);
        voucher.setDirectorName(director.getFullName());
        voucher.setRejectionReason(request.getRejectionReason().trim());
        voucher.setStatus(VoucherStatus.REJECTED);

        Voucher saved = voucherRepository.save(voucher);
        return VoucherResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public VoucherResponse getVoucherById(Long id, User currentUser) {
        Voucher voucher = getVoucherEntity(id);

        // Security check: Employee can only view their own vouchers
        if (currentUser.getRole() == Role.ROLE_EMPLOYEE) {
            validateVoucherOwnership(voucher, currentUser);
        }

        return VoucherResponse.fromEntity(voucher);
    }

    @Transactional(readOnly = true)
    public List<VoucherResponse> getVouchersForEmployee(User employee, VoucherFilterRequest filter) {
        Specification<Voucher> spec = VoucherSpecification.withFilter(filter, employee);
        Sort sort = buildSort(filter);
        return voucherRepository.findAll(spec, sort)
                .stream()
                .map(VoucherResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VoucherResponse> getAllVouchers(VoucherFilterRequest filter) {
        Specification<Voucher> spec = VoucherSpecification.withFilter(filter, null);
        Sort sort = buildSort(filter);
        return voucherRepository.findAll(spec, sort)
                .stream()
                .map(VoucherResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VoucherResponse> getPendingVouchersForDirector() {
        VoucherFilterRequest filter = new VoucherFilterRequest();
        filter.setStatus(VoucherStatus.PENDING_APPROVAL);
        return getAllVouchers(filter);
    }

    public Voucher getVoucherEntity(Long id) {
        return voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher not found with id: " + id));
    }

    private void validateVoucherOwnership(Voucher voucher, User employee) {
        if (!voucher.getEmployee().getId().equals(employee.getId())) {
            throw new UnauthorizedActionException("You are not authorized to access or modify this voucher.");
        }
    }

    private Sort buildSort(VoucherFilterRequest filter) {
        String sortBy = "createdDate";
        Sort.Direction direction = Sort.Direction.DESC;

        if (filter != null) {
            if (filter.getSortBy() != null && !filter.getSortBy().isBlank()) {
                sortBy = filter.getSortBy();
            }
            if ("ASC".equalsIgnoreCase(filter.getSortDirection())) {
                direction = Sort.Direction.ASC;
            }
        }
        return Sort.by(direction, sortBy);
    }
}
