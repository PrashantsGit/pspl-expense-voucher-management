package com.prachay.voucher.security;

import com.prachay.voucher.entity.Role;
import com.prachay.voucher.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private static final String VALID_256_BIT_SECRET = "TestSecretKeyThatIsAtLeast256BitsLongForTestingPurposes123456";

    @Test
    @DisplayName("Should initialize successfully and validate tokens with valid secret")
    void testValidSecretInitializationAndTokenFlow() {
        JwtTokenProvider provider = new JwtTokenProvider(VALID_256_BIT_SECRET, 3600000);

        User user = new User(1L, "testuser", "hashedpass", "Test User", "EMP-001", "IT", Role.ROLE_EMPLOYEE);
        UserPrincipal principal = UserPrincipal.create(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        String token = provider.generateToken(auth);
        assertNotNull(token);
        assertTrue(provider.validateToken(token));
        assertEquals("testuser", provider.getUsernameFromJwt(token));
    }

    @Test
    @DisplayName("Should fail startup when JWT secret is null or empty")
    void testMissingSecretThrowsException() {
        IllegalStateException exNull = assertThrows(IllegalStateException.class, () ->
                new JwtTokenProvider(null, 3600000)
        );
        assertTrue(exNull.getMessage().contains("JWT signing key is not configured"));

        IllegalStateException exEmpty = assertThrows(IllegalStateException.class, () ->
                new JwtTokenProvider("   ", 3600000)
        );
        assertTrue(exEmpty.getMessage().contains("JWT signing key is not configured"));
    }

    @Test
    @DisplayName("Should fail startup when JWT secret is shorter than 256 bits")
    void testShortSecretThrowsException() {
        IllegalStateException exShort = assertThrows(IllegalStateException.class, () ->
                new JwtTokenProvider("short-secret-less-than-32-bytes", 3600000)
        );
        assertTrue(exShort.getMessage().contains("JWT signing key must be at least 256 bits"));
    }
}
