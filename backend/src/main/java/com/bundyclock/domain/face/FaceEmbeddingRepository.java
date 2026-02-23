package com.bundyclock.domain.face;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FaceEmbeddingRepository extends JpaRepository<FaceEmbedding, UUID> {

    Optional<FaceEmbedding> findTopByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    List<FaceEmbedding> findAllByEmployeeId(UUID employeeId);

    boolean existsByEmployeeId(UUID employeeId);
}
