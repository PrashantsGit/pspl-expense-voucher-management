package com.prachay.voucher.repository;

import com.prachay.voucher.entity.User;
import com.prachay.voucher.entity.Voucher;
import com.prachay.voucher.entity.VoucherStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long>, JpaSpecificationExecutor<Voucher> {

    Optional<Voucher> findByVoucherNumber(String voucherNumber);

    List<Voucher> findByEmployeeOrderByCreatedDateDesc(User employee);

    Optional<Voucher> findTopByOrderByIdDesc();

    // Employee Dashboard metrics
    long countByEmployee(User employee);
    long countByEmployeeAndStatus(User employee, VoucherStatus status);

    @Query("SELECT COALESCE(SUM(v.amount), 0) FROM Voucher v WHERE v.employee = :employee")
    BigDecimal sumAmountByEmployee(@Param("employee") User employee);

    // Director Dashboard metrics
    long countByStatus(VoucherStatus status);

    @Query("SELECT COUNT(v) FROM Voucher v WHERE v.status = 'APPROVED' AND v.approvalDate = :today")
    long countApprovedToday(@Param("today") LocalDate today);

    @Query("SELECT COUNT(v) FROM Voucher v WHERE v.status = 'REJECTED' AND v.lastUpdatedDate >= :startOfDay")
    long countRejectedToday(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COALESCE(SUM(v.amount), 0) FROM Voucher v WHERE v.status = 'PENDING_APPROVAL'")
    BigDecimal sumPendingAmount();

    // Accounts Dashboard metrics
    @Query("SELECT COALESCE(SUM(v.amount), 0) FROM Voucher v WHERE v.status = 'APPROVED'")
    BigDecimal sumApprovedAmount();

    List<Voucher> findByStatusOrderByApprovalDateDescCreatedDateDesc(VoucherStatus status, Pageable pageable);

    List<Voucher> findAllByOrderByLastUpdatedDateDesc(Pageable pageable);

    // Signature reference counting
    long countByEmployeeSignaturePath(String employeeSignaturePath);
    long countByDirectorSignaturePath(String directorSignaturePath);
}
