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

export default function StatusTimeline({ history, dark = false }) {
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
    return <div style={{ color: dark ? '#666' : '#475569' }}>Chưa có dữ liệu trạng thái.</div>;
  }

  const currentStatus = statuses[statuses.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      {statuses.map((status, idx) => {
        const isDone = idx < statuses.length - 1;
        const isCurrent = status === currentStatus;
        const label = STATUS_LABELS[status] ?? status;
        const changedAt = timeByStatus[status];

        return (
          <div
            key={`${status}-${idx}`}
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
              position: 'relative'
            }}
          >
            {}
            {idx < statuses.length - 1 && (
              <div style={{
                position: 'absolute',
                left: '6px',
                top: '18px',
                bottom: '-12px',
                width: '2px',
                background: isDone ? '#22c55e' : (dark ? '#1f1f1f' : '#e2e8f0'),
                zIndex: 0
              }} />
            )}

            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: isCurrent ? '#22c55e' : isDone ? '#22c55e' : (dark ? '#1f1f1f' : '#cbd5e1'),
                border: isCurrent ? `4px solid ${dark ? '#22c55e20' : '#22c55e40'}` : 'none',
                boxSizing: 'content-box',
                marginTop: '4px',
                zIndex: 1
              }}
            />
            <div>
              <div style={{ 
                fontWeight: '600', 
                fontSize: '14px',
                color: isCurrent ? '#22c55e' : (dark ? '#fff' : '#0f172a') 
              }}>{label}</div>
              {changedAt ? (
                <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>
                  {new Date(changedAt).toLocaleString('vi-VN')}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
