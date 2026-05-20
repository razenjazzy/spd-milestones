import React, { useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { theme } from "./theme/theme";
import { LanguageProvider } from "./config/i18n";
import AppLayout from "./components/Layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ErrorPage from "./components/UI/ErrorPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import GanttView from "./pages/GanttView";
import GlobalGanttView from "./pages/GlobalGanttView";
import ActivityManager from "./pages/ActivityManager";
import ActivityCalendar from "./pages/ActivityCalendar";
import AiCli from "./pages/AiCli";
import Tests from "./pages/Tests";
import Releases from "./pages/Releases";
import Settings from "./pages/Settings";

function App() {
  // IDM Extension Blocker - Continuously remove IDM elements
  useEffect(() => {
    const removeIDMElements = () => {
      const idmSelectors = [
        '[class*="idm"]',
        '[id*="idm"]',
        '[class*="dmldm"]',
        '[id*="dmldm"]',
        'div[style*="z-index: 2147483647"]'
      ];
      
      idmSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            if (el.id !== 'root' && !el.closest('#root')) {
              el.remove();
            }
          });
        } catch (e) {
          // Silently ignore errors
        }
      });
    };

    // Run immediately
    removeIDMElements();

    // Run periodically
    const interval = setInterval(removeIDMElements, 1000);

    return () => clearInterval(interval);
  }, []);

  const router = createBrowserRouter([
    {
      path: '/login',
      element: <LoginPage />,
      errorElement: <ErrorPage />,
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AppLayout><Outlet /></AppLayout>
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
      children: [
        { path: '/', element: <Dashboard /> },
        { path: '/projects', element: <ProtectedRoute requiredPage="projects"><Projects /></ProtectedRoute> }, 
        { path: '/project/:id', element: <ProtectedRoute requiredPage="projects"><ProjectDetail /></ProtectedRoute> },
        { path: '/projects/:id', element: <ProtectedRoute requiredPage="projects"><ProjectDetail /></ProtectedRoute> },
        { path: '/project/:id/gantt', element: <ProtectedRoute requiredPage="gantt"><GanttView /></ProtectedRoute> },
        { path: '/project/:id/activities', element: <ProtectedRoute requiredPage="activities"><ActivityManager /></ProtectedRoute> },
        { path: '/projects/:id/activities', element: <ProtectedRoute requiredPage="activities"><ActivityManager /></ProtectedRoute> },
        { path: '/releases/:releaseId/activities', element: <ProtectedRoute requiredPage="activities"><ActivityManager /></ProtectedRoute> },
        { path: '/activities', element: <ProtectedRoute requiredPage="activities"><ActivityManager /></ProtectedRoute> },
        { path: '/activities/calendar', element: <ProtectedRoute requiredPage="calendar"><ActivityCalendar /></ProtectedRoute> },
        { path: '/releases', element: <ProtectedRoute requiredPage="releases"><Releases /></ProtectedRoute> },
        { path: '/settings', element: <ProtectedRoute requireAdmin><Settings /></ProtectedRoute> },
        { path: '/setting', element: <ProtectedRoute requireAdmin><Settings /></ProtectedRoute> },
        { path: '/ai-cli', element: <ProtectedRoute requireAdmin><AiCli /></ProtectedRoute> },
        { path: '/gantt', element: <ProtectedRoute requiredPage="gantt"><GlobalGanttView /></ProtectedRoute> },
        { path: '/global-gantt', element: <ProtectedRoute requiredPage="gantt"><GlobalGanttView /></ProtectedRoute> },
        { path: '/tests', element: <ProtectedRoute requireAdmin><Tests /></ProtectedRoute> },
      ],
    },
  ]);

  return (
    <LanguageProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
