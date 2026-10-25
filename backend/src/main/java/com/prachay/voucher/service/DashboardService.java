package com.prachay.voucher.service;

import com.prachay.voucher.dto.AccountsDashboardDto;
import com.prachay.voucher.dto.DirectorDashboardDto;
import com.prachay.voucher.dto.EmployeeDashboardDto;
import com.prachay.voucher.dto.VoucherResponse;
import com.prachay.voucher.entity.User;
import com.prachay.voucher.entity.VoucherStatus;
import com.prachay.voucher.repository.VoucherRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final VoucherRepository voucherRepository;

    public DashboardService(VoucherRepository voucherRepository) {
        this.voucherRepository = voucherRepository;
    }

    public EmployeeDashboardDto getEmployeeDashboard(User employee) {
        long total = voucherRepository.countByEmployee(employee);
        long drafts = voucherRepository.countByEmployeeAndStatus(employee, VoucherStatus.DRAFT);
        long pending = voucherRepository.countByEmployeeAndStatus(employee, VoucherStatus.PENDING_APPROVAL);
        long approved = voucherRepository.countByEmployeeAndStatus(employee, VoucherStatus.APPROVED);
        long rejected = voucherRepository.countByEmployeeAndStatus(employee, VoucherStatus.REJECTED);
        BigDecimal totalAmount = voucherRepository.sumAmountByEmployee(employee);

        return new EmployeeDashboardDto(total, drafts, pending, approved, rejected, totalAmount);
    }

    public DirectorDashboardDto getDirectorDashboard() {
        long pendingCount = voucherRepository.countByStatus(VoucherStatus.PENDING_APPROVAL);
        long approvedToday = voucherRepository.countApprovedToday(LocalDate.now());
        long rejectedToday = voucherRepository.countRejectedToday(LocalDate.now().atStartOfDay());
        BigDecimal totalPending = voucherRepository.sumPendingAmount();

        List<VoucherResponse> recentActivity = voucherRepository.findAllByOrderByLastUpdatedDateDesc(PageRequest.of(0, 10))
                .stream()
                .map(VoucherResponse::fromEntity)
                .collect(Collectors.toList());

        return new DirectorDashboardDto(pendingCount, approvedToday, rejectedToday, totalPending, recentActivity);
    }

    public AccountsDashboardDto getAccountsDashboard() {
        long total = voucherRepository.count();
        long pending = voucherRepository.countByStatus(VoucherStatus.PENDING_APPROVAL);
        long approved = voucherRepository.countByStatus(VoucherStatus.APPROVED);
        long rejected = voucherRepository.countByStatus(VoucherStatus.REJECTED);
        BigDecimal totalApproved = voucherRepository.sumApprovedAmount();

        List<VoucherResponse> recentApproved = voucherRepository.findByStatusOrderByApprovalDateDescCreatedDateDesc(VoucherStatus.APPROVED, PageRequest.of(0, 10))
                .stream()
                .map(VoucherResponse::fromEntity)
                .collect(Collectors.toList());

        return new AccountsDashboardDto(total, pending, approved, rejected, totalApproved, recentApproved);
    }
}
