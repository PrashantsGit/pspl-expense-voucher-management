package com.prachay.voucher.service;

import com.prachay.voucher.exception.FileStorageException;
import com.prachay.voucher.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
public class SignatureStorageService {

    public static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    public static final long MIN_FILE_SIZE = 24; // Minimum plausible image header
    public static final int MAX_DIMENSION = 5000; // Max allowed width or height in pixels

    private final Path rootLocation;

    public enum SupportedImageFormat {
        PNG("image/png", ".png", List.of(".png"), List.of("image/png")),
        JPEG("image/jpeg", ".jpg", List.of(".jpg", ".jpeg"), List.of("image/jpeg", "image/jpg", "image/pjpeg")),
        WEBP("image/webp", ".webp", List.of(".webp"), List.of("image/webp"));

        private final String mimeType;
        private final String defaultExtension;
        private final List<String> allowedExtensions;
        private final List<String> allowedMimeTypes;

        SupportedImageFormat(String mimeType, String defaultExtension, List<String> allowedExtensions, List<String> allowedMimeTypes) {
            this.mimeType = mimeType;
            this.defaultExtension = defaultExtension;
            this.allowedExtensions = allowedExtensions;
            this.allowedMimeTypes = allowedMimeTypes;
        }

        public String getMimeType() {
            return mimeType;
        }

        public String getDefaultExtension() {
            return defaultExtension;
        }

        public List<String> getAllowedExtensions() {
            return allowedExtensions;
        }

        public List<String> getAllowedMimeTypes() {
            return allowedMimeTypes;
        }

        public boolean matchesExtension(String ext) {
            if (ext == null) return false;
            String lower = ext.toLowerCase();
            return allowedExtensions.contains(lower);
        }

        public boolean matchesMimeType(String mime) {
            if (mime == null) return false;
            String lower = mime.toLowerCase();
            return allowedMimeTypes.contains(lower);
        }
    }

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

    /**
     * Stores a validated signature file.
     * Enforces:
     * 1. Empty / null / size limits
     * 2. Magic-byte detection (PNG, JPEG, WebP)
     * 3. Deep image decoding and dimension verification
     * 4. Client Content-Type verification against detected format
     * 5. Original filename extension validation against detected format
     * 6. Server-controlled UUID filename with canonical extension
     * 7. Guaranteed atomic write with cleanup on failure
     */
    public String store(MultipartFile file, String prefix) {
        if (file == null || file.isEmpty() || file.getSize() == 0) {
            throw new FileStorageException("Cannot store an empty signature file");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileStorageException("Signature file size exceeds maximum permitted limit of 5MB");
        }

        if (file.getSize() < MIN_FILE_SIZE) {
            throw new FileStorageException("File is too small to be a valid image");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new FileStorageException("Failed to read signature file bytes", e);
        }

        if (bytes == null || bytes.length == 0) {
            throw new FileStorageException("Cannot store an empty signature file");
        }

        // 1. Detect format by inspecting actual file magic bytes
        SupportedImageFormat detectedFormat = detectFormat(bytes);

        // 2. Validate client-provided MIME type against detected format
        validateMimeType(file.getContentType(), detectedFormat);

        // 3. Validate client-provided file extension against detected format
        validateExtension(file.getOriginalFilename(), detectedFormat);

        // 4. Deep-validate actual image structure, raster decodability, and dimensions
        validateImageContent(bytes, detectedFormat);

        // 5. Generate safe server-controlled filename strictly using the canonical extension
        String safePrefix = (prefix != null && !prefix.isBlank()) ? prefix.replaceAll("[^a-zA-Z0-9_-]", "") : "sig";
        String storedFilename = safePrefix + "_" + UUID.randomUUID().toString().replace("-", "") + detectedFormat.getDefaultExtension();

        Path destinationFile = this.rootLocation.resolve(storedFilename).normalize().toAbsolutePath();
        if (!destinationFile.getParent().equals(this.rootLocation.toAbsolutePath())) {
            throw new FileStorageException("Cannot store file outside target directory");
        }

        // 6. Write to disk and ensure failed writes do not leave partial files behind
        try {
            Files.write(destinationFile, bytes);
            return storedFilename;
        } catch (Exception e) {
            try {
                Files.deleteIfExists(destinationFile);
            } catch (IOException ignored) {
            }
            throw new FileStorageException("Failed to store signature file: " + e.getMessage(), e);
        }
    }

    /**
     * Inspects magic bytes to identify supported image formats or reject unsupported/malformed formats.
     */
    public SupportedImageFormat detectFormat(byte[] bytes) {
        if (bytes == null || bytes.length < MIN_FILE_SIZE) {
            throw new FileStorageException("File content is too small to determine image format");
        }

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G'
                && bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A) {
            return SupportedImageFormat.PNG;
        }

        // JPEG: FF D8 FF
        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return SupportedImageFormat.JPEG;
        }

        // WebP: 'RIFF' + 4-byte size + 'WEBP'
        if (bytes.length >= 12
                && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return SupportedImageFormat.WEBP;
        }

        // Specific detection of known unsupported formats for clear error reporting
        if (bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F') {
            throw new FileStorageException("Unsupported image format: GIF images are not allowed. Only PNG, JPEG, and WebP are supported.");
        }
        if (bytes[0] == 'B' && bytes[1] == 'M') {
            throw new FileStorageException("Unsupported image format: BMP images are not allowed. Only PNG, JPEG, and WebP are supported.");
        }
        if (bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F') {
            throw new FileStorageException("Unsupported format: PDF documents cannot be uploaded as signature images.");
        }
        String headerSnippet = new String(bytes, 0, Math.min(bytes.length, 64), StandardCharsets.US_ASCII).toLowerCase();
        if (headerSnippet.contains("<svg") || headerSnippet.contains("<?xml")) {
            throw new FileStorageException("Unsupported image format: SVG images are not allowed due to security restrictions.");
        }

        throw new FileStorageException("Invalid file content: The file is not a supported image (only PNG, JPEG, and WebP are allowed).");
    }

    /**
     * Validates that the client-declared Content-Type matches the actual detected image format.
     */
    private void validateMimeType(String clientMime, SupportedImageFormat format) {
        if (clientMime == null || clientMime.isBlank()) {
            return;
        }
        String cleanMime = clientMime.trim().toLowerCase();
        if (!format.matchesMimeType(cleanMime)) {
            throw new FileStorageException("Content-Type mismatch: client reported '" + clientMime
                    + "' but file content is " + format.name() + " (" + format.getMimeType() + ")");
        }
    }

    /**
     * Validates that the original filename extension matches the actual detected image format.
     */
    private void validateExtension(String originalFilename, SupportedImageFormat format) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return;
        }
        String cleanName = StringUtils.cleanPath(originalFilename);
        if (cleanName.contains("..") || cleanName.contains("/") || cleanName.contains("\\")) {
            throw new FileStorageException("Filename contains invalid path sequence: " + originalFilename);
        }

        int dotIndex = cleanName.lastIndexOf('.');
        if (dotIndex >= 0 && dotIndex < cleanName.length() - 1) {
            String extension = cleanName.substring(dotIndex).toLowerCase();
            if (!format.matchesExtension(extension)) {
                throw new FileStorageException("File extension mismatch: extension '" + extension
                        + "' does not match detected format " + format.name()
                        + " (allowed: " + format.getAllowedExtensions() + ")");
            }
        }
    }

    /**
     * Performs deep validation of the image data based on the detected format.
     */
    private void validateImageContent(byte[] bytes, SupportedImageFormat format) {
        switch (format) {
            case PNG -> validateRasterImage(bytes, "png");
            case JPEG -> validateRasterImage(bytes, "JPEG");
            case WEBP -> validateWebPImage(bytes);
        }
    }

    /**
     * Uses Java ImageIO ImageReader to inspect dimensions without unneeded memory overhead,
     * then reads the raster to verify structural integrity.
     */
    private void validateRasterImage(byte[] bytes, String expectedFormatName) {
        try (ImageInputStream iis = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            if (iis == null) {
                throw new FileStorageException("Unable to read image stream");
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(iis);
            if (!readers.hasNext()) {
                throw new FileStorageException("Malformed or unreadable " + expectedFormatName + " image");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(iis, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                if (width <= 0 || height <= 0) {
                    throw new FileStorageException("Image dimensions must be positive (got " + width + "x" + height + ")");
                }
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    throw new FileStorageException("Image dimensions (" + width + "x" + height
                            + ") exceed maximum permitted size of " + MAX_DIMENSION + "px");
                }

                // Verify the entire raster can be decoded without corruption
                BufferedImage bufferedImage = reader.read(0);
                if (bufferedImage == null) {
                    throw new FileStorageException("Corrupted or invalid " + expectedFormatName + " image data");
                }
            } finally {
                reader.dispose();
            }
        } catch (FileStorageException fse) {
            throw fse;
        } catch (Exception e) {
            throw new FileStorageException("Malformed or corrupted " + expectedFormatName + " image: " + e.getMessage(), e);
        }
    }

    /**
     * Validates WebP container, chunk header, start code/signature, and canvas dimensions.
     */
    private void validateWebPImage(byte[] bytes) {
        if (bytes.length < 25) {
            throw new FileStorageException("Malformed WebP image: file size too small");
        }

        long riffSize = (bytes[4] & 0xFFL) | ((bytes[5] & 0xFFL) << 8) | ((bytes[6] & 0xFFL) << 16) | ((bytes[7] & 0xFFL) << 24);
        if (bytes.length < riffSize + 8) {
            throw new FileStorageException("Corrupted WebP image: incomplete file stream");
        }

        String chunkType = new String(bytes, 12, 4, StandardCharsets.US_ASCII);
        long chunkSize = (bytes[16] & 0xFFL) | ((bytes[17] & 0xFFL) << 8) | ((bytes[18] & 0xFFL) << 16) | ((bytes[19] & 0xFFL) << 24);

        int width = 0;
        int height = 0;

        if ("VP8 ".equals(chunkType)) {
            if (bytes.length < 30 || chunkSize < 10) {
                throw new FileStorageException("Malformed lossy WebP (VP8) chunk");
            }
            // Check VP8 frame start code: 0x9D, 0x01, 0x2A
            if ((bytes[23] & 0xFF) != 0x9D || (bytes[24] & 0xFF) != 0x01 || (bytes[25] & 0xFF) != 0x2A) {
                throw new FileStorageException("Malformed VP8 frame header in WebP image");
            }
            width = (bytes[26] & 0xFF | ((bytes[27] & 0xFF) << 8)) & 0x3FFF;
            height = (bytes[28] & 0xFF | ((bytes[29] & 0xFF) << 8)) & 0x3FFF;
        } else if ("VP8L".equals(chunkType)) {
            if (bytes.length < 25 || chunkSize < 5) {
                throw new FileStorageException("Malformed lossless WebP (VP8L) chunk");
            }
            // Check 1-byte signature at offset 20: 0x2F
            if ((bytes[20] & 0xFF) != 0x2F) {
                throw new FileStorageException("Malformed VP8L signature in WebP image");
            }
            int b21 = bytes[21] & 0xFF;
            int b22 = bytes[22] & 0xFF;
            int b23 = bytes[23] & 0xFF;
            int b24 = bytes[24] & 0xFF;
            width = (b21 | ((b22 & 0x3F) << 8)) + 1;
            height = (((b22 & 0xC0) >>> 6) | (b23 << 2) | ((b24 & 0x0F) << 10)) + 1;
        } else if ("VP8X".equals(chunkType)) {
            if (bytes.length < 30 || chunkSize < 10) {
                throw new FileStorageException("Malformed extended WebP (VP8X) chunk");
            }
            width = (bytes[24] & 0xFF | ((bytes[25] & 0xFF) << 8) | ((bytes[26] & 0xFF) << 16)) + 1;
            height = (bytes[27] & 0xFF | ((bytes[28] & 0xFF) << 8) | ((bytes[29] & 0xFF) << 16)) + 1;
        } else {
            throw new FileStorageException("Unsupported WebP chunk format: " + chunkType);
        }

        if (width <= 0 || height <= 0) {
            throw new FileStorageException("WebP image dimensions must be positive");
        }
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            throw new FileStorageException("WebP image dimensions (" + width + "x" + height
                    + ") exceed maximum permitted size of " + MAX_DIMENSION + "px");
        }
    }

    /**
     * Determines the safe, deterministic MediaType for serving a signature file based on its extension.
     */
    public MediaType getMediaTypeForFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        }
        if (lower.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    public boolean exists(String filename) {
        if (filename == null || filename.isBlank()) return false;
        Path file = this.rootLocation.resolve(filename).normalize().toAbsolutePath();
        if (Files.exists(file) && Files.isReadable(file)) {
            return true;
        }
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
            if (filename == null || filename.isBlank()) {
                throw new ResourceNotFoundException("Signature filename cannot be empty");
            }
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
