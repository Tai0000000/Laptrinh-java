package com.project.waste.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import com.project.waste.enums.CollectionStatus;
import com.project.waste.enums.WasteType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "collection_requests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CollectionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Quan hệ ──────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_id", nullable = false)
    private User citizen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enterprise_id")
    private Enterprise enterprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_collector_id")
    private User assignedCollector;

    // ── State Machine ──────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "collection_status")
    @Builder.Default
    private CollectionStatus status = CollectionStatus.PENDING;

    // ── Waste Info ─────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "waste_type", nullable = false, columnDefinition = "waste_type")
    private WasteType wasteType;

    private String description;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(nullable = false, precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(name = "address_text")
    private String addressText;

    @Column(name = "proof_image_url")
    private String proofImageUrl;

    @Column(name = "reject_reason")
    private String rejectReason;

    @Version
    private Integer version;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

    public Long getEnterpriseId() { return enterpriseId; }
    public void setEnterpriseId(Long enterpriseId) { this.enterpriseId = enterpriseId; }

    public Long getCollectorId() { return collectorId; }
    public void setCollectorId(Long collectorId) { this.collectorId = collectorId; }

    public String getWasteType() { return wasteType; }
    public void setWasteType(String wasteType) { this.wasteType = wasteType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public CollectionStatus getStatus() { return status; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    /**
     * Chuyển đổi trạng thái một cách an toàn (dùng canTransitionTo của CollectionStatus).
     */
    public void transitionTo(CollectionStatus newStatus) {
        if (this.status == null || !this.status.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                "Không thể chuyển trạng thái từ " + this.status + " sang " + newStatus
            );
        }
        this.status = newStatus;
    }
=======
>>>>>>> 6e211a7 (Edit and add các file model và repository)
}
