package com.project.waste.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "collection_requests")
public class CollectionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "citizen_id", nullable = false)
    private Long citizenId;

    @Column(name = "enterprise_id")
    private Long enterpriseId;

    @Column(name = "collector_id")
    private Long collectorId;

    @Column(name = "waste_type", nullable = false)
    private String wasteType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CollectionStatus status = CollectionStatus.PENDING;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public CollectionRequest() {
    }

    public CollectionRequest(Long id, Long citizenId, Long enterpriseId, Long collectorId,
                             String wasteType, String description, String imageUrl,
                             Double latitude, Double longitude, CollectionStatus status) {
        this.id = id;
        this.citizenId = citizenId;
        this.enterpriseId = enterpriseId;
        this.collectorId = collectorId;
        this.wasteType = wasteType;
        this.description = description;
        this.imageUrl = imageUrl;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCitizenId() { return citizenId; }
    public void setCitizenId(Long citizenId) { this.citizenId = citizenId; }

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
}
