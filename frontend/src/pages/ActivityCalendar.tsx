import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, CameraAlt as CameraAltIcon, EditCalendar as EditCalendarIcon } from "@mui/icons-material";
import { format } from "date-fns";
import { activityAPI } from "../api/api";
import { exportElementAsImage } from "../utils/chartExport";

type ActivityType = "maintenance" | "security" | "hotfix";

type Activity = {
  _id: string;
  title: string;
  date: string;
  type: ActivityType;
  note?: string;
};

const TYPE_COLOR: Record<ActivityType, string> = {
  maintenance: "#1f7a3b",
  security: "#7a2bc1",
  hotfix: "#d61f1f",
};

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: Array<{ day?: number; dateKey?: string }> = [];
  for (let i = 0; i < startOffset; i += 1) cells.push({});
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, dateKey: format(new Date(year, month - 1, day), "yyyy-MM-dd") });
  }
  while (cells.length % 7 !== 0) cells.push({});

  const rows: Array<Array<{ day?: number; dateKey?: string }>> = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export default function ActivityCalendar() {
  const user = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const isAdmin = user?.role === "admin";
  const today = new Date();
  const [month, setMonth] = useState<number>(today.getMonth() + 1);
  const [year, setYear] = useState<number>(today.getFullYear());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [dialog, setDialog] = useState<{ open: boolean; date: string; activityId?: string }>({ open: false, date: "" });
  const [form, setForm] = useState({ title: "", type: "maintenance" as ActivityType, note: "" });

  const monthGrid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const groupedByDate = useMemo(() => {
    const out: Record<string, Activity[]> = {};
    activities.forEach((item) => {
      const key = format(new Date(item.date), "yyyy-MM-dd");
      if (!out[key]) out[key] = [];
      out[key].push(item);
    });
    return out;
  }, [activities]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const activitiesRes = await activityAPI.list({ year, month });
      setActivities(Array.isArray(activitiesRes.data) ? activitiesRes.data : []);
    } catch {
      setSnackbar({ open: true, message: "Failed to load activities", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [month, year]);

  const copyCalendarImage = async () => {
    await exportElementAsImage({
      containerId: "activities-calendar-grid",
      filename: `activities-calendar-${year}-${month}`,
      copyToClipboard: true,
      showSuccessMessage: (message) => setSnackbar({ open: true, message, severity: "success" }),
      showErrorMessage: (message) => setSnackbar({ open: true, message, severity: "error" }),
    });
  };

  const openAdd = (dateKey: string) => {
    setDialog({ open: true, date: dateKey });
    setForm({ title: "", type: "maintenance", note: "" });
  };

  const openEdit = (item: Activity) => {
    setDialog({ open: true, date: format(new Date(item.date), "yyyy-MM-dd"), activityId: item._id });
    setForm({ title: item.title, type: item.type, note: item.note || "" });
  };

  const saveFromCalendar = async () => {
    if (!form.title.trim() || !dialog.date) return;
    try {
      if (dialog.activityId) {
        await activityAPI.updateStandalone(dialog.activityId, { title: form.title, type: form.type, note: form.note, date: dialog.date });
      } else {
        await activityAPI.createStandalone({ title: form.title, type: form.type, note: form.note, date: dialog.date });
      }
      setDialog({ open: false, date: "" });
      await loadActivities();
      setSnackbar({ open: true, message: dialog.activityId ? "Activity updated" : "Activity added", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to save activity", severity: "error" });
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton component={Link} to="/activities">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Activities Calendar View
            </Typography>
            <Typography color="text.secondary">
              Independent month-wise calendar page for release activities and slide-ready exports
            </Typography>
          </Box>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: { xs: 1, sm: 0 } }}>
          <Button component={Link} to="/activities" startIcon={<EditCalendarIcon />} variant="outlined">
            Manage Activities
          </Button>
          <IconButton onClick={copyCalendarImage} color="primary" title="Copy calendar as image" aria-label="Copy calendar as image">
            <CameraAltIcon />
          </IconButton>
        </Stack>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
            <Stack direction="row" spacing={1}>
              <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} size="small">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <MenuItem key={m} value={m}>{format(new Date(2026, m - 1, 1), "MMMM")}</MenuItem>
                ))}
              </Select>
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))} size="small">
                {Array.from({ length: 8 }, (_, i) => 2023 + i).map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Use the camera icon to copy this calendar grid directly as an image.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box id="activities-calendar-grid">
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", borderTop: "1px solid", borderColor: "divider" }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <Box key={d} sx={{ px: 1.2, py: 1, fontWeight: 700, color: "white", backgroundColor: "#1f3552", borderRight: "1px solid #2f4a6d" }}>
                  {d}
                </Box>
              ))}
            </Box>

            {monthGrid.map((row, rowIndex) => (
              <Box key={rowIndex} sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
                {row.map((cell, colIndex) => {
                  const dayItems = cell.dateKey ? groupedByDate[cell.dateKey] || [] : [];
                  return (
                    <Box
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => cell.dateKey && openAdd(cell.dateKey)}
                      sx={{
                        minHeight: { xs: 80, sm: 100, md: 120 },
                        borderTop: "1px solid",
                        borderRight: "1px solid",
                        borderColor: "divider",
                        backgroundColor: colIndex === 0 || colIndex === 6 ? "#f4fbf3" : "#f9f9fb",
                        p: 1,
                        cursor: cell.dateKey ? "pointer" : "default",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, mb: 0.75 }}>{cell.day || ""}</Typography>
                      <Stack spacing={0.5}>
                        {dayItems.map((item) => (
                          <Button
                            key={item._id}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(item);
                            }}
                            sx={{ justifyContent: "flex-start", color: TYPE_COLOR[item.type], textTransform: "none", p: 0, minWidth: 0, lineHeight: 1.25 }}
                          >
                            * {item.title}
                          </Button>
                        ))}
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

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

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, date: "" })} fullWidth maxWidth="sm">
        <DialogTitle>{dialog.activityId ? "Update Activity" : "Add Activity"}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.2} sx={{ mt: 1 }}>
            <TextField label="Date" type="date" value={dialog.date} InputLabelProps={{ shrink: true }} onChange={(e) => setDialog((prev) => ({ ...prev, date: e.target.value }))} />
            <TextField label="Title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            <Select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as ActivityType }))}>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="security">Security</MenuItem>
              <MenuItem value="hotfix">Hotfix</MenuItem>
            </Select>
            <TextField label="Note" multiline rows={3} value={form.note} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, date: "" })}>Cancel</Button>
          <Button onClick={saveFromCalendar} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
