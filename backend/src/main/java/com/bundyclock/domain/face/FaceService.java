package com.bundyclock.domain.face;

import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface FaceService {

    FaceVerifyResult verify(MultipartFile image);

    FaceEmbedding registerFace(UUID employeeId, MultipartFile image);

    /** Returns face registration status (embedding count + last registered date) for one employee. */
    FaceStatusResponse getFaceStatus(UUID employeeId);

    /** Deletes all face embeddings (DB rows + Python service files) for an employee. */
    void deleteFaceData(UUID employeeId);
}
