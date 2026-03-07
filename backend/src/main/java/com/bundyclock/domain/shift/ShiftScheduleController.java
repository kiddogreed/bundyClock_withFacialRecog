package com.bundyclock.domain.shift;

import com.bundyclock.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shifts")
@RequiredArgsConstructor
@Tag(name = "Shifts", description = "Shift schedule lookup")
public class ShiftScheduleController {

    private final ShiftScheduleRepository shiftScheduleRepository;

    @GetMapping
    @Operation(summary = "List all predefined shift schedules")
    public ResponseEntity<ApiResponse<List<ShiftSchedule>>> getAllShifts() {
        List<ShiftSchedule> shifts = shiftScheduleRepository.findAllByOrderByName();
        return ResponseEntity.ok(ApiResponse.ok(shifts));
    }
}
