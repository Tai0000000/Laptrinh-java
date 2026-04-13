package com.project.waste.dto;

import java.time.LocalDateTime;

public record AdminEnterpriseDto(
        Long id,
        String companyName,
        String licenseNumber,
        String acceptedWasteTypes,
        String serviceArea,
        Integer maxCapacityKg,
        String address,
        boolean verified,
        LocalDateTime createdAt
) {
}

