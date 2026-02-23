package com.bundyclock.domain.face;

import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface FaceService {

    FaceVerifyResult verify(MultipartFile image);

    FaceEmbedding registerFace(UUID employeeId, MultipartFile image);
}
