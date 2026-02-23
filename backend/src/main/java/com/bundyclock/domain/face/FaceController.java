package com.bundyclock.domain.face;

import com.bundyclock.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/face")
@RequiredArgsConstructor
@Tag(name = "Face Recognition", description = "Face registration and verification endpoints")
public class FaceController {

    private final FaceService faceService;

    @PostMapping(value = "/verify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Verify a captured face image against registered embeddings")
    public ResponseEntity<ApiResponse<FaceVerifyResult>> verifyFace(
            @RequestPart("image") MultipartFile image) {

        FaceVerifyResult result = faceService.verify(image);
        return ResponseEntity.ok(ApiResponse.ok("Verification complete", result));
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Register a face image for an employee")
    public ResponseEntity<ApiResponse<FaceEmbedding>> registerFace(
            @RequestParam UUID employeeId,
            @RequestPart("image") MultipartFile image) {

        FaceEmbedding embedding = faceService.registerFace(employeeId, image);
        return ResponseEntity.ok(ApiResponse.ok("Face registered", embedding));
    }
}
