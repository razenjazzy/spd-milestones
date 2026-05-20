import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { activityAPI, projectAPI, releaseAPI, settingsAPI } from "../api/api";
import { resolveEffectiveActivityScope, ActivityScope } from "../utils/activityScope";

type ActivityKind = "maintenance" | "security" | "hotfix" | "release";
type ActivityStatus = "planned" | "in-progress" | "completed" | "rejected" | "reopened";
type ActivityEnvironment = "staging" | "production";

type ActivityHistory = {
  changedAt: string;
  oldStatus?: ActivityStatus;
  newStatus?: ActivityStatus;
  reason?: string;
};

type Activity = {
  _id: string;
  projectId?: string;
  releaseId?: string;
  scope?: "standalone" | "project" | "release";
  title: string;
  date: string;
  type: ActivityKind;
  environment?: ActivityEnvironment;
  status?: ActivityStatus;
  startTime?: string;
  endTime?: string;
  duration?: string;
  note?: string;
  approverName?: string;
  impactedArea?: string;
  downtime?: string;
  participants?: string;
  history?: ActivityHistory[];
};

const TYPE_COLOR: Record<ActivityKind, string> = {
  release: "#0b63ce",
  maintenance: "#1f7a3b",
  hotfix: "#d61f1f",
  security: "#7a2bc1",
};

const DEFAULT_APPROVAL_TEMPLATE = `Dear {{approverName}},

{{contextParagraph}}

Seeking your kind approval for the {{activityWindow}} activity to start from {{scheduleStart}}.

Activity Title: {{activityTitle}}
Schedule: {{schedule}}
Impacted Area: {{impactedArea}}
Downtime: {{downtime}}
Participants: {{participants}}

RELEASE PACKAGE:
{{releasePackage}}

Package Name: {{packageName}}

Link: {{downloadLink}}

ACTIVITY BREAKDOWN:
{{activityBreakdown}}

ACTIVITY STEPS:

Deployment:
{{deploymentSteps}}

Testing & Rollout:
{{testingSteps}}

ROLLBACK:
{{rollbackSteps}}

{{closureNote}}`;

function replaceTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((acc, [key, value]) => {
    return acc.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  }, template);
}

const DEFAULT_CONTEXT_PARAGRAPH =
  "To address the observed issues, fix has been deployed in Staging and passed functionality and security checks. Relevant teams are aligned and informed.";

const DEFAULT_ACTIVITY_BREAKDOWN = `- Perform backend deployment - 00:10 AM - 01:00 AM
- Test live services and critical paths - 01:00 AM - 02:00 AM
- Publish/rollout updates and monitor - 02:00 AM onwards`;

const DEFAULT_DEPLOYMENT_STEPS = `1. Stop load balancer routes in partial mode.
2. Backup running artifacts and deploy new package.
3. Monitor successful startup and health checks.
4. Switch traffic and repeat for remaining nodes.
5. Confirm successful deployment.`;

const DEFAULT_TESTING_STEPS = `1. Execute post-deploy sanity checks.
2. Validate target issue resolution.
3. Validate key integrations and transaction flows.
4. Complete release rollout and monitor logs.
5. Confirm closure with stakeholders.`;

const DEFAULT_ROLLBACK_STEPS = `1. Stop rollout immediately if critical issue appears.
2. Restore previous package/artifact.
3. Re-enable routes progressively.
4. Perform service sanity and data consistency checks.`;

const DEFAULT_CLOSURE_NOTE =
  "We will inform you once the activity is successfully completed and sanity is performed.";

export default function ActivityManager() {
  const { id: projectIdParam, releaseId: releaseIdParam } = useParams();
  const [searchParams] = useSearchParams();

  const scopedProjectId = projectIdParam || searchParams.get("projectId") || undefined;
  const scopedReleaseId = releaseIdParam || searchParams.get("releaseId") || undefined;

  const today = new Date();
  const [month, setMonth] = useState<number | "all">("all");
  const [year, setYear] = useState<number>(today.getFullYear());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | ActivityScope>("all");
  const [filterType, setFilterType] = useState<"all" | ActivityKind>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | ActivityStatus>("all");
  const [filterEnvironment, setFilterEnvironment] = useState<"all" | ActivityEnvironment>("all");
  const [filterProjectId, setFilterProjectId] = useState<string>(scopedProjectId || "all");
  const [filterReleaseId, setFilterReleaseId] = useState<string>(scopedReleaseId || "all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; activity?: Activity; text: string }>({ open: false, text: "" });

  const [form, setForm] = useState({
    title: "",
    date: format(today, "yyyy-MM-dd"),
    scope: (scopedReleaseId ? "release" : scopedProjectId ? "project" : "standalone") as ActivityScope,
    projectId: scopedProjectId || "",
    releaseId: scopedReleaseId || "",
    type: "maintenance" as ActivityKind,
    environment: "staging" as ActivityEnvironment,
    status: "planned" as ActivityStatus,
    statusReason: "",
    startTime: "",
    endTime: "",
    duration: "",
    note: "",
    approverName: "",
    impactedArea: "no impact on running services",
    downtime: "No downtime involved",
    participants: "",
  });

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const isAdmin = user?.role === "admin";

  const loadLookups = async () => {
    try {
      const [projectRes, releaseRes, settingsRes] = await Promise.all([
        projectAPI.getAll(),
        releaseAPI.list({ projectId: filterProjectId !== "all" ? filterProjectId : undefined }),
        settingsAPI.get(),
      ]);
      setProjects(Array.isArray(projectRes.data) ? projectRes.data : []);
      setReleases(Array.isArray(releaseRes.data) ? releaseRes.data : []);
      setSettings(settingsRes.data || null);
    } catch {
      // non-blocking lookup load
    }
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      const effectiveProjectId = scopedProjectId || (filterProjectId !== "all" ? filterProjectId : undefined);
      const effectiveReleaseId = scopedReleaseId || (filterReleaseId !== "all" ? filterReleaseId : undefined);

      const activitiesRes = await activityAPI.list({
        projectId: effectiveProjectId,
        releaseId: effectiveReleaseId,
        activityKind: filterType !== "all" ? filterType : undefined,
        year,
        month: month === "all" ? undefined : month,
      });

      setActivities(Array.isArray(activitiesRes.data) ? activitiesRes.data : []);
    } catch {
      setSnackbar({ open: true, message: "Failed to load activities", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, [filterProjectId]);

  useEffect(() => {
    loadActivities();
  }, [month, year, scopedProjectId, scopedReleaseId, filterProjectId, filterReleaseId, filterType]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: "",
      date: format(new Date(year, month === "all" ? 0 : month - 1, 1), "yyyy-MM-dd"),
      scope: (scopedReleaseId ? "release" : scopedProjectId ? "project" : "standalone") as ActivityScope,
      projectId: scopedProjectId || "",
      releaseId: scopedReleaseId || "",
      type: "maintenance",
      environment: "staging",
      status: "planned",
      statusReason: "",
      startTime: "",
      endTime: "",
      duration: "",
      note: "",
      approverName: "",
      impactedArea: "no impact on running services",
      downtime: "No downtime involved",
      participants: "",
    });
  };

  const submitActivity = async () => {
    if (!form.title.trim() || !form.date) {
      setSnackbar({ open: true, message: "Title and date are required", severity: "error" });
      return;
    }

    const { effectiveProjectId, effectiveReleaseId } = resolveEffectiveActivityScope({
      editingId,
      scopedProjectId,
      scopedReleaseId,
      formScope: form.scope,
      projectId: form.projectId,
      releaseId: form.releaseId,
    });

    const payload = {
      ...form,
      projectId: effectiveProjectId,
      releaseId: effectiveReleaseId,
      scope: form.scope,
    };

    try {
      setLoading(true);
      if (editingId) {
        if (effectiveReleaseId) {
          await activityAPI.updateByRelease(effectiveReleaseId, editingId, payload);
        } else if (effectiveProjectId) {
          await activityAPI.update(effectiveProjectId, editingId, payload);
        } else {
          await activityAPI.updateStandalone(editingId, payload);
        }
        setSnackbar({ open: true, message: "Activity updated", severity: "success" });
      } else {
        if (effectiveReleaseId) {
          await activityAPI.createByRelease(effectiveReleaseId, payload);
        } else if (effectiveProjectId) {
          await activityAPI.create(effectiveProjectId, payload);
        } else {
          await activityAPI.createStandalone(payload);
        }
        setSnackbar({ open: true, message: "Activity added", severity: "success" });
      }
      resetForm();
      await loadActivities();
    } catch {
      setSnackbar({ open: true, message: "Failed to save activity", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const editActivity = (item: Activity) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      date: format(new Date(item.date), "yyyy-MM-dd"),
      scope: (item.scope || (item.releaseId ? "release" : item.projectId ? "project" : "standalone")) as ActivityScope,
      projectId: item.projectId || "",
      releaseId: item.releaseId || "",
      type: item.type,
      environment: item.environment || "staging",
      status: item.status || "planned",
      statusReason: "",
      startTime: item.startTime || "",
      endTime: item.endTime || "",
      duration: item.duration || "",
      note: item.note || "",
      approverName: item.approverName || "",
      impactedArea: item.impactedArea || "no impact on running services",
      downtime: item.downtime || "No downtime involved",
      participants: item.participants || "",
    });
  };

  const removeActivity = async (activityId: string) => {
    if (!isAdmin) {
      setSnackbar({ open: true, message: "Only admin can delete activities", severity: "error" });
      return;
    }

    const effectiveProjectId = scopedProjectId || (filterProjectId !== "all" ? filterProjectId : undefined);
    const effectiveReleaseId = scopedReleaseId || (filterReleaseId !== "all" ? filterReleaseId : undefined);

    try {
      setLoading(true);
      if (effectiveReleaseId) {
        await activityAPI.deleteByRelease(effectiveReleaseId, activityId);
      } else if (effectiveProjectId) {
        await activityAPI.delete(effectiveProjectId, activityId);
      } else {
        await activityAPI.deleteStandalone(activityId);
      }
      await loadActivities();
      setSnackbar({ open: true, message: "Activity deleted", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to delete activity", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activities.filter((a) => {
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        (a.note || "").toLowerCase().includes(q) ||
        format(new Date(a.date), "yyyy-MM-dd").includes(q);
      const matchScope = scopeFilter === "all" || (a.scope || (a.releaseId ? "release" : a.projectId ? "project" : "standalone")) === scopeFilter;
      const matchStatus = filterStatus === "all" || (a.status || "planned") === filterStatus;
      const matchEnvironment = filterEnvironment === "all" || (a.environment || "staging") === filterEnvironment;
      return matchSearch && matchScope && matchStatus && matchEnvironment;
    });
  }, [activities, search, scopeFilter, filterStatus, filterEnvironment]);

  const openApprovalTemplate = (activity: Activity) => {
    const relatedRelease = releases.find((r) => r._id === activity.releaseId);
    const template = settings?.approvalEmailTemplate || DEFAULT_APPROVAL_TEMPLATE;
    const generated = replaceTemplate(template, {
      approverName: activity.approverName || "Name of Approver",
      contextParagraph: DEFAULT_CONTEXT_PARAGRAPH,
      activityWindow: "LIVE deployment & App rollout",
      scheduleStart: `${activity.startTime || "00:10"} hrs, ${format(new Date(activity.date), "dd MMM yyyy, EEEE")}`,
      activityTitle: activity.title,
      schedule: `${activity.startTime || "00:10"} - ${activity.endTime || "03:00"} hrs, ${format(new Date(activity.date), "dd MMM yyyy, EEEE")}`,
      impactedArea: activity.impactedArea || "no impact on running services",
      downtime: activity.downtime || "No downtime involved",
      participants: activity.participants || "Name of participants",
      releasePackage: relatedRelease?.releasePackage || "Release package",
      packageName: relatedRelease?.releasePackage || activity.title,
      downloadLink: relatedRelease?.downloadLink || "",
      activityBreakdown: DEFAULT_ACTIVITY_BREAKDOWN,
      deploymentSteps: DEFAULT_DEPLOYMENT_STEPS,
      testingSteps: DEFAULT_TESTING_STEPS,
      rollbackSteps: DEFAULT_ROLLBACK_STEPS,
      closureNote: DEFAULT_CLOSURE_NOTE,
    });

    setApprovalDialog({ open: true, activity, text: generated });
  };

  const copyApproval = async () => {
    try {
      await navigator.clipboard.writeText(approvalDialog.text);
      setSnackbar({ open: true, message: "Approval email copied", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to copy template", severity: "error" });
    }
  };

  const backTarget = scopedReleaseId
    ? "/releases"
    : scopedProjectId
      ? `/project/${scopedProjectId}`
      : "/";

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton component={Link} to={backTarget}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Activities
            </Typography>
            <Typography color="text.secondary">
              {scopedReleaseId
                ? "Release-scoped activity planner"
                : scopedProjectId
                  ? "Project-scoped activity planner"
                  : "Global activity planner with scope filters"}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                {editingId ? "Edit Activity" : "Add Activity"}
              </Typography>
              <Stack spacing={1.25}>
                <TextField label="Activity Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <TextField type="date" label="Date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} />
                <Select
                  data-testid="activity-form-scope"
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value as ActivityScope, projectId: e.target.value === "project" ? form.projectId : "", releaseId: e.target.value === "release" ? form.releaseId : "" })}
                >
                  <MenuItem value="standalone">Standalone</MenuItem>
                  <MenuItem value="project">Project</MenuItem>
                  <MenuItem value="release">Release</MenuItem>
                </Select>
                {form.scope === "project" && (
                  <Select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: String(e.target.value) })}>
                    <MenuItem value="">Select Project</MenuItem>
                    {projects.map((p) => (
                      <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                    ))}
                  </Select>
                )}
                {form.scope === "release" && (
                  <Select value={form.releaseId} onChange={(e) => setForm({ ...form, releaseId: String(e.target.value) })}>
                    <MenuItem value="">Select Release</MenuItem>
                    {releases.map((r) => (
                      <MenuItem key={r._id} value={r._id}>{r.releasePackage}</MenuItem>
                    ))}
                  </Select>
                )}
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ActivityKind })}>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="hotfix">Hotfix</MenuItem>
                </Select>
                <Select value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value as ActivityEnvironment })}>
                  <MenuItem value="staging">Staging</MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                </Select>
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ActivityStatus })}>
                  <MenuItem value="planned">Planned</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="reopened">Reopened</MenuItem>
                </Select>
                <TextField label="Status reason" value={form.statusReason} onChange={(e) => setForm({ ...form, statusReason: e.target.value })} />
                <TextField type="time" label="Start Time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} InputLabelProps={{ shrink: true }} />
                <TextField type="time" label="End Time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} InputLabelProps={{ shrink: true }} />
                <TextField label="Duration (HH:MM)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                <TextField label="Approver Name" value={form.approverName} onChange={(e) => setForm({ ...form, approverName: e.target.value })} />
                <TextField label="Participants" value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} />
                <TextField label="Impacted Area" value={form.impactedArea} onChange={(e) => setForm({ ...form, impactedArea: e.target.value })} />
                <TextField label="Downtime" value={form.downtime} onChange={(e) => setForm({ ...form, downtime: e.target.value })} />
                <TextField label="Note" value={form.note} multiline rows={2} onChange={(e) => setForm({ ...form, note: e.target.value })} />

                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={submitActivity} disabled={loading}>
                    {editingId ? "Update" : "Add"}
                  </Button>
                  {editingId && (
                    <Button variant="outlined" onClick={resetForm} disabled={loading}>
                      Cancel
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: { xs: "wrap", md: "nowrap" }, gap: 0.75, overflowX: { xs: "visible", md: "auto" }, pb: 0.5 }}>
                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{
                    flexWrap: { xs: "wrap", md: "nowrap" },
                    rowGap: 0.75,
                    minWidth: { xs: "100%", md: "max-content" },
                    "& .activity-filter-control": {
                      mb: 0.75,
                      flex: "0 0 auto",
                      "& .MuiOutlinedInput-root": {
                        minHeight: 36,
                        fontSize: 14,
                      },
                      "& .MuiInputBase-input": {
                        py: "6px",
                        px: "8px",
                        fontSize: 14,
                      },
                      "& .MuiSelect-select": {
                        py: "6px !important",
                        pl: "8px !important",
                        pr: "24px !important",
                        fontSize: 14,
                        lineHeight: 1.4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      },
                    },
                  }}
                >
                  <TextField
                    className="activity-filter-control"
                    size="small"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ minWidth: { xs: 120, md: 140 }, width: { xs: 128, md: 152 } }}
                  />

                  <Select
                    className="activity-filter-control"
                    value={scopeFilter}
                    onChange={(e) => setScopeFilter(e.target.value as "all" | ActivityScope)}
                    size="small"
                    sx={{ minWidth: { xs: 116, md: 130 } }}
                  >
                    <MenuItem value="all">All Activity</MenuItem>
                    <MenuItem value="standalone">Standalone</MenuItem>
                    <MenuItem value="project">All Project</MenuItem>
                    <MenuItem value="release">All Release</MenuItem>
                  </Select>

                  <Select
                    className="activity-filter-control"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    size="small"
                    sx={{ minWidth: { xs: 110, md: 124 } }}
                  >
                    <MenuItem value="all">All Activities</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                    <MenuItem value="security">Security</MenuItem>
                    <MenuItem value="hotfix">Hotfix</MenuItem>
                  </Select>

                  <Select className="activity-filter-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} size="small" sx={{ minWidth: { xs: 114, md: 126 } }}>
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="planned">Planned</MenuItem>
                    <MenuItem value="in-progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="reopened">Reopened</MenuItem>
                  </Select>

                  <Select className="activity-filter-control" value={filterEnvironment} onChange={(e) => setFilterEnvironment(e.target.value as any)} size="small" sx={{ minWidth: { xs: 108, md: 118 } }}>
                    <MenuItem value="all">All Env</MenuItem>
                    <MenuItem value="staging">Staging</MenuItem>
                    <MenuItem value="production">Production</MenuItem>
                  </Select>

                  <Select className="activity-filter-control" value={month} onChange={(e) => setMonth(e.target.value === "all" ? "all" : Number(e.target.value))} size="small" sx={{ minWidth: { xs: 108, md: 118 } }}>
                    <MenuItem value="all">All Month</MenuItem>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <MenuItem key={m} value={m}>{format(new Date(2026, m - 1, 1), "MMMM")}</MenuItem>
                    ))}
                  </Select>

                  <Select className="activity-filter-control" value={year} onChange={(e) => setYear(Number(e.target.value))} size="small" sx={{ minWidth: { xs: 92, md: 100 } }}>
                    {Array.from({ length: 8 }, (_, i) => 2023 + i).map((y) => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </Stack>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 860 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Activity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Release</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredActivities.map((a) => {
                    const project = projects.find((p) => p._id === a.projectId);
                    const release = releases.find((r) => r._id === a.releaseId);

                    return (
                      <TableRow key={a._id} hover>
                        <TableCell>{format(new Date(a.date), "yyyy-MM-dd")}</TableCell>
                        <TableCell>{a.title}</TableCell>
                        <TableCell>
                          <Box sx={{ color: TYPE_COLOR[a.type], fontWeight: 700, textTransform: "capitalize" }}>{a.type}</Box>
                        </TableCell>
                        <TableCell sx={{ textTransform: "capitalize" }}>{a.status || "planned"}</TableCell>
                        <TableCell>{a.startTime || "-"} {a.endTime ? `- ${a.endTime}` : ""}</TableCell>
                        <TableCell>{project?.name || "-"}</TableCell>
                        <TableCell>{release?.releasePackage || "-"}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" aria-label="Edit activity" onClick={() => editActivity(a)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" aria-label="Open approval template" onClick={() => openApprovalTemplate(a)}>
                            <EmailIcon fontSize="small" />
                          </IconButton>
                          {isAdmin && (
                            <IconButton size="small" onClick={() => removeActivity(a._id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!filteredActivities.length && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Typography sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
                          No activities found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={approvalDialog.open} onClose={() => setApprovalDialog({ open: false, text: "" })} fullWidth maxWidth="md">
        <DialogTitle>Approval Email Template</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            fullWidth
            minRows={16}
            value={approvalDialog.text}
            onChange={(e) => setApprovalDialog((prev) => ({ ...prev, text: e.target.value }))}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog({ open: false, text: "" })}>Close</Button>
          <Button startIcon={<ContentCopyIcon />} onClick={copyApproval} variant="contained">Copy</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
