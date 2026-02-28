package com.bundyclock.domain.attendance;

import com.bundyclock.common.exception.ResourceNotFoundException;
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
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for {@link AttendanceController}.
 *
 * <p>Multipart endpoints are exercised with {@link MockMultipartFile} so that
 * no real file I/O or face-recognition service is needed.
 */
@WebMvcTest(AttendanceController.class)
@Import(SecurityConfig.class)
@DisplayName("AttendanceController")
@WithMockUser
class AttendanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AttendanceService attendanceService;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private AttendanceLog sampleLog(UUID employeeId, AttendanceLog.AttendanceType type) {
        return AttendanceLog.builder()
                .id(UUID.randomUUID())
                .employeeId(employeeId)
                .type(type)
                .timestamp(ZonedDateTime.now())
                .verified(true)
                .confidenceScore(new BigDecimal("0.9800"))
                .build();
    }

    private MockMultipartFile sampleImagePart() {
        return new MockMultipartFile(
                "image", "face.jpg", "image/jpeg", new byte[]{1, 2, 3});
    }

    // -------------------------------------------------------------------------
    // POST /api/attendance/time-in
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/attendance/time-in")
    class TimeIn {

        @Test
        @DisplayName("returns 200 with attendance log when image is provided")
        void recordsTimeInWithImage() throws Exception {
            UUID employeeId = UUID.randomUUID();
            AttendanceLog log = sampleLog(employeeId, AttendanceLog.AttendanceType.TIME_IN);
            when(attendanceService.timeIn(eq(employeeId), any())).thenReturn(log);

            mockMvc.perform(multipart("/api/attendance/time-in")
                            .file(sampleImagePart())
                            .param("employeeId", employeeId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Time-In recorded"))
                    .andExpect(jsonPath("$.data.type").value("TIME_IN"))
                    .andExpect(jsonPath("$.data.employeeId").value(employeeId.toString()));
        }

        @Test
        @DisplayName("returns 200 with attendance log when no image is provided")
        void recordsTimeInWithoutImage() throws Exception {
            UUID employeeId = UUID.randomUUID();
            AttendanceLog log = sampleLog(employeeId, AttendanceLog.AttendanceType.TIME_IN);
            when(attendanceService.timeIn(eq(employeeId), any())).thenReturn(log);

            mockMvc.perform(multipart("/api/attendance/time-in")
                            .param("employeeId", employeeId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.type").value("TIME_IN"));
        }

        @Test
        @DisplayName("returns 404 when employee does not exist")
        void returns404ForUnknownEmployee() throws Exception {
            UUID employeeId = UUID.randomUUID();
            when(attendanceService.timeIn(eq(employeeId), any()))
                    .thenThrow(new ResourceNotFoundException("Employee not found"));

            mockMvc.perform(multipart("/api/attendance/time-in")
                            .param("employeeId", employeeId.toString()))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("returns 409 when employee is already clocked in")
        void returns409WhenAlreadyClockedIn() throws Exception {
            UUID employeeId = UUID.randomUUID();
            when(attendanceService.timeIn(eq(employeeId), any()))
                    .thenThrow(new IllegalStateException("Employee already has an open TIME_IN entry"));

            mockMvc.perform(multipart("/api/attendance/time-in")
                            .param("employeeId", employeeId.toString()))
                    .andExpect(status().isConflict());
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/attendance/time-out
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/attendance/time-out")
    class TimeOut {

        @Test
        @DisplayName("returns 200 with attendance log on successful time-out")
        void recordsTimeOut() throws Exception {
            UUID employeeId = UUID.randomUUID();
            AttendanceLog log = sampleLog(employeeId, AttendanceLog.AttendanceType.TIME_OUT);
            when(attendanceService.timeOut(eq(employeeId), any())).thenReturn(log);

            mockMvc.perform(multipart("/api/attendance/time-out")
                            .file(sampleImagePart())
                            .param("employeeId", employeeId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Time-Out recorded"))
                    .andExpect(jsonPath("$.data.type").value("TIME_OUT"));
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/attendance
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/attendance")
    class GetAllLogs {

        @Test
        @DisplayName("returns 200 with all attendance logs")
        void returnsAllLogs() throws Exception {
            UUID emp1 = UUID.randomUUID();
            UUID emp2 = UUID.randomUUID();
            when(attendanceService.getAllLogs()).thenReturn(List.of(
                    sampleLog(emp1, AttendanceLog.AttendanceType.TIME_IN),
                    sampleLog(emp2, AttendanceLog.AttendanceType.TIME_OUT)
            ));

            mockMvc.perform(get("/api/attendance"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(2)));
        }

        @Test
        @DisplayName("returns 200 with empty list when no logs exist")
        void returnsEmptyList() throws Exception {
            when(attendanceService.getAllLogs()).thenReturn(List.of());

            mockMvc.perform(get("/api/attendance"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(0)));
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/attendance/employee/{employeeId}
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/attendance/employee/{employeeId}")
    class GetLogsByEmployee {

        @Test
        @DisplayName("returns 200 with logs for the given employee")
        void returnsLogsForEmployee() throws Exception {
            UUID employeeId = UUID.randomUUID();
            when(attendanceService.getLogsByEmployee(employeeId)).thenReturn(List.of(
                    sampleLog(employeeId, AttendanceLog.AttendanceType.TIME_IN),
                    sampleLog(employeeId, AttendanceLog.AttendanceType.TIME_OUT)
            ));

            mockMvc.perform(get("/api/attendance/employee/{employeeId}", employeeId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(2)))
                    .andExpect(jsonPath("$.data[0].employeeId").value(employeeId.toString()));
        }

        @Test
        @DisplayName("returns 404 when employee is not found")
        void returns404ForUnknownEmployee() throws Exception {
            UUID employeeId = UUID.randomUUID();
            when(attendanceService.getLogsByEmployee(employeeId))
                    .thenThrow(new ResourceNotFoundException("Employee not found"));

            mockMvc.perform(get("/api/attendance/employee/{employeeId}", employeeId))
                    .andExpect(status().isNotFound());
        }
    }
}
