import React, { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Tabs,
  Tab,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api/api";
import { logger } from "../utils/logger";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerRole, setRegisterRole] = useState<"user" | "admin">("user");
  const [registerKey, setRegisterKey] = useState("");

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await authAPI.login(loginEmail, loginPassword);
      const { token, id, email, role, permissions } = response.data;

      // Store token and user info
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify({ id, email, role, permissions }));

      logger.debug("Login successful", { email, role });
      setSuccess("Login successful! Redirecting...");
      
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || "Login failed";
      setError(message);
      logger.error("Login error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await authAPI.register(registerEmail, registerPassword, registerName, registerRole, registerKey || undefined);
      
      logger.debug("Registration successful", response.data);
      setSuccess("Registration successful! Please login with your credentials.");
      
      // Switch to login tab
      setTimeout(() => {
        setTabValue(0);
        setRegisterEmail("");
        setRegisterPassword("");
        setRegisterName("");
        setRegisterRole("user");
        setRegisterKey("");
      }, 1500);
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || "Registration failed";
      setError(message);
      logger.error("Registration error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ display: "flex", alignItems: "center", minHeight: "100vh", py: 4 }}>
      <Paper elevation={3} sx={{ width: "100%", p: 0 }}>
        {/* Header */}
        <Box sx={{ bgcolor: "primary.main", color: "white", p: 3, textAlign: "center" }}>
          <Typography variant="h4" fontWeight="bold">
            SPD Milestones
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            Project Dashboard & Timeline Management
          </Typography>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ m: 2 }}>
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="auth tabs"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            px: 2,
          }}
        >
          <Tab label="Login" id="auth-tab-0" aria-controls="auth-tabpanel-0" />
          <Tab label="Register" id="auth-tab-1" aria-controls="auth-tabpanel-1" />
        </Tabs>

        {/* Login Tab */}
        <TabPanel value={tabValue} index={0}>
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3 }}
              type="submit"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Login"}
            </Button>
          </form>
        </TabPanel>

        {/* Register Tab */}
        <TabPanel value={tabValue} index={1}>
          <form onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="Full Name"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              margin="normal"
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              helperText="At least 6 characters"
            />
            <TextField
              fullWidth
              select
              label="Role"
              value={registerRole}
              onChange={(e) => setRegisterRole(e.target.value as "user" | "admin")}
              margin="normal"
              disabled={loading}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
            {registerRole === "admin" && (
              <TextField
                fullWidth
                label="Admin Registration Key"
                type="password"
                value={registerKey}
                onChange={(e) => setRegisterKey(e.target.value)}
                margin="normal"
                required
                disabled={loading}
              />
            )}
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3 }}
              type="submit"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Register"}
            </Button>
          </form>
        </TabPanel>

        {/* Footer */}
        <Box sx={{ bgcolor: "background.default", p: 2, textAlign: "center", borderTop: 1, borderColor: "divider" }}>
          <Typography variant="caption" color="textSecondary">
            Admin account required for archive management
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
