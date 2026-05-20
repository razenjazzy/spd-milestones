import { differenceInCalendarDays } from "date-fns";
import MilestoneModel, { IMilestone } from "../models/Milestone";

export type MilestoneGantt = {
  id: string;
  title: string;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  plannedDuration: number;
  delayDays: number;
  status: string;
  responsible?: string;
  teamName?: string;
  color?: string;
  iterations?: any[];
  delayReason?: string;
  isDeleted?: boolean;
};

export function computeMilestoneStatus(m: IMilestone): MilestoneGantt {
  const today = new Date();
  const plannedStart = new Date(m.plannedStart);
  const plannedEnd = new Date(m.plannedEnd);

  const plannedDuration = differenceInCalendarDays(plannedEnd, plannedStart) + 1;

  let delayDays = 0;
  if (m.actualEnd) {
    delayDays = differenceInCalendarDays(new Date(m.actualEnd), plannedEnd);
  } else {
    if (today > plannedEnd) {
      delayDays = differenceInCalendarDays(today, plannedEnd);
    }
  }
  if (delayDays < 0) delayDays = 0;

  let status = "Upcoming";
  if (m.actualEnd) status = delayDays > 0 ? "Completed (Delayed)" : "Completed";
  else if (today < plannedStart) status = "Upcoming";
  else status = delayDays > 0 ? "Delayed" : "In Progress";

  return {
    id: m._id.toString(),
    title: m.title,
    plannedStart,
    plannedEnd,
    actualStart: m.actualStart,
    actualEnd: m.actualEnd,
    plannedDuration,
    delayDays,
    status,
    responsible: m.responsible,
    teamName: m.teamName,
    color: m.color,
    iterations: m.iterations || [],
    delayReason: m.delayReason,
    isDeleted: m.isDeleted || false,
  };
}

export async function getProjectGantt(projectId: string) {
  const milestones = await MilestoneModel.find({ projectId, isDeleted: { $ne: true } }).sort({ plannedStart: 1 });
  const computed: MilestoneGantt[] = milestones.map((m: IMilestone) => computeMilestoneStatus(m));
  const minStart = computed.reduce<Date | null>((acc, m) => (acc ? (m.plannedStart < acc ? m.plannedStart : acc) : m.plannedStart), null);
  const maxEnd = computed.reduce<Date | null>((acc, m) => (acc ? (m.plannedEnd > acc ? m.plannedEnd : acc) : m.plannedEnd), null);

  return {
    timeline: {
      start: minStart,
      end: maxEnd,
    },
    milestones: computed,
  };
}
