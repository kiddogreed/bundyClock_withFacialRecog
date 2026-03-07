package com.bundyclock.domain.employee;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    public enum EmployeeStatus { ACTIVE, ON_LEAVE, RESIGNED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "employee_code", nullable = false, unique = true, length = 50)
    private String employeeCode;

    @Column(length = 100)
    private String department;

    @Column(unique = true)
    private String email;

    @Column(name = "photo_url")
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    /** FK to a predefined shift schedule. NULL when a custom shift is used instead. */
    @Column(name = "shift_schedule_id")
    private UUID shiftScheduleId;

    /** Custom shift start time — used only when shiftScheduleId is NULL. */
    @JsonFormat(pattern = "HH:mm")
    @Column(name = "custom_shift_start")
    private LocalTime customShiftStart;

    /** Custom shift end time — used only when shiftScheduleId is NULL. */
    @JsonFormat(pattern = "HH:mm")
    @Column(name = "custom_shift_end")
    private LocalTime customShiftEnd;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
