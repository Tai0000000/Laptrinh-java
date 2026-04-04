package com.project.waste.enums;

import org.junit.jupiter.api.Test;

import java.util.EnumSet;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CollectionStatusTest {

    @Test
    void nullTarget_isRejectedForAllOrigins() {
        for (CollectionStatus from : CollectionStatus.values()) {
            assertFalse(from.canTransitionTo(null), from.name());
        }
    }

    @Test
    void sameState_isRejected() {
        for (CollectionStatus s : CollectionStatus.values()) {
            assertFalse(s.canTransitionTo(s), s.name());
        }
    }

    @Test
    void pending_allowedTargets() {
        assertTrue(CollectionStatus.PENDING.canTransitionTo(CollectionStatus.ACCEPTED));
        assertTrue(CollectionStatus.PENDING.canTransitionTo(CollectionStatus.REJECTED));
        assertTrue(CollectionStatus.PENDING.canTransitionTo(CollectionStatus.CANCELLED));
    }

    @Test
    void pending_rejectsSkipStepsAndOtherStates() {
        EnumSet<CollectionStatus> forbidden = EnumSet.complementOf(
                EnumSet.of(CollectionStatus.ACCEPTED, CollectionStatus.REJECTED, CollectionStatus.CANCELLED));
        for (CollectionStatus to : forbidden) {
            assertFalse(CollectionStatus.PENDING.canTransitionTo(to), "PENDING -> " + to);
        }
    }

    @Test
    void accepted_allowedAndForbidden() {
        assertTrue(CollectionStatus.ACCEPTED.canTransitionTo(CollectionStatus.ASSIGNED));
        assertTrue(CollectionStatus.ACCEPTED.canTransitionTo(CollectionStatus.CANCELLED));
        assertFalse(CollectionStatus.ACCEPTED.canTransitionTo(CollectionStatus.ON_THE_WAY));
        assertFalse(CollectionStatus.ACCEPTED.canTransitionTo(CollectionStatus.COLLECTED));
        assertFalse(CollectionStatus.ACCEPTED.canTransitionTo(CollectionStatus.REJECTED));
    }

    @Test
    void assigned_allowedAndForbidden() {
        assertTrue(CollectionStatus.ASSIGNED.canTransitionTo(CollectionStatus.ON_THE_WAY));
        assertTrue(CollectionStatus.ASSIGNED.canTransitionTo(CollectionStatus.CANCELLED));
        assertFalse(CollectionStatus.ASSIGNED.canTransitionTo(CollectionStatus.COLLECTED));
        assertFalse(CollectionStatus.ASSIGNED.canTransitionTo(CollectionStatus.ACCEPTED));
    }

    @Test
    void onTheWay_allowedAndForbidden() {
        assertTrue(CollectionStatus.ON_THE_WAY.canTransitionTo(CollectionStatus.COLLECTED));
        assertTrue(CollectionStatus.ON_THE_WAY.canTransitionTo(CollectionStatus.CANCELLED));
        assertFalse(CollectionStatus.ON_THE_WAY.canTransitionTo(CollectionStatus.ASSIGNED));
    }

    @Test
    void terminalStates_rejectAnyOtherState() {
        EnumSet<CollectionStatus> terminal = EnumSet.of(
                CollectionStatus.REJECTED, CollectionStatus.COLLECTED, CollectionStatus.CANCELLED);
        for (CollectionStatus from : terminal) {
            for (CollectionStatus to : CollectionStatus.values()) {
                if (to == from) {
                    continue;
                }
                assertFalse(from.canTransitionTo(to), from + " -> " + to);
            }
        }
    }
}
