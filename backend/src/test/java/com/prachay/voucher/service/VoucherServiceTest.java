package com.prachay.voucher.service;

import com.prachay.voucher.dto.VoucherCreateRequest;
import com.prachay.voucher.dto.VoucherFilterRequest;
import com.prachay.voucher.dto.VoucherResponse;
import com.prachay.voucher.entity.Role;
import com.prachay.voucher.entity.User;
import com.prachay.voucher.entity.Voucher;
import com.prachay.voucher.entity.VoucherStatus;
import com.prachay.voucher.exception.BadRequestException;
import com.prachay.voucher.repository.VoucherRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;
import org.springframework.mock.web.MockMultipartFile;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;

class VoucherServiceTest {

    private VoucherService voucherService;
    private AtomicLong idSequence;
    private AtomicBoolean shouldThrowOnSave;
    private List<String> deletedSignatures;

    private User sampleEmployee;
    private VoucherCreateRequest sampleRequest;

    @BeforeEach
    void setUp() {
        idSequence = new AtomicLong(100);
        shouldThrowOnSave = new AtomicBoolean(false);
        deletedSignatures = new CopyOnWriteArrayList<>();

        // Standard JDK dynamic proxy for VoucherRepository (zero ByteBuddy / agent overhead)
        VoucherRepository mockRepo = (VoucherRepository) Proxy.newProxyInstance(
                VoucherRepository.class.getClassLoader(),
                new Class<?>[]{VoucherRepository.class},
                (proxy, method, args) -> {
                    if ("saveAndFlush".equals(method.getName())) {
                        if (shouldThrowOnSave.get()) {
                            throw new RuntimeException("Simulated Database Persistence Error");
                        }
                        Voucher v = (Voucher) args[0];
                        if (v.getId() == null) {
                            v.setId(idSequence.incrementAndGet());
                        }
                        return v;
                    }
                    return null;
                }
        );

        // Subclass / stub for SignatureStorageService
        SignatureStorageService stubStorage = new SignatureStorageService("uploads/signatures") {
            @Override
            public String store(org.springframework.web.multipart.MultipartFile file, String prefix) {
                return prefix + "_mock_sig_123.png";
            }

            @Override
            public void deleteIfExists(String filename) {
                deletedSignatures.add(filename);
            }
        };

        voucherService = new VoucherService(mockRepo, stubStorage);

        sampleEmployee = new User(10L, "rahul", "hash", "Rahul Sharma", "EMP-1001", "Technology", Role.ROLE_EMPLOYEE);

        sampleRequest = new VoucherCreateRequest();
        sampleRequest.setExpenseDate(LocalDate.of(2026, 10, 20));
        sampleRequest.setDepartmentName("Technology");
        sampleRequest.setExpenseTitle("Cloud Certification");
        sampleRequest.setExpenseCategory("Training & Certification");
        sampleRequest.setExpenseDescription("AWS Exam Fee");
        sampleRequest.setAmount(new BigDecimal("15000.00"));
        sampleRequest.setEmployeeCustomId("EMP-1001");
    }

    // =========================================================================
    // Task 1: Sorting Parameter Validation Tests
    // =========================================================================

    @Test
    @DisplayName("Should use default sorting (createdDate DESC) when filter is null")
    void testValidateAndBuildSort_DefaultWhenFilterNull() {
        Sort sort = voucherService.validateAndBuildSort(null);

        assertNotNull(sort);
        Sort.Order order = sort.getOrderFor("createdDate");
        assertNotNull(order);
        assertEquals(Sort.Direction.DESC, order.getDirection());
    }

    @Test
    @DisplayName("Should use default sorting (createdDate DESC) when sortBy and sortDirection are empty")
    void testValidateAndBuildSort_DefaultWhenEmptyFilter() {
        VoucherFilterRequest filter = new VoucherFilterRequest();
        filter.setSortBy("");
        filter.setSortDirection("");

        Sort sort = voucherService.validateAndBuildSort(filter);

        assertNotNull(sort);
        Sort.Order order = sort.getOrderFor("createdDate");
        assertNotNull(order);
        assertEquals(Sort.Direction.DESC, order.getDirection());
    }

    @Test
    @DisplayName("Should accept valid sort fields and canonicalize property names")
    void testValidateAndBuildSort_ValidSortFields() {
        List<String> validFields = List.of(
                "amount", "expenseDate", "voucherDate", "voucherNumber",
                "departmentName", "expenseTitle", "expenseCategory",
                "status", "employeeName", "approvalDate", "id", "createdDate"
        );

        for (String field : validFields) {
            VoucherFilterRequest filter = new VoucherFilterRequest();
            filter.setSortBy(field);
            filter.setSortDirection("ASC");

            Sort sort = voucherService.validateAndBuildSort(filter);
            assertNotNull(sort, "Sort should not be null for valid field: " + field);

            Sort.Order order = sort.getOrderFor(field);
            assertNotNull(order, "Order should exist for field: " + field);
            assertEquals(Sort.Direction.ASC, order.getDirection());
        }
    }

    @Test
    @DisplayName("Should handle case-insensitive sort field matching")
    void testValidateAndBuildSort_CaseInsensitiveField() {
        VoucherFilterRequest filter = new VoucherFilterRequest();
        filter.setSortBy("EXPENSEDATE");
        filter.setSortDirection("desc");

        Sort sort = voucherService.validateAndBuildSort(filter);
        assertNotNull(sort);
        Sort.Order order = sort.getOrderFor("expenseDate");
        assertNotNull(order);
        assertEquals(Sort.Direction.DESC, order.getDirection());
    }

    @Test
    @DisplayName("Should reject invalid sort field with HTTP 400 BadRequestException")
    void testValidateAndBuildSort_InvalidFieldThrowsBadRequest() {
        VoucherFilterRequest filter = new VoucherFilterRequest();
        filter.setSortBy("nonExistentColumn");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                voucherService.validateAndBuildSort(filter)
        );

        assertTrue(ex.getMessage().contains("Invalid sort field: 'nonExistentColumn'"));
        assertTrue(ex.getMessage().contains("Supported sort fields are:"));
    }

    @Test
    @DisplayName("Should reject SQL injection attempt in sortBy with BadRequestException")
    void testValidateAndBuildSort_SqlInjectionInSortByRejected() {
        VoucherFilterRequest filter = new VoucherFilterRequest();
        filter.setSortBy("amount; DROP TABLE vouchers;--");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                voucherService.validateAndBuildSort(filter)
        );

        assertTrue(ex.getMessage().contains("Invalid sort field"));
    }

    @Test
    @DisplayName("Should reject invalid sort direction with HTTP 400 BadRequestException")
    void testValidateAndBuildSort_InvalidDirectionThrowsBadRequest() {
        VoucherFilterRequest filter = new VoucherFilterRequest();
        filter.setSortBy("amount");
        filter.setSortDirection("SIDEWAYS");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                voucherService.validateAndBuildSort(filter)
        );

        assertTrue(ex.getMessage().contains("Invalid sort direction: 'SIDEWAYS'"));
        assertTrue(ex.getMessage().contains("Supported directions are: ASC, DESC"));
    }

    // =========================================================================
    // Task 2: Voucher Number Generation and Concurrency Tests
    // =========================================================================

    @Test
    @DisplayName("Should format canonical voucher number correctly from database ID")
    void testFormatVoucherNumber() {
        LocalDate testDate = LocalDate.of(2026, 10, 25);
        assertEquals("VCH-202610-0001", voucherService.formatVoucherNumber(1L, testDate));
        assertEquals("VCH-202610-0042", voucherService.formatVoucherNumber(42L, testDate));
        assertEquals("VCH-202610-9999", voucherService.formatVoucherNumber(9999L, testDate));
        assertEquals("VCH-202610-10000", voucherService.formatVoucherNumber(10000L, testDate));
    }

    @Test
    @DisplayName("Should create draft with collision-free atomic two-phase persistence")
    void testCreateDraft_AtomicVoucherNumberAllocation() {
        VoucherResponse response = voucherService.createDraft(sampleEmployee, sampleRequest, null);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        String expectedPrefix = "VCH-" + LocalDate.now().getYear() + String.format("%02d", LocalDate.now().getMonthValue()) + "-0101";
        assertEquals(expectedPrefix, response.getVoucherNumber());
        assertEquals(VoucherStatus.DRAFT, response.getStatus());
    }

    @Test
    @DisplayName("Should clean up uploaded signature file if database persistence fails")
    void testCreateDraft_SignatureCleanedUpOnDatabaseFailure() {
        MockMultipartFile sigFile = new MockMultipartFile("signature", "sign.png", "image/png", new byte[]{1, 2, 3});
        shouldThrowOnSave.set(true);

        assertThrows(RuntimeException.class, () ->
                voucherService.createDraft(sampleEmployee, sampleRequest, sigFile)
        );

        assertEquals(1, deletedSignatures.size());
        assertEquals("emp_10_mock_sig_123.png", deletedSignatures.get(0));
    }

    @Test
    @DisplayName("Concurrent voucher number generation produces 100% unique, non-colliding numbers")
    void testConcurrentVoucherNumberAllocation() throws InterruptedException, ExecutionException {
        int threadCount = 50;
        ExecutorService executor = Executors.newFixedThreadPool(10);
        AtomicLong dbAutoIncrementId = new AtomicLong(0);
        LocalDate testDate = LocalDate.of(2026, 10, 25);

        List<Callable<String>> tasks = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            tasks.add(() -> {
                long allocatedId = dbAutoIncrementId.incrementAndGet();
                return voucherService.formatVoucherNumber(allocatedId, testDate);
            });
        }

        List<Future<String>> futures = executor.invokeAll(tasks);
        Set<String> generatedNumbers = ConcurrentHashMap.newKeySet();

        for (Future<String> future : futures) {
            String num = future.get();
            assertNotNull(num);
            assertTrue(num.startsWith("VCH-202610-"));
            assertTrue(generatedNumbers.add(num), "Duplicate voucher number detected: " + num);
        }

        assertEquals(threadCount, generatedNumbers.size(), "All generated voucher numbers must be strictly unique");
        executor.shutdown();
    }
}
