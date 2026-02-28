package com.bundyclock.domain.face;

import com.bundyclock.config.SecurityConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for {@link FaceController}.
 *
 * <p>The face-recognition Python service is not invoked; {@link FaceService}
 * is completely mocked so tests run without any external dependencies.
 */
@WebMvcTest(FaceController.class)
@Import(SecurityConfig.class)
@DisplayName("FaceController")
@WithMockUser
class FaceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FaceService faceService;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private MockMultipartFile sampleImagePart() {
        return new MockMultipartFile(
                "image", "face.jpg", "image/jpeg", new byte[]{1, 2, 3});
    }

    // -------------------------------------------------------------------------
    // POST /api/face/verify
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/face/verify")
    class VerifyFace {

        @Test
        @DisplayName("returns 200 with matched result when face is recognised")
        void returnsMatchedResult() throws Exception {
            UUID employeeId = UUID.randomUUID();
            FaceVerifyResult result = FaceVerifyResult.builder()
                    .employeeId(employeeId)
                    .confidenceScore(new BigDecimal("0.9750"))
                    .matched(true)
                    .message("Face matched")
                    .build();
            when(faceService.verify(any())).thenReturn(result);

            mockMvc.perform(multipart("/api/face/verify")
                            .file(sampleImagePart()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Verification complete"))
                    .andExpect(jsonPath("$.data.matched").value(true))
                    .andExpect(jsonPath("$.data.employeeId").value(employeeId.toString()))
                    .andExpect(jsonPath("$.data.confidenceScore").value(0.9750));
        }

        @Test
        @DisplayName("returns 200 with unmatched result when no face matches")
        void returnsUnmatchedResult() throws Exception {
            FaceVerifyResult result = FaceVerifyResult.builder()
                    .matched(false)
                    .confidenceScore(new BigDecimal("0.2100"))
                    .message("No match found")
                    .build();
            when(faceService.verify(any())).thenReturn(result);

            mockMvc.perform(multipart("/api/face/verify")
                            .file(sampleImagePart()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.matched").value(false));
        }

        @Test
        @DisplayName("returns 500 when the face-recognition service is unavailable")
        void returns500WhenServiceUnavailable() throws Exception {
            when(faceService.verify(any()))
                    .thenThrow(new RuntimeException("Face recognition service unavailable"));

            mockMvc.perform(multipart("/api/face/verify")
                            .file(sampleImagePart()))
                    .andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/face/register
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/face/register")
    class RegisterFace {

        @Test
        @DisplayName("returns 200 with embedding record when registration succeeds")
        void registersSuccessfully() throws Exception {
            UUID employeeId = UUID.randomUUID();
            FaceEmbedding embedding = FaceEmbedding.builder()
                    .id(UUID.randomUUID())
                    .employeeId(employeeId)
                    .modelUsed("DeepFace")
                    .embeddingVector("[0.1, 0.2, 0.3]")
                    .build();
            when(faceService.registerFace(eq(employeeId), any())).thenReturn(embedding);

            mockMvc.perform(multipart("/api/face/register")
                            .file(sampleImagePart())
                            .param("employeeId", employeeId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Face registered"))
                    .andExpect(jsonPath("$.data.employeeId").value(employeeId.toString()))
                    .andExpect(jsonPath("$.data.modelUsed").value("DeepFace"));
        }

        @Test
        @DisplayName("returns 404 when the employee does not exist")
        void returns404WhenEmployeeNotFound() throws Exception {
            UUID employeeId = UUID.randomUUID();
            when(faceService.registerFace(eq(employeeId), any()))
                    .thenThrow(new com.bundyclock.common.exception.ResourceNotFoundException(
                            "Employee not found: " + employeeId));

            mockMvc.perform(multipart("/api/face/register")
                            .file(sampleImagePart())
                            .param("employeeId", employeeId.toString()))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("returns 409 when a face is already registered for the employee")
        void returns409WhenAlreadyRegistered() throws Exception {
            UUID employeeId = UUID.randomUUID();
            when(faceService.registerFace(eq(employeeId), any()))
                    .thenThrow(new IllegalStateException(
                            "Face already registered for employee " + employeeId));

            mockMvc.perform(multipart("/api/face/register")
                            .file(sampleImagePart())
                            .param("employeeId", employeeId.toString()))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }
}
