package com.project.waste.enums;


public enum CollectionStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    ASSIGNED,
    ON_THE_WAY,
    COLLECTED,
    CANCELLED;

    public boolean canTransitionTo(CollectionStatus next) {
        return switch (this) {
            case PENDING     -> next == ACCEPTED || next == REJECTED;
            case ACCEPTED    -> next == ASSIGNED || next == CANCELLED;
            case ASSIGNED    -> next == ON_THE_WAY;
            case ON_THE_WAY  -> next == COLLECTED;
            // Terminal states — không thể đổi tiếp
            case COLLECTED, REJECTED, CANCELLED -> false;
        };
    }
}
