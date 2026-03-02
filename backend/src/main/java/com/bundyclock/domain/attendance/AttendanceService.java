package com.bundyclock.domain.attendance;

import org.springframework.web.multipart.MultipartFile;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public interface AttendanceService {

    AttendanceLog timeIn(UUID employeeId, MultipartFile image);

    AttendanceLog timeOut(UUID employeeId, MultipartFile image);

    List<AttendanceLog> getLogsByEmployee(UUID employeeId);

    List<AttendanceLog> getAllLogs();

    /**
     * Returns logs filtered by any combination of employee, from, and to.
     * Null parameters are treated as "no filter" on that dimension.
     */
    List<AttendanceLog> getLogs(UUID employeeId, ZonedDateTime from, ZonedDateTime to);
}
