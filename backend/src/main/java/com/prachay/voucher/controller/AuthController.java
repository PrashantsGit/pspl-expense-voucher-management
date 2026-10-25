package com.prachay.voucher.controller;

import com.prachay.voucher.dto.AuthResponse;
import com.prachay.voucher.dto.LoginRequest;
import com.prachay.voucher.entity.User;
import com.prachay.voucher.security.JwtTokenProvider;
import com.prachay.voucher.security.UserPrincipal;
import com.prachay.voucher.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider, UserService userService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername().trim(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        AuthResponse response = new AuthResponse(
                jwt,
                principal.getId(),
                principal.getUsername(),
                principal.getFullName(),
                principal.getEmployeeId(),
                principal.getDepartment(),
                principal.getRole()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser() {
        User user = userService.getCurrentUser();
        AuthResponse response = new AuthResponse(
                null,
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmployeeId(),
                user.getDepartment(),
                user.getRole()
        );
        return ResponseEntity.ok(response);
    }
}
