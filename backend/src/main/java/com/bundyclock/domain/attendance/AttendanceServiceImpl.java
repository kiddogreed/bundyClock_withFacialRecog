package com.bundyclock.domain.attendance;

import com.bundyclock.domain.employee.Employee;
import com.bundyclock.domain.employee.EmployeeRepository;
import com.bundyclock.domain.shift.ShiftSchedule;
import com.bundyclock.domain.shift.ShiftScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceServiceImpl implements AttendanceService {

    /** How many minutes before shift start a punch-in / punch-out is still allowed. */
    private static final int GRACE_BEFORE_MINUTES = 30;

    /** How many minutes after shift end a punch-in / punch-out is still allowed. */
    private static final int GRACE_AFTER_MINUTES = 120;

    private final AttendanceLogRepository attendanceLogRepository;
    private final EmployeeRepository employeeRepository;
    private final ShiftScheduleRepository shiftScheduleRepository;

    // ----------------------------------------------------------------
    // Shift enforcement
    // ----------------------------------------------------------------

    /**
     * Throws {@link IllegalStateException} when the current wall-clock time falls
     * outside the employee's allowed attendance window.
     * <p>
     * Window = [shiftStart − GRACE_BEFORE, shiftEnd + GRACE_AFTER].
     * Employees with no shift assigned are always allowed.
     */
    private void validateShiftWindow(UUID employeeId) {
        Employee emp = employeeRepository.findById(employeeId).orElse(null);
        if (emp == null) return;

        LocalTime shiftStart = null;
        LocalTime shiftEnd   = null;

        if (emp.getShiftScheduleId() != null) {
            ShiftSchedule shift = shiftScheduleRepository.findById(emp.getShiftScheduleId()).orElse(null);
            if (shift != null) {
                shiftStart = shift.getStartTime();
                shiftEnd   = shift.getEndTime();
            }
        } else if (emp.getCustomShiftStart() != null && emp.getCustomShiftEnd() != null) {
            shiftStart = emp.getCustomShiftStart();
            shiftEnd   = emp.getCustomShiftEnd();
        }

        if (shiftStart == null) return; // no shift assigned — no restriction

        LocalTime now        = LocalTime.now(ZoneId.systemDefault());
        LocalTime windowStart = shiftStart.minusMinutes(GRACE_BEFORE_MINUTES);
        LocalTime windowEnd   = shiftEnd.plusMinutes(GRACE_AFTER_MINUTES);

        // Overnight shift: end_time < start_time (e.g. 22:00 – 06:00)
        boolean overnight = shiftEnd.isBefore(shiftStart);
        boolean inWindow;
        if (!overnight) {
            inWindow = !now.isBefore(windowStart) && !now.isAfter(windowEnd);
        } else {
            // Allowed range wraps midnight: now >= windowStart  OR  now <= windowEnd
            inWindow = !now.isBefore(windowStart) || !now.isAfter(windowEnd);
        }

        if (!inWindow) {
            String label = shiftStart + " – " + shiftEnd;
            throw new IllegalStateException(
                "Outside shift hours. Your shift is " + label +
                ". Attendance is allowed from " + GRACE_BEFORE_MINUTES +
                " min before start to " + GRACE_AFTER_MINUTES + " min after end."
            );
        }
    }

    // ----------------------------------------------------------------
    // Public service methods
    // ----------------------------------------------------------------

    @Override
    @Transactional
    public AttendanceLog timeIn(UUID employeeId, MultipartFile image) {
        validateShiftWindow(employeeId);

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
        validateShiftWindow(employeeId);

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

    @Override
    public List<AttendanceLog> getLogs(UUID employeeId, ZonedDateTime from, ZonedDateTime to) {
        boolean hasEmployee = employeeId != null;
        boolean hasRange    = from != null && to != null;

        if (hasEmployee && hasRange) {
            return attendanceLogRepository
                .findByEmployeeIdAndTimestampBetweenOrderByTimestampDesc(employeeId, from, to);
        }
        if (hasRange) {
            return attendanceLogRepository
                .findByTimestampBetweenOrderByTimestampDesc(from, to);
        }
        if (hasEmployee) {
            return attendanceLogRepository
                .findByEmployeeIdOrderByTimestampDesc(employeeId);
        }
        return attendanceLogRepository.findAll();
    }
}
