package com.bundyclock.domain.attendance;

import com.bundyclock.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance", description = "Time in/out attendance endpoints")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping(value = "/time-in", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Record Time-In with optional face image")
    public ResponseEntity<ApiResponse<AttendanceLog>> timeIn(
            @RequestParam UUID employeeId,
            @RequestPart(value = "image", required = false) MultipartFile image) {

        AttendanceLog log = attendanceService.timeIn(employeeId, image);
        return ResponseEntity.ok(ApiResponse.ok("Time-In recorded", log));
    }

    @PostMapping(value = "/time-out", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Record Time-Out with optional face image")
    public ResponseEntity<ApiResponse<AttendanceLog>> timeOut(
            @RequestParam UUID employeeId,
            @RequestPart(value = "image", required = false) MultipartFile image) {

        AttendanceLog log = attendanceService.timeOut(employeeId, image);
        return ResponseEntity.ok(ApiResponse.ok("Time-Out recorded", log));
    }

    @GetMapping
    @Operation(summary = "Get all attendance logs")
    public ResponseEntity<ApiResponse<List<AttendanceLog>>> getAllLogs() {
        return ResponseEntity.ok(ApiResponse.ok(attendanceService.getAllLogs()));
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get attendance logs for a specific employee")
    public ResponseEntity<ApiResponse<List<AttendanceLog>>> getLogsByEmployee(
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(attendanceService.getLogsByEmployee(employeeId)));
    }
}
