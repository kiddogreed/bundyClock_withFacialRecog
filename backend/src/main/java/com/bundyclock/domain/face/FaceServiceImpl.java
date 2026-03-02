package com.bundyclock.domain.face;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FaceServiceImpl implements FaceService {

    private final FaceEmbeddingRepository faceEmbeddingRepository;
    private final WebClient webClient;

    @Value("${app.face-recognition.service-url}")
    private String faceServiceUrl;

    @Value("${app.face-recognition.verify-endpoint}")
    private String verifyEndpoint;

    @Value("${app.face-recognition.register-endpoint}")
    private String registerEndpoint;

    // -------------------------------------------------------------------------
    // Verify
    // -------------------------------------------------------------------------

    @Override
    @SuppressWarnings("unchecked")
    public FaceVerifyResult verify(MultipartFile image) {
        log.info("Forwarding image to face recognition service for verification");
        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("image", new NamedByteArrayResource(image.getBytes(),
                    image.getOriginalFilename() != null ? image.getOriginalFilename() : "face.jpg"));

            Map<String, Object> result = webClient.post()
                    .uri(faceServiceUrl + verifyEndpoint)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (result == null) throw new RuntimeException("Empty response from face service");

            boolean matched = Boolean.TRUE.equals(result.get("matched"));
            String empIdStr  = (String) result.get("employee_id");
            Number  score    = (Number)  result.get("confidence_score");
            String  message  = (String)  result.get("message");

            log.info("Verification — matched={}, employee={}, score={}", matched, empIdStr, score);

            return FaceVerifyResult.builder()
                    .matched(matched)
                    .employeeId(empIdStr != null ? UUID.fromString(empIdStr) : null)
                    .confidenceScore(score != null ? new BigDecimal(score.toString()) : null)
                    .message(message)
                    .build();

        } catch (WebClientResponseException e) {
            log.error("Face verification HTTP error {}: {}", e.getStatusCode(), e.getMessage());
            return FaceVerifyResult.builder()
                    .matched(false)
                    .message("Face recognition service error: " + e.getMessage())
                    .build();
        } catch (Exception e) {
            log.error("Face verification call failed: {}", e.getMessage(), e);
            return FaceVerifyResult.builder()
                    .matched(false)
                    .message("Face recognition service unavailable: " + e.getMessage())
                    .build();
        }
    }

    // -------------------------------------------------------------------------
    // Register
    // -------------------------------------------------------------------------

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    public FaceEmbedding registerFace(UUID employeeId, MultipartFile image) {
        log.info("Forwarding image to face recognition service for registration — employee={}", employeeId);
        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("employee_id", employeeId.toString());
            builder.part("image", new NamedByteArrayResource(image.getBytes(),
                    image.getOriginalFilename() != null ? image.getOriginalFilename() : "face.jpg"));

            Map<String, Object> result = webClient.post()
                    .uri(faceServiceUrl + registerEndpoint)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (result == null) throw new RuntimeException("Empty response from face service");

            Boolean success       = (Boolean) result.get("success");
            String  message       = (String)  result.get("message");
            String  embeddingPath = (String)  result.get("embedding_path");

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

        } catch (WebClientResponseException e) {
            log.error("Face registration HTTP error {}: {}", e.getStatusCode(), e.getMessage());
            throw new IllegalArgumentException("Face service error: " + e.getResponseBodyAsString());
        } catch (org.springframework.web.reactive.function.client.WebClientRequestException e) {
            log.error("Face registration connection failed: {}", e.getMessage());
            throw new IllegalStateException("Face recognition service is not running. Please start it on port 5001.");
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.error("Face registration call failed: {}", e.getMessage(), e);
            throw new RuntimeException("Face registration failed: " + e.getMessage(), e);
        }
    }

    // -------------------------------------------------------------------------
    // Face status
    // -------------------------------------------------------------------------

    @Override
    public FaceStatusResponse getFaceStatus(UUID employeeId) {
        List<FaceEmbedding> embeddings = faceEmbeddingRepository.findAllByEmployeeId(employeeId);
        FaceEmbedding latest = embeddings.stream()
                .max(java.util.Comparator.comparing(FaceEmbedding::getCreatedAt,
                        java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                .orElse(null);

        return FaceStatusResponse.builder()
                .employeeId(employeeId)
                .embeddingCount(embeddings.size())
                .registered(!embeddings.isEmpty())
                .lastRegisteredAt(latest != null ? latest.getCreatedAt() : null)
                .build();
    }

    // -------------------------------------------------------------------------
    // Delete face data
    // -------------------------------------------------------------------------

    @Override
    @Transactional
    public void deleteFaceData(UUID employeeId) {
        // 1. Delete DB records
        faceEmbeddingRepository.deleteByEmployeeId(employeeId);

        // 2. Tell Python service to delete the embedding file (best-effort)
        try {
            webClient.delete()
                    .uri(faceServiceUrl + "/delete-face/" + employeeId)
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();
            log.info("Deleted face data from Python service for employee={}", employeeId);
        } catch (Exception e) {
            log.warn("Could not delete face data from Python service for employee={}: {}", employeeId, e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Inner helper
    // -------------------------------------------------------------------------

    /** ByteArrayResource with a filename so WebClient sends a proper multipart part. */
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
