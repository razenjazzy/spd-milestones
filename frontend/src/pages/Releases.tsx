import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
} from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon, Password as PasswordIcon, EventNote as EventNoteIcon, ContentCopy as ContentCopyIcon } from "@mui/icons-material";
import { format } from "date-fns";
import { dashboardAPI, projectAPI, releaseAPI, settingsAPI } from "../api/api";
import { applyReleaseTemplate, DEFAULT_RELEASE_MESSAGE_TEMPLATE } from "../utils/releaseTemplate";

const DEFAULT_STATUSES = ["production", "staging", "overwritten", "halted", "dc2"];
const DEFAULT_TYPES = [
  "financial-glitch-hotfix",
  "new-feature-changes",
  "security-fix",
  "application-glitch",
  "system-enhancement",
  "mobile-app-glitch",
];

export default function Releases() {
  const [searchParams] = useSearchParams();
  const projectIdFromQuery = searchParams.get("projectId") || undefined;
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [settings, setSettings] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState({ standalone: 0, merged: 0, releaseForProductionUpcoming: 0 });
  const [revealDialog, setRevealDialog] = useState<{ open: boolean; id: string; link?: string; password?: string }>({ open: false, id: "" });
  const [artifactDialog, setArtifactDialog] = useState<{ open: boolean; id: string; artifact?: "downloadLink" | "dbScriptLink" | "jarAppLink"; value?: string }>({ open: false, id: "" });
  const [shareDialog, setShareDialog] = useState<{ open: boolean; id: string; code?: string; expiresAt?: string }>({ open: false, id: "" });
  const [actionDialog, setActionDialog] = useState<{ open: boolean; id: string; action: "rejected" | "reopened" | "redeployed"; reason: string }>({ open: false, id: "", action: "rejected", reason: "" });
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; id: string; otp: string }>({ open: false, id: "", otp: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [adminPassword, setAdminPassword] = useState("");
  const [redeemCode, setRedeemCode] = useState("");

  const [form, setForm] = useState({
    projectId: "",
    releasePackage: "",
    status: "staging",
    type: "application-glitch",
    received: "",
    staging: "",
    live: "",
    downloadLink: "",
    downloadPassword: "",
    dbScriptLink: "",
    jarAppLink: "",
    components: "",
    dbScripts: "",
    comments: "",
    pipelineStage: "standalone",
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

  const statusOptions = settings?.statusOptions?.length ? settings.statusOptions : DEFAULT_STATUSES;
  const typeOptions = settings?.typeOptions?.length ? settings.typeOptions : DEFAULT_TYPES;
  const stageGroups = useMemo(() => {
    const standalone = releases.filter((r) => (r.pipelineStage || "standalone") === "standalone");
    const merged = releases.filter((r) => (r.pipelineStage || "standalone") === "merged");
    const upcoming = releases.filter((r) => (r.pipelineStage || "standalone") === "release-for-production-upcoming");
    return { standalone, merged, upcoming };
  }, [releases]);

  const load = async () => {
    try {
      setLoading(true);
      const [releaseRes, settingsRes, pipelineRes, projectRes] = await Promise.all([
        releaseAPI.list(projectIdFromQuery ? { projectId: projectIdFromQuery } : undefined),
        settingsAPI.get(),
        dashboardAPI.pipeline(),
        projectAPI.getAll(),
      ]);
      setReleases(Array.isArray(releaseRes.data) ? releaseRes.data : []);
      setSettings(settingsRes.data || null);
      setPipeline(pipelineRes.data || { standalone: 0, merged: 0, releaseForProductionUpcoming: 0 });
      setProjects(Array.isArray(projectRes.data) ? projectRes.data : []);
    } catch {
      setSnackbar({ open: true, message: "Failed to load releases", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectIdFromQuery]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      projectId: "",
      releasePackage: "",
      status: "staging",
      type: "application-glitch",
      received: "",
      staging: "",
      live: "",
      downloadLink: "",
      downloadPassword: "",
      dbScriptLink: "",
      jarAppLink: "",
      components: "",
      dbScripts: "",
      comments: "",
      pipelineStage: "standalone",
    });
  };

  const submit = async () => {
    if (!form.releasePackage.trim()) {
      setSnackbar({ open: true, message: "Release/Package is required", severity: "error" });
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await releaseAPI.update(editingId, form);
      } else {
        await releaseAPI.create(form);
      }
      await load();
      resetForm();
      setSnackbar({ open: true, message: editingId ? "Release updated" : "Release created", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to save release", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const edit = (row: any) => {
    setEditingId(row._id);
    setForm({
      projectId: row.projectId || "",
      releasePackage: row.releasePackage || "",
      status: row.status || "staging",
      type: row.type || "application-glitch",
      received: row.received ? format(new Date(row.received), "yyyy-MM-dd") : "",
      staging: row.staging ? format(new Date(row.staging), "yyyy-MM-dd") : "",
      live: row.live ? format(new Date(row.live), "yyyy-MM-dd") : "",
      downloadLink: row.downloadLink || "",
      downloadPassword: row.downloadPassword || "",
      dbScriptLink: row.dbScriptLink || "",
      jarAppLink: row.jarAppLink || "",
      components: row.components || "",
      dbScripts: row.dbScripts || "",
      comments: row.comments || "",
      pipelineStage: row.pipelineStage || "standalone",
    });
  };

  const remove = async (id: string) => {
    try {
      await releaseAPI.delete(id);
      await load();
      setSnackbar({ open: true, message: "Release deleted", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to delete release", severity: "error" });
    }
  };

  const applyAction = async () => {
    try {
      await releaseAPI.update(actionDialog.id, { action: actionDialog.action, historyReason: actionDialog.reason });
      setActionDialog({ open: false, id: "", action: "rejected", reason: "" });
      await load();
      setSnackbar({ open: true, message: "Release action applied", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to apply release action", severity: "error" });
    }
  };

  const revealLinkAsAdmin = async () => {
    try {
      const res = await releaseAPI.adminRevalidateLink(revealDialog.id, adminPassword);
      setRevealDialog((prev) => ({ ...prev, link: res.data.downloadLink, password: res.data.downloadPassword }));
      setPasswordVisible(false);
    } catch {
      setSnackbar({ open: true, message: "Admin revalidation failed", severity: "error" });
    }
  };

  const issueShareCode = async (id: string) => {
    try {
      const res = await releaseAPI.issueOneTimeCode(id);
      setShareDialog({ open: true, id, code: res.data.code, expiresAt: res.data.expiresAt });
    } catch {
      setSnackbar({ open: true, message: "Failed to issue one-time code", severity: "error" });
    }
  };

  const copyReleaseMessage = async (row: any) => {
    const template = settings?.releaseMessageTemplate || DEFAULT_RELEASE_MESSAGE_TEMPLATE;
    const text = applyReleaseTemplate(template, {
      releasePackage: row.releasePackage || "",
      downloadLink: row.downloadLink || "",
      downloadPassword: row.downloadPassword || "",
    });

    try {
      await navigator.clipboard.writeText(text);
      setSnackbar({ open: true, message: "Release deployment text copied", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to copy release text", severity: "error" });
    }
  };

  const openArtifact = async (releaseId: string, artifact: "downloadLink" | "dbScriptLink" | "jarAppLink") => {
    if (isAdmin) {
      const row = releases.find((r) => r._id === releaseId);
      const value = row?.[artifact];
      setArtifactDialog({ open: true, id: releaseId, artifact, value });
      return;
    }
    setRevealDialog({ open: true, id: releaseId });
    setArtifactDialog({ open: true, id: releaseId, artifact });
  };

  const revealArtifactWithPassword = async () => {
    try {
      const res = await releaseAPI.revealArtifact(artifactDialog.id, adminPassword || redeemCode, artifactDialog.artifact || "downloadLink");
      setArtifactDialog((prev) => ({ ...prev, value: res.data.value }));
      setSnackbar({ open: true, message: "Artifact revealed", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Invalid password", severity: "error" });
    }
  };

  const redeemShareCode = async (id: string) => {
    try {
      const res = await releaseAPI.redeemOneTimeCode(id, redeemCode);
      setRevealDialog({ open: true, id, link: res.data.downloadLink, password: res.data.downloadPassword });
      setPasswordVisible(false);
      setRedeemCode("");
    } catch {
      setSnackbar({ open: true, message: "Invalid or expired code", severity: "error" });
    }
  };

  const revealPasswordWithOtp = async () => {
    try {
      if (!passwordDialog.otp.trim()) {
        setSnackbar({ open: true, message: "One-time code is required", severity: "error" });
        return;
      }
      const res = await releaseAPI.redeemOneTimeCode(passwordDialog.id, passwordDialog.otp.trim());
      setRevealDialog((prev) => ({ ...prev, link: res.data.downloadLink || prev.link, password: res.data.downloadPassword || prev.password }));
      setPasswordVisible(true);
      setPasswordDialog({ open: false, id: "", otp: "" });
      setSnackbar({ open: true, message: "Password revealed", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Invalid or expired one-time code", severity: "error" });
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Release Pipeline</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Track and manage all releases</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Standalone", count: pipeline.standalone, items: stageGroups.standalone },
          { label: "Merged", count: pipeline.merged, items: stageGroups.merged },
          { label: "Upcoming Release", count: pipeline.releaseForProductionUpcoming, items: stageGroups.upcoming },
        ].map((stage) => (
          <Grid item xs={12} md={4} key={stage.label}>
            <Card sx={{ height: "100%", border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">{stage.label}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>{stage.count}</Typography>
                <Stack spacing={0.75}>
                  {stage.items.length > 0 ? stage.items.slice(0, 6).map((item) => (
                    <Box key={item._id} sx={{ px: 1.25, py: 0.9, borderRadius: 1, backgroundColor: "action.hover" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{item.releasePackage}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {item.status} · {item.type}
                      </Typography>
                    </Box>
                  )) : (
                    <Typography variant="body2" color="text.secondary">No releases in this lane.</Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>{editingId ? "Edit Release" : "Add Release"}</Typography>
              <Stack spacing={1.2}>
                <Select value={form.projectId || ""} onChange={(e) => setForm({ ...form, projectId: String(e.target.value) })}>
                  <MenuItem value="">Standalone (No Project)</MenuItem>
                  {projects.map((p) => (
                    <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                  ))}
                </Select>
                <TextField label="Release/Package" value={form.releasePackage} onChange={(e) => setForm({ ...form, releasePackage: e.target.value })} />
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: String(e.target.value) })}>
                  {statusOptions.map((s: string) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: String(e.target.value) })}>
                  {typeOptions.map((s: string) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
                <TextField type="date" label="Received" InputLabelProps={{ shrink: true }} value={form.received} onChange={(e) => setForm({ ...form, received: e.target.value })} />
                <TextField type="date" label="Staging" InputLabelProps={{ shrink: true }} value={form.staging} onChange={(e) => setForm({ ...form, staging: e.target.value })} />
                <TextField type="date" label="Live" InputLabelProps={{ shrink: true }} value={form.live} onChange={(e) => setForm({ ...form, live: e.target.value })} />
                <TextField label="Download Link" value={form.downloadLink} onChange={(e) => setForm({ ...form, downloadLink: e.target.value })} />
                <TextField type="password" label="Password" value={form.downloadPassword} onChange={(e) => setForm({ ...form, downloadPassword: e.target.value })} />
                <TextField label="DB Script Link" value={form.dbScriptLink} onChange={(e) => setForm({ ...form, dbScriptLink: e.target.value })} />
                <TextField label="JAR/App Link" value={form.jarAppLink} onChange={(e) => setForm({ ...form, jarAppLink: e.target.value })} />
                <TextField label="Components" value={form.components} onChange={(e) => setForm({ ...form, components: e.target.value })} />
                <TextField label="DB Scripts" value={form.dbScripts} onChange={(e) => setForm({ ...form, dbScripts: e.target.value })} />
                <TextField label="Comments" multiline rows={2} value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
                <Select value={form.pipelineStage} onChange={(e) => setForm({ ...form, pipelineStage: String(e.target.value) })}>
                  <MenuItem value="standalone">Standalone</MenuItem>
                  <MenuItem value="merged">Merged</MenuItem>
                  <MenuItem value="release-for-production-upcoming">Release for Production (Upcoming)</MenuItem>
                </Select>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button variant="contained" onClick={submit} disabled={loading}>{editingId ? "Update" : "Save"}</Button>
                  {editingId && <Button variant="outlined" onClick={resetForm}>Cancel</Button>}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 760, tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 220 }}>Release/Package</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Received</TableCell>
                    <TableCell>Staging</TableCell>
                    <TableCell>Live</TableCell>
                    <TableCell sx={{ width: 170 }}>Comments</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {releases.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.releasePackage}>{r.releasePackage}</TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>{r.status}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell>{r.received ? format(new Date(r.received), "d-MMM-yy") : ""}</TableCell>
                      <TableCell>{r.staging ? format(new Date(r.staging), "d-MMM-yy") : ""}</TableCell>
                      <TableCell>{r.live ? format(new Date(r.live), "d-MMM-yy") : "???"}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.comments || ""}>{r.comments || ""}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" justifyContent="flex-end">
                          {r.downloadLink && <Button size="small" onClick={() => openArtifact(r._id, "downloadLink")}>Link</Button>}
                          {r.dbScriptLink && <Button size="small" onClick={() => openArtifact(r._id, "dbScriptLink")}>DB</Button>}
                          {r.jarAppLink && <Button size="small" onClick={() => openArtifact(r._id, "jarAppLink")}>JAR</Button>}
                          <IconButton size="small" aria-label="Copy deployment text" onClick={() => copyReleaseMessage(r)} title="Copy deployment text">
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" component={Link} to={`/releases/${r._id}/activities${r.projectId ? `?projectId=${r.projectId}` : ""}`}><EventNoteIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => edit(r)}><EditIcon fontSize="small" /></IconButton>
                          {isAdmin && <IconButton size="small" onClick={() => remove(r._id)}><DeleteIcon fontSize="small" /></IconButton>}
                          {isAdmin && <IconButton size="small" onClick={() => issueShareCode(r._id)}><PasswordIcon fontSize="small" /></IconButton>}
                          {isAdmin && <Button size="small" onClick={() => setActionDialog({ open: true, id: r._id, action: "rejected", reason: "" })}>Reject</Button>}
                          {isAdmin && <Button size="small" onClick={() => setActionDialog({ open: true, id: r._id, action: "reopened", reason: "" })}>Reopen</Button>}
                          {isAdmin && <Button size="small" onClick={() => setActionDialog({ open: true, id: r._id, action: "redeployed", reason: "" })}>Redeploy</Button>}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!releases.length && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Typography sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>No releases found.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Release History</Typography>
              <Stack spacing={1}>
                {releases
                  .filter((r) => Array.isArray(r.history) && r.history.length > 0)
                  .map((r) => (
                    <Box key={`hist-${r._id}`} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.25 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.5 }}>{r.releasePackage}</Typography>
                      {(r.history || []).map((h: any, idx: number) => (
                        <Typography key={`${r._id}-${idx}`} variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                          {format(new Date(h.changedAt), "yyyy-MM-dd HH:mm")}: {h.action}
                          {h.oldStatus || h.newStatus ? ` (${h.oldStatus || "-"} -> ${h.newStatus || "-"})` : ""}
                          {h.reason ? ` - ${h.reason}` : ""}
                        </Typography>
                      ))}
                    </Box>
                  ))}
                {!releases.some((r) => Array.isArray(r.history) && r.history.length > 0) && (
                  <Typography variant="body2" color="text.secondary">No release history yet.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, id: "", action: "rejected", reason: "" })}>
        <DialogTitle>Release Action: {actionDialog.action}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason"
            value={actionDialog.reason}
            onChange={(e) => setActionDialog((prev) => ({ ...prev, reason: e.target.value }))}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, id: "", action: "rejected", reason: "" })}>Cancel</Button>
          <Button variant="contained" onClick={applyAction}>Apply</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={revealDialog.open} onClose={() => {
        setRevealDialog({ open: false, id: "" });
        setPasswordVisible(false);
      }}>
        <DialogTitle>Reveal Download Link</DialogTitle>
        <DialogContent>
          {isAdmin && !revealDialog.link && (
            <TextField
              fullWidth
              label="Admin revalidation password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              sx={{ mt: 1 }}
            />
          )}
          {!isAdmin && (
            <TextField
              fullWidth
              label="One-time share code"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              sx={{ mt: 1 }}
            />
          )}
          {revealDialog.link && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">Link: {revealDialog.link}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                <Typography variant="body2">Password: {passwordVisible ? (revealDialog.password || "") : "••••••••••"}</Typography>
                {!passwordVisible && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setPasswordDialog({ open: true, id: revealDialog.id, otp: "" })}
                  >
                    Show Password
                  </Button>
                )}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevealDialog({ open: false, id: "" })}>Close</Button>
          {isAdmin && !revealDialog.link && <Button onClick={revealLinkAsAdmin} variant="contained">Validate</Button>}
          {!isAdmin && <Button onClick={() => redeemShareCode(revealDialog.id)} variant="contained">Redeem</Button>}
        </DialogActions>
      </Dialog>

      <Dialog open={passwordDialog.open} onClose={() => setPasswordDialog({ open: false, id: "", otp: "" })}>
        <DialogTitle>One-time Password Verification</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="One-time code"
            value={passwordDialog.otp}
            onChange={(e) => setPasswordDialog((prev) => ({ ...prev, otp: e.target.value }))}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog({ open: false, id: "", otp: "" })}>Cancel</Button>
          <Button variant="contained" onClick={revealPasswordWithOtp}>Verify & Show</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={shareDialog.open} onClose={() => setShareDialog({ open: false, id: "" })}>
        <DialogTitle>One-time Share Code</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Code: <strong>{shareDialog.code}</strong></Typography>
          <Typography variant="caption" color="text.secondary">Expires: {shareDialog.expiresAt ? format(new Date(shareDialog.expiresAt), "yyyy-MM-dd HH:mm") : ""}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialog({ open: false, id: "" })}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={artifactDialog.open} onClose={() => setArtifactDialog({ open: false, id: "" })}>
        <DialogTitle>Protected Artifact</DialogTitle>
        <DialogContent>
          {!isAdmin && !artifactDialog.value && (
            <TextField fullWidth label="Shared password" type="password" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} sx={{ mt: 1 }} />
          )}
          {artifactDialog.value && (
            <Typography sx={{ mt: 1, wordBreak: "break-all" }}>{artifactDialog.value}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArtifactDialog({ open: false, id: "" })}>Close</Button>
          {!artifactDialog.value && <Button onClick={revealArtifactWithPassword} variant="contained">Reveal</Button>}
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
