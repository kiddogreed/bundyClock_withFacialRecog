package com.bundyclock.auth;

import com.bundyclock.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Auth endpoints")
public class AuthController {

    @PostMapping("/login")
    @Operation(summary = "Login with username and password")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
        // TODO: Implement JWT issuance using Spring Security AuthenticationManager
        LoginResponse response = new LoginResponse("placeholder-jwt-token", "admin");
        return ResponseEntity.ok(ApiResponse.ok("Login successful (MVP stub)", response));
    }

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    public static class LoginResponse {
        private final String token;
        private final String role;
    }
}
