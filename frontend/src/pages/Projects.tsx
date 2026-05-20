import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../config/i18n';
import {
	Box,
	Typography,
	Grid,
	Card,
	CardContent,
	Button,
	TextField,
	InputAdornment,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Menu,
	MenuItem as MenuOption,
	Alert,
	List,
	ListItem,
	ListItemText,
	ListItemAvatar,
	Avatar,
	Snackbar,
} from '@mui/material';
import {
	Add as AddIcon,
	Search as SearchIcon,
	Sort as SortIcon,
	Assignment as AssignmentIcon,
	TrendingUp as TrendingUpIcon,
	Warning as WarningIcon,
	CalendarToday as CalendarIcon,
	FolderOpen as FolderIcon,
	MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { projectAPI } from '../api/api';
import StatCard from '../components/UI/StatCard';
import ProjectCard from '../components/UI/ProjectCard';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemIcon from '@mui/material/ListItemIcon';
// ...existing code...
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmptyState from '../components/UI/EmptyState';
import {
	calculateProjectAnalytics,
	filterAndSortProjects,
	ProjectAnalytics,
	ProjectFilters,
} from '../utils/projectAnalytics';
import { format } from 'date-fns';

export default function Projects() {
	const { t } = useTranslation();
		const [createDialogOpen, setCreateDialogOpen] = useState(false);
		const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
	const [editDialog, setEditDialog] = useState<{ open: boolean; project: any | null }>({ open: false, project: null });
	const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; project: any | null }>({ open: false, project: null });
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const [selectedProject, setSelectedProject] = useState<any>(null);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [editForm, setEditForm] = useState({ name: "", description: "" });
	const navigate = useNavigate();
	const [projects, setProjects] = useState<any[]>([]);
	const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
	const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const [filters, setFilters] = useState<ProjectFilters>({
		search: '',
		status: 'all',
		sortBy: 'name',
		sortOrder: 'asc',
	});

	const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

	useEffect(() => {
		fetchProjects();
	}, []);

	useEffect(() => {
		if (projects.length > 0) {
			const analytics = calculateProjectAnalytics(projects);
			setAnalytics(analytics);

			const filtered = filterAndSortProjects(projects, filters);
			setFilteredProjects(filtered);
		}
	}, [projects, filters]);

	const fetchProjects = async () => {
		try {
			setLoading(true);
			const response = await projectAPI.getAll();
			const projectsData = response.data || [];
			
			// Ensure we have milestone counts - some endpoints may not include them in the list
			const enhanced = await Promise.all(
				projectsData.map(async (p: any) => {
					if (p.milestones && Array.isArray(p.milestones)) return p;
					try {
						const r = await projectAPI.getById(p._id);
						const detailed = r.data.project || r.data;
						return { ...p, milestones: detailed.milestones || [] };
					} catch (err) {
						return { ...p, milestones: [] };
					}
				})
			);
			setProjects(enhanced);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch projects');
		} finally {
			setLoading(false);
		}
	};

	const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, project: any) => {
		setMenuAnchor(e.currentTarget);
		setSelectedProject(project);
	};
	const handleMenuClose = () => {
		setMenuAnchor(null);
		setSelectedProject(null);
	};
	const handleEditProject = () => {
		setEditDialog({ open: true, project: selectedProject });
		setEditForm({ name: selectedProject?.name || "", description: selectedProject?.description || "" });
		handleMenuClose();
	};
	const handleDeleteProject = () => {
		setDeleteDialog({ open: true, project: selectedProject });
		handleMenuClose();
	};
	const updateProject = async () => {
		if (!editForm.name.trim() || !editDialog.project) return;
		try {
			setLoading(true);
			await projectAPI.update(editDialog.project._id, { name: editForm.name, description: editForm.description });
			setProjects(projects.map(p => p._id === editDialog.project!._id ? { ...p, name: editForm.name, description: editForm.description } : p));
			setSnackbar({ open: true, message: t('projects.notifications.updated'), severity: "success" });
			setEditDialog({ open: false, project: null });
		} catch {
			setSnackbar({ open: true, message: t('projects.notifications.updateError'), severity: "error" });
		} finally {
			setLoading(false);
		}
	};
	const deleteProject = async () => {
		if (!deleteDialog.project) return;
		try {
			setLoading(true);
			await projectAPI.delete(deleteDialog.project._id);
			setProjects(projects.filter(p => p._id !== deleteDialog.project!._id));
			setSnackbar({ open: true, message: t('projects.notifications.deleted'), severity: "success" });
			setDeleteDialog({ open: false, project: null });
		} catch {
			setSnackbar({ open: true, message: t('projects.notifications.deleteError'), severity: "error" });
		} finally {
			setLoading(false);
		}
	};
	const createProject = async () => {
		if (!name.trim()) return;
		try {
			setLoading(true);
			const res = await projectAPI.create({ name, description });
			setProjects([res.data, ...projects]);
			setName("");
			setDescription("");
			setSnackbar({ open: true, message: t('projects.notifications.created'), severity: "success" });
			setCreateDialogOpen(false);
		} catch {
			setSnackbar({ open: true, message: t('projects.notifications.createError'), severity: "error" });
		} finally {
			setLoading(false);
		}
	};

	const handleFilterChange = (field: keyof ProjectFilters, value: any) => {
		setFilters((prev) => ({ ...prev, [field]: value }));
	};

	const handleSort = (sortBy: ProjectFilters['sortBy']) => {
		setFilters((prev) => ({
			...prev,
			sortBy,
			sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
		}));
		setSortMenuAnchor(null);
	};

	if (loading) {
			return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box sx={{ py: 4 }}>
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			</Box>
		);
	}

	return (
		<Box sx={{ py: 4 }}>
			{/* Header */}
			<Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Box>
					<Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
						{t('projects.header.title')}
					</Typography>
					<Typography variant="body1" color="text.secondary">
						{t('projects.header.subtitle')}
					</Typography>
				</Box>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={() => setCreateDialogOpen(true)}
					sx={{ minWidth: 160 }}
				>
					{t('projects.header.create')}
				</Button>
			</Box>

			{/* Analytics Dashboard */}
			{analytics && (
				<Grid container spacing={3} sx={{ mb: 4 }}>
					{/* Additional Analytics */}
					<Grid item xs={12} md={3}>
						<StatCard title={t('projects.stats.activeProjects')} value={analytics.activeProjects} icon={<FolderIcon />} color="info" />
					</Grid>
					<Grid item xs={12} md={3}>
						<StatCard title={t('projects.stats.completedProjects')} value={analytics.completedProjects} icon={<TrendingUpIcon />} color="success" />
					</Grid>
					<Grid item xs={12} md={3}>
						<StatCard title={t('projects.stats.overdueMilestones')} value={analytics.overdueMilestones.length} icon={<WarningIcon />} color="error" />
					</Grid>
					<Grid item xs={12} md={3}>
						<StatCard title={t('projects.stats.avgProjectDuration')} value={`${Math.round(analytics.averageProjectDuration)} days`} icon={<CalendarIcon />} color="secondary" />
					</Grid>

					{/* Upcoming Deadlines */}
					<Grid item xs={12} md={6}>
						<Card sx={{ height: '100%' }}>
							<CardContent>
								<Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
									{t('projects.sections.upcomingDeadlines')}
								</Typography>
								{analytics.upcomingDeadlines.length > 0 ? (
									<List dense>
										{analytics.upcomingDeadlines.slice(0, 5).map((milestone, index) => (
											<ListItem key={index} divider={index < Math.min(analytics.upcomingDeadlines.length, 5) - 1}>
												<ListItemAvatar>
													<Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
														<CalendarIcon fontSize="small" />
													</Avatar>
												</ListItemAvatar>
												<ListItemText
													primary={milestone.title}
													secondary={format(new Date(milestone.plannedEnd), 'MMM dd, yyyy')}
													primaryTypographyProps={{ fontSize: '0.875rem' }}
													secondaryTypographyProps={{ fontSize: '0.75rem' }}
												/>
											</ListItem>
										))}
									</List>
								) : (
									<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
										{t('projects.sections.noUpcoming')}
									</Typography>
								)}
							</CardContent>
						</Card>
					</Grid>

					{/* Critical Projects Details */}
					<Grid item xs={12} md={6}>
						<Card sx={{ height: '100%' }}>
							<CardContent>
								<Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
									{t('projects.sections.criticalProjects')}
								</Typography>
								{analytics.criticalProjects.length > 0 ? (
									<List dense>
										{analytics.criticalProjects.slice(0, 5).map((project, index) => (
											<ListItem key={index} divider={index < Math.min(analytics.criticalProjects.length, 5) - 1}>
												<ListItemAvatar>
													<Avatar sx={{ bgcolor: 'error.main', width: 32, height: 32 }}>
														<WarningIcon fontSize="small" />
													</Avatar>
												</ListItemAvatar>
												<ListItemText
													primary={project.name}
													secondary={`${project.completionRate}% ${t('projects.card.complete')}`}
													primaryTypographyProps={{ fontSize: '0.875rem' }}
													secondaryTypographyProps={{ fontSize: '0.75rem' }}
												/>
											</ListItem>
										))}
									</List>
								) : (
									<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
										{t('projects.sections.noCritical')}
									</Typography>
								)}
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			)}

			{/* Filters and Search */}
			<Box sx={{ mb: 4 }}>
				<Grid container spacing={2} alignItems="center">
						<Grid item xs={12} sm={6} md={4}>
							<TextField
								fullWidth
								placeholder={t('projects.filters.searchPlaceholder')}
								value={filters.search}
								onChange={(e) => handleFilterChange('search', e.target.value)}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<SearchIcon />
										</InputAdornment>
									),
								}}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={3}>
							<FormControl fullWidth>
								<InputLabel>{t('projects.filters.statusLabel')}</InputLabel>
								<Select value={filters.status} label={t('projects.filters.statusLabel')} onChange={(e) => handleFilterChange('status', e.target.value)}>
									<MenuItem value="all">{t('projects.filters.statusAll')}</MenuItem>
									<MenuItem value="active">{t('projects.filters.statusActive')}</MenuItem>
									<MenuItem value="completed">{t('projects.filters.statusCompleted')}</MenuItem>
									<MenuItem value="critical">{t('projects.filters.statusCritical')}</MenuItem>
								</Select>
							</FormControl>
						</Grid>
						<Grid item xs={12} sm={6} md={3}>
							<Button fullWidth variant="outlined" startIcon={<SortIcon />} onClick={(e) => setSortMenuAnchor(e.currentTarget)}>
								{t('projects.filters.sortBy')} {filters.sortBy}
							</Button>
							<Menu anchorEl={sortMenuAnchor} open={Boolean(sortMenuAnchor)} onClose={() => setSortMenuAnchor(null)}>
								<MenuOption onClick={() => handleSort('name')}>{t('projects.sort.name')}</MenuOption>
								<MenuOption onClick={() => handleSort('created')}>{t('projects.sort.created')}</MenuOption>
								<MenuOption onClick={() => handleSort('deadline')}>{t('projects.sort.deadline')}</MenuOption>
								<MenuOption onClick={() => handleSort('completion')}>{t('projects.sort.completion')}</MenuOption>
							</Menu>
						</Grid>
						<Grid item xs={12} md={2}>
							<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
								{filteredProjects.length} {t('projects.filters.resultsCount')} {projects.length} {t('projects.filters.projects')}
							</Typography>
					</Grid>
				</Grid>
			</Box>

			{/* Create Project Dialog */}
					<Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
						<DialogTitle>{t('projects.dialog.create.title')}</DialogTitle>
						<DialogContent>
							<TextField
								fullWidth
								label={t('projects.dialog.create.nameLabel')}
								placeholder={t('projects.dialog.create.namePlaceholder')}
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								margin="normal"
							/>
							<TextField
								fullWidth
								label={t('projects.dialog.create.descriptionLabel')}
								placeholder={t('projects.dialog.create.descriptionPlaceholder')}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								margin="normal"
							/>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setCreateDialogOpen(false)} color="inherit" sx={{ '&:hover': { backgroundColor: '#e0e0e0' } }}>{t('projects.dialog.create.cancel')}</Button>
							<Button variant="contained" onClick={createProject} disabled={!name.trim() || loading} startIcon={<AddIcon />}>
								{t('projects.dialog.create.submit')}
							</Button>
						</DialogActions>
					</Dialog>

					{/* Projects Grid */}
					{filteredProjects.length === 0 ? (
						<Card sx={{ mt: 6, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', textAlign: 'center', py: 6 }}>
							<CardContent>
								<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
									<Box sx={{ width: 56, height: 56, borderRadius: 2, background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
										<FolderIcon sx={{ color: 'white', fontSize: 32 }} />
									</Box>
									<Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
										{t('projects.empty.title')}
									</Typography>
									<Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 400, mb: 3 }}>
										{filters.search || filters.status !== 'all'
											? t('projects.empty.messageFiltered')
											: t('projects.empty.messageEmpty')}
									</Typography>
									<Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
										{t('projects.empty.createButton')}
									</Button>
								</Box>
							</CardContent>
						</Card>
					) : (
						<Grid container spacing={3}>
							{filteredProjects.map((project) => (
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
													<Typography
														variant="caption"
														sx={{
															background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
															color: '#1565c0',
															padding: '2px 8px',
															borderRadius: '12px',
															fontSize: '0.75rem',
															fontWeight: 500,
														}}
													>
														{new Date(project.createdAt).toLocaleDateString()}
													</Typography>
												</Box>
												<IconButton 
													size="small" 
													onClick={(e) => {
														e.stopPropagation();
														handleMenuOpen(e, project);
													}}
													sx={{ ml: 1 }}
												>
													<MoreVertIcon />
												</IconButton>
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
											<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
												<Typography variant="caption" sx={{ color: "text.secondary" }}>
													{Array.isArray(project.milestones) ? project.milestones.filter((m: any) => m && (m.title || m.plannedStart)).length : 0} {t('projects.card.milestones')}
												</Typography>
												{project.completionRate !== undefined && (
													<Typography 
														variant="caption" 
														sx={{ 
															color: project.completionRate === 100 ? 'success.main' : project.completionRate > 50 ? 'warning.main' : 'error.main',
															fontWeight: 600 
														}}
													>
														{project.completionRate}% {t('projects.card.complete')}
													</Typography>
												)}
											</Box>
										</CardContent>
									</Card>
								</Grid>
							))}
						</Grid>
					)}

					{/* Edit Project Dialog */}
					<Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, project: null })} maxWidth="sm" fullWidth>
						<DialogTitle>{t('projects.dialog.edit.title')}</DialogTitle>
						<DialogContent>
							<TextField
								fullWidth
								label={t('projects.dialog.create.nameLabel')}
								value={editForm.name}
								onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
								margin="normal"
								required
							/>
							<TextField
								fullWidth
								label={t('projects.dialog.create.descriptionLabel')}
								value={editForm.description}
								onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
								margin="normal"
								multiline
								rows={3}
							/>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setEditDialog({ open: false, project: null })}>{t('projects.dialog.edit.cancel')}</Button>
							<Button variant="contained" onClick={updateProject} disabled={loading}>
								{t('projects.dialog.edit.submit')}
							</Button>
						</DialogActions>
					</Dialog>

					{/* Delete Project Dialog */}
					<Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, project: null })}>
						<DialogTitle>{t('projects.dialog.delete.title')}</DialogTitle>
						<DialogContent>
							<Typography>
								{t('projects.dialog.delete.message').replace('{name}', deleteDialog.project?.name || '')}
							</Typography>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setDeleteDialog({ open: false, project: null })}>{t('projects.dialog.delete.cancel')}</Button>
							<Button variant="contained" color="error" onClick={deleteProject} disabled={loading}>
								{t('projects.dialog.delete.submit')}
							</Button>
						</DialogActions>
					</Dialog>

					{/* Project Menu */}
					<Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
					<MenuItem onClick={handleEditProject}>
							<ListItemIcon>
								<EditIcon fontSize="small" />
							</ListItemIcon>
							<ListItemText>{t('projects.card.edit')}</ListItemText>
						</MenuItem>
					<MenuItem onClick={handleDeleteProject} sx={{ color: 'error.main' }}>
							<ListItemIcon>
								<DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
							</ListItemIcon>
							<ListItemText>{t('projects.card.delete')}</ListItemText>
						</MenuItem>
					</Menu>

					{/* Snackbar for notifications */}
					<Snackbar
						open={snackbar.open}
						autoHideDuration={6000}
						onClose={() => setSnackbar({ ...snackbar, open: false })}
						anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
					>
						<Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
							{snackbar.message}
						</Alert>
					</Snackbar>
		</Box>
	);
}