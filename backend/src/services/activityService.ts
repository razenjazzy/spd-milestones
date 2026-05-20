import ActivityModel, { IActivity } from "../models/Activity";
import ProjectModel from "../models/Project";
import ReleaseModel from "../models/Release";

const RELEASE_ACTIVITY_TYPES = new Set(["release", "hotfix", "security"]);

const validateActivitySemantics = async (payload: Partial<IActivity>) => {
  const scope = payload.scope || (payload.releaseId ? "release" : payload.projectId ? "project" : "standalone");

  if (scope === "standalone") {
    if (payload.projectId || payload.releaseId) {
      throw new Error("Standalone activity cannot include projectId or releaseId");
    }
    return;
  }

  if (scope === "project") {
    if (!payload.projectId) {
      throw new Error("Project-scoped activity requires projectId");
    }
    if (payload.releaseId) {
      throw new Error("Project-scoped activity cannot include releaseId");
    }
  }

  if (payload.projectId) {
    const projectExists = await ProjectModel.exists({ _id: payload.projectId as any });
    if (!projectExists) throw new Error("Referenced project does not exist");
  }

  if (scope === "release") {
    if (!payload.releaseId) {
      throw new Error("Release-scoped activity requires releaseId");
    }
    if (!RELEASE_ACTIVITY_TYPES.has(String(payload.type || "").toLowerCase())) {
      throw new Error("Release-scoped activity type must be release, hotfix, or security");
    }
  }

  if (payload.releaseId) {
    const release = await ReleaseModel.findById(payload.releaseId as any);
    if (!release) throw new Error("Referenced release does not exist");
    if (scope !== "release") {
      throw new Error("releaseId can only be used for release-scoped activity");
    }

    if (release.projectId && payload.projectId && String(release.projectId) !== String(payload.projectId)) {
      throw new Error("Release projectId does not match activity projectId");
    }
  }
};

export const createActivity = async (data: Partial<IActivity>) => {
  const payload: Partial<IActivity> = {
    status: data.status || "planned",
    environment: data.environment || "staging",
    scope: data.scope || (data.releaseId ? "release" : data.projectId ? "project" : "standalone"),
    ...data,
  };

  await validateActivitySemantics(payload);

  return ActivityModel.create(payload);
};

export const getActivities = async (params: { projectId?: string; releaseId?: string; year?: number; month?: number; activityKind?: string }) => {
  const query: Record<string, unknown> = { isDeleted: { $ne: true } };

  if (params.projectId) {
    query.projectId = params.projectId;
  }

  if (params.releaseId) {
    query.releaseId = params.releaseId;
  }

  if (params.activityKind) {
    query.type = params.activityKind;
  }

  if (Number.isInteger(params.year) && Number.isInteger(params.month) && (params.month as number) >= 1 && (params.month as number) <= 12) {
    const year = Number(params.year);
    const month = Number(params.month);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);
    query.date = { $gte: monthStart, $lt: monthEnd };
  } else if (Number.isInteger(params.year)) {
    const year = Number(params.year);
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    query.date = { $gte: yearStart, $lt: yearEnd };
  }

  return ActivityModel.find(query).sort({ date: 1, startTime: 1 });
};

export const getActivitiesByProject = async (projectId: string) => {
  return ActivityModel.find({ projectId, isDeleted: { $ne: true } }).sort({ date: 1, startTime: 1 });
};

export const getActivitiesByProjectAndMonth = async (projectId: string, year: number, month: number) => {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  return ActivityModel.find({
    projectId,
    isDeleted: { $ne: true },
    date: { $gte: monthStart, $lt: monthEnd },
  }).sort({ date: 1, startTime: 1 });
};

export const getActivitiesByMonth = async (year: number, month: number) => {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  return ActivityModel.find({
    isDeleted: { $ne: true },
    date: { $gte: monthStart, $lt: monthEnd },
  }).sort({ date: 1, startTime: 1 });
};

export const updateActivity = async (id: string, data: Partial<IActivity>) => {
  const current = await ActivityModel.findById(id);
  if (!current) return null;

  const nextStatus = data.status;
  if (nextStatus && nextStatus !== current.status) {
    current.history = current.history || [];
    current.history.push({
      changedAt: new Date(),
      oldStatus: current.status,
      newStatus: nextStatus,
      reason: (data as any).statusReason || "Status updated",
    } as any);
  }

  // Allow moving an activity cleanly across scopes.
  if (data.scope === "standalone") {
    (data as any).projectId = undefined;
    (data as any).releaseId = undefined;
  } else if (data.scope === "project") {
    (data as any).releaseId = undefined;
  } else if (data.scope === "release") {
    if (!(data as any).projectId) {
      (data as any).projectId = (current as any).projectId;
    }
  }

  const candidate: Partial<IActivity> = {
    ...(current.toObject() as any),
    ...data,
  };

  await validateActivitySemantics(candidate);

  Object.assign(current, data);
  return current.save();
};

export const deleteActivity = async (id: string) => {
  return ActivityModel.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    { new: true }
  );
};

export const getDeletedActivitiesByProject = async (projectId: string) => {
  return ActivityModel.find({ projectId, isDeleted: true }).sort({ deletedAt: -1 });
};

export const getDeletedActivitiesByScope = async (params: { projectId?: string; releaseId?: string }) => {
  const query: Record<string, unknown> = { isDeleted: true };
  if (params.projectId) query.projectId = params.projectId;
  if (params.releaseId) query.releaseId = params.releaseId;
  return ActivityModel.find(query).sort({ deletedAt: -1 });
};

export const permanentDeleteActivity = async (id: string) => {
  return ActivityModel.findByIdAndDelete(id);
};

export const restoreActivity = async (id: string) => {
  return ActivityModel.findByIdAndUpdate(
    id,
    {
      isDeleted: false,
      deletedAt: undefined,
    },
    { new: true }
  );
};

export const copyActivitiesToMonth = async (
  projectId: string | undefined,
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number
) => {
  const source = projectId
    ? await getActivitiesByProjectAndMonth(projectId, fromYear, fromMonth)
    : await getActivitiesByMonth(fromYear, fromMonth);
  const shifted = source.map((activity) => {
    const sourceDate = new Date(activity.date);
    const sourceMonthIndex = sourceDate.getMonth();
    const sourceYear = sourceDate.getFullYear();

    const monthOffset = (toYear - sourceYear) * 12 + (toMonth - 1 - sourceMonthIndex);
    const nextDate = new Date(sourceDate);
    nextDate.setMonth(nextDate.getMonth() + monthOffset);

    return {
      ...(activity.projectId ? { projectId: activity.projectId } : {}),
      title: activity.title,
      date: nextDate,
      type: activity.type,
      environment: activity.environment,
      status: activity.status || "planned",
      platform: activity.platform,
      startTime: activity.startTime,
      endTime: activity.endTime,
      duration: activity.duration,
      note: activity.note,
      color: activity.color,
      history: [],
    };
  });

  if (!shifted.length) return [];
  return ActivityModel.insertMany(shifted);
};
