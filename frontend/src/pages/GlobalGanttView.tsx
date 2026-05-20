import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import api from "../api/api";
import GanttChart from "../components/GanttChartView";
import EmptyState from "../components/UI/EmptyState";
import FolderIcon from "@mui/icons-material/Folder";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { useNavigate } from "react-router-dom";
import { buildGanttItems } from "../utils/milestoneUtils";
import { exportGanttChart } from "../utils/chartExport";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { IconButton, Tooltip } from "@mui/material";
import { useTranslation } from '../config/i18n';  
import { milestoneAPI } from "../api/api";

export default function GlobalGanttView() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingDateChanges, setPendingDateChanges] = useState<Record<string, { oldStart: string; oldEnd: string; newStart: string; newEnd: string; daysDelta: number }>>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadMilestones(selectedProject);
    }
  }, [selectedProject]);

  async function loadProjects() {
    try {
      const res = await api.get("/projects");
      const data = res.data.projects || res.data;
      setProjects(data);

      // 👇 Automatically select the latest project if available
      if (data.length > 0) {
        // Assuming projects are sorted by createdAt or have a timestamp
        // otherwise, fallback to the last item in the array
        const latestProject = data[data.length - 1];
        setSelectedProject(latestProject._id);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  }

  async function loadMilestones(projectId: string) {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${projectId}/gantt`);
      setMilestones(res.data.milestones || []);
      setPendingDateChanges({});
    } catch (err) {
      console.error("Failed to load milestones:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleBarDateShift = (
    milestoneId: string,
    oldStart: string,
    oldEnd: string,
    newStart: string,
    newEnd: string,
    daysDelta: number
  ) => {
    setPendingDateChanges((prev) => ({ ...prev, [milestoneId]: { oldStart, oldEnd, newStart, newEnd, daysDelta } }));
  };

  const handleInlineMilestoneSave = async (
    milestoneId: string,
    payload: { title?: string; responsible?: string; teamName?: string; note?: string; delayReason?: string }
  ) => {
    if (!selectedProject) return;
    await milestoneAPI.update(selectedProject, milestoneId, payload);
    await loadMilestones(selectedProject);
  };

  const saveDateChanges = async () => {
    if (!selectedProject) return;
    const updates = Object.entries(pendingDateChanges);
    if (!updates.length) return;
    await Promise.all(
      updates.map(([milestoneId, change]) =>
        milestoneAPI.updateDates(selectedProject, milestoneId, {
          newStart: change.newStart,
          newEnd: change.newEnd,
          reason: `Dragged in Gantt by ${change.daysDelta > 0 ? '+' : ''}${change.daysDelta} day(s)`,
        })
      )
    );
    setPendingDateChanges({});
    await loadMilestones(selectedProject);
  };

  const discardDateChanges = () => {
    setPendingDateChanges({});
  };

  const handleExport = async () => {
    const selectedProjectName = projects.find(p => p._id === selectedProject)?.name || 'project';
    await exportGanttChart({
      filename: `global-gantt-${selectedProjectName}`,
      containerId: 'global-gantt-chart-container',
      copyToClipboard: true,
    });
  };

  const milestonesWithPending = milestones.map((m) => {
    const pending = pendingDateChanges[String(m.id)];
    if (!pending) return m;

    return {
      ...m,
      plannedStart: pending.newStart,
      plannedEnd: pending.newEnd,
    };
  });

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.4rem', sm: '1.8rem', md: '3rem' } }}>
          {t('globalGanttView.title')}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, width: { xs: '100%', sm: 'auto' } }}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel>{t('globalGanttView.selectProject')}</InputLabel>
            <Select
              value={selectedProject}
              label={t('globalGanttView.selectProject')}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              {projects.length === 0 ? (
                <MenuItem disabled>{t('globalGanttView.noProjects')}</MenuItem>
              ) : (
                projects.map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          {projects.length > 0 && selectedProject && milestones.length > 0 && (
            <Tooltip title={t('globalGanttView.actions.export')}>
              <IconButton onClick={handleExport} sx={{ color: 'primary.main' }}>
                <CameraAltIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

    {loading ? (
      <Box sx={{ display: "flex", justifyContent: "center", minHeight: 300 }}>
        <CircularProgress />
      </Box>
    ) : milestones.length > 0 ? (
      <Box>
        {Object.keys(pendingDateChanges).length > 0 && (
          <Card sx={{ mb: 2, border: '1px solid', borderColor: 'warning.main', background: 'rgba(245,158,11,0.08)' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                    {Object.keys(pendingDateChanges).length} pending date change(s)
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Changes are staged locally. Save to persist or discard to revert.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" color="inherit" onClick={discardDateChanges}>Discard</Button>
                  <Button variant="contained" color="warning" onClick={saveDateChanges}>Save changes</Button>
                </Box>
              </Box>
              <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {Object.entries(pendingDateChanges).map(([milestoneId, change]) => (
                  <Typography key={milestoneId} variant="caption" sx={{ color: 'text.secondary' }}>
                    {milestoneId}: {change.oldStart} to {change.oldEnd} {'->'} {change.newStart} to {change.newEnd}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
        <Box id="global-gantt-chart-container">
          <GanttChart
            milestones={buildGanttItems(milestonesWithPending)}
            editable
            editableFields
            onBarDateShift={handleBarDateShift}
            onMilestoneInlineSave={handleInlineMilestoneSave}
          />
        </Box>
      </Box>
    ) : selectedProject ? (
      <Card>
        <EmptyState
          icon={<FolderIcon />}
          title={t('globalGanttView.empty.noMilestonesTitle')}
          description={t('globalGanttView.empty.noMilestonesDesc')}
          action={{
            label: t('globalGanttView.empty.goToProjects'),
            onClick: () => navigate("/projects"),
          }}
        />
      </Card>
    ) : (
      <EmptyState
        icon={<DashboardIcon />}
        title={t('globalGanttView.empty.selectProjectTitle')}
        description={t('globalGanttView.empty.selectProjectDesc')}
        action={{
          label: t('globalGanttView.empty.goToDashboard'),
          onClick: () => navigate("/"),
        }}
      />
    )}

    </Box>
  );
}
