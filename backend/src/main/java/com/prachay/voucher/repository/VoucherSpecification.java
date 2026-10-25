package com.prachay.voucher.repository;

import com.prachay.voucher.dto.VoucherFilterRequest;
import com.prachay.voucher.entity.User;
import com.prachay.voucher.entity.Voucher;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class VoucherSpecification {

    public static Specification<Voucher> withFilter(VoucherFilterRequest filter, User employeeScope) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Scoping: if an employee scope is provided, MUST strictly filter by that employee
            if (employeeScope != null) {
                predicates.add(cb.equal(root.get("employee"), employeeScope));
            }

            if (filter != null) {
                // Voucher Number filter
                if (filter.getVoucherNumber() != null && !filter.getVoucherNumber().isBlank()) {
                    predicates.add(cb.like(cb.lower(root.get("voucherNumber")), "%" + filter.getVoucherNumber().trim().toLowerCase() + "%"));
                }

                // Employee Name filter
                if (filter.getEmployeeName() != null && !filter.getEmployeeName().isBlank()) {
                    predicates.add(cb.like(cb.lower(root.get("employeeName")), "%" + filter.getEmployeeName().trim().toLowerCase() + "%"));
                }

                // Department filter
                if (filter.getDepartment() != null && !filter.getDepartment().isBlank()) {
                    predicates.add(cb.like(cb.lower(root.get("departmentName")), "%" + filter.getDepartment().trim().toLowerCase() + "%"));
                }

                // Expense Category filter
                if (filter.getExpenseCategory() != null && !filter.getExpenseCategory().isBlank()) {
                    predicates.add(cb.equal(root.get("expenseCategory"), filter.getExpenseCategory().trim()));
                }

                // Status filter
                if (filter.getStatus() != null) {
                    predicates.add(cb.equal(root.get("status"), filter.getStatus()));
                }

                // Date Range (filters by expenseDate)
                if (filter.getStartDate() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("expenseDate"), filter.getStartDate()));
                }
                if (filter.getEndDate() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("expenseDate"), filter.getEndDate()));
                }

                // Amount Range
                if (filter.getMinAmount() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("amount"), filter.getMinAmount()));
                }
                if (filter.getMaxAmount() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("amount"), filter.getMaxAmount()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
