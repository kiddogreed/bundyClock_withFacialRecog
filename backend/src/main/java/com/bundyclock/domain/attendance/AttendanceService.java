package com.bundyclock.domain.attendance;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface AttendanceService {

    AttendanceLog timeIn(UUID employeeId, MultipartFile image);

    AttendanceLog timeOut(UUID employeeId, MultipartFile image);

    List<AttendanceLog> getLogsByEmployee(UUID employeeId);

    List<AttendanceLog> getAllLogs();
}
