import { APP_CONFIG, getStatusColor, getStatusLabel } from '../config/constants';

export type MilestoneStatus = 'pending' | 'in-progress' | 'completed';

export interface MilestoneStatusInfo {
  status: MilestoneStatus;
  color: 'default' | 'warning' | 'success' | 'error';
  label: string;
  bgColor: string;
}

function normalizeStatus(status?: string): MilestoneStatus | undefined {
  if (!status) return undefined;
  if (status === 'completed' || status === 'in-progress' || status === 'pending') {
    return status;
  }
  return undefined;
}

// Milestone status utilities
export function getMilestoneStatus(milestone: any): MilestoneStatusInfo {
  const explicitStatus = normalizeStatus(milestone.status);
  if (explicitStatus === 'completed') {
    return {
      status: explicitStatus,
      color: 'success',
      label: 'Completed',
      bgColor: getStatusColor(APP_CONFIG.milestones.statuses.COMPLETED)
    };
  }

  if (explicitStatus === 'in-progress') {
    return {
      status: explicitStatus,
      color: 'warning',
      label: getStatusLabel(APP_CONFIG.milestones.statuses.IN_PROGRESS),
      bgColor: getStatusColor(APP_CONFIG.milestones.statuses.IN_PROGRESS)
    };
  }

  if (explicitStatus === 'pending') {
    return {
      status: explicitStatus,
      color: 'default',
      label: getStatusLabel(APP_CONFIG.milestones.statuses.PENDING),
      bgColor: getStatusColor(APP_CONFIG.milestones.statuses.PENDING)
    };
  }

  const isCompleted = !!milestone.actualEnd;
  const isInProgress = !!milestone.actualStart && !milestone.actualEnd;
  const isPending = !milestone.actualStart && !milestone.actualEnd;
  const hasDelay = (milestone.delayDays ?? 0) > 0;
  const isOnTime = isCompleted && !hasDelay;

  if (isPending) {
    return {
      status: APP_CONFIG.milestones.statuses.PENDING as MilestoneStatus,
      color: 'default',
      label: getStatusLabel(APP_CONFIG.milestones.statuses.PENDING),
      bgColor: getStatusColor(APP_CONFIG.milestones.statuses.PENDING)
    };
  } else if (isInProgress) {
    return {
      status: APP_CONFIG.milestones.statuses.IN_PROGRESS as MilestoneStatus,
      color: 'warning',
      label: getStatusLabel(APP_CONFIG.milestones.statuses.IN_PROGRESS),
      bgColor: getStatusColor(APP_CONFIG.milestones.statuses.IN_PROGRESS)
    };
  } else if (isCompleted) {
    return {
      status: APP_CONFIG.milestones.statuses.COMPLETED as MilestoneStatus,
      color: 'success',
      label: isOnTime ? 'Completed on time' : 'Completed',
      bgColor: getStatusColor(APP_CONFIG.milestones.statuses.COMPLETED)
    };
  }

  return {
    status: APP_CONFIG.milestones.statuses.PENDING as MilestoneStatus,
    color: 'default',
    label: getStatusLabel(APP_CONFIG.milestones.statuses.PENDING),
    bgColor: getStatusColor(APP_CONFIG.milestones.statuses.PENDING)
  };
}

export function getSegmentColor(milestone: any, segmentType: 'planned' | 'delay' | 'actual'): string {
  const today = new Date();
  const explicitStatus = normalizeStatus(milestone.status);
  
  if (segmentType === 'delay') {
    return APP_CONFIG.gantt.colors.delay;
  }
  
  if (segmentType === 'actual') {
    return APP_CONFIG.gantt.colors.actual;
  }
  
  if (segmentType === 'planned') {
    // For planned segments, determine color based on milestone status
    const plannedStart = new Date(milestone.plannedStart);
    const plannedEnd = new Date(milestone.plannedEnd);
    
    let statusColor = getStatusColor(APP_CONFIG.milestones.statuses.PENDING); // default: grey

    if (explicitStatus === 'completed' || milestone.actualEnd) {
      statusColor = getStatusColor(APP_CONFIG.milestones.statuses.COMPLETED); // completed: green
    } else if (explicitStatus === 'in-progress' || milestone.actualStart) {
      statusColor = getStatusColor(APP_CONFIG.milestones.statuses.IN_PROGRESS); // in progress: orange
    } else if (today >= plannedStart && today <= plannedEnd) {
      statusColor = getStatusColor(APP_CONFIG.milestones.statuses.IN_PROGRESS); // should be in progress: orange
    }
    
    return milestone.color || statusColor;
  }
  
  return APP_CONFIG.gantt.colors.planned;
}

// Shared: Build Gantt segments from raw milestone with optional filtering flags
export type GanttSegment = { type: 'planned' | 'delay' | 'actual'; start: any; end: any; color: string; label?: string };
export type GanttItem = {
  id: string;
  title: string;
  segments: GanttSegment[];
  teamName?: string;
  responsible?: string;
  color?: string;
  delayReason?: string;
  note?: string;
  subtitle?: string;
  status?: MilestoneStatus;
};

export function buildGanttItems(
  milestones: any[],
  options?: { filterStatus?: 'all' | 'completed' | 'delayed' | 'in-progress'; showCompleted?: boolean }
): GanttItem[] {
  const filterStatus = options?.filterStatus ?? 'all';
  const showCompleted = options?.showCompleted ?? true;

  return (milestones || [])
    .filter((milestone) => {
      let statusMatch = true;
      if (filterStatus === 'completed') statusMatch = !!milestone.actualEnd;
      else if (filterStatus === 'delayed') statusMatch = milestone.actualEnd && new Date(milestone.actualEnd) > new Date(milestone.plannedEnd);
      else if (filterStatus === 'in-progress') statusMatch = !milestone.actualEnd;
      const isCompleted = !!milestone.actualEnd;
      const completedMatch = showCompleted || !isCompleted;
      return statusMatch && completedMatch;
    })
    .map((milestone) => {
      const segments: GanttSegment[] = [];
      if (milestone.plannedStart && milestone.plannedEnd) {
        segments.push({
          type: 'planned',
          start: milestone.plannedStart,
          end: milestone.plannedEnd,
          color: milestone.color || getSegmentColor(milestone, 'planned'),
          label: (milestone.plannedDuration ? `${milestone.plannedDuration}d` : undefined),
        });
      }
      if (milestone.actualEnd && new Date(milestone.actualEnd) > new Date(milestone.plannedEnd)) {
        segments.push({
          type: 'delay',
          start: milestone.plannedEnd,
          end: milestone.actualEnd,
          color: getSegmentColor(milestone, 'delay'),
          label: (milestone.delayDays ? `Delay: ${milestone.delayDays}d` : undefined),
        });
      }
      if (milestone.actualStart && milestone.actualEnd) {
        segments.push({
          type: 'actual',
          start: milestone.actualStart,
          end: milestone.actualEnd,
          color: getSegmentColor(milestone, 'actual'),
        });
      }
      return {
        id: milestone.id || milestone._id,
        title: milestone.title,
        segments,
        teamName: milestone.teamName,
        responsible: milestone.responsible,
        color: milestone.color,
        delayReason: milestone.delayReason,
        note: milestone.note,
        subtitle: milestone.subtitle,
        status: normalizeStatus(milestone.status) || getMilestoneStatus(milestone).status,
      } as GanttItem;
    })
    .filter((m) => Array.isArray(m.segments) && m.segments.length > 0);
}