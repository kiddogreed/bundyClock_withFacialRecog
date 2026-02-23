package com.bundyclock.domain.attendance;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZonedDateTime;
import java.util.List;
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
        // TODO: call FaceService.verify() before logging
        // TODO: save image to disk / object storage
        log.info("TIME_IN for employee: {}", employeeId);
        AttendanceLog log = AttendanceLog.builder()
            .employeeId(employeeId)
            .timestamp(ZonedDateTime.now())
            .type(AttendanceLog.AttendanceType.TIME_IN)
            .verified(false)
            .build();
        return attendanceLogRepository.save(log);
    }

    @Override
    @Transactional
    public AttendanceLog timeOut(UUID employeeId, MultipartFile image) {
        // TODO: call FaceService.verify() before logging
        log.info("TIME_OUT for employee: {}", employeeId);
        AttendanceLog logEntry = AttendanceLog.builder()
            .employeeId(employeeId)
            .timestamp(ZonedDateTime.now())
            .type(AttendanceLog.AttendanceType.TIME_OUT)
            .verified(false)
            .build();
        return attendanceLogRepository.save(logEntry);
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
