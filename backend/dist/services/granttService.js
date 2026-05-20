"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeMilestoneStatus = computeMilestoneStatus;
exports.getProjectGantt = getProjectGantt;
const date_fns_1 = require("date-fns");
const Milestone_1 = __importDefault(require("../models/Milestone"));
function computeMilestoneStatus(m) {
    const today = new Date();
    const plannedStart = new Date(m.plannedStart);
    const plannedEnd = new Date(m.plannedEnd);
    const plannedDuration = (0, date_fns_1.differenceInCalendarDays)(plannedEnd, plannedStart) + 1;
    let delayDays = 0;
    if (m.actualEnd) {
        delayDays = (0, date_fns_1.differenceInCalendarDays)(new Date(m.actualEnd), plannedEnd);
    }
    else {
        if (today > plannedEnd) {
            delayDays = (0, date_fns_1.differenceInCalendarDays)(today, plannedEnd);
        }
    }
    if (delayDays < 0)
        delayDays = 0;
    let status = "Upcoming";
    if (m.actualEnd)
        status = delayDays > 0 ? "Completed (Delayed)" : "Completed";
    else if (today < plannedStart)
        status = "Upcoming";
    else
        status = delayDays > 0 ? "Delayed" : "In Progress";
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
async function getProjectGantt(projectId) {
    const milestones = await Milestone_1.default.find({ projectId, isDeleted: { $ne: true } }).sort({ plannedStart: 1 });
    const computed = milestones.map((m) => computeMilestoneStatus(m));
    const minStart = computed.reduce((acc, m) => (acc ? (m.plannedStart < acc ? m.plannedStart : acc) : m.plannedStart), null);
    const maxEnd = computed.reduce((acc, m) => (acc ? (m.plannedEnd > acc ? m.plannedEnd : acc) : m.plannedEnd), null);
    return {
        timeline: {
            start: minStart,
            end: maxEnd,
        },
        milestones: computed,
    };
}
//# sourceMappingURL=granttService.js.map