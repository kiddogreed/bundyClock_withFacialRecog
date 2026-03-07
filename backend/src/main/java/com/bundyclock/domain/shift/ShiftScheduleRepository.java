package com.bundyclock.domain.shift;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ShiftScheduleRepository extends JpaRepository<ShiftSchedule, UUID> {

    List<ShiftSchedule> findAllByOrderByName();
}
