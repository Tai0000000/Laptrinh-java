package com.project.waste.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import com.project.waste.enums.CollectionStatus;
import com.project.waste.enums.WasteType;

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
    private Collector assignedCollector;

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

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

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

    // Proxy methods phục vụ các query/service đang dùng dạng *Id (citizenId/enterpriseId/collectorId).
    // Mục tiêu: không cần load full relationship, chỉ cần set "stub entity" với id để JPA lưu đúng FK.
    public Long getCitizenId() { return citizen != null ? citizen.getId() : null; }

    public void setCitizenId(Long citizenId) {
        if (citizenId == null) {
            this.citizen = null;
            return;
        }
        User u = new User();
        u.setId(citizenId);
        this.citizen = u;
    }

    public Long getEnterpriseId() { return enterprise != null ? enterprise.getId() : null; }

    public void setEnterpriseId(Long enterpriseId) {
        if (enterpriseId == null) {
            this.enterprise = null;
            return;
        }
        Enterprise e = new Enterprise();
        e.setId(enterpriseId);
        this.enterprise = e;
    }

    public Long getCollectorId() { return assignedCollector != null ? assignedCollector.getId() : null; }

    public void setCollectorId(Long collectorId) {
        if (collectorId == null) {
            this.assignedCollector = null;
            return;
        }
        Collector c = new Collector();
        c.setId(collectorId);
        this.assignedCollector = c;
    }

    /**
     * Setter giúp service/controller truyền `wasteType` dạng String.
     * Nếu truyền trực tiếp WasteType thì Lombok sẽ sinh setter tương ứng.
     */
    public void setWasteType(String wasteType) {
        if (wasteType == null) {
            this.wasteType = null;
            return;
        }
        this.wasteType = WasteType.valueOf(wasteType);
    }

    /**
     * Chuyển đổi trạng thái một cách an toàn (dùng canTransitionTo của CollectionStatus).
     */
    public void transitionTo(CollectionStatus newStatus) {
        if (newStatus == null || this.status == null) {
            throw new IllegalStateException("Trạng thái hiện tại hoặc trạng thái mới không hợp lệ");
        }
        if (!this.status.canTransitionTo(newStatus)) {
            throw new IllegalStateException("Không thể chuyển trạng thái từ " + this.status + " sang " + newStatus);
        }
        this.status = newStatus;
    }
}
