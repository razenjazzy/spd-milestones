import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { useTranslation } from "../config/i18n";  
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material";

import {
  ArrowBack as ArrowBackIcon,  
  CalendarToday as CalendarIcon,
  Folder as FolderIcon,
  Person as PersonIcon,
  Timeline as TimelineIcon,
  EventNote as EventNoteIcon,
  RocketLaunch as RocketLaunchIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Palette as PaletteIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import api, { projectAPI, milestoneAPI } from "../api/api";
import MilestoneCard from "../components/UI/MilestoneCard";
import EmptyState from "../components/UI/EmptyState";
import { getMilestoneStatus } from "../utils/milestoneUtils";
import { APP_CONFIG, getStatusColor, getStatusLabel } from "../config/constants";

export default function ProjectDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const user = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const isAdmin = user?.role === "admin";
  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [completeDialog, setCompleteDialog] = useState({ open: false, milestone: null as any });
  const [editDialog, setEditDialog] = useState({ open: false, milestone: null as any });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, milestone: null as any });
  const [restoreDialog, setRestoreDialog] = useState({ open: false, milestone: null as any });
  const [statusDialog, setStatusDialog] = useState({ open: false, milestone: null as any });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [deletedMilestones, setDeletedMilestones] = useState<any[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [form, setForm] = useState({
    title: "",
    plannedStart: "",
    plannedEnd: "",
    responsible: "",
    teamName: "",
    color: APP_CONFIG.milestones.defaultColor as string,
  });
  const [editForm, setEditForm] = useState({
    title: "",
    plannedStart: "",
    plannedEnd: "",
    responsible: "",
    teamName: "",
    color: APP_CONFIG.milestones.defaultColor as string,
  });
  const [completeForm, setCompleteForm] = useState({
    actualStart: "",
    actualEnd: "",
  });

  const predefinedColors = APP_CONFIG.milestones.predefinedColors;  useEffect(() => {
    if (!id) return;
    loadProject();
    loadGantt();
    loadDeletedMilestones();
  }, [id]);

  async function loadProject() {
    try {
      const res = await projectAPI.getById(id!);
      setProject(res.data);
    } catch (err) {
      console.warn("project load failed", err);
    }
  }

  async function loadGantt() {
    try {
      const res = await projectAPI.getGantt(id!);
      const data = res.data || [];
      // Handle the gantt response structure: { timeline, milestones }
      const milestones = data.milestones || data || [];
      console.log('Gantt API response:', data, 'Milestones:', milestones);
      // Ensure we always set an array
      setMilestones(Array.isArray(milestones) ? milestones : []);
    } catch (err) {
      console.warn("gantt load failed", err);
      setMilestones([]); // Reset to empty array on error
    }
  }

  async function loadDeletedMilestones() {
    try {
      const res = await milestoneAPI.getDeletedByProject(id!);
      setDeletedMilestones(res.data || []);
    } catch (err) {
      console.warn("deleted milestones load failed", err);
    }
  }

  async function addMilestone() {
    if (!id) return;
    if (!form.title || !form.plannedStart || !form.plannedEnd) {
      setSnackbar({ open: true, message: t('projectDetail.notifications.fillRequired'), severity: "error" });
      return;
    }

    try {
      setLoading(true);
      await milestoneAPI.create(id!, { ...form });
      setForm({ title: "", plannedStart: "", plannedEnd: "", responsible: "", teamName: "", color: "#2563eb" });
      await loadGantt();
      await loadDeletedMilestones();
      setSnackbar({ open: true, message: t('projectDetail.notifications.added'), severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: t('projectDetail.notifications.addError'), severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  function openCompleteDialog(milestone: any) {
    setCompleteDialog({ open: true, milestone });
    setCompleteForm({
      actualStart: milestone.plannedStart?.slice?.(0, 10) || "",
      actualEnd: milestone.plannedEnd?.slice?.(0, 10) || "",
    });
  }

  async function completeMilestone() {
    if (!id || !completeDialog.milestone) return;
    if (!completeForm.actualStart || !completeForm.actualEnd) {
      setSnackbar({ open: true, message: t('projectDetail.notifications.fillActualDates'), severity: "error" });
      return;
    }

    try {
      setLoading(true);
      await milestoneAPI.update(id!, completeDialog.milestone.id, {
        actualStart: completeForm.actualStart,
        actualEnd: completeForm.actualEnd,
      });
      setCompleteDialog({ open: false, milestone: null });
      await loadGantt();
      await loadDeletedMilestones();
      setSnackbar({ open: true, message: t('projectDetail.notifications.completed'), severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: t('projectDetail.notifications.completeError'), severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, milestone: any) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMilestone(milestone);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedMilestone(null);
  };

  const handleEditMilestone = () => {
    if (selectedMilestone) {
      setEditForm({
        title: selectedMilestone.title,
        plannedStart: selectedMilestone.plannedStart?.slice?.(0, 10) || "",
        plannedEnd: selectedMilestone.plannedEnd?.slice?.(0, 10) || "",
        responsible: selectedMilestone.responsible || "",
        teamName: selectedMilestone.teamName || "",
        color: selectedMilestone.color || "#2563eb",
      });
      setEditDialog({ open: true, milestone: selectedMilestone });
    }
    handleMenuClose();
  };

  const handleDeleteMilestone = () => {
    if (selectedMilestone) {
      setDeleteDialog({ open: true, milestone: selectedMilestone });
    }
    handleMenuClose();
  };

  const handleChangeStatus = () => {
    if (selectedMilestone) {
      setStatusDialog({ open: true, milestone: selectedMilestone });
    }
    handleMenuClose();
  };

  const changeStatus = async (status: 'pending' | 'in-progress' | 'completed') => {
    if (!statusDialog.milestone) return;

    try {
      setLoading(true);
      const updateData: any = {};
      
      if (status === 'pending') {
        // Reset to pending: clear actual dates
        updateData.actualStart = null;
        updateData.actualEnd = null;
      } else if (status === 'in-progress') {
        // Set to in progress: set actualStart but not actualEnd
        updateData.actualStart = new Date().toISOString().split('T')[0];
        updateData.actualEnd = null;
      } else if (status === 'completed') {
        // Set to completed: set both dates if not already set
        updateData.actualStart = statusDialog.milestone.actualStart || new Date().toISOString().split('T')[0];
        updateData.actualEnd = new Date().toISOString().split('T')[0];
      }

      await milestoneAPI.update(id!, statusDialog.milestone.id, updateData);
      setStatusDialog({ open: false, milestone: null });
      await loadGantt();
      await loadDeletedMilestones();
      setSnackbar({ open: true, message: t('projectDetail.notifications.statusChanged').replace('{status}', status.replace('-', ' ')), severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: t('projectDetail.notifications.statusChangeError'), severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const updateMilestone = async () => {
    if (!editDialog.milestone || !editForm.title.trim() || !editForm.plannedStart || !editForm.plannedEnd) {
      setSnackbar({ open: true, message: t('projectDetail.notifications.fillRequired'), severity: "error" });
      return;
    }

    try {
      setLoading(true);
      await milestoneAPI.update(id!, editDialog.milestone.id, { ...editForm });
      setEditDialog({ open: false, milestone: null });
      await loadGantt();
      await loadDeletedMilestones();
      setSnackbar({ open: true, message: t('projectDetail.notifications.updated'), severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: t('projectDetail.notifications.updateError'), severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const deleteMilestone = async () => {
    if (!deleteDialog.milestone) return;

    try {
      setLoading(true);
      await milestoneAPI.delete(id!, deleteDialog.milestone.id);
      setDeleteDialog({ open: false, milestone: null });
      await loadGantt();
      await loadDeletedMilestones();
      setSnackbar({ open: true, message: t('projectDetail.notifications.deleted'), severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: t('projectDetail.notifications.deleteError'), severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const restoreMilestone = async () => {
    if (!restoreDialog.milestone) return;

    try {
      setLoading(true);
      await milestoneAPI.restore(id!, restoreDialog.milestone.id);
      setRestoreDialog({ open: false, milestone: null });
      await loadGantt();
      await loadDeletedMilestones();
      setSnackbar({ open: true, message: t('projectDetail.notifications.restored'), severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: t('projectDetail.notifications.restoreError'), severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Ensure milestones is always an array before rendering
  const safeMilestones = Array.isArray(milestones) ? milestones : [];

  return (
    <Box sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton
          component={Link}
          to="/"
          sx={{ mr: 2, color: 'primary.main' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.4rem', sm: '1.8rem', md: '3rem' } }}>
            {project?.name || t('projectDetail.loading')}
          </Typography>
          {project?.description && (
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              {project.description}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            component={Link}
            to={`/releases?projectId=${id}`}
            variant="outlined"
            startIcon={<RocketLaunchIcon />}
            size="large"
          >
            Release Pipeline
          </Button>
          <Button
            component={Link}
            to={`/project/${id}/activities`}
            variant="outlined"
            startIcon={<EventNoteIcon />}
            size="large"
          >
            Activities
          </Button>
          <Button
            component={Link}
            to={`/project/${id}/gantt`}
            variant="contained"
            startIcon={<TimelineIcon />}
            size="large"
          >
            {t('common.viewGantt')}
          </Button>
        </Box>
      </Box>

      {/* Add Milestone Form */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 3,
              }}
            >
              <AddIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {t('projectDetail.addMilestone.title')}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {t('projectDetail.addMilestone.subtitle')}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('projectDetail.addMilestone.titleLabel')}
                placeholder={t('projectDetail.addMilestone.titlePlaceholder')}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={t('projectDetail.addMilestone.plannedStartLabel')}
                type="date"
                value={form.plannedStart}
                onChange={(e) => setForm({ ...form, plannedStart: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={t('projectDetail.addMilestone.plannedEndLabel')}
                type="date"
                value={form.plannedEnd}
                onChange={(e) => setForm({ ...form, plannedEnd: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={t('projectDetail.addMilestone.responsibleLabel')}
                placeholder={t('projectDetail.addMilestone.responsiblePlaceholder')}
                value={form.responsible}
                onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={t('projectDetail.addMilestone.teamNameLabel')}
                placeholder={t('projectDetail.addMilestone.teamNamePlaceholder')}
                value={form.teamName}
                onChange={(e) => setForm({ ...form, teamName: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                  {t('projectDetail.addMilestone.colorLabel')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {predefinedColors.map((color) => (
                    <Box
                      key={color}
                      onClick={() => setForm({ ...form, color })}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: form.color === color ? '3px solid' : '2px solid',
                        borderColor: form.color === color ? 'primary.main' : 'grey.300',
                        '&:hover': { transform: 'scale(1.1)' },
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
               <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                size="large"
                onClick={addMilestone}
                disabled={!form.title.trim() || !form.plannedStart || !form.plannedEnd || loading}
                startIcon={<AddIcon />}
                sx={{ height: 56, color: '#fff' }}
              >
                {t('projectDetail.addMilestone.button')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Milestones Section */}
      <Box sx={{ mb: 6, mt: 3, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '1.3rem', sm: '1.7rem', md: '3rem' } }}>
              {t('projectDetail.milestones.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('projectDetail.milestones.subtitle')}
            </Typography>
          </Box>
          <Chip
            label={`${safeMilestones.length} ${safeMilestones.length === 1 ? t('projectDetail.milestones.milestone') : t('projectDetail.milestones.milestones')}`}
            variant="outlined"
            sx={{ fontWeight: 500, mt: 0.5 }}
          />
        </Box>

        {safeMilestones.length === 0 ? (
          <Card>
            <EmptyState
              icon={<CheckCircleIcon />}
              title={t('projectDetail.milestones.empty.title')}
              description={t('projectDetail.milestones.empty.description')}
            />
          </Card>
        ) : (
          <DragDropContext
            onDragEnd={async (result: DropResult) => {
              if (!result.destination) return;
              const reordered = Array.from(milestones);
              const [removed] = reordered.splice(result.source.index, 1);
              reordered.splice(result.destination.index, 0, removed);
              setMilestones(reordered);
              
              // Persist new order to backend
              try {
                const order = reordered.map(m => m.id);
                await milestoneAPI.updateOrder(id!, order);
              } catch (error) {
                console.error('Failed to update milestone order:', error);
                // Optionally show error message to user
              }
            }}
          >
            <Droppable droppableId="milestone-list" direction="vertical">
              {(provided: DroppableProvided) => (
                <Grid container spacing={3} ref={provided.innerRef} {...provided.droppableProps}>
                  {safeMilestones.map((milestone, index) => {
                    const statusInfo = getMilestoneStatus(milestone);
                    return (
                      <Draggable key={milestone.id} draggableId={milestone.id} index={index}>
                        {(draggableProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <Grid item xs={12} sm={6} lg={4}
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            {...draggableProvided.dragHandleProps}
                          >
                            <Card sx={{ height: '100%', transition: 'all 0.2s ease', boxShadow: snapshot.isDragging ? 6 : 1, '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
                              <CardContent sx={{ p: 3, pb: 2, position: 'relative', minHeight: 180 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                  <Box sx={{ width: 36, height: 36, borderRadius: 1, background: milestone.color || 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, fontSize: 18 }}>{index + 1}</Typography>
                                  </Box>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{milestone.title}</Typography>
                                  </Box>
                                  <IconButton
                                    size="small"
                                    onClick={(event) => handleMenuOpen(event, milestone)}
                                    sx={{
                                      opacity: 0.7,
                                      '&:hover': { opacity: 1 },
                                    }}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Chip label={statusInfo.label} size="small" color={statusInfo.color} variant="outlined" />
                                  {milestone.plannedDuration && (
                                    <Chip label={`${milestone.plannedDuration}WD`} size="small" variant="outlined" />
                                  )}
                                  {statusInfo.status === 'completed' && milestone.delayDays > 0 && (
                                    <Chip label={`Delay: ${milestone.delayDays}d`} size="small" color="error" variant="outlined" />
                                  )}
                                </Box>
                                {statusInfo.status !== 'completed' && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="primary"
                                    sx={{
                                      minWidth: 0,
                                      px: 2,
                                      position: 'absolute',
                                      bottom: 16,
                                      right: 16,
                                      zIndex: 2
                                    }}
                                    onClick={() => openCompleteDialog(milestone)}
                                  >
                                    {t('projectDetail.milestones.markComplete')}
                                  </Button>
                                )}
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  <CalendarIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                  {new Date(milestone.plannedStart).toLocaleDateString()} → {new Date(milestone.plannedEnd).toLocaleDateString()}
                                </Typography>
                                {milestone.actualStart && milestone.actualEnd && (
                                  <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                                    <CheckCircleIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                    {new Date(milestone.actualStart).toLocaleDateString()} → {new Date(milestone.actualEnd).toLocaleDateString()}
                                  </Typography>
                                )}
                                {milestone.responsible && (
                                  <Typography variant="body2" color="text.secondary">{milestone.responsible}</Typography>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </Grid>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Box>

      {/* Deleted Milestones Section */}
      {deletedMilestones.length > 0 && (
        <Card sx={{ mt: 4, border: '1px dashed', borderColor: 'error.main' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'error.main' }}>
                {t('projectDetail.deleted.title')}
              </Typography>
              <Chip
                label={`${deletedMilestones.length} ${t('projectDetail.deleted.count')}`}
                variant="outlined"
                color="error"
                sx={{ fontWeight: 500 }}
              />
            </Box>

            <Grid container spacing={2} alignItems="stretch">
              {deletedMilestones.map((milestone, index) => (
                <Grid item xs={12} sm={6} md={4} key={milestone._id}>
                  <Card sx={{ opacity: 0.7, border: '1px solid', borderColor: 'error.light', height: '100%' }}>
                    <CardContent sx={{ p: 2, height: '100%' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: 'error.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {milestone.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Deleted on {new Date(milestone.deletedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Stack direction="row" spacing={0.75} sx={{ justifyContent: 'flex-end' }}>
                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            sx={{ minWidth: 72, px: 1 }}
                            onClick={() => setRestoreDialog({ open: true, milestone })}
                          >
                            Restore
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              sx={{ minWidth: 68, px: 1 }}
                              onClick={async () => {
                                if (!id) return;
                                try {
                                  setLoading(true);
                                  await milestoneAPI.permanentDelete(id, milestone._id);
                                  await loadDeletedMilestones();
                                  setSnackbar({ open: true, message: t('projectDetail.notifications.deleted'), severity: 'success' });
                                } catch {
                                  setSnackbar({ open: true, message: t('projectDetail.notifications.deleteError'), severity: 'error' });
                                } finally {
                                  setLoading(false);
                                }
                              }}
                            >
                              Delete
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Complete Milestone Dialog */}
      <Dialog
        open={completeDialog.open}
        onClose={() => setCompleteDialog({ open: false, milestone: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('projectDetail.dialogs.complete.title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            {completeDialog.milestone?.title}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('projectDetail.dialogs.complete.actualStart')}
                type="date"
                value={completeForm.actualStart}
                onChange={(e) => setCompleteForm({ ...completeForm, actualStart: e.target.value })}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('projectDetail.dialogs.complete.actualEnd')}
                type="date"
                value={completeForm.actualEnd}
                onChange={(e) => setCompleteForm({ ...completeForm, actualEnd: e.target.value })}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialog({ open: false, milestone: null })}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={completeMilestone}
            disabled={!completeForm.actualStart || !completeForm.actualEnd || loading}
          >
            {t('projectDetail.dialogs.complete.button')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Milestone Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, milestone: null })} maxWidth="md" fullWidth>
        <DialogTitle>{t('projectDetail.dialogs.edit.title')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('projectDetail.dialogs.edit.titleLabel')}
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={t('projectDetail.dialogs.edit.plannedStartLabel')}
                type="date"
                value={editForm.plannedStart}
                onChange={(e) => setEditForm({ ...editForm, plannedStart: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={t('projectDetail.dialogs.edit.plannedEndLabel')}
                type="date"
                value={editForm.plannedEnd}
                onChange={(e) => setEditForm({ ...editForm, plannedEnd: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={t('projectDetail.dialogs.edit.responsibleLabel')}
                value={editForm.responsible}
                onChange={(e) => setEditForm({ ...editForm, responsible: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={t('projectDetail.dialogs.edit.teamNameLabel')}
                value={editForm.teamName}
                onChange={(e) => setEditForm({ ...editForm, teamName: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                  {t('projectDetail.dialogs.edit.colorLabel')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {predefinedColors.map((color) => (
                    <Box
                      key={color}
                      onClick={() => setEditForm({ ...editForm, color })}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: editForm.color === color ? '3px solid' : '2px solid',
                        borderColor: editForm.color === color ? 'primary.main' : 'grey.300',
                        '&:hover': { transform: 'scale(1.1)' },
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, milestone: null })}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" onClick={updateMilestone} disabled={loading}>
            {t('projectDetail.dialogs.edit.button')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Milestone Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, milestone: null })}>
        <DialogTitle>{t('projectDetail.dialogs.delete.title')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('projectDetail.dialogs.delete.message').replace('{title}', deleteDialog.milestone?.title || '')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, milestone: null })}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" color="error" onClick={deleteMilestone} disabled={loading}>
            {t('projectDetail.dialogs.delete.button')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Milestone Dialog */}
      <Dialog open={restoreDialog.open} onClose={() => setRestoreDialog({ open: false, milestone: null })}>
        <DialogTitle>{t('projectDetail.dialogs.restore.title')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('projectDetail.dialogs.restore.message').replace('{title}', restoreDialog.milestone?.title || '')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog({ open: false, milestone: null })}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" color="success" onClick={restoreMilestone} disabled={loading}>
            {t('projectDetail.dialogs.restore.button')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, milestone: null })}>
        <DialogTitle>{t('projectDetail.dialogs.status.title')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            {t('projectDetail.dialogs.status.message').replace('{title}', statusDialog.milestone?.title || '')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => changeStatus('pending')}
              disabled={loading}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              <Box sx={{ width: 16, height: 16, backgroundColor: '#b0b0b0', borderRadius: 1, mr: 2 }} />
              {t('projectDetail.dialogs.status.pending')}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => changeStatus('in-progress')}
              disabled={loading}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              <Box sx={{ width: 16, height: 16, backgroundColor: '#f59e0b', borderRadius: 1, mr: 2 }} />
              {t('projectDetail.dialogs.status.inProgress')}
            </Button>
            <Button
              variant="outlined"
              color="success"
              onClick={() => changeStatus('completed')}
              disabled={loading}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              <Box sx={{ width: 16, height: 16, backgroundColor: '#10b981', borderRadius: 1, mr: 2 }} />
              {t('projectDetail.dialogs.status.completed')}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, milestone: null })}>
            {t('common.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Milestone Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditMilestone}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('projectDetail.menu.edit')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleChangeStatus}>
          <ListItemIcon>
            <ScheduleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('projectDetail.menu.changeStatus')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteMilestone} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>{t('projectDetail.menu.delete')}</ListItemText>
        </MenuItem>
      </Menu>

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