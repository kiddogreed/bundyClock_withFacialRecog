package com.bundyclock.domain.face;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FaceServiceImpl implements FaceService {

    private final FaceEmbeddingRepository faceEmbeddingRepository;
    private final RestTemplate restTemplate;

    @Value("${app.face-recognition.service-url}")
    private String faceServiceUrl;

    @Value("${app.face-recognition.verify-endpoint}")
    private String verifyEndpoint;

    @Value("${app.face-recognition.register-endpoint}")
    private String registerEndpoint;

    @Override
    public FaceVerifyResult verify(MultipartFile image) {
        // TODO: Forward image to face-recognition-service via HTTP
        // Placeholder stub — replace with real HTTP call
        log.info("Sending image to face recognition service for verification");
        return FaceVerifyResult.builder()
            .matched(false)
            .message("Face recognition service not yet integrated")
            .build();
    }

    @Override
    @Transactional
    public FaceEmbedding registerFace(UUID employeeId, MultipartFile image) {
        // TODO: Forward image to face-recognition-service to generate embedding
        // TODO: Save returned embedding vector to DB
        log.info("Registering face for employee: {}", employeeId);
        FaceEmbedding embedding = FaceEmbedding.builder()
            .employeeId(employeeId)
            .modelUsed("DeepFace")
            .build();
        return faceEmbeddingRepository.save(embedding);
    }
}
