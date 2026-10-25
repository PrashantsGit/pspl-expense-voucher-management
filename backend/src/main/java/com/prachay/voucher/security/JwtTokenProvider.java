package com.prachay.voucher.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long jwtExpirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long jwtExpirationMs) {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException("JWT signing key is not configured. Set the 'JWT_SECRET' environment variable or 'app.jwt.secret' application property with a secure key of at least 256 bits.");
        }

        String trimmedSecret = secret.trim();
        byte[] keyBytes;
        byte[] decodedBase64 = null;
        try {
            decodedBase64 = Decoders.BASE64.decode(trimmedSecret);
        } catch (Exception ignored) {
            // Not a valid Base64 string; fallback to raw UTF-8 bytes below
        }

        if (decodedBase64 != null && decodedBase64.length >= 32) {
            keyBytes = decodedBase64;
        } else {
            keyBytes = trimmedSecret.getBytes(StandardCharsets.UTF_8);
        }

        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT signing key must be at least 256 bits (32 bytes) long. Current key length is " + (keyBytes.length * 8) + " bits.");
        }

        try {
            this.key = Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Invalid JWT signing key configuration: " + e.getMessage(), e);
        }
        this.jwtExpirationMs = jwtExpirationMs;
    }

    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .claim("userId", userPrincipal.getId())
                .claim("role", userPrincipal.getRole().name())
                .claim("fullName", userPrincipal.getFullName())
                .claim("department", userPrincipal.getDepartment())
                .claim("employeeId", userPrincipal.getEmployeeId())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String getUsernameFromJwt(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
