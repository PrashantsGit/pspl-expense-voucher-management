package com.prachay.voucher.service;

import com.prachay.voucher.exception.FileStorageException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

class SignatureStorageServiceTest {

    @TempDir
    Path tempDir;

    private SignatureStorageService storageService;

    @BeforeEach
    void setUp() {
        storageService = new SignatureStorageService(tempDir.toString());
    }

    @AfterEach
    void tearDown() {
        try (Stream<Path> files = Files.walk(tempDir)) {
            files.filter(Files::isRegularFile).forEach(p -> {
                try {
                    Files.deleteIfExists(p);
                } catch (IOException ignored) {}
            });
        } catch (IOException ignored) {}
    }

    private byte[] createValidPngBytes(int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        return baos.toByteArray();
    }

    private byte[] createValidJpegBytes(int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", baos);
        return baos.toByteArray();
    }

    private byte[] createValidLosslessWebPBytes() {
        return new byte[]{
                'R', 'I', 'F', 'F',
                20, 0, 0, 0,
                'W', 'E', 'B', 'P',
                'V', 'P', '8', 'L',
                8, 0, 0, 0,
                0x2F,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00
        };
    }

    @Test
    @DisplayName("Should successfully store valid PNG signature and save as .png")
    void testStoreValidPng() throws IOException {
        byte[] pngBytes = createValidPngBytes(200, 80);
        MockMultipartFile file = new MockMultipartFile(
                "signature", "employee_sign.png", "image/png", pngBytes
        );

        String storedName = storageService.store(file, "emp_101");
        assertNotNull(storedName);
        assertTrue(storedName.startsWith("emp_101_"));
        assertTrue(storedName.endsWith(".png"));
        assertTrue(storageService.exists(storedName));
        assertNotNull(storageService.loadAsResource(storedName));
    }

    @Test
    @DisplayName("Should successfully store valid JPEG signature and save as .jpg")
    void testStoreValidJpeg() throws IOException {
        byte[] jpegBytes = createValidJpegBytes(250, 90);
        MockMultipartFile file = new MockMultipartFile(
                "signature", "director_approval.jpg", "image/jpeg", jpegBytes
        );

        String storedName = storageService.store(file, "dir_201");
        assertNotNull(storedName);
        assertTrue(storedName.startsWith("dir_201_"));
        assertTrue(storedName.endsWith(".jpg"));
        assertTrue(storageService.exists(storedName));
    }

    @Test
    @DisplayName("Should successfully store valid WebP signature and save as .webp")
    void testStoreValidWebP() {
        byte[] webpBytes = createValidLosslessWebPBytes();
        MockMultipartFile file = new MockMultipartFile(
                "signature", "sign.webp", "image/webp", webpBytes
        );

        String storedName = storageService.store(file, "emp_102");
        assertNotNull(storedName);
        assertTrue(storedName.startsWith("emp_102_"));
        assertTrue(storedName.endsWith(".webp"));
        assertTrue(storageService.exists(storedName));
    }

    @Test
    @DisplayName("Should reject empty or zero-byte file")
    void testStoreEmptyFileRejected() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "signature", "empty.png", "image/png", new byte[0]
        );

        FileStorageException ex = assertThrows(FileStorageException.class, () ->
                storageService.store(emptyFile, "emp_101")
        );
        assertTrue(ex.getMessage().contains("Cannot store an empty signature file"));
    }

    @Test
    @DisplayName("Should reject file exceeding 5MB size limit")
    void testStoreOversizedFileRejected() {
        byte[] oversizedBytes = new byte[(int) (SignatureStorageService.MAX_FILE_SIZE + 1024)];
        MockMultipartFile largeFile = new MockMultipartFile(
                "signature", "huge.png", "image/png", oversizedBytes
        );

        FileStorageException ex = assertThrows(FileStorageException.class, () ->
                storageService.store(largeFile, "emp_101")
        );
        assertTrue(ex.getMessage().contains("exceeds maximum permitted limit"));
    }

    @Test
    @DisplayName("Should reject malformed PNG image with valid magic bytes but corrupted data")
    void testStoreMalformedPngRejected() {
        byte[] malformedPng = new byte[]{
                (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A,
                'F', 'A', 'K', 'E', 'D', 'A', 'T', 'A', '1', '2', '3', '4', '5', '6', '7', '8'
        };
        MockMultipartFile file = new MockMultipartFile(
                "signature", "corrupt.png", "image/png", malformedPng
        );

        FileStorageException ex = assertThrows(FileStorageException.class, () ->
                storageService.store(file, "emp_101")
        );
        assertTrue(ex.getMessage().contains("Malformed or corrupted") || ex.getMessage().contains("image"));
    }

    @Test
    @DisplayName("Should reject malformed JPEG with valid SOI marker but corrupted body")
    void testStoreMalformedJpegRejected() {
        byte[] malformedJpeg = new byte[]{
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
                'C', 'O', 'R', 'R', 'U', 'P', 'T', 'E', 'D', 'J', 'P', 'E', 'G', 'B', 'O', 'D', 'Y'
        };
        MockMultipartFile file = new MockMultipartFile(
                "signature", "corrupt.jpg", "image/jpeg", malformedJpeg
        );

        FileStorageException ex = assertThrows(FileStorageException.class, () ->
                storageService.store(file, "emp_101")
        );
        assertTrue(ex.getMessage().contains("Malformed or corrupted") || ex.getMessage().contains("image"));
    }

    @Test
    @DisplayName("Should reject malformed WebP with truncated RIFF payload")
    void testStoreMalformedWebPRejected() {
        byte[] truncatedWebP = new byte[]{
                'R', 'I', 'F', 'F',
                (byte) 0xE8, 0x03, 0x00, 0x00,
                'W', 'E', 'B', 'P',
                'V', 'P', '8', ' ',
                10, 0, 0, 0,
                0, 0, 0, (byte) 0x9D, 0x01, 0x2A, 10, 0, 10, 0
        };
        MockMultipartFile file = new MockMultipartFile(
                "signature", "truncated.webp", "image/webp", truncatedWebP
        );

        FileStorageException ex = assertThrows(FileStorageException.class, () ->
                storageService.store(file, "emp_101")
        );
        assertTrue(ex.getMessage().contains("Corrupted WebP image") || ex.getMessage().contains("WebP"));
    }

    @Test
    @DisplayName("Should reject unsupported GIF format with explicit error")
    void testStoreUnsupportedGifRejected() {
        byte[] gifBytes = new byte[]{
                'G', 'I', 'F', '8', '9', 'a',
                10, 0, 10, 0, (byte) 0x80, 0, 0, 0, 0, 0, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF,
                0x21, (byte) 0xF9, 0x04, 0x01, 0, 0, 0, 0, 0x2C
        };
        MockMultipartFile file = new MockMultipartFile(
                "signature", "animation.gif", "image/gif", gifBytes
        );

        FileStorageException ex = assertThrows(FileStorageException.class, () ->
                storageService.store(file, "emp_101")
        );
        assertTrue(ex.getMessage().contains("GIF images are not allowed"));
    }

    @Test
    @DisplayName("Should reject unsupported BMP format with explicit error")
    void testStoreUnsupportedBmpRejected() {
        byte[] bmpBytes = new byte[]{
                'B', 'M', 50, 0, 0, 0, 0, 0, 0, 0, 54, 0, 0, 0, 40, 0, 0, 0,
                1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 24, 0
        };
        MockMultipartFile file = new MockMultipartFile(
                "signature", "bitmap.bmp", "image/bmp", bmpBytes
        );

        FileStorageException ex = assertThrows(FileStorageException.class, () ->
                storageService.store(file, "emp_101")
        );
        assertTrue(ex.getMessage().contains("BMP images are not allowed"));
    }

    @Test
    @DisplayName("Should reject SVG files with script or xml content")
    void testStoreUnsupportedSvgRejected() {
        byte[] svgBytes = "<svg xmlns=\"http://www.w3.org/2000/svg\"><text>Signature</text></svg>".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "signature", "vector.svg", "image/svg+xml", svgBytes
        );

        FileStorageException ex = assertThrows(FileStorageException.class, () ->
                storageService.store(file, "emp_101")
        );
        assertTrue(ex.getMessage().contains("SVG images are not allowed"));
    }

    @Test
    @DisplayName("Should reject non-image plain text file spoofing image Content-Type")
    void testStoreNonImageSpoofingMimeRejected() {
        byte[] textBytes = "This is a plain text file pretending to be an image.".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "signature", "document.png", "image/png", textBytes
        );

        FileStorageException ex = assertThrows(FileStorageException.class, () ->
                storageService.store(file, "emp_101")
        );
        assertTrue(ex.getMessage().contains("not a supported image") || ex.getMessage().contains("Invalid file content"));
    }

    @Test
    @DisplayName("Should reject Content-Type mismatch where file is PNG but client claims image/jpeg")
    void testStoreMimeTypeMismatchRejected() throws IOException {
        byte[] pngBytes = createValidPngBytes(150, 60);
        MockMultipartFile file = new MockMultipartFile(
                "signature", "signature.png", "image/jpeg", pngBytes
        );

        FileStorageException ex = assertThrows(FileStorageException.class, () ->
                storageService.store(file, "emp_101")
        );
        assertTrue(ex.getMessage().contains("Content-Type mismatch"));
    }

    @Test
    @DisplayName("Should reject extension mismatch where file is PNG but filename has .jpg extension")
    void testStoreExtensionMismatchRejected() throws IOException {
        byte[] pngBytes = createValidPngBytes(150, 60);
        MockMultipartFile file = new MockMultipartFile(
                "signature", "signature.jpg", "image/png", pngBytes
        );

        FileStorageException ex = assertThrows(FileStorageException.class, () ->
                storageService.store(file, "emp_101")
        );
        assertTrue(ex.getMessage().contains("File extension mismatch"));
    }

    @Test
    @DisplayName("Should reject path traversal sequences in original filename")
    void testStorePathTraversalRejected() throws IOException {
        byte[] pngBytes = createValidPngBytes(100, 50);
        MockMultipartFile file = new MockMultipartFile(
                "signature", "../../etc/passwd.png", "image/png", pngBytes
        );

        FileStorageException ex = assertThrows(FileStorageException.class, () ->
                storageService.store(file, "emp_101")
        );
        assertTrue(ex.getMessage().contains("invalid path sequence"));
    }

    @Test
    @DisplayName("Should verify failed uploads leave zero files on disk")
    void testFailedUploadLeavesNoFileOnDisk() {
        long initialCount;
        try (Stream<Path> stream = Files.list(tempDir)) {
            initialCount = stream.count();
        } catch (IOException e) {
            initialCount = 0;
        }

        MockMultipartFile invalidFile = new MockMultipartFile(
                "signature", "corrupt.png", "image/png", "not an image".getBytes()
        );

        assertThrows(FileStorageException.class, () ->
                storageService.store(invalidFile, "emp_failed")
        );

        long finalCount;
        try (Stream<Path> stream = Files.list(tempDir)) {
            finalCount = stream.count();
        } catch (IOException e) {
            finalCount = 0;
        }

        assertEquals(initialCount, finalCount, "No file should be written to disk when validation fails");
    }

    @Test
    @DisplayName("Should return appropriate MediaType based on filename extension")
    void testGetMediaTypeForFilename() {
        assertEquals(MediaType.IMAGE_PNG, storageService.getMediaTypeForFilename("test_123.png"));
        assertEquals(MediaType.IMAGE_JPEG, storageService.getMediaTypeForFilename("test_123.jpg"));
        assertEquals(MediaType.IMAGE_JPEG, storageService.getMediaTypeForFilename("test_123.jpeg"));
        assertEquals(MediaType.parseMediaType("image/webp"), storageService.getMediaTypeForFilename("test_123.webp"));
        assertEquals(MediaType.APPLICATION_OCTET_STREAM, storageService.getMediaTypeForFilename("unknown.bin"));
        assertEquals(MediaType.APPLICATION_OCTET_STREAM, storageService.getMediaTypeForFilename(null));
    }
}
