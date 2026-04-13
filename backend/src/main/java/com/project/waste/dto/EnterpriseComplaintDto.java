package com.project.waste.dto;

import java.time.LocalDateTime;

public record EnterpriseComplaintDto(
        Long id,
        Long requestId,
        Long citizenId,
        String citizenFullName,
        String title,
        String content,
        String status,
        String resolution,
        LocalDateTime createdAt,
        LocalDateTime resolvedAt
) {
}

