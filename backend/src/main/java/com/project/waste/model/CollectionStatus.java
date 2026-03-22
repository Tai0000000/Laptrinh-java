package com.project.waste.model;

public enum CollectionStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    ASSIGNED,
    ON_THE_WAY,
    COLLECTED,
    CANCELLED;

    /**
     * Kiểm tra xem trạng thái hiện tại có được phép chuyển sang trạng thái mới hay không.
     *
     * @param nextStatus Trạng thái muốn chuyển tới
     * @return true nếu hợp lệ, false nếu vi phạm logic business
     */
    public boolean canTransitionTo(CollectionStatus nextStatus) {
        if (nextStatus == null || this == nextStatus) {
            return false;
        }

        return switch (this) {
            case PENDING -> nextStatus == ACCEPTED || nextStatus == REJECTED || nextStatus == CANCELLED;
            case ACCEPTED -> nextStatus == ASSIGNED || nextStatus == CANCELLED;
            case ASSIGNED -> nextStatus == ON_THE_WAY || nextStatus == CANCELLED;
            case ON_THE_WAY -> nextStatus == COLLECTED || nextStatus == CANCELLED;
            case REJECTED, COLLECTED, CANCELLED -> false;
        };
    }
}