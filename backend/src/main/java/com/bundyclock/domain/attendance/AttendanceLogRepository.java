package com.bundyclock.domain.attendance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceLogRepository extends JpaRepository<AttendanceLog, UUID> {

    List<AttendanceLog> findByEmployeeIdOrderByTimestampDesc(UUID employeeId);

    List<AttendanceLog> findByTimestampBetweenOrderByTimestampDesc(
        ZonedDateTime from, ZonedDateTime to);

    List<AttendanceLog> findByEmployeeIdAndTimestampBetweenOrderByTimestampDesc(
        UUID employeeId, ZonedDateTime from, ZonedDateTime to);
}
