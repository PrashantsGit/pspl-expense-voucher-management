package com.prachay.voucher.service;

import com.prachay.voucher.exception.FileStorageException;
import com.prachay.voucher.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class SignatureStorageService {

    private final Path rootLocation;
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp"
    );

    public SignatureStorageService(@Value("${app.upload.dir:uploads/signatures}") String uploadDir) {
        Path path = Paths.get(uploadDir).normalize();
        if (!path.isAbsolute()) {
            Path currentWorkingDir = Paths.get("").toAbsolutePath();
            // If running inside backend subdirectory, anchor to project root uploads
            if (currentWorkingDir.endsWith("backend")) {
                this.rootLocation = currentWorkingDir.getParent().resolve("uploads").resolve("signatures").normalize();
            } else {
                this.rootLocation = currentWorkingDir.resolve(uploadDir).normalize();
            }
        } else {
            this.rootLocation = path;
        }

        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new FileStorageException("Could not initialize storage directory", e);
        }
    }

    public Path getRootLocation() {
        return rootLocation;
    }

    public String store(MultipartFile file, String prefix) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("Cannot store an empty signature file");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new FileStorageException("Invalid file format. Only PNG, JPEG, and WebP images are allowed.");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "signature.png");

        // Prevent path traversal
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new FileStorageException("Filename contains invalid path sequence: " + originalFilename);
        }

        // Extract extension
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        } else {
            extension = ".png";
        }

        String storedFilename = prefix + "_" + UUID.randomUUID().toString().replace("-", "") + extension;

        try {
            Path destinationFile = this.rootLocation.resolve(storedFilename).normalize().toAbsolutePath();
            if (!destinationFile.getParent().equals(this.rootLocation.toAbsolutePath())) {
                throw new FileStorageException("Cannot store file outside current directory");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }
            return storedFilename;
        } catch (IOException e) {
            throw new FileStorageException("Failed to store file: " + originalFilename, e);
        }
    }

    public boolean exists(String filename) {
        if (filename == null || filename.isBlank()) return false;
        Path file = this.rootLocation.resolve(filename).normalize().toAbsolutePath();
        if (Files.exists(file) && Files.isReadable(file)) {
            return true;
        }
        // Check secondary directory if launched from alternative root
        Path altFile = Paths.get("uploads", "signatures", filename).toAbsolutePath().normalize();
        if (Files.exists(altFile) && Files.isReadable(altFile)) {
            return true;
        }
        Path altBackendFile = Paths.get("backend", "uploads", "signatures", filename).toAbsolutePath().normalize();
        return Files.exists(altBackendFile) && Files.isReadable(altBackendFile);
    }

    public void createOrUpdateSignatureFile(String filename, byte[] content) {
        if (filename == null || filename.isBlank()) return;
        try {
            Path destinationFile = this.rootLocation.resolve(filename).normalize().toAbsolutePath();
            Files.createDirectories(destinationFile.getParent());
            Files.write(destinationFile, content);
        } catch (IOException e) {
            throw new FileStorageException("Could not write signature file: " + filename, e);
        }
    }

    public Resource loadAsResource(String filename) {
        try {
            // Guard against traversal
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                throw new FileStorageException("Invalid filename sequence");
            }

            Path file = this.rootLocation.resolve(filename).normalize().toAbsolutePath();
            if (!file.getParent().equals(this.rootLocation.toAbsolutePath())) {
                throw new FileStorageException("Access denied: invalid file path");
            }

            if (Files.exists(file) && Files.isReadable(file)) {
                return new UrlResource(file.toUri());
            }

            // Fallback check in project-relative paths
            Path fallback1 = Paths.get("uploads", "signatures", filename).toAbsolutePath().normalize();
            if (Files.exists(fallback1) && Files.isReadable(fallback1)) {
                return new UrlResource(fallback1.toUri());
            }

            Path fallback2 = Paths.get("backend", "uploads", "signatures", filename).toAbsolutePath().normalize();
            if (Files.exists(fallback2) && Files.isReadable(fallback2)) {
                return new UrlResource(fallback2.toUri());
            }

            throw new ResourceNotFoundException("Signature file not found: " + filename);
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Signature file not found: " + filename);
        }
    }

    public void deleteIfExists(String filename) {
        if (filename == null || filename.isBlank()) {
            return;
        }
        try {
            Path file = this.rootLocation.resolve(filename).normalize().toAbsolutePath();
            if (file.getParent().equals(this.rootLocation.toAbsolutePath())) {
                Files.deleteIfExists(file);
            }
        } catch (IOException ignored) {
        }
    }
}
