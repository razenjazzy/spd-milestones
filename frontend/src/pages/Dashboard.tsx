import React, { useEffect, useState } from "react";
import StatCard from "../components/UI/StatCard";
import { useTranslation } from "../config/i18n";
import { TrendingUp as TrendingUpIcon, Warning as WarningIcon } from "@mui/icons-material";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Add as AddIcon,
  Folder as FolderIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { dashboardAPI } from "../api/api";
import EmptyState from "../components/UI/EmptyState";

export default function Dashboard() {
  const { t } = useTranslation();
  async function createProject() {
    if (!name.trim()) {
      setSnackbar({ open: true, message: t('dashboard.notifications.nameRequired'), severity: "error" });
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/projects", { name, description, createdBy: "frontend" });
      setName("");
      setDescription("");
      setProjects([res.data, ...projects]);
      setSnackbar({ open: true, message: t('dashboard.notifications.created'), severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: t('dashboard.notifications.createError'), severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  const [projects, setProjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [editDialog, setEditDialog] = useState({ open: false, project: null as any });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, project: null as any });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [pipeline, setPipeline] = useState({ standalone: 0, merged: 0, releaseForProductionUpcoming: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/projects");
      const projectsData = res.data || [];
      // Ensure we have milestone counts - some endpoints may not include them in the list
      const enhanced = await Promise.all(
        projectsData.map(async (p: any) => {
          if (p.milestones && Array.isArray(p.milestones)) return p;
          try {
            const r = await api.get(`/projects/${p._id}`);
            const detailed = r.data.project || r.data;
            return { ...p, milestones: detailed.milestones || [] };
          } catch (err) {
            return p;
          }
        })
      );
      setProjects(enhanced);
      try {
        const pipeRes = await dashboardAPI.pipeline();
        setPipeline(pipeRes.data || { standalone: 0, merged: 0, releaseForProductionUpcoming: 0 });
      } catch {
        setPipeline({ standalone: 0, merged: 0, releaseForProductionUpcoming: 0 });
      }
    } catch (error) {
      setSnackbar({ open: true, message: t('dashboard.notifications.loadError'), severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.6rem', sm: '2rem', md: '3rem' } }}>
          {t('dashboard.title')}
        </Typography>
        <Typography variant="h6" sx={{ color: "text.secondary", maxWidth: 600, mx: "auto" }}>
          {t('dashboard.subtitle')}
        </Typography>
        <Box sx={{ mb: 3 }} />
        {/* Analytics Dashboard */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <StatCard
              title={t('dashboard.stats.totalProjects')}
              value={projects.length}
              icon={<FolderIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title={t('dashboard.stats.totalMilestones')}
              value={projects.reduce((acc, p) => acc + (Array.isArray(p.milestones) ? p.milestones.length : 0), 0)}
              icon={<AddIcon />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title={t('dashboard.stats.completionRate')}
              value={(() => {
                const total = projects.reduce((acc, p) => acc + (Array.isArray(p.milestones) ? p.milestones.length : 0), 0);
                const completed = projects.reduce((acc, p) => acc + (Array.isArray(p.milestones) ? p.milestones.filter((m: any) => m.actualEnd).length : 0), 0);
                return total ? Math.round((completed / total) * 100) + '%' : '0%';
              })()}
              icon={<TrendingUpIcon />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title={t('dashboard.stats.criticalProjects')}
              value={projects.filter(p => Array.isArray(p.milestones) && p.milestones.some((m: any) => m.isCritical)).length}
              icon={<WarningIcon />}
              color="warning"
            />
          </Grid>
        </Grid>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Release Pipeline</Typography>
            <Typography variant="body2" color="text.secondary">
              Standalone: {pipeline.standalone} | Merged: {pipeline.merged} | Release for Production (Upcoming): {pipeline.releaseForProductionUpcoming}
            </Typography>
            <Button sx={{ mt: 1.5 }} variant="outlined" onClick={() => navigate('/releases')}>
              Open Releases
            </Button>
          </CardContent>
        </Card>
      </Box>

      {/* Projects Section */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
          <Chip
            label={`${projects.length} ${projects.length === 1 ? t('common.project') : t('common.projects')}`}
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        </Box>
        {projects.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FolderIcon />}
              title={t('dashboard.empty.title')}
              description={t('dashboard.empty.description')}
              action={{
                label: t('dashboard.empty.action'),
                onClick: () => {
                  const nameInput = document.querySelector('input[placeholder="e.g., Data Center Migration"]') as HTMLInputElement;
                  nameInput?.focus();
                },
              }}
            />
          </Card>
        ) : (
          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid item xs={12} sm={6} lg={4} key={project._id}>
                <Card
                  sx={{
                    height: "100%",
                    position: "relative",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => navigate(`/project/${project._id}`)}
                >
                  <CardContent sx={{ p: 3, pb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mr: 2,
                        }}
                      >
                        <FolderIcon sx={{ color: "white", fontSize: 24 }} />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.3 }}>
                          {project.name}
                        </Typography>
                        <Chip
                          label={new Date(project.createdAt).toLocaleDateString()}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.75rem" }}
                        />
                      </Box>
                    </Box>
                    {project.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          mb: 2,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {project.description}
                      </Typography>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {Array.isArray(project.milestones) ? project.milestones.filter((m: any) => m && (m.title || m.plannedStart)).length : 0} {t('common.milestones')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Create Project Form */}
      <Box sx={{ mt: 6 }}>
        <Card sx={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
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
                  {t('dashboard.createProject.title')}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {t('dashboard.createProject.subtitle')}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={t('dashboard.createProject.nameLabel')}
                  placeholder={t('dashboard.createProject.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={t('dashboard.createProject.descriptionLabel')}
                  placeholder={t('dashboard.createProject.descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={createProject}
                  disabled={!name.trim() || loading}
                  startIcon={<AddIcon />}
                  sx={{ height: 56 }}
                >
                  {t('dashboard.createProject.button')}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

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
