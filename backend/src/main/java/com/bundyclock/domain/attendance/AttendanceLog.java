package com.bundyclock.domain.attendance;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "attendance_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(nullable = false)
    private ZonedDateTime timestamp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AttendanceType type;

    @Column(name = "image_path", length = 500)
    private String imagePath;

    @Column(name = "confidence_score", precision = 5, scale = 4)
    private BigDecimal confidenceScore;

    @Builder.Default
    @Column(nullable = false)
    private Boolean verified = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    public enum AttendanceType {
        TIME_IN, TIME_OUT
    }
}
