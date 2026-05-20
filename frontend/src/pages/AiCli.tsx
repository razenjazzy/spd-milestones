import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { aiAPI } from "../api/api";

const initialStructured = {
  entity: "activity",
  action: "add",
  scope: "project",
  scopeContextId: "",
  releaseId: "",
  id: "",
  fields: "{\n  \"title\": \"Night deploy\",\n  \"date\": \"2026-05-10\",\n  \"type\": \"release\"\n}",
};

export default function AiCli() {
  const [provider, setProvider] = useState<"gemini" | "local" | "gemini-cli">("local");
  const [model, setModel] = useState("gemini-2.0-flash-lite");
  const [mode, setMode] = useState<"prompt" | "agent">("agent");
  const [scope, setScope] = useState<"any" | "project" | "release" | "standalone">("project");
  const [scopeContextId, setScopeContextId] = useState("");
  const [prompt, setPrompt] = useState('add activity "DB patch" on 2026-05-12 hotfix');
  const [structured, setStructured] = useState(initialStructured);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" | "warning" });

  const runPrompt = async () => {
    try {
      setLoading(true);
      const res = await aiAPI.runCommand({
        prompt,
        provider,
        model: provider === "gemini" || provider === "gemini-cli" ? model : undefined,
        projectId: scope === "project" ? (scopeContextId || undefined) : undefined,
      });
      setResult(res.data?.result || res.data);
      if (res.data?.result?.status === "cli-response") {
        setSnackbar({ open: true, message: "Gemini CLI connected to your codebase and responded", severity: "success" });
      } else if (res.data?.result?.status === "no-op") {
        setSnackbar({ open: true, message: res.data?.result?.message || "Prompt not recognized. No changes were applied.", severity: "warning" });
      } else if (res.data?.result?.fallbackReason) {
        setSnackbar({ open: true, message: "Gemini fallback applied to local parser and command executed", severity: "warning" });
      } else {
        setSnackbar({ open: true, message: "Prompt executed", severity: "success" });
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.response?.data?.error || "Prompt could not run; no changes applied", severity: "warning" });
    } finally {
      setLoading(false);
    }
  };

  const runStructured = async () => {
    try {
      setLoading(true);
      const parsed = JSON.parse(structured.fields || "{}");
      const res = await aiAPI.runCommand({
        provider,
        model: provider === "gemini" || provider === "gemini-cli" ? model : undefined,
        projectId: scope === "project" ? (scopeContextId || undefined) : undefined,
        command: {
          entity: structured.entity,
          action: structured.action,
          projectId: scope === "project" ? (structured.scopeContextId || scopeContextId || undefined) : undefined,
          id: structured.id || undefined,
          fields: {
            ...parsed,
            ...(scope !== "any" ? { scope } : {}),
            ...(scope === "release" ? { releaseId: structured.releaseId || scopeContextId || undefined } : {}),
          },
        },
      });
      setResult(res.data?.result || res.data);
      setSnackbar({ open: true, message: "Structured command executed", severity: "success" });
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.response?.data?.error || err?.message || "Structured command failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <IconButton component={Link} to="/projects">
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            AI CLI
          </Typography>
          <Typography color="text.secondary">Agent-like CRUD command center for project, milestone, release, and activity scopes</Typography>
        </Box>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Provider</InputLabel>
              <Select label="Provider" value={provider} onChange={(e) => setProvider(e.target.value as "gemini" | "local" | "gemini-cli")}>
                <MenuItem value="gemini-cli">Gemini CLI</MenuItem>
                <MenuItem value="gemini">Gemini (free-tier)</MenuItem>
                <MenuItem value="local">Local parser</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              sx={{ minWidth: 220 }}
              disabled={provider === "local"}
            />

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Mode</InputLabel>
              <Select label="Mode" value={mode} onChange={(e) => setMode(e.target.value as "prompt" | "agent")}> 
                <MenuItem value="agent">Agent mode</MenuItem>
                <MenuItem value="prompt">Prompt mode</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Scope</InputLabel>
              <Select label="Scope" value={scope} onChange={(e) => setScope(e.target.value as "any" | "project" | "release" | "standalone")}> 
                <MenuItem value="project">Project scope</MenuItem>
                <MenuItem value="release">Release scope</MenuItem>
                <MenuItem value="standalone">Standalone scope</MenuItem>
                <MenuItem value="any">Any scope</MenuItem>
              </Select>
            </FormControl>

            {scope !== "any" && scope !== "standalone" && (
              <TextField
                size="small"
                label={scope === "release" ? "Release ID" : "Project ID"}
                value={scopeContextId}
                onChange={(e) => {
                  const next = e.target.value;
                  setScopeContextId(next);
                  setStructured((s) => ({
                    ...s,
                    scopeContextId: next,
                    ...(scope === "release" ? { releaseId: next } : {}),
                  }));
                }}
                sx={{ minWidth: 280 }}
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      {mode === "prompt" && (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.25, fontWeight: 700 }}>Prompt mode</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
                Examples: add activity "Go live" on 2026-05-12 release, add release "Patch 1.2.3" status staging type security-fix, update milestone 663cc2... 2026-05-10 2026-05-14, add standalone maintenance activity, or create a release-linked hotfix activity.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={8}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type natural language command"
              />
              <Button sx={{ mt: 1.25 }} variant="contained" onClick={runPrompt} disabled={loading || !prompt.trim()}>
                Run prompt
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}

      {mode === "agent" && (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.25, fontWeight: 700 }}>Agent mode (guided options)</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
                Select entity, action, scope and fields. This sends a structured AI command and executes CRUD directly.
              </Typography>
              <Stack spacing={1}>
                <Select
                  size="small"
                  value={structured.entity}
                  onChange={(e) => setStructured((s) => ({ ...s, entity: String(e.target.value) }))}
                >
                  <MenuItem value="project">project</MenuItem>
                  <MenuItem value="milestone">milestone</MenuItem>
                  <MenuItem value="release">release</MenuItem>
                  <MenuItem value="activity">activity</MenuItem>
                </Select>
                <Select
                  size="small"
                  value={structured.action}
                  onChange={(e) => setStructured((s) => ({ ...s, action: String(e.target.value) }))}
                >
                  <MenuItem value="add">add</MenuItem>
                  <MenuItem value="update">update</MenuItem>
                  <MenuItem value="delete">delete</MenuItem>
                </Select>
                <TextField
                  size="small"
                  label="Scope Context ID (project/release)"
                  value={structured.scopeContextId}
                  onChange={(e) => setStructured((s) => ({ ...s, scopeContextId: e.target.value }))}
                  disabled={scope === "any" || scope === "standalone"}
                />
                <TextField
                  size="small"
                  label="Release ID (optional)"
                  value={structured.releaseId}
                  onChange={(e) => setStructured((s) => ({ ...s, releaseId: e.target.value }))}
                  disabled={scope !== "release"}
                />
                <TextField
                  size="small"
                  label="Entity ID (for update/delete)"
                  value={structured.id}
                  onChange={(e) => setStructured((s) => ({ ...s, id: e.target.value }))}
                />
                <TextField
                  label="Fields JSON"
                  multiline
                  rows={6}
                  value={structured.fields}
                  onChange={(e) => setStructured((s) => ({ ...s, fields: e.target.value }))}
                />
              </Stack>
              <Button sx={{ mt: 1.25 }} variant="contained" onClick={runStructured} disabled={loading}>
                Run agent command
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Gemini CLI mode runs against your project codebase path on backend; when unavailable it automatically falls back to local parser.
          </Typography>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Result</Typography>
          <Box sx={{
            background: "#0f172a",
            color: "#dbeafe",
            p: 1.5,
            borderRadius: 1,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
            fontSize: 12,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            minHeight: 160,
          }}>
            {result ? JSON.stringify(result, null, 2) : "No result yet."}
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
    </Box>
  );
}
