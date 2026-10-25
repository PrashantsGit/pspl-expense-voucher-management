package com.prachay.voucher.exception;

import com.prachay.voucher.dto.ErrorResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("Should return generic error message for unexpected HTTP 500 without leaking exception details")
    void testHandleGeneralException_SanitizesInternalDetails() {
        String sensitiveMessage = "SQL Syntax Error near table `users` with password hash: $2a$10$abcdef...";
        Exception unexpectedException = new RuntimeException(sensitiveMessage);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGeneralException(unexpectedException);

        assertNotNull(response);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());

        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(500, body.getStatus());
        assertEquals("Internal Server Error", body.getError());

        // Verify sensitive exception details are NOT exposed to the client
        assertFalse(body.getMessage().contains("SQL Syntax Error"));
        assertFalse(body.getMessage().contains("password hash"));
        assertFalse(body.getMessage().contains("users"));

        // Verify safe, user-friendly generic message is returned
        assertEquals("An unexpected internal error occurred. Please try again or contact system support if the issue persists.", body.getMessage());
    }

    @Test
    @DisplayName("Should preserve intentional BadRequestException message for client validation")
    void testHandleBadRequest_PreservesIntentionalMessage() {
        BadRequestException ex = new BadRequestException("Invalid sort field: 'hackerProperty'");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleBadRequest(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());

        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(400, body.getStatus());
        assertEquals("Bad Request", body.getError());
        assertEquals("Invalid sort field: 'hackerProperty'", body.getMessage());
    }

    @Test
    @DisplayName("Should preserve intentional ResourceNotFoundException message")
    void testHandleResourceNotFound_PreservesIntentionalMessage() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Voucher not found with id: 999");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleResourceNotFound(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());

        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(404, body.getStatus());
        assertEquals("Not Found", body.getError());
        assertEquals("Voucher not found with id: 999", body.getMessage());
    }

    @Test
    @DisplayName("Should preserve intentional UnauthorizedActionException message")
    void testHandleUnauthorizedAction_PreservesIntentionalMessage() {
        UnauthorizedActionException ex = new UnauthorizedActionException("Only Draft vouchers can be edited.");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleUnauthorizedAction(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());

        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(403, body.getStatus());
        assertEquals("Forbidden", body.getError());
        assertEquals("Only Draft vouchers can be edited.", body.getMessage());
    }
}
