package com.bundyclock.domain.face;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Map;
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
    @SuppressWarnings("unchecked")
    public FaceVerifyResult verify(MultipartFile image) {
        log.info("Forwarding image to face recognition service for verification");
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new NamedByteArrayResource(image.getBytes(),
                    image.getOriginalFilename() != null ? image.getOriginalFilename() : "face.jpg"));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    faceServiceUrl + verifyEndpoint,
                    new HttpEntity<>(body, headers),
                    Map.class);

            Map<String, Object> result = response.getBody();
            if (result == null) throw new RuntimeException("Empty response from face service");

            boolean matched = Boolean.TRUE.equals(result.get("matched"));
            String empIdStr = (String) result.get("employee_id");
            Number score = (Number) result.get("confidence_score");
            String message = (String) result.get("message");

            log.info("Verification — matched={}, employee={}, score={}", matched, empIdStr, score);

            return FaceVerifyResult.builder()
                    .matched(matched)
                    .employeeId(empIdStr != null ? UUID.fromString(empIdStr) : null)
                    .confidenceScore(score != null ? new BigDecimal(score.toString()) : null)
                    .message(message)
                    .build();

        } catch (Exception e) {
            log.error("Face verification call failed: {}", e.getMessage(), e);
            return FaceVerifyResult.builder()
                    .matched(false)
                    .message("Face recognition service unavailable: " + e.getMessage())
                    .build();
        }
    }

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    public FaceEmbedding registerFace(UUID employeeId, MultipartFile image) {
        log.info("Forwarding image to face recognition service for registration — employee={}", employeeId);
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("employee_id", employeeId.toString());
            body.add("image", new NamedByteArrayResource(image.getBytes(),
                    image.getOriginalFilename() != null ? image.getOriginalFilename() : "face.jpg"));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    faceServiceUrl + registerEndpoint,
                    new HttpEntity<>(body, headers),
                    Map.class);

            Map<String, Object> result = response.getBody();
            if (result == null) throw new RuntimeException("Empty response from face service");

            Boolean success = (Boolean) result.get("success");
            String message = (String) result.get("message");
            String embeddingPath = (String) result.get("embedding_path");

            if (!Boolean.TRUE.equals(success)) {
                throw new IllegalArgumentException(message != null ? message : "Face not detected in image");
            }

            log.info("Face registered for employee={}, path={}", employeeId, embeddingPath);

            FaceEmbedding embedding = FaceEmbedding.builder()
                    .employeeId(employeeId)
                    .rawImagePath(embeddingPath)
                    .modelUsed("DeepFace")
                    .build();
            return faceEmbeddingRepository.save(embedding);

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Face registration call failed: {}", e.getMessage(), e);
            throw new RuntimeException("Face registration failed: " + e.getMessage(), e);
        }
    }

    /** ByteArrayResource with a filename so RestTemplate sends a proper multipart part. */
    private static class NamedByteArrayResource extends ByteArrayResource {
        private final String filename;

        NamedByteArrayResource(byte[] byteArray, String filename) {
            super(byteArray);
            this.filename = filename;
        }

        @Override
        public String getFilename() {
            return filename;
        }
    }
}
