import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  PlayCircle as PlayCircleIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Fullscreen as FullscreenIcon,
  FilterList as FilterIcon,
  CameraAlt as CameraAltIcon,
} from "@mui/icons-material";
import api from "../api/api";
import { milestoneAPI } from "../api/api";
import GanttChart from "../components/GanttChartView";
import StatCard from "../components/UI/StatCard";
import { buildGanttItems } from "../utils/milestoneUtils";
import { exportGanttChart, printChart } from "../utils/chartExport";
import { useTranslation } from '../config/i18n';  

export default function GanttView() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const [referenceDate, setReferenceDate] = useState<string>("");
  const [pendingDateChanges, setPendingDateChanges] = useState<
    Record<
      string,
      {
        oldStart: string;
        oldEnd: string;
        newStart: string;
        newEnd: string;
        daysDelta: number;
      }
    >
  >({});

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const [projectRes, ganttRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/gantt`)
      ]);
      
      setProject(projectRes.data.project || projectRes.data);
      setMilestones(ganttRes.data.milestones || []);
    } catch (err) {
      console.error("Failed to load data:", err);
      setSnackbar({ open: true, message: t('ganttView.notifications.loadError'), severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleBarDateShift = (
    milestoneId: string,
    oldStart: string,
    oldEnd: string,
    newStart: string,
    newEnd: string,
    daysDelta: number
  ) => {
    setPendingDateChanges((prev) => ({
      ...prev,
      [milestoneId]: { oldStart, oldEnd, newStart, newEnd, daysDelta },
    }));
  };

  const handleInlineMilestoneSave = async (
    milestoneId: string,
    payload: { title?: string; responsible?: string; teamName?: string; note?: string; delayReason?: string }
  ) => {
    if (!id) return;
    try {
      await milestoneAPI.update(id, milestoneId, payload);
      await loadData();
      setSnackbar({ open: true, message: "Milestone info updated", severity: "success" });
    } catch (err) {
      console.error("Failed to update milestone info:", err);
      setSnackbar({ open: true, message: "Failed to update milestone info", severity: "error" });
    }
  };

  const discardDateChanges = () => {
    setPendingDateChanges({});
  };

  const saveDateChanges = async () => {
    if (!id) return;
    const updates = Object.entries(pendingDateChanges);
    if (!updates.length) return;

    try {
      setLoading(true);
      await Promise.all(
        updates.map(([milestoneId, change]) =>
          milestoneAPI.updateDates(id, milestoneId, {
            newStart: change.newStart,
            newEnd: change.newEnd,
            reason: `Dragged in Gantt by ${change.daysDelta > 0 ? '+' : ''}${change.daysDelta} day(s) from ${change.oldStart} - ${change.oldEnd}`,
          })
        )
      );
      setPendingDateChanges({});
      await loadData();
      setSnackbar({ open: true, message: 'Milestone dates saved successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to save milestone date changes:', err);
      setSnackbar({ open: true, message: 'Failed to save milestone date changes', severity: 'error' });
    } finally {
      setLoading(false);
    }
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

  // Transform milestones via shared utility
  const filteredMilestones = buildGanttItems(milestonesWithPending, { filterStatus: filterStatus as any, showCompleted });

  const handleExport = async () => {
    await exportGanttChart({
      filename: `${project?.name || 'gantt'}-timeline`,
      containerId: 'gantt-chart-container',
      copyToClipboard: true,
      showSuccessMessage: (message) => setSnackbar({ open: true, message, severity: 'success' }),
      showErrorMessage: (message) => setSnackbar({ open: true, message, severity: 'error' }),
    });
  };

  const handlePrint = () => {
    printChart();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            component={Link}
            to={`/project/${id}`}
            sx={{ color: 'primary.main' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.4rem', sm: '1.8rem', md: '3rem' } }}>
              {t('ganttView.title')}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              {project?.name}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 1, md: 2 }, mt: { xs: 1, md: 0 } }}>
          <FormControl size="small" sx={{ minWidth: { xs: 110, md: 120 } }}>
            <InputLabel>{t('ganttView.filters.label')}</InputLabel>
            <Select
              value={filterStatus}
              label={t('ganttView.filters.label')}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">{t('ganttView.filters.all')}</MenuItem>
              <MenuItem value="completed">{t('ganttView.filters.completed')}</MenuItem>
              <MenuItem value="delayed">{t('ganttView.filters.delayed')}</MenuItem>
              <MenuItem value="in-progress">{t('ganttView.filters.inProgress')}</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('ganttView.filters.showCompletedLabel')}</InputLabel>
            <Select
              value={showCompleted ? "yes" : "no"}
              label={t('ganttView.filters.showCompletedLabel')}
              onChange={(e) => setShowCompleted(e.target.value === "yes")}
            >
              <MenuItem value="yes">{t('ganttView.filters.showCompleted')}</MenuItem>
              <MenuItem value="no">{t('ganttView.filters.hideCompleted')}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label={t('ganttView.filters.referenceDate')}
            type="date"
            value={referenceDate}
            onChange={(e) => setReferenceDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          
          <IconButton onClick={handleExport} title={t('ganttView.actions.export')} sx={{ color: 'primary.main' }}>
            <CameraAltIcon />
          </IconButton>
          <IconButton onClick={handlePrint} title={t('ganttView.actions.print')} sx={{ color: 'primary.main' }}>
            <PrintIcon />
          </IconButton>
          <IconButton onClick={toggleFullscreen} title={t('ganttView.actions.fullscreen')} sx={{ color: 'primary.main' }}>
            <FullscreenIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('ganttView.stats.totalMilestones')}
            value={milestones.length}
            icon={<TimelineIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('ganttView.stats.onTime')}
            value={milestones.filter(m => m.actualEnd && new Date(m.actualEnd) <= new Date(m.plannedEnd)).length}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('ganttView.stats.delayed')}
            value={milestones.filter(m => m.actualEnd && new Date(m.actualEnd) > new Date(m.plannedEnd)).length}
            icon={<WarningIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('ganttView.stats.inProgress')}
            value={milestones.filter(m => !m.actualEnd).length}
            icon={<PlayCircleIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Timeline View Title and Subtitle OUTSIDE the card */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          {t('ganttView.timeline.title')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          {t('ganttView.timeline.subtitle')}
        </Typography>
      </Box>

      {/* Gantt Chart Card - only the chart inside */}
      {Object.keys(pendingDateChanges).length > 0 && (
        <Card sx={{ mb: 2, border: '1px solid', borderColor: 'warning.main', background: 'rgba(245,158,11,0.08)' }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                  {Object.keys(pendingDateChanges).length} pending date change(s)
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Previous and new dates are tracked. Save to persist changes in real time.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" color="inherit" onClick={discardDateChanges}>
                  Discard
                </Button>
                <Button variant="contained" color="warning" onClick={saveDateChanges}>
                  Save changes
                </Button>
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

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 0 }}>
          <Box 
            id="gantt-chart-container" 
            sx={{ overflowX: 'auto' }}
            role="img"
            aria-label="Gantt chart showing project milestones timeline"
          >
            <GanttChart
              milestones={filteredMilestones}
              editable
              editableFields
              onBarDateShift={handleBarDateShift}
              onMilestoneInlineSave={handleInlineMilestoneSave}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: 'warning.main',
                  border: '2px dashed',
                  borderColor: 'warning.dark',
                  borderRadius: 1,
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('ganttView.legend.today')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: 'grey.400',
                  borderRadius: 1,
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('ganttView.legend.workingDays')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: '#01471bff',
                  borderRadius: 1,
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('ganttView.legend.onTime')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: '#f59e0b',
                  borderRadius: 1,
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('ganttView.legend.planned')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: '#dc2626',
                  borderRadius: 1,
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('ganttView.legend.delayed')}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}