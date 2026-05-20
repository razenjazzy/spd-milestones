import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, differenceInCalendarDays, format } from 'date-fns';

interface SourceBarSegment {
  type: 'planned' | 'delay' | 'actual';
  start: string;
  end: string;
  color?: string;
  label?: string;
}

interface SourceMilestone {
  id: string;
  title: string;
  teamName?: string;
  responsible?: string;
  color?: string;
  subtitle?: string;
  segments: SourceBarSegment[];
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'delayed';
  delayReason?: string;
  note?: string;
}

type MilestoneStatus = 'done' | 'inprogress' | 'upcoming' | 'blocked' | 'overdue';

interface BarSegment {
  type: 'bar' | 'delay' | 'milestone' | 'pin';
  start: string;
  end?: string;
  label?: string;
  progress?: number;
  note?: string;
  done?: boolean;
  milestoneStatus?: MilestoneStatus;
}

interface GanttMilestone {
  id: string | number;
  title: string;
  team?: string;
  teamColor?: string;
  segments: BarSegment[];
  note?: string;
  delayReason?: string;
}

interface InlineEditRow {
  title: string;
  teamName: string;
  responsible: string;
  note: string;
  delayReason: string;
}

interface GanttChartProps {
  milestones: SourceMilestone[];
  today?: string;
  onMilestoneClick?: (m: SourceMilestone) => void;
  editable?: boolean;
  editableFields?: boolean;
  onMilestoneInlineSave?: (
    milestoneId: string,
    payload: {
      title?: string;
      responsible?: string;
      teamName?: string;
      note?: string;
      delayReason?: string;
    }
  ) => void;
  onBarDateShift?: (
    milestoneId: string,
    oldStart: string,
    oldEnd: string,
    newStart: string,
    newEnd: string,
    daysDelta: number
  ) => void;
}

const SIDEBAR_W = 310;
const SIDEBAR_W_MOBILE = 170;
const PAD_DAYS = 3;
const ROW_H = 52;
const ROW_H_MOBILE = 46;
const BAR_H = 22;
const HEADER_H = 62;
const TEAM_W = 70;
const ROW_MIN_W = 24 + TEAM_W + 180;

function toDate(input: string): Date {
  const raw = (input || '').trim();
  const d = raw.includes('T') || raw.includes(' ') ? new Date(raw) : new Date(`${raw}T00:00:00`);
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

function dk(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function hexA(hex: string, a: number): string {
  try {
    const h = hex.replace('#', '');
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
  } catch {
    return hex;
  }
}

function parseDelayLabel(start: string, end: string): string {
  const d = Math.max(1, differenceInCalendarDays(toDate(end), toDate(start)));
  return `+${d} d`;
}

function computeProgress(start: string, end: string, today: Date, status?: SourceMilestone['status']): number {
  if (status === 'completed') return 1;
  const s = toDate(start);
  const e = toDate(end);
  if (today <= s) return 0;
  if (today >= e) return 1;
  const total = Math.max(1, e.getTime() - s.getTime());
  const elapsed = today.getTime() - s.getTime();
  return Math.max(0, Math.min(1, elapsed / total));
}

function deriveMilestoneStatus(start: Date, today: Date, done: boolean, blocked: boolean): MilestoneStatus {
  if (done) return 'done';
  if (blocked) return 'blocked';
  const s = start.getTime();
  const t = today.getTime();
  if (s < t) return 'overdue';
  if (s === t) return 'inprogress';
  return 'upcoming';
}

function isGoLiveMarker(raw: SourceMilestone): boolean {
  const markerText = [raw.title, raw.teamName, raw.responsible]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toLowerCase();

  return markerText === 'live' || markerText.includes('go live');
}

function mapToViewMilestone(raw: SourceMilestone, today: Date): GanttMilestone {
  const teamColor = raw.color || '#6b7280';
  const team = raw.teamName || raw.responsible;

  const planned = (raw.segments || []).find((s) => s.type === 'planned');
  const delay = (raw.segments || []).find((s) => s.type === 'delay');
  const actual = (raw.segments || []).find((s) => s.type === 'actual');

  const start = planned?.start || raw.startDate;
  const end = planned?.end || raw.endDate;
  const done = Boolean(actual) || raw.status === 'completed';
  let renderedAsMilestone = false;

  const segments: BarSegment[] = [];

  if (start && end) {
    const dStart = toDate(start);
    const dEnd = toDate(end);
    const diff = differenceInCalendarDays(dEnd, dStart);
    const isOneDayMilestone = diff === 0;

    if (isOneDayMilestone) {
      renderedAsMilestone = true;
      if (isGoLiveMarker(raw)) {
        segments.push({
          type: 'pin',
          start,
          note: raw.note || raw.subtitle || raw.title,
        });
      } else {
        segments.push({
          type: 'milestone',
          start,
          done,
          note: raw.note,
          milestoneStatus: deriveMilestoneStatus(dStart, today, done, Boolean(raw.delayReason)),
        });
      }
    } else {
      segments.push({
        type: 'bar',
        start,
        end,
        label: planned?.label || `${Math.max(1, diff)} d`,
        progress: computeProgress(start, end, today, raw.status),
        note: raw.note,
      });
    }
  }

  if (!renderedAsMilestone && delay?.start && delay?.end) {
    segments.push({
      type: 'delay',
      start: delay.start,
      end: delay.end,
      label: delay.label || parseDelayLabel(delay.start, delay.end),
      note: raw.delayReason,
    });
  } else if (!renderedAsMilestone && !done && end && today > toDate(end)) {
    segments.push({
      type: 'delay',
      start: end,
      end: dk(today),
      label: `+${Math.max(1, differenceInCalendarDays(today, toDate(end)))} d`,
      note: raw.delayReason || 'In delay beyond planned end date',
    });
  }

  return {
    id: raw.id,
    title: raw.title,
    team,
    teamColor,
    note: raw.note,
    delayReason: raw.delayReason,
    segments,
  };
}

interface TT {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  body: string;
}

const InfoIcon: React.FC<{ title: string; body: string; onShow: (t: TT) => void; onHide: () => void }> = ({
  title,
  body,
  onShow,
  onHide,
}) => (
  <span
    onMouseEnter={(e) => {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      onShow({ visible: true, x: r.right + 8, y: r.top - 4, title, body });
    }}
    onMouseLeave={onHide}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: 'rgba(255,255,255,.93)',
      border: '1px solid rgba(0,0,0,.18)',
      color: '#555',
      fontSize: 9,
      fontWeight: 700,
      cursor: 'default',
      marginLeft: 4,
      flexShrink: 0,
      userSelect: 'none',
      verticalAlign: 'middle',
    }}
  >
    i
  </span>
);

const CIRCLE_ICON: Record<MilestoneStatus, string> = {
  done: '✓',
  inprogress: '',
  upcoming: '',
  blocked: '✕',
  overdue: '!',
};

const CIRCLE_STYLE: Record<MilestoneStatus, string> = {
  done: 'background:#27ae60;color:#fff;border:2.5px solid #27ae60',
  inprogress: 'background:#e67e22;color:#fff;border:2.5px solid #e67e22',
  upcoming: 'background:#b0bec5;color:#fff;border:2px solid #b0bec5',
  blocked: 'background:#c0392b;color:#fff;border:2.5px solid #c0392b',
  overdue: 'background:#e53e3e;color:#fff;border:2.5px solid #e53e3e',
};

const GanttChart: React.FC<GanttChartProps> = ({
  milestones,
  today: todayProp,
  onMilestoneClick,
  editable = false,
  editableFields = false,
  onMilestoneInlineSave,
  onBarDateShift,
}) => {
  const [tt, setTt] = useState<TT>({ visible: false, x: 0, y: 0, title: '', body: '' });
  const hideTt = useCallback(() => setTt((t) => ({ ...t, visible: false })), []);
  const chartColRef = useRef<HTMLDivElement | null>(null);
  const [chartW, setChartW] = useState(900);
  const [dragState, setDragState] = useState<{
    milestoneId: string;
    startX: number;
    oldStart: string;
    oldEnd: string;
    daysDelta: number;
  } | null>(null);
  const [inlineEdit, setInlineEdit] = useState<Record<string, InlineEditRow>>({});
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  const buildInlineRow = useCallback(
    (m: GanttMilestone): InlineEditRow => {
      return (
        inlineEdit[String(m.id)] || {
          title: m.title,
          teamName: m.team || '',
          responsible: '',
          note: m.note || '',
          delayReason: m.delayReason || '',
        }
      );
    },
    [inlineEdit]
  );

  const setInlineField = useCallback(
    (m: GanttMilestone, field: keyof InlineEditRow, value: string) => {
      const id = String(m.id);
      setInlineEdit((prev) => ({
        ...prev,
        [id]: {
          ...buildInlineRow(m),
          ...prev[id],
          [field]: value,
        },
      }));
    },
    [buildInlineRow]
  );

  const discardInlineEdit = useCallback((milestoneId: string) => {
    setInlineEdit((prev) => {
      const next = { ...prev };
      delete next[milestoneId];
      return next;
    });
    setActiveRowId(null);
  }, []);

  const saveInlineEdit = useCallback(
    (m: GanttMilestone) => {
      const row = buildInlineRow(m);
      onMilestoneInlineSave?.(String(m.id), {
        title: row.title,
        teamName: row.teamName,
        responsible: row.responsible,
        note: row.note,
        delayReason: row.delayReason,
      });
    },
    [buildInlineRow, onMilestoneInlineSave]
  );

  const today = useMemo(() => {
    if (todayProp) return toDate(todayProp);
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [todayProp]);

  useEffect(() => {
    if (!chartColRef.current) return;
    const el = chartColRef.current;
    const obs = new ResizeObserver(() => {
      setChartW(Math.max(320, el.offsetWidth));
    });
    obs.observe(el);
    setChartW(Math.max(320, el.offsetWidth));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const viewMilestones = useMemo(() => milestones.map((m) => mapToViewMilestone(m, today)), [milestones, today]);
  const activeMilestone = useMemo(
    () => viewMilestones.find((m) => String(m.id) === activeRowId) || null,
    [viewMilestones, activeRowId]
  );
  const sidebarW = Math.max(isCompact ? SIDEBAR_W_MOBILE : SIDEBAR_W, ROW_MIN_W);
  const rowH = isCompact ? ROW_H_MOBILE : ROW_H;

  if (!viewMilestones.length) {
    return <div style={{ padding: 24, color: '#6b7a99' }}>No milestones to display</div>;
  }

  const allDates: Date[] = [today];
  viewMilestones.forEach((m) =>
    (m.segments || []).forEach((s) => {
      allDates.push(toDate(s.start));
      if (s.end) allDates.push(toDate(s.end));
    })
  );

  const rawMin = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const rawMax = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const chartMin = addDays(rawMin, -PAD_DAYS);
  const chartMax = addDays(rawMax, PAD_DAYS);
  const totalDays = Math.max(1, differenceInCalendarDays(chartMax, chartMin));
  const totalMs = Math.max(1, chartMax.getTime() - chartMin.getTime());
  const dayWidthPx = Math.max(1, chartW / totalDays);

  const keySet = new Set<string>([dk(today)]);
  viewMilestones.forEach((m) =>
    (m.segments || []).forEach((s) => {
      keySet.add(dk(toDate(s.start)));
      if (s.end) keySet.add(dk(toDate(s.end)));
    })
  );

  const keyDates = Array.from(keySet)
    .sort()
    .map((s) => toDate(s));

  const toPct = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - chartMin.getTime()) / totalMs) * 100));
  const toWPct = (s: Date, e: Date) => Math.max(0.3, ((e.getTime() - s.getTime()) / totalMs) * 100);
  const todayPct = toPct(today);

  const monthBands = useMemo(() => {
    const bands: Array<{ key: string; label: string; left: number; width: number }> = [];
    let cur = new Date(chartMin.getFullYear(), chartMin.getMonth(), 1);

    while (cur <= chartMax) {
      const mStart = new Date(Math.max(cur.getTime(), chartMin.getTime()));
      const nextMon = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const mEnd = new Date(Math.min(nextMon.getTime(), chartMax.getTime()));
      const left = toPct(mStart);
      const right = toPct(mEnd);
      const width = Math.max(0, right - left);
      if (width > 0.5) {
        bands.push({
          key: `${cur.getFullYear()}-${cur.getMonth()}`,
          label: format(cur, 'MMM'),
          left,
          width,
        });
      }
      cur = nextMon;
    }

    return bands;
  }, [chartMin, chartMax, totalMs]);

  const importantDateKeys = useMemo(() => {
    const keys = new Set<string>([dk(today)]);
    viewMilestones.forEach((m) => {
      (m.segments || []).forEach((s) => {
        keys.add(dk(toDate(s.start)));
        if (s.end) keys.add(dk(toDate(s.end)));
      });
    });
    return keys;
  }, [viewMilestones, today]);

  const dateLabels = useMemo(() => {
    const todayKey = dk(today);

    return keyDates
      .filter((d) => dk(d) !== todayKey)
      .map((d) => ({
        key: dk(d),
        day: d.getDate(),
        pct: toPct(d),
        important: importantDateKeys.has(dk(d)),
      }));
  }, [keyDates, today, importantDateKeys]);

  useEffect(() => {
    if (!dragState) return;

    const onMouseMove = (event: MouseEvent) => {
      const dx = event.clientX - dragState.startX;
      const nextDelta = Math.round(dx / dayWidthPx);
      if (nextDelta !== dragState.daysDelta) {
        setDragState((prev) => (prev ? { ...prev, daysDelta: nextDelta } : prev));
      }
    };

    const onMouseUp = () => {
      const finalDrag = dragState;
      setDragState(null);

      if (finalDrag.daysDelta !== 0 && onBarDateShift) {
        const shiftedStart = dk(addDays(toDate(finalDrag.oldStart), finalDrag.daysDelta));
        const shiftedEnd = dk(addDays(toDate(finalDrag.oldEnd), finalDrag.daysDelta));
        onBarDateShift(
          finalDrag.milestoneId,
          finalDrag.oldStart,
          finalDrag.oldEnd,
          shiftedStart,
          shiftedEnd,
          finalDrag.daysDelta
        );
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragState, dayWidthPx, onBarDateShift]);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 2px 20px rgba(0,0,0,.08)',
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        color: '#1a2133',
      }}
    >
      {tt.visible && (
        <div
          style={{
            position: 'fixed',
            left: tt.x,
            top: tt.y,
            background: '#1a2133',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: 7,
            fontSize: 11.5,
            lineHeight: 1.6,
            maxWidth: 260,
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 6px 24px rgba(0,0,0,.28)',
          }}
        >
          {tt.title && <strong style={{ display: 'block', marginBottom: 3, fontSize: 12, fontWeight: 600 }}>{tt.title}</strong>}
          {tt.body}
        </div>
      )}

      <div style={{ display: 'flex', overflowX: 'auto' }}>
        <div
          style={{
            width: sidebarW,
            flexShrink: 0,
            borderRight: '1.5px solid rgba(0,0,0,.08)',
            position: 'sticky',
            left: 0,
            zIndex: 20,
            background: '#fff',
          }}
        >
          <div
            style={{
              height: HEADER_H,
              borderBottom: '1px solid rgba(0,0,0,.07)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '0 12px 10px',
              background: '#fafbfc',
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'rgba(100,115,140,.45)',
                letterSpacing: '.07em',
                textTransform: 'uppercase',
              }}
            >
              Milestone
            </span>
          </div>

          {viewMilestones.map((m, i) => (
            <div
              key={String(m.id)}
              style={{
                height: rowH,
                display: 'grid',
                gridTemplateColumns: `24px minmax(0,1fr) ${TEAM_W}px`,
                alignItems: 'center',
                columnGap: 8,
                padding: '0 10px',
                borderBottom: '.5px solid rgba(0,0,0,.055)',
                transition: 'background .12s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(55,138,221,.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              onClick={() => {
                setActiveRowId(String(m.id));
                const src = milestones.find((x) => x.id === String(m.id));
                if (src) onMilestoneClick?.(src);
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#2d3a5a',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 12.5,
                  color: '#1a2133',
                }}
                title={m.title}
              >
                {editableFields && activeRowId === String(m.id) ? (
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <input
                      value={buildInlineRow(m).title}
                      onChange={(e) => setInlineField(m, 'title', e.target.value)}
                      style={{ width: '100%', border: 'none', background: 'transparent', color: '#1a2133', fontSize: 12.5, padding: 0, outline: 'none' }}
                    />
                  </div>
                ) : (
                  m.title
                )}
                {(m.note || m.delayReason) && (
                  <InfoIcon
                    title={m.delayReason ? '⚠ Delay' : m.title}
                    body={m.delayReason || m.note || ''}
                    onShow={setTt}
                    onHide={hideTt}
                  />
                )}
              </div>

              {(editableFields || m.team) && (
                <div
                  style={{
                    width: TEAM_W,
                    flexShrink: 0,
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: 3,
                    whiteSpace: 'nowrap',
                    background: m.teamColor || '#6b7280',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    opacity: m.team || (editableFields && activeRowId === String(m.id)) ? 1 : 0,
                    justifySelf: 'stretch',
                  }}
                >
                  {editableFields && activeRowId === String(m.id) ? (
                    <input
                      value={buildInlineRow(m).teamName}
                      onChange={(e) => setInlineField(m, 'teamName', e.target.value)}
                      style={{ border: 'none', background: 'transparent', color: '#fff', width: '100%', fontSize: 10, minWidth: 0, outline: 'none' }}
                    />
                  ) : (
                    m.team || ''
                  )}
                </div>
              )}
            </div>
          ))}

          {editableFields && activeMilestone && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 8,
                padding: '8px 10px',
                borderTop: '1px solid rgba(0,0,0,.07)',
                background: '#f8fafc',
              }}
            >
              <button
                onClick={() => saveInlineEdit(activeMilestone)}
                style={{ border: 'none', background: '#2563eb', color: '#fff', borderRadius: 4, fontSize: 11, padding: '6px 10px', cursor: 'pointer' }}
              >
                Save
              </button>
              <button
                onClick={() => discardInlineEdit(String(activeMilestone.id))}
                style={{ border: '1px solid #d0d7de', background: '#fff', color: '#374151', borderRadius: 4, fontSize: 11, padding: '6px 10px', cursor: 'pointer' }}
              >
                Discard
              </button>
            </div>
          )}
        </div>

        <div ref={chartColRef} style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <div style={{ height: HEADER_H, borderBottom: '1px solid rgba(0,0,0,.07)', background: '#fafbfc', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 28, borderBottom: '1px solid rgba(0,0,0,.08)', overflow: 'hidden' }}>
              {monthBands.map((band, i) => (
                <div
                  key={band.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: `${band.left}%`,
                    width: `${band.width}%`,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'rgba(107,122,153,.72)',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    borderLeft: i === 0 ? 'none' : '1px solid rgba(180,165,80,.2)',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {(band.width / 100) * chartW > 28 ? band.label : ''}
                </div>
              ))}
            </div>

            <div style={{ position: 'absolute', top: 28, bottom: 0, left: 0, right: 0, overflow: 'visible' }}>
              <div
                style={{
                  position: 'absolute',
                  left: `${todayPct}%`,
                  bottom: 6,
                  transform: 'translateX(-50%)',
                  zIndex: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: '#e53e3e',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                  }}
                >
                  Today
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    background: '#e53e3e',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '1px 6px',
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  {today.getDate()}
                </span>
              </div>

              {dateLabels.map((l) => {
                return (
                  <div
                    key={l.key}
                    style={{
                      position: 'absolute',
                      left: `${l.pct}%`,
                      bottom: 6,
                      transform: 'translateX(-50%)',
                      textAlign: 'center',
                      zIndex: 3,
                      minWidth: 16,
                      lineHeight: 1,
                    }}
                  >
                    <span style={{ fontSize: 10.5, fontWeight: l.important ? 700 : 500, color: l.important ? '#285fa6' : '#6b7a99' }}>{l.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ position: 'relative', overflow: 'visible' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'visible' }}>
              {keyDates.map((date, i) => {
                if (dk(date) === dk(today)) return null;
                const pct = toPct(date);
                return (
                  <div
                    key={`gl-${i}`}
                    style={{
                      position: 'absolute',
                      left: `${pct}%`,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      borderLeft: '1px dashed rgba(140,120,60,.22)',
                      zIndex: 0,
                    }}
                  />
                );
              })}
            </div>

            <div
              style={{
                position: 'absolute',
                left: `${todayPct}%`,
                top: 0,
                bottom: 0,
                width: 0,
                borderLeft: '1px dashed rgba(200,40,40,.75)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />

            {viewMilestones.map((m) => {
              const color = m.teamColor || '#6b7280';
              return (
                <div
                  key={String(m.id)}
                  style={{
                    height: rowH,
                    position: 'relative',
                    borderBottom: '.5px solid rgba(0,0,0,.055)',
                    zIndex: 2,
                    transition: 'background .12s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(55,138,221,.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                  onClick={() => setActiveRowId(String(m.id))}
                >
                  {(m.segments || []).map((seg, si) => {
                    const sDate = toDate(seg.start);
                    const eDate = seg.end ? toDate(seg.end) : sDate;
                    const isSingleDay = dk(sDate) === dk(eDate);
                    const segDragDelta =
                      dragState && dragState.milestoneId === String(m.id)
                        ? dragState.daysDelta
                        : 0;
                    const renderStart = addDays(sDate, segDragDelta);
                    const renderEnd = addDays(eDate, segDragDelta);
                    const x = toPct(renderStart);
                    const w = toWPct(renderStart, renderEnd);
                    const top = (rowH - BAR_H) / 2;
                    const note = seg.note || '';
                    const noteTitle = seg.type === 'delay' ? '⚠ Delay Reason' : m.title;

                    if (seg.type === 'delay') {
                      const prev = m.segments[si - 1];
                      return (
                        <div
                          key={si}
                          style={{
                            position: 'absolute',
                            left: `${x}%`,
                            width: `${w}%`,
                            top,
                            height: BAR_H,
                            borderRadius: prev ? '0 4px 4px 0' : 4,
                            background: '#e53e3e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 3,
                          }}
                        >
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{seg.label || ''}</span>
                          {note && (
                            <span style={{ position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)', zIndex: 6 }}>
                              <InfoIcon title={noteTitle} body={note} onShow={setTt} onHide={hideTt} />
                            </span>
                          )}
                        </div>
                      );
                    }

                    if (seg.type === 'milestone' || (seg.type === 'bar' && isSingleDay)) {
                      const status =
                        seg.milestoneStatus ||
                        (seg.done ? 'done' : sDate < today ? 'overdue' : sDate.getTime() === today.getTime() ? 'inprogress' : 'upcoming');

                      return (
                        <div
                          key={si}
                          style={{
                            position: 'absolute',
                            left: `${x}%`,
                            top: '50%',
                            transform: 'translate(-50%,-50%)',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            zIndex: 5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'default',
                            ...Object.fromEntries(
                              CIRCLE_STYLE[status as MilestoneStatus]
                                .split(';')
                                .filter(Boolean)
                                .map((rule) => {
                                  const [k, v] = rule.split(':');
                                  return [k.trim() as string, v.trim() as string];
                                })
                            ),
                          }}
                          onMouseEnter={
                            note
                              ? (e) => {
                                  const r = e.currentTarget.getBoundingClientRect();
                                  setTt({ visible: true, x: r.right + 8, y: r.top - 4, title: m.title, body: note });
                                }
                              : undefined
                          }
                          onMouseLeave={note ? hideTt : undefined}
                        >
                          {CIRCLE_ICON[status as MilestoneStatus]}
                        </div>
                      );
                    }

                    if (seg.type === 'pin') {
                      return (
                        <div
                          key={si}
                          style={{
                            position: 'absolute',
                            left: `${x}%`,
                            top: '50%',
                            transform: 'translate(-50%,-62%)',
                            fontSize: 20,
                            lineHeight: 1,
                            zIndex: 5,
                            cursor: editable ? 'grab' : 'default',
                          }}
                          onMouseDown={
                            editable
                              ? (e) => {
                                  e.preventDefault();
                                  setDragState({
                                    milestoneId: String(m.id),
                                    startX: e.clientX,
                                    oldStart: dk(sDate),
                                    oldEnd: dk(sDate),
                                    daysDelta: 0,
                                  });
                                }
                              : undefined
                          }
                          onMouseEnter={
                            note
                              ? (e) => {
                                  const r = e.currentTarget.getBoundingClientRect();
                                  setTt({ visible: true, x: r.right + 8, y: r.top - 4, title: m.title, body: note });
                                }
                              : undefined
                          }
                          onMouseLeave={note ? hideTt : undefined}
                        >
                          📍
                        </div>
                      );
                    }

                    const next = m.segments[si + 1];
                    const hasDelay = next?.type === 'delay';
                    const progress = seg.progress ?? 0;

                    return (
                      <div
                        key={si}
                        style={{
                          position: 'absolute',
                          left: `${x}%`,
                          width: `${w}%`,
                          top,
                          height: BAR_H,
                          borderRadius: hasDelay ? '4px 0 0 4px' : 4,
                          background: hexA(color, 0.2),
                          overflow: 'visible',
                          zIndex: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: editable ? 'grab' : 'default',
                        }}
                        onMouseDown={
                          editable
                            ? (e) => {
                                e.preventDefault();
                                setDragState({
                                  milestoneId: String(m.id),
                                  startX: e.clientX,
                                  oldStart: dk(sDate),
                                  oldEnd: dk(eDate),
                                  daysDelta: 0,
                                });
                              }
                            : undefined
                        }
                      >
                        {progress > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: `${progress * 100}%`,
                              background: color,
                              borderRadius: progress >= 1 ? (hasDelay ? '4px 0 0 4px' : 4) : '4px 0 0 4px',
                            }}
                          />
                        )}
                        <span
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#fff',
                            textShadow: '0 1px 2px rgba(0,0,0,.28)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {seg.label || ''}
                        </span>
                        {note && !hasDelay && (
                          <span style={{ position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)', zIndex: 6 }}>
                            <InfoIcon title={m.title} body={note} onShow={setTt} onHide={hideTt} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: '10px 16px',
          borderTop: '.5px solid rgba(0,0,0,.07)',
          flexWrap: 'wrap',
          background: '#fafbfc',
          alignItems: 'center',
          fontSize: 11,
          color: '#6b7a99',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ display: 'flex', borderRadius: 3, overflow: 'hidden', height: 10 }}>
            <div style={{ width: 14, background: 'rgba(100,150,200,.2)' }} />
            <div style={{ width: 8, background: '#3d7cc9' }} />
          </div>
          Bar progress
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ display: 'flex', borderRadius: 3, overflow: 'hidden', height: 10 }}>
            <div style={{ width: 12, background: '#3d7cc9' }} />
            <div style={{ width: 10, background: '#e53e3e' }} />
          </div>
          Delay (continuous)
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#27ae60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff' }}>✓</div>
          Completed
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#e67e22' }} />
          In Progress (today)
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#b0bec5' }} />
          Upcoming
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#e53e3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700 }}>!</div>
          Overdue / not done
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#c0392b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700 }}>✕</div>
          Blocked
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 14 }}>📍</span>
          Go Live
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.93)',
              border: '1px solid rgba(0,0,0,.18)',
              color: '#555',
              fontSize: 9,
              fontWeight: 700,
            }}
          >
            i
          </span>
          Hover for notes
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
