package com.bundyclock.domain.face;

import lombok.Builder;
import lombok.Data;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Response DTO for the face registration status of a single employee.
 */
@Data
@Builder
public class FaceStatusResponse {

    private UUID employeeId;

    /** How many face embeddings are stored for this employee. */
    private int embeddingCount;

    /** Whether at least one embedding is registered. */
    private boolean registered;

    /** Timestamp of the most recently registered face (null if none). */
    private ZonedDateTime lastRegisteredAt;
}
