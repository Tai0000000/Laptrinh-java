package com.project.waste.service;
import com.project.waste.enums.UserRole;
import com.project.waste.enums.WasteType;
import com.project.waste.model.*;
import com.project.waste.repository.*;
import com.project.waste.enums.CollectionStatus;
import com.project.waste.exception.ResourceNotFoundException;
import com.project.waste.exception.InvalidStateTransitionException;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepo;
    private final CollectionRequestRepository requestRepo;
    private final ComplaintRepository complaintRepo;
    private final EnterpriseRepository enterpriseRepo;
    private final RequestStatusHistoryRepository requestStatusHistoryRepo;

    public Map<String, Object> getSystemOverview() {
        Map<String, Long> usersByRole = new LinkedHashMap<>();
        for (UserRole role : UserRole.values()) {
            usersByRole.put(role.name(), userRepo.countByRole(role));
        }

        Map<String, Long> requestsByStatus = new LinkedHashMap<>();
        requestRepo.globalCountByStatus()
                .forEach(row -> {
                    if (row[0] != null && row[1] != null) {
                        requestsByStatus.put(row[0].toString(), ((Number) row[1]).longValue());
                    }
                });

        long openComplaints = complaintRepo.findByStatus("OPEN",
                PageRequest.of(0, 1)).getTotalElements();

        long totalComplaints = complaintRepo.count();
        long closedComplaints = complaintRepo.countByStatus("RESOLVED")
                + complaintRepo.countByStatus("DISMISSED");
        double complaintResolutionPercent = totalComplaints > 0
                ? Math.round(1000.0 * closedComplaints / totalComplaints) / 10.0
                : 100.0;

        Double avgHoursRaw = requestRepo.averageHoursCreatedToUpdatedCollected();
        Double avgHoursToCollect = avgHoursRaw != null
                ? Math.round(avgHoursRaw * 10.0) / 10.0
                : null;

        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("totalUsers", userRepo.count());
        overview.put("usersByRole", usersByRole);
        overview.put("totalRequests", requestRepo.count());
        overview.put("requestsByStatus", requestsByStatus);
        overview.put("openComplaints", openComplaints);
        overview.put("totalEnterprises", enterpriseRepo.count());
        overview.put("totalComplaints", totalComplaints);
        overview.put("complaintResolutionPercent", complaintResolutionPercent);
        overview.put("avgHoursToCollect", avgHoursToCollect);
        overview.put("last7DaysTrend", buildLast7DaysTrend());
        overview.put("wasteByWeekdayLast7Days", buildWasteByWeekdayLast7Days());
        return overview;
    }

    private List<Map<String, Object>> buildLast7DaysTrend() {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(6);
        LocalDateTime since = start.atStartOfDay();

        Map<LocalDate, Long> created = toDayCountMap(requestRepo.countCreatedByDaySince(since));
        Map<LocalDate, Long> collected = toDayCountMap(
                requestRepo.countCollectedByDaySince(since, CollectionStatus.COLLECTED));

        List<Map<String, Object>> rows = new ArrayList<>();
        DateTimeFormatter dayMonth = DateTimeFormatter.ofPattern("dd/MM");
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", d.format(dayMonth));
            row.put("weekday", weekdayShortVi(d));
            row.put("requests", created.getOrDefault(d, 0L));
            row.put("completed", collected.getOrDefault(d, 0L));
            rows.add(row);
        }
        return rows;
    }

    private List<Map<String, Object>> buildWasteByWeekdayLast7Days() {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(6);
        LocalDateTime since = start.atStartOfDay();

        Map<LocalDate, Map<String, Long>> byDay = new TreeMap<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            byDay.put(d, zeroWasteCounts());
        }

        for (Object[] row : requestRepo.countByDayAndWasteTypeSince(since)) {
            LocalDate d = toLocalDate(row[0]);
            if (d == null || row[1] == null || row[2] == null || !byDay.containsKey(d)) {
                continue;
            }
            WasteType wt = row[1] instanceof WasteType
                    ? (WasteType) row[1]
                    : WasteType.valueOf(row[1].toString());
            long c = ((Number) row[2]).longValue();
            byDay.get(d).merge(wasteChartKey(wt), c, Long::sum);
        }

        List<Map<String, Object>> list = new ArrayList<>();
        for (Map.Entry<LocalDate, Map<String, Long>> e : byDay.entrySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", weekdayShortVi(e.getKey()));
            for (Map.Entry<String, Long> wt : e.getValue().entrySet()) {
                row.put(wt.getKey(), wt.getValue());
            }
            list.add(row);
        }
        return list;
    }

    private static Map<String, Long> zeroWasteCounts() {
        Map<String, Long> m = new LinkedHashMap<>();
        for (WasteType wt : WasteType.values()) {
            m.put(wasteChartKey(wt), 0L);
        }
        return m;
    }

    private static String wasteChartKey(WasteType wt) {
        return switch (wt) {
            case RECYCLABLE -> "recyclable";
            case ORGANIC -> "organic";
            case HAZARDOUS -> "hazardous";
            case GENERAL -> "general";
            case ELECTRONIC -> "electronic";
        };
    }

    private static String weekdayShortVi(LocalDate d) {
        return switch (d.getDayOfWeek()) {
            case MONDAY -> "T2";
            case TUESDAY -> "T3";
            case WEDNESDAY -> "T4";
            case THURSDAY -> "T5";
            case FRIDAY -> "T6";
            case SATURDAY -> "T7";
            case SUNDAY -> "CN";
        };
    }

    private static Map<LocalDate, Long> toDayCountMap(List<Object[]> rows) {
        Map<LocalDate, Long> m = new HashMap<>();
        if (rows == null) {
            return m;
        }
        for (Object[] row : rows) {
            LocalDate d = toLocalDate(row[0]);
            if (d != null && row[1] != null) {
                m.put(d, ((Number) row[1]).longValue());
            }
        }
        return m;
    }

    private static LocalDate toLocalDate(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof LocalDate) {
            return (LocalDate) o;
        }
        if (o instanceof java.sql.Date) {
            return ((java.sql.Date) o).toLocalDate();
        }
        if (o instanceof java.util.Date) {
            return new java.sql.Date(((java.util.Date) o).getTime()).toLocalDate();
        }
        return null;
    }

    public Page<User> getAllUsers(String search, UserRole role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (search != null && !search.isBlank()) {
            if (role != null) {
                return userRepo.findByRoleAndSearch(role, search.trim(), pageable);
            }
            return userRepo.findBySearch(search.trim(), pageable);
        } else if (role != null) {
            return userRepo.findByRole(role, pageable);
        }
        return userRepo.findAll(pageable);
    }

    public Page<User> getUsersByRole(UserRole role, int page) {
        return getAllUsers(null, role, page, 20);
    }

    @Transactional
    public User toggleUserActive(@NonNull Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
        userRepo.setActive(userId, !user.isActive());
        user.setActive(!user.isActive());
        return user;
    }

    @Transactional
    public Enterprise verifyEnterprise(@NonNull Long enterpriseId) {
        Enterprise enterprise = enterpriseRepo.findById(enterpriseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enterprise không tồn tại"));
        enterprise.setVerified(true);
        return enterpriseRepo.save(enterprise);
    }

    @Transactional
    public Enterprise rejectEnterprise(@NonNull Long enterpriseId) {
        Enterprise enterprise = enterpriseRepo.findById(enterpriseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enterprise không tồn tại"));
        enterprise.setVerified(false);
        return enterpriseRepo.save(enterprise);
    }

    public Page<Enterprise> getAllEnterprises(String search, Boolean verified, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (search != null && !search.isBlank()) {
            if (verified != null) {
                return enterpriseRepo.findByVerifiedAndSearch(verified, search.trim(), pageable);
            }
            return enterpriseRepo.findBySearch(search.trim(), pageable);
        } else if (verified != null) {
            return enterpriseRepo.findByVerified(verified, pageable);
        }
        return enterpriseRepo.findAll(pageable);
    }

    public Page<Enterprise> getAllEnterprises(int page) {
        return getAllEnterprises(null, null, page, 20);
    }

    public Page<CollectionRequest> getAllRequests(int page) {
        return requestRepo.findAll(
                PageRequest.of(page, 20, Sort.by("createdAt").descending()));
    }


    public Page<Complaint> getOpenComplaints(int page) {
        return complaintRepo.findByStatus("OPEN",
                PageRequest.of(page, 20, Sort.by("createdAt").descending()));
    }

    @Transactional
    public Complaint resolveComplaint(@NonNull Long complaintId, String adminUsername,
                                       String resolution, boolean dismiss) {
        Complaint complaint = complaintRepo.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint không tồn tại"));

        if (!complaint.getStatus().equals("OPEN")) {
            throw new InvalidStateTransitionException("OPEN", complaint.getStatus() + " (already resolved)");
        }

        User admin = userRepo.findByUsername(adminUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Admin không tồn tại"));

        complaint.setStatus(dismiss ? "DISMISSED" : "RESOLVED");
        complaint.setResolvedBy(admin);
        complaint.setResolution(resolution);
        complaint.setResolvedAt(LocalDateTime.now());

        return complaintRepo.save(complaint);
    }

    /**
     * Hủy các yêu cầu {@link CollectionStatus#PENDING} quá hạn (chưa được enterprise xử lý),
     * dùng {@link CollectionRequest#transitionTo} để đảm bảo đúng state machine.
     *
     * @param hoursOld   số giờ tối thiểu kể từ {@code createdAt}
     * @param adminUsername username đăng nhập (principal), dùng cho audit {@code RequestStatusHistory}
     * @return số bản ghi đã chuyển sang {@link CollectionStatus#CANCELLED}
     */
    @Transactional
    public int cancelStaleRequests(int hoursOld, String adminUsername) {
        if (hoursOld <= 0) {
            throw new IllegalArgumentException("hoursOld phải > 0");
        }
        if (adminUsername == null || adminUsername.isBlank()) {
            throw new IllegalArgumentException("adminUsername không hợp lệ");
        }
        User admin = userRepo.findByUsername(adminUsername.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Admin không tồn tại"));

        LocalDateTime cutoff = LocalDateTime.now().minusHours(hoursOld);
        List<CollectionRequest> stale = requestRepo.findByStatusAndCreatedAtBefore(
                CollectionStatus.PENDING, cutoff);

        int count = 0;
        for (CollectionRequest request : stale) {
            CollectionStatus from = request.getStatus();
            request.transitionTo(CollectionStatus.CANCELLED);
            requestRepo.save(request);

            RequestStatusHistory history = RequestStatusHistory.builder()
                    .request(request)
                    .fromStatus(from)
                    .toStatus(CollectionStatus.CANCELLED)
                    .changedBy(admin)
                    .note("Admin cancelled stale PENDING request (older than " + hoursOld + "h)")
                    .build();
            requestStatusHistoryRepo.save(Objects.requireNonNull(history));
            count++;
        }
        return count;
    }
}
