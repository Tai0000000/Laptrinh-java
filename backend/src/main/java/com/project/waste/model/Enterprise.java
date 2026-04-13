package com.project.waste.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "enterprises")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Enterprise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "license_number")
    private String licenseNumber;

    



    @Column(name = "accepted_waste_types", nullable = false)
    private String acceptedWasteTypes;

    @Column(name = "service_area")
    private String serviceArea;

    @Column(name = "max_capacity_kg")
    private Integer maxCapacityKg;

    private String address;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean verified = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
