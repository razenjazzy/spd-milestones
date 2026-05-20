import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon, IosShare as IosShareIcon } from "@mui/icons-material";
import { settingsAPI, usersAPI } from "../api/api";

type CustomFieldType = "text" | "dropdown" | "radio";

type CustomField = {
  id: string;
  name: string;
  section: string;
  fieldType: CustomFieldType;
  options: string[];
  hidden: boolean;
};

const csvToArray = (text: string) =>
  text
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const arrayToCsv = (arr?: string[]) => (Array.isArray(arr) ? arr.join(", ") : "");

const emptyUserForm = {
  email: "",
  name: "",
  password: "",
  role: "user" as "admin" | "user",
  pages: ["dashboard", "projects", "releases", "activities", "gantt", "calendar"] as string[],
  modules: ["projects", "milestones", "releases", "activities"] as string[],
  actions: ["view", "add", "edit"] as string[],
};

const defaultReleaseTemplate = `<STAGING> DEPLOYMENT - <{{releasePackage}}>

<Deployers Names> <Requesting your kind assignment for <STAGING> deployment of the <{{releasePackage}}>.>

<The release is large in comparison to other, please follow preparation, caution, study, recommendation as per documentation of release doc & deployment plan. Please let me know of any required assistance or query.>

Package Name : <{{releasePackage}}>
Package Link : <{{downloadLink}}>
Password : <{{downloadPassword}}>`;

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [savingUsers, setSavingUsers] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const [form, setForm] = useState({
    statusOptions: "",
    typeOptions: "",
    packageTypes: "",
    packageContents: "",
    responsibleOptions: "",
    teamOptions: "",
    departmentOptions: "",
    linkVisibilityTtlMinutes: "10",
    passwordRevealKey: "",
    approvalEmailTemplate: "",
    releaseMessageTemplate: defaultReleaseTemplate,
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [fieldDraft, setFieldDraft] = useState({
    name: "",
    section: "milestone",
    fieldType: "text" as CustomFieldType,
    options: "",
  });

  const [users, setUsers] = useState<any[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState(emptyUserForm);

  const loadUsers = async () => {
    const res = await usersAPI.list();
    setUsers(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await settingsAPI.get();
        const s = res.data || {};
        setForm({
          statusOptions: arrayToCsv(s.statusOptions),
          typeOptions: arrayToCsv(s.typeOptions),
          packageTypes: arrayToCsv(s.packageTypes),
          packageContents: arrayToCsv(s.packageContents),
          responsibleOptions: arrayToCsv(s.responsibleOptions),
          teamOptions: arrayToCsv(s.teamOptions),
          departmentOptions: arrayToCsv(s.departmentOptions),
          linkVisibilityTtlMinutes: String(s.linkVisibilityTtlMinutes || 10),
          passwordRevealKey: s.passwordRevealKey || "",
          approvalEmailTemplate: s.approvalEmailTemplate || "",
          releaseMessageTemplate: s.releaseMessageTemplate || defaultReleaseTemplate,
        });
        setCustomFields(Array.isArray(s.customFields) ? s.customFields : []);
      } catch {
        setSnackbar({ open: true, message: "Failed to load settings", severity: "error" });
      }
    })();

    (async () => {
      try {
        await loadUsers();
      } catch {
        setSnackbar({ open: true, message: "Failed to load users", severity: "error" });
      }
    })();
  }, []);

  const toggleValue = (field: "pages" | "modules" | "actions", value: string) => {
    setUserForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      await settingsAPI.update({
        statusOptions: csvToArray(form.statusOptions),
        typeOptions: csvToArray(form.typeOptions),
        packageTypes: csvToArray(form.packageTypes),
        packageContents: csvToArray(form.packageContents),
        responsibleOptions: csvToArray(form.responsibleOptions),
        teamOptions: csvToArray(form.teamOptions),
        departmentOptions: csvToArray(form.departmentOptions),
        linkVisibilityTtlMinutes: Number(form.linkVisibilityTtlMinutes) || 10,
        passwordRevealKey: form.passwordRevealKey.trim(),
        approvalEmailTemplate: form.approvalEmailTemplate,
        releaseMessageTemplate: form.releaseMessageTemplate,
        customFields,
      });
      setSnackbar({ open: true, message: "Settings saved", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to save settings", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const upsertUser = async () => {
    if (!userForm.email.trim()) {
      setSnackbar({ open: true, message: "Email is required", severity: "error" });
      return;
    }
    if (!editingUserId && !userForm.password.trim()) {
      setSnackbar({ open: true, message: "Password is required for new user", severity: "error" });
      return;
    }

    try {
      setSavingUsers(true);
      const payload: any = {
        email: userForm.email,
        name: userForm.name,
        role: userForm.role,
        permissions: {
          pages: userForm.pages,
          modules: userForm.modules,
          actions: userForm.actions,
        },
      };
      if (userForm.password.trim()) payload.password = userForm.password;

      if (editingUserId) {
        await usersAPI.update(editingUserId, payload);
      } else {
        await usersAPI.create(payload);
      }

      await loadUsers();
      setSnackbar({ open: true, message: editingUserId ? "User updated" : "User created", severity: "success" });
      setEditingUserId(null);
      setUserForm(emptyUserForm);
    } catch {
      setSnackbar({ open: true, message: "Failed to save user", severity: "error" });
    } finally {
      setSavingUsers(false);
    }
  };

  const editUser = (u: any) => {
    setEditingUserId(u._id);
    setUserForm({
      email: u.email || "",
      name: u.name || "",
      password: "",
      role: u.role || "user",
      pages: u.permissions?.pages || [],
      modules: u.permissions?.modules || [],
      actions: u.permissions?.actions || [],
    });
  };

  const removeUser = async (id: string) => {
    try {
      setSavingUsers(true);
      await usersAPI.delete(id);
      if (editingUserId === id) {
        setEditingUserId(null);
        setUserForm(emptyUserForm);
      }
      await loadUsers();
      setSnackbar({ open: true, message: "User deleted", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to delete user", severity: "error" });
    } finally {
      setSavingUsers(false);
    }
  };

  const addCustomField = () => {
    if (!fieldDraft.name.trim() || !fieldDraft.section.trim()) return;

    setCustomFields((prev) => [
      ...prev,
      {
        id: `field_${Date.now()}`,
        name: fieldDraft.name.trim(),
        section: fieldDraft.section.trim(),
        fieldType: fieldDraft.fieldType,
        options: fieldDraft.fieldType === "text" ? [] : csvToArray(fieldDraft.options),
        hidden: false,
      },
    ]);

    setFieldDraft({ name: "", section: "milestone", fieldType: "text", options: "" });
  };

  const deleteCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleHiddenField = (id: string) => {
    setCustomFields((prev) => prev.map((f) => (f.id === id ? { ...f, hidden: !f.hidden } : f)));
  };

  const persistPasswordRevealKey = async (key: string) => {
    await settingsAPI.update({ passwordRevealKey: key });
  };

  const generatePasswordRevealKey = async () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%*";
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    const generated = Array.from(bytes, (byte) => chars[byte % chars.length]).join("");

    setForm((prev) => ({ ...prev, passwordRevealKey: generated }));

    try {
      await persistPasswordRevealKey(generated);
      setSnackbar({ open: true, message: "One-time key generated", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to save one-time key", severity: "error" });
    }
  };

  const sharePasswordRevealKey = async () => {
    const key = form.passwordRevealKey.trim();
    if (!key) {
      setSnackbar({ open: true, message: "No key to share", severity: "error" });
      return;
    }

    try {
      await persistPasswordRevealKey(key);
      await navigator.clipboard.writeText(key);
      setSnackbar({ open: true, message: "Shared key copied", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to copy shared key", severity: "error" });
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
        Admin Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
                  Core Configuration
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Status options" value={form.statusOptions} onChange={(e) => setForm({ ...form, statusOptions: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Type options" value={form.typeOptions} onChange={(e) => setForm({ ...form, typeOptions: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Package types" value={form.packageTypes} onChange={(e) => setForm({ ...form, packageTypes: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Package contents" value={form.packageContents} onChange={(e) => setForm({ ...form, packageContents: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="One-time code TTL (minutes)" type="number" value={form.linkVisibilityTtlMinutes} onChange={(e) => setForm({ ...form, linkVisibilityTtlMinutes: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        fullWidth
                        type="text"
                        label="Password reveal shared key"
                        value={form.passwordRevealKey}
                        onChange={(e) => setForm({ ...form, passwordRevealKey: e.target.value })}
                      />
                      <IconButton
                        color="primary"
                        onClick={sharePasswordRevealKey}
                        aria-label="Share password reveal key"
                        title="Copy shared key"
                        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
                      >
                        <IosShareIcon fontSize="small" />
                      </IconButton>
                      <Button variant="outlined" onClick={generatePasswordRevealKey} sx={{ whiteSpace: "nowrap", minWidth: 96 }}>
                        Generate
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Package type/content are reusable metadata groups used in release and approval templates.
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
                  Milestone Assignment Lists
                </Typography>
                <Stack spacing={1.5}>
                  <TextField label="Responsible options" value={form.responsibleOptions} onChange={(e) => setForm({ ...form, responsibleOptions: e.target.value })} />
                  <TextField label="Team options" value={form.teamOptions} onChange={(e) => setForm({ ...form, teamOptions: e.target.value })} />
                  <TextField label="Department options" value={form.departmentOptions} onChange={(e) => setForm({ ...form, departmentOptions: e.target.value })} />
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
                  Templates
                </Typography>
                <Stack spacing={1.5}>
                  <TextField label="Approval email template" multiline minRows={10} value={form.approvalEmailTemplate} onChange={(e) => setForm({ ...form, approvalEmailTemplate: e.target.value })} />
                  <TextField label="Release deployment template" multiline minRows={8} value={form.releaseMessageTemplate} onChange={(e) => setForm({ ...form, releaseMessageTemplate: e.target.value })} />
                  <Typography variant="caption" color="text.secondary">
                    Release placeholders: {'{{releasePackage}}'}, {'{{downloadLink}}'}, {'{{downloadPassword}}'}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Box>
              <Button variant="contained" onClick={saveSettings} disabled={loading}>
                Save Admin Settings
              </Button>
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
                User Roles & Privileges
              </Typography>

              <Grid container spacing={1.25} sx={{ mb: 1.5 }}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Name" value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={editingUserId ? "Password (optional)" : "Password"} type="password" value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Select fullWidth value={userForm.role} onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value as "admin" | "user" }))}>
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </Grid>
              </Grid>

              <Grid container spacing={1}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2">Pages</Typography>
                  {["dashboard", "projects", "releases", "activities", "gantt", "calendar", "settings", "ai-cli", "tests"].map((item) => (
                    <FormControlLabel key={item} control={<Checkbox size="small" checked={userForm.pages.includes(item)} onChange={() => toggleValue("pages", item)} />} label={item} />
                  ))}
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2">Modules</Typography>
                  {["projects", "milestones", "releases", "activities", "settings", "ai-cli"].map((item) => (
                    <FormControlLabel key={item} control={<Checkbox size="small" checked={userForm.modules.includes(item)} onChange={() => toggleValue("modules", item)} />} label={item} />
                  ))}
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2">Actions</Typography>
                  {["view", "add", "edit", "delete"].map((item) => (
                    <FormControlLabel key={item} control={<Checkbox size="small" checked={userForm.actions.includes(item)} onChange={() => toggleValue("actions", item)} />} label={item} />
                  ))}
                </Grid>
              </Grid>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
                <Button variant="contained" onClick={upsertUser} disabled={savingUsers}>
                  {editingUserId ? "Update User" : "Create User"}
                </Button>
                {editingUserId && (
                  <Button variant="outlined" onClick={() => { setEditingUserId(null); setUserForm(emptyUserForm); }}>
                    Cancel Edit
                  </Button>
                )}
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Existing Users
              </Typography>

              <Stack spacing={0.75}>
                {users.map((u) => (
                  <Box key={u._id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1 }}>
                    <Box sx={{ display: "flex", alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, justifyContent: "space-between", gap: 1 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {u.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {u.role}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => editUser(u)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => removeUser(u._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      Pages: {(u.permissions?.pages || []).join(", ") || "-"}
                    </Typography>
                  </Box>
                ))}
                {!users.length && <Typography variant="body2" color="text.secondary">No users found.</Typography>}
              </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
                  Dynamic Field Builder
                </Typography>
                <Grid container spacing={1.5} sx={{ mb: 1 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Field name" value={fieldDraft.name} onChange={(e) => setFieldDraft((p) => ({ ...p, name: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Select fullWidth value={fieldDraft.section} onChange={(e) => setFieldDraft((p) => ({ ...p, section: String(e.target.value) }))}>
                      <MenuItem value="milestone">milestone</MenuItem>
                      <MenuItem value="release">release</MenuItem>
                      <MenuItem value="activity">activity</MenuItem>
                      <MenuItem value="project">project</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Select fullWidth value={fieldDraft.fieldType} onChange={(e) => setFieldDraft((p) => ({ ...p, fieldType: e.target.value as CustomFieldType }))}>
                      <MenuItem value="text">text</MenuItem>
                      <MenuItem value="dropdown">dropdown</MenuItem>
                      <MenuItem value="radio">radio</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Options (CSV)"
                      value={fieldDraft.options}
                      onChange={(e) => setFieldDraft((p) => ({ ...p, options: e.target.value }))}
                      disabled={fieldDraft.fieldType === "text"}
                    />
                  </Grid>
                </Grid>

                <Button variant="outlined" onClick={addCustomField}>
                  Add Field
                </Button>

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={1}>
                  {customFields.map((f) => (
                    <Box key={f.id} sx={{ display: "flex", flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: "space-between", gap: 1, border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        <Chip size="small" label={f.section} />
                        <Chip size="small" label={f.fieldType} color="info" variant="outlined" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {f.name}
                        </Typography>
                        {f.hidden && <Chip size="small" label="hidden" color="warning" />}
                      </Box>
                      <Stack direction="row" spacing={0.5} sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
                        <Button size="small" onClick={() => toggleHiddenField(f.id)}>
                          {f.hidden ? "Show" : "Hide"}
                        </Button>
                        <IconButton size="small" color="error" onClick={() => deleteCustomField(f.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                  ))}
                  {!customFields.length && <Typography variant="body2" color="text.secondary">No custom fields configured.</Typography>}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
