package com.bundyclock.domain.face;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceVerifyResult {

    private UUID employeeId;
    private BigDecimal confidenceScore;
    private boolean matched;
    private String message;
}
