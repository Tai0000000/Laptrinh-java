package com.project.waste.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.project.waste.enums.CollectionStatus;

@Entity
@Table(name = "request_status_history")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class RequestStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private CollectionRequest request;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", columnDefinition = "collection_status")
    private CollectionStatus fromStatus;  // null khi tạo mới

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, columnDefinition = "collection_status")
    private CollectionStatus toStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by", nullable = false)
    private User changedBy;

    private String note;

    @Column(name = "changed_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime changedAt = LocalDateTime.now();
}
