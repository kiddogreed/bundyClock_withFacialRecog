package com.bundyclock.domain.face;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "face_embeddings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceEmbedding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    /**
     * JSON-serialized float array of face embedding vector.
     * Store as TEXT for portability. Consider pgvector for production.
     */
    @Column(name = "embedding_vector", columnDefinition = "TEXT")
    private String embeddingVector;

    @Column(name = "raw_image_path", length = 500)
    private String rawImagePath;

    @Builder.Default
    @Column(name = "model_used", length = 100)
    private String modelUsed = "DeepFace";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
