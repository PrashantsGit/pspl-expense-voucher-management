package com.prachay.voucher.config;

import com.prachay.voucher.entity.Role;
import com.prachay.voucher.entity.User;
import com.prachay.voucher.entity.Voucher;
import com.prachay.voucher.entity.VoucherStatus;
import com.prachay.voucher.repository.UserRepository;
import com.prachay.voucher.repository.VoucherRepository;
import com.prachay.voucher.service.SignatureStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Configuration
@Profile("!prod")
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final VoucherRepository voucherRepository;
    private final PasswordEncoder passwordEncoder;
    private final SignatureStorageService signatureStorageService;
    private final boolean seedDemoData;

    public DataInitializer(
            UserRepository userRepository,
            VoucherRepository voucherRepository,
            PasswordEncoder passwordEncoder,
            SignatureStorageService signatureStorageService,
            @Value("${app.demo.seed-data:true}") boolean seedDemoData) {
        this.userRepository = userRepository;
        this.voucherRepository = voucherRepository;
        this.passwordEncoder = passwordEncoder;
        this.signatureStorageService = signatureStorageService;
        this.seedDemoData = seedDemoData;
    }

    @Override
    public void run(String... args) throws Exception {
        if (!seedDemoData) {
            logger.info("Demo data initialization is disabled (app.demo.seed-data=false). Skipping demo seeding and self-healing.");
            return;
        }

        // 1. Initial Seeding if no users exist
        if (userRepository.count() == 0) {
            logger.info("Initializing demo users and sample vouchers...");

            User emp1 = new User(null, "employee1", passwordEncoder.encode("password123"), "Rahul Sharma", "EMP-1001", "Technology", Role.ROLE_EMPLOYEE);
            User emp2 = new User(null, "employee2", passwordEncoder.encode("password123"), "Priya Patel", "EMP-1002", "Marketing", Role.ROLE_EMPLOYEE);
            User director = new User(null, "director", passwordEncoder.encode("password123"), "Vikram Malhotra", "DIR-001", "Executive Management", Role.ROLE_DIRECTOR);
            User accounts = new User(null, "accounts", passwordEncoder.encode("password123"), "Anjali Gupta", "ACC-001", "Finance & Accounts", Role.ROLE_ACCOUNTS);

            emp1 = userRepository.save(emp1);
            emp2 = userRepository.save(emp2);
            director = userRepository.save(director);
            accounts = userRepository.save(accounts);

            // Generate dedicated, distinct signature files per voucher
            byte[] emp1SigBytes = generateSignatureImage("Rahul Sharma");
            byte[] emp2SigBytes = generateSignatureImage("Priya Patel");
            byte[] dirSigBytes = generateSignatureImage("Vikram Malhotra (Director)");

            String sig1 = signatureStorageService.store(new ByteArrayMultipartFile("signature", "signature.png", "image/png", emp1SigBytes), "emp_" + emp1.getId());
            String sig2 = signatureStorageService.store(new ByteArrayMultipartFile("signature", "signature.png", "image/png", emp1SigBytes), "emp_" + emp1.getId());
            String sig3 = signatureStorageService.store(new ByteArrayMultipartFile("signature", "signature.png", "image/png", emp1SigBytes), "emp_" + emp1.getId());
            String sig4 = signatureStorageService.store(new ByteArrayMultipartFile("signature", "signature.png", "image/png", emp2SigBytes), "emp_" + emp2.getId());
            String dirSig = signatureStorageService.store(new ByteArrayMultipartFile("signature", "signature.png", "image/png", dirSigBytes), "dir_" + director.getId());

            // Voucher 1: DRAFT (Employee 1)
            Voucher v1 = new Voucher();
            v1.setVoucherNumber("VCH-202610-0001");
            v1.setVoucherDate(LocalDate.now());
            v1.setExpenseDate(LocalDate.now().minusDays(3));
            v1.setDepartmentName("Technology");
            v1.setExpenseTitle("Client Cloud Architecture Workshop");
            v1.setExpenseCategory("Training & Certification");
            v1.setExpenseDescription("Attendance registration fee for AWS Advanced Architecture Workshop for Q4 project deployment.");
            v1.setAmount(new BigDecimal("12500.00"));
            v1.setStatus(VoucherStatus.DRAFT);
            v1.setEmployee(emp1);
            v1.setEmployeeName(emp1.getFullName());
            v1.setEmployeeCustomId(emp1.getEmployeeId());
            v1.setEmployeeSignaturePath(sig1);
            voucherRepository.save(v1);

            // Voucher 2: PENDING_APPROVAL (Employee 1)
            Voucher v2 = new Voucher();
            v2.setVoucherNumber("VCH-202610-0002");
            v2.setVoucherDate(LocalDate.now().minusDays(2));
            v2.setExpenseDate(LocalDate.now().minusDays(4));
            v2.setDepartmentName("Technology");
            v2.setExpenseTitle("Production IDE & Tooling Licenses");
            v2.setExpenseCategory("Software & Tools");
            v2.setExpenseDescription("JetBrains All Products Pack subscription renewal for the backend engineering team.");
            v2.setAmount(new BigDecimal("28400.00"));
            v2.setStatus(VoucherStatus.PENDING_APPROVAL);
            v2.setEmployee(emp1);
            v2.setEmployeeName(emp1.getFullName());
            v2.setEmployeeCustomId(emp1.getEmployeeId());
            v2.setEmployeeSignaturePath(sig2);
            voucherRepository.save(v2);

            // Voucher 3: APPROVED (Employee 1 - Approved by Director)
            Voucher v3 = new Voucher();
            v3.setVoucherNumber("VCH-202610-0003");
            v3.setVoucherDate(LocalDate.now().minusDays(5));
            v3.setExpenseDate(LocalDate.now().minusDays(7));
            v3.setDepartmentName("Technology");
            v3.setExpenseTitle("Client Onsite Visit Flight Tickets");
            v3.setExpenseCategory("Travel & Transport");
            v3.setExpenseDescription("Round-trip flight booking to Mumbai headquarters for client system integration testing.");
            v3.setAmount(new BigDecimal("14250.00"));
            v3.setStatus(VoucherStatus.APPROVED);
            v3.setEmployee(emp1);
            v3.setEmployeeName(emp1.getFullName());
            v3.setEmployeeCustomId(emp1.getEmployeeId());
            v3.setEmployeeSignaturePath(sig3);
            v3.setDirector(director);
            v3.setDirectorName(director.getFullName());
            v3.setDirectorSignaturePath(dirSig);
            v3.setApprovalDate(LocalDate.now());
            voucherRepository.save(v3);

            // Voucher 4: REJECTED (Employee 2 - Rejected by Director)
            Voucher v4 = new Voucher();
            v4.setVoucherNumber("VCH-202610-0004");
            v4.setVoucherDate(LocalDate.now().minusDays(6));
            v4.setExpenseDate(LocalDate.now().minusDays(8));
            v4.setDepartmentName("Marketing");
            v4.setExpenseTitle("Team Dinner at Gourmet Bistro");
            v4.setExpenseCategory("Meals & Entertainment");
            v4.setExpenseDescription("Informal team dinner following quarterly campaign launch.");
            v4.setAmount(new BigDecimal("18600.00"));
            v4.setStatus(VoucherStatus.REJECTED);
            v4.setEmployee(emp2);
            v4.setEmployeeName(emp2.getFullName());
            v4.setEmployeeCustomId(emp2.getEmployeeId());
            v4.setEmployeeSignaturePath(sig4);
            v4.setDirector(director);
            v4.setDirectorName(director.getFullName());
            v4.setRejectionReason("Quarterly dinner expenses exceed per-head policy limits. Please split and resubmit with itemized tax invoice.");
            voucherRepository.save(v4);

            logger.info("Demo users and seed vouchers created successfully.");
        }

        // 2. Self-healing: verify all existing voucher signature references on disk and restore missing files
        List<Voucher> allVouchers = voucherRepository.findAll();
        for (Voucher v : allVouchers) {
            if (v.getEmployeeSignaturePath() != null && !signatureStorageService.exists(v.getEmployeeSignaturePath())) {
                String name = v.getEmployeeName() != null ? v.getEmployeeName() : "Employee Signature";
                byte[] bytes = generateSignatureImage(name);
                signatureStorageService.createOrUpdateSignatureFile(v.getEmployeeSignaturePath(), bytes);
                logger.info("Restored missing employee signature file for voucher {}: {}", v.getVoucherNumber(), v.getEmployeeSignaturePath());
            }

            if (v.getDirectorSignaturePath() != null && !signatureStorageService.exists(v.getDirectorSignaturePath())) {
                String name = v.getDirectorName() != null ? v.getDirectorName() + " (Director)" : "Director Approval";
                byte[] bytes = generateSignatureImage(name);
                signatureStorageService.createOrUpdateSignatureFile(v.getDirectorSignaturePath(), bytes);
                logger.info("Restored missing director signature file for voucher {}: {}", v.getVoucherNumber(), v.getDirectorSignaturePath());
            }
        }
    }

    private byte[] generateSignatureImage(String text) throws IOException {
        int width = 350;
        int height = 100;
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = image.createGraphics();

        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setColor(new Color(248, 249, 250));
        g2d.fillRect(0, 0, width, height);

        g2d.setColor(new Color(220, 224, 230));
        g2d.drawRect(0, 0, width - 1, height - 1);

        g2d.setColor(new Color(20, 60, 140));
        g2d.setFont(new Font("Serif", Font.ITALIC | Font.BOLD, 22));
        g2d.drawString(text, 25, 55);

        g2d.setColor(new Color(100, 120, 160));
        g2d.setFont(new Font("SansSerif", Font.PLAIN, 11));
        g2d.drawString("Digitally Verified Signature - PSPL", 25, 78);

        g2d.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        return baos.toByteArray();
    }

    private static class ByteArrayMultipartFile implements MultipartFile {
        private final String name;
        private final String originalFilename;
        private final String contentType;
        private final byte[] content;

        public ByteArrayMultipartFile(String name, String originalFilename, String contentType, byte[] content) {
            this.name = name;
            this.originalFilename = originalFilename;
            this.contentType = contentType;
            this.content = content != null ? content : new byte[0];
        }

        @Override public String getName() { return name; }
        @Override public String getOriginalFilename() { return originalFilename; }
        @Override public String getContentType() { return contentType; }
        @Override public boolean isEmpty() { return content.length == 0; }
        @Override public long getSize() { return content.length; }
        @Override public byte[] getBytes() { return content; }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(content); }
        @Override public void transferTo(File dest) throws IOException {
            try (FileOutputStream fos = new FileOutputStream(dest)) {
                fos.write(content);
            }
        }
    }
}
