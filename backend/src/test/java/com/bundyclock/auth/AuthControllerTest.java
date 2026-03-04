package com.bundyclock.auth;

import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bundyclock.config.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Unit tests for {@link AuthController}.
 *
 * <p>The real {@link org.springframework.security.authentication.AuthenticationManager} backed by
 * {@code InMemoryUserDetailsManager} (admin / admin123) is used via {@code @Import(SecurityConfig.class)}.
 * {@link JwtService} is mocked so no actual crypto happens in tests.
 */
@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
@DisplayName("AuthController")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /** Required by SecurityConfig constructor and by AuthController. */
    @MockBean
    private JwtService jwtService;

    // -------------------------------------------------------------------------
    // POST /api/auth/login
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/auth/login")
    class Login {

        @Test
        @DisplayName("returns 200 with a JWT token on valid admin credentials")
        void returnsTokenOnValidLogin() throws Exception {
            when(jwtService.generateToken("admin")).thenReturn("test-jwt-token");

            Map<String, String> body = Map.of("username", "admin", "password", "admin123");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Login successful"))
                    .andExpect(jsonPath("$.data.token").value("test-jwt-token"))
                    .andExpect(jsonPath("$.data.role").value("ADMIN"));
        }

        @Test
        @DisplayName("returns 401 with wrong password")
        void returns401OnWrongPassword() throws Exception {
            Map<String, String> body = Map.of("username", "admin", "password", "wrongpass");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("returns 401 with unknown username")
        void returns401OnUnknownUser() throws Exception {
            Map<String, String> body = Map.of("username", "unknown", "password", "secret");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }
}
