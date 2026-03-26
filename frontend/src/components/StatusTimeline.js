import React, { useMemo } from 'react';

const STATUS_LABELS = {
  PENDING: 'Đang chờ',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Từ chối',
  ASSIGNED: 'Đã phân công',
  ON_THE_WAY: 'Đang trên đường',
  COLLECTED: 'Đã thu gom',
  CANCELLED: 'Đã hủy',
};

export default function StatusTimeline({ history }) {
  const safeHistory = Array.isArray(history) ? history : [];

  const { statuses, timeByStatus } = useMemo(() => {
    const timeByStatus = {};
    for (const h of safeHistory) {
      if (h?.toStatus) timeByStatus[h.toStatus] = h.changedAt;
    }

    const statuses = [];
    for (const h of safeHistory) {
      if (h?.fromStatus && statuses.length === 0) statuses.push(h.fromStatus);
      if (h?.toStatus && statuses[statuses.length - 1] !== h.toStatus) statuses.push(h.toStatus);
    }
    
    if (statuses.length === 0 && safeHistory.length > 0 && safeHistory[0]?.toStatus) {
      statuses.push(safeHistory[0].toStatus);
    }

    return { statuses, timeByStatus };
  }, [safeHistory]);

  if (statuses.length === 0) {
    return <div className="status-timeline">Chưa có dữ liệu trạng thái.</div>;
  }

  const currentStatus = statuses[statuses.length - 1];

  return (
    <div className="status-timeline" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {statuses.map((status, idx) => {
        const isDone = idx < statuses.length - 1;
        const isCurrent = status === currentStatus;
        const label = STATUS_LABELS[status] ?? status;
        const changedAt = timeByStatus[status];

        return (
          <div
            key={`${status}-${idx}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '16px 1fr',
              gap: 10,
              alignItems: 'start',
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: isCurrent ? '#2563eb' : isDone ? '#16a34a' : '#cbd5e1',
                marginTop: 6,
              }}
            />
            <div>
              <div style={{ fontWeight: 700, color: isCurrent ? '#2563eb' : '#0f172a' }}>{label}</div>
              {changedAt ? (
                <div style={{ color: '#475569', fontSize: 13 }}>
                  Thời điểm: {new Date(changedAt).toLocaleString('vi-VN')}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}