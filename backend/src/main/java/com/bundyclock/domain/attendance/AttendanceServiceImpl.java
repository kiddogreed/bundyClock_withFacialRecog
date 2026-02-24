package com.bundyclock.domain.attendance;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceLogRepository attendanceLogRepository;

    @Override
    @Transactional
    public AttendanceLog timeIn(UUID employeeId, MultipartFile image) {
        ZonedDateTime startOfDay = LocalDate.now(ZoneId.systemDefault())
            .atStartOfDay(ZoneId.systemDefault());
        Optional<AttendanceLog> last = attendanceLogRepository
            .findTopByEmployeeIdAndTimestampAfterOrderByTimestampDesc(employeeId, startOfDay);
        if (last.isPresent() && last.get().getType() == AttendanceLog.AttendanceType.TIME_IN) {
            throw new IllegalStateException("Already timed in today. Please time out first.");
        }
        log.info("TIME_IN for employee: {}", employeeId);
        AttendanceLog entry = AttendanceLog.builder()
            .employeeId(employeeId)
            .timestamp(ZonedDateTime.now())
            .type(AttendanceLog.AttendanceType.TIME_IN)
            .verified(true)
            .build();
        return attendanceLogRepository.save(entry);
    }

    @Override
    @Transactional
    public AttendanceLog timeOut(UUID employeeId, MultipartFile image) {
        ZonedDateTime startOfDay = LocalDate.now(ZoneId.systemDefault())
            .atStartOfDay(ZoneId.systemDefault());
        Optional<AttendanceLog> last = attendanceLogRepository
            .findTopByEmployeeIdAndTimestampAfterOrderByTimestampDesc(employeeId, startOfDay);
        if (last.isEmpty()) {
            throw new IllegalStateException("Cannot time out — no time-in record found for today.");
        }
        if (last.get().getType() == AttendanceLog.AttendanceType.TIME_OUT) {
            throw new IllegalStateException("Already timed out today.");
        }
        log.info("TIME_OUT for employee: {}", employeeId);
        AttendanceLog entry = AttendanceLog.builder()
            .employeeId(employeeId)
            .timestamp(ZonedDateTime.now())
            .type(AttendanceLog.AttendanceType.TIME_OUT)
            .verified(true)
            .build();
        return attendanceLogRepository.save(entry);
    }

    @Override
    public List<AttendanceLog> getLogsByEmployee(UUID employeeId) {
        return attendanceLogRepository.findByEmployeeIdOrderByTimestampDesc(employeeId);
    }

    @Override
    public List<AttendanceLog> getAllLogs() {
        return attendanceLogRepository.findAll();
    }
}
