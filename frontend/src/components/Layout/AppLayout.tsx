import React, { useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useTranslation } from '../../config/i18n';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../../styles/layout.css';
import {
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  Menu as MenuIcon,
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  ViewTimeline as ViewTimelineIcon,
  EventNote as EventNoteIcon,
  CalendarMonth as CalendarMonthIcon,
  SmartToy as SmartToyIcon,
  Science as ScienceIcon,
  RocketLaunch as RocketLaunchIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { projects, loading } = useProjects();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  // Get user from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const hasPage = (page: string) => user?.role === 'admin' || user?.permissions?.pages?.includes(page);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isActivitiesActive = location.pathname === '/activities' || /^\/project\/[^/]+\/activities$/.test(location.pathname) || /^\/projects\/[^/]+\/activities$/.test(location.pathname);
  const isGanttActive = location.pathname.startsWith('/gantt') || location.pathname.startsWith('/global-gantt');

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    handleUserMenuClose();
    navigate('/login');
  };

  return (
    <Box className="app-layout">
      {/* Header */}
      <AppBar position="sticky" elevation={0} className="app-header">
        <Toolbar className="app-toolbar" sx={{ justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box className="app-logo-container">
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Box className="app-logo-icon">
                <TimelineIcon />
              </Box>
              <Typography variant="h6" className="app-title">
                {t('app.name')}
              </Typography>
            </Link>
          </Box>

          {/* Desktop Nav */}
          {!isMobile && (
            <Box className="app-nav">
              <Button
                component={Link}
                to="/"
                startIcon={<DashboardIcon />}
                variant="text"
                disableRipple
                disableElevation
                className={`app-nav-link ${isActive('/') ? 'app-nav-link-active' : ''}`}
              >
                {t('nav.dashboard')}
              </Button>

              {hasPage('projects') && (
                <Button
                  component={Link}
                  to="/projects"
                  startIcon={<FolderIcon />}
                  variant="text"
                  disableRipple
                  disableElevation
                  className={`app-nav-link ${isActive('/projects') ? 'app-nav-link-active' : ''}`}
                >
                  {t('nav.projects')}
                </Button>
              )}

              {hasPage('releases') && (
                <Button
                  component={Link}
                  to="/releases"
                  startIcon={<RocketLaunchIcon />}
                  variant="text"
                  disableRipple
                  disableElevation
                  className={`app-nav-link ${isActive('/releases') ? 'app-nav-link-active' : ''}`}
                >
                  {t('nav.release')}
                </Button>
              )}

              {hasPage('activities') && (
                <Button
                  component={Link}
                  to="/activities"
                  startIcon={<EventNoteIcon />}
                  variant="text"
                  disableRipple
                  disableElevation
                  className={`app-nav-link ${isActivitiesActive ? 'app-nav-link-active' : ''}`}
                >
                  Activity
                </Button>
              )}

              {hasPage('gantt') && (
                <Button
                  component={Link}
                  to="/gantt"
                  startIcon={<ViewTimelineIcon />}
                  variant="text"
                  disableRipple
                  disableElevation
                  className={`app-nav-link ${isGanttActive ? 'app-nav-link-active' : ''}`}
                >
                  {t('nav.ganttView')}
                </Button>
              )}

              {hasPage('calendar') && (
                <Button
                  component={Link}
                  to="/activities/calendar"
                  startIcon={<CalendarMonthIcon />}
                  variant="text"
                  disableRipple
                  disableElevation
                  className={`app-nav-link ${isActive('/activities/calendar') ? 'app-nav-link-active' : ''}`}
                >
                  Activity Calendar
                </Button>
              )}

              {user?.role === 'admin' && (
                <>
                  <Button
                    component={Link}
                    to="/ai-cli"
                    startIcon={<SmartToyIcon />}
                    variant="text"
                    disableRipple
                    disableElevation
                    className={`app-nav-link ${isActive('/ai-cli') ? 'app-nav-link-active' : ''}`}
                  >
                    AI CLI
                  </Button>

                  <Button
                    component={Link}
                    to="/settings"
                    startIcon={<SettingsIcon />}
                    variant="text"
                    disableRipple
                    disableElevation
                    className={`app-nav-link ${isActive('/settings') ? 'app-nav-link-active' : ''}`}
                  >
                    Settings
                  </Button>

                  <Button
                    component={Link}
                    to="/tests"
                    startIcon={<ScienceIcon />}
                    variant="text"
                    disableRipple
                    disableElevation
                    className={`app-nav-link ${isActive('/tests') ? 'app-nav-link-active' : ''}`}
                  >
                    Test
                  </Button>
                </>
              )}
            </Box>
          )}

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            <IconButton
              onClick={handleUserMenuOpen}
              color="inherit"
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">{user?.email}</Typography>
              </MenuItem>
              <MenuItem disabled>
                <Typography variant="caption">Role: {user?.role}</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>

          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              onClick={() => setMobileMenuOpen(true)}
              disableRipple
              className="app-mobile-menu-button"
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Mobile Drawer Menu */}
          {isMobile && mobileMenuOpen && (
            <Box className="app-mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
              <Box className="app-mobile-drawer" onClick={e => e.stopPropagation()}>
                <Button
                  component={Link}
                  to="/"
                  startIcon={<DashboardIcon />}
                  variant="text"
                  disableRipple
                  disableElevation
                  className={`app-mobile-drawer-link ${isActive('/') ? 'app-mobile-drawer-link-active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.dashboard')}
                </Button>

                <Button
                  disableRipple
                  disableElevation
                  variant="text"
                  className="app-mobile-drawer-link"
                  onClick={() => setProjectsDropdownOpen(o => !o)}
                  endIcon={<ExpandMoreIcon />}
                >
                  {t('nav.projects')}
                </Button>

                {projectsDropdownOpen && (
                  <Box className="app-mobile-drawer-dropdown-content">
                    <Button
                      component={Link}
                      to="/projects"
                      disableRipple
                      disableElevation
                      className={`app-mobile-drawer-sublink ${location.pathname === '/projects' ? 'app-mobile-drawer-sublink-active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      All Projects
                    </Button>
                    {loading ? (
                      <Typography style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading...</Typography>
                    ) : (
                      projects.map(project => (
                        <Button
                          key={project._id}
                          component={Link}
                          to={`/project/${project._id}`}
                          disableRipple
                          disableElevation
                          className={`app-mobile-drawer-sublink ${location.pathname === `/project/${project._id}` ? 'app-mobile-drawer-sublink-active' : ''}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {project.name}
                        </Button>
                      ))
                    )}
                  </Box>
                )}

                {hasPage('releases') && (
                  <Button
                    component={Link}
                    to="/releases"
                    startIcon={<RocketLaunchIcon />}
                    variant="text"
                    disableRipple
                    disableElevation
                    className={`app-mobile-drawer-link ${location.pathname === '/releases' ? 'app-mobile-drawer-link-active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.release')}
                  </Button>
                )}

                {hasPage('activities') && (
                  <Button
                    component={Link}
                    to="/activities"
                    startIcon={<EventNoteIcon />}
                    variant="text"
                    disableRipple
                    disableElevation
                    className={`app-mobile-drawer-link ${isActivitiesActive ? 'app-mobile-drawer-link-active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Activity
                  </Button>
                )}

                {hasPage('gantt') && (
                  <Button
                    component={Link}
                    to="/gantt"
                    startIcon={<ViewTimelineIcon />}
                    variant="text"
                    disableRipple
                    disableElevation
                    className={`app-mobile-drawer-link ${isGanttActive ? 'app-mobile-drawer-link-active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Gantt View
                  </Button>
                )}

                {hasPage('calendar') && (
                  <Button
                    component={Link}
                    to="/activities/calendar"
                    startIcon={<CalendarMonthIcon />}
                    variant="text"
                    disableRipple
                    disableElevation
                    className={`app-mobile-drawer-link ${location.pathname === '/activities/calendar' ? 'app-mobile-drawer-link-active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Activity Calendar
                  </Button>
                )}

                {hasPage('ai-cli') && (
                  <>
                    <Button
                      component={Link}
                      to="/ai-cli"
                      startIcon={<SmartToyIcon />}
                      variant="text"
                      disableRipple
                      disableElevation
                      className={`app-mobile-drawer-link ${location.pathname === '/ai-cli' ? 'app-mobile-drawer-link-active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      AI CLI
                    </Button>

                    <Button
                      component={Link}
                      to="/settings"
                      startIcon={<SettingsIcon />}
                      variant="text"
                      disableRipple
                      disableElevation
                      className={`app-mobile-drawer-link ${location.pathname === '/settings' ? 'app-mobile-drawer-link-active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Settings
                    </Button>

                    <Button
                      component={Link}
                      to="/tests"
                      startIcon={<ScienceIcon />}
                      variant="text"
                      disableRipple
                      disableElevation
                      className={`app-mobile-drawer-link ${location.pathname === '/tests' ? 'app-mobile-drawer-link-active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Test
                    </Button>
                  </>
                )}

                {!loading && projects.length > 0 && (
                  <Box className="app-mobile-drawer-dropdown-content">
                    {projects.map(project => (
                      <Button
                        key={`gantt-${project._id}`}
                        component={Link}
                        to={`/project/${project._id}/gantt`}
                        disableRipple
                        disableElevation
                        className={`app-mobile-drawer-sublink ${location.pathname === `/project/${project._id}/gantt` ? 'app-mobile-drawer-sublink-active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {project.name} Gantt
                      </Button>
                    ))}
                  </Box>
                )}

                <Button
                  onClick={handleLogout}
                  startIcon={<LogoutIcon />}
                  variant="text"
                  disableRipple
                  disableElevation
                  className="app-mobile-drawer-link"
                  sx={{ mt: 2, borderTop: 1, borderColor: 'divider', pt: 2 }}
                >
                  Logout
                </Button>
              </Box>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="main" className="app-main">
        <Container maxWidth="xl">{children}</Container>
      </Box>
    </Box>
  );
}
