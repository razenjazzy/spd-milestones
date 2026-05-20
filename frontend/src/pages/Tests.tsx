import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Science as ScienceIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import api from '../api/api';
import { useTranslation } from '../config/i18n';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  results: TestResult[];
}

export default function Tests() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TestReport | null>(null);
  const [error, setError] = useState('');

  const runTests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.post('/tests/run');
      setReport(response.data.report);
    } catch (err: any) {
      setError(err.response?.data?.error || t('tests.notifications.runError'));
    } finally {
      setLoading(false);
    }
  };

  const successRate = report
    ? ((report.passedTests / report.totalTests) * 100).toFixed(1)
    : '0';

  return (
    <Box sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {t('tests.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('tests.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
          onClick={runTests}
          disabled={loading}
          sx={{ minWidth: 160 }}
        >
          {loading ? t('tests.runningButton') : t('tests.runButton')}
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
            Module Smoke Navigation
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
            <Button component={Link} to="/projects" variant="outlined" startIcon={<OpenInNewIcon />}>
              Projects Module
            </Button>
            <Button component={Link} to="/gantt" variant="outlined" startIcon={<OpenInNewIcon />}>
              Gantt Module
            </Button>
            <Button component={Link} to="/activities" variant="outlined" startIcon={<OpenInNewIcon />}>
              Activities Planner
            </Button>
            <Button component={Link} to="/activities/calendar" variant="outlined" startIcon={<OpenInNewIcon />}>
              Activities Calendar
            </Button>
            <Button component={Link} to="/ai-cli" variant="outlined" startIcon={<OpenInNewIcon />}>
              AI CLI Module
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Test Summary */}
      {report && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ScienceIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('tests.summary.total')}
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {report.totalTests}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SuccessIcon sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('tests.summary.passed')}
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {report.passedTests}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ErrorIcon sx={{ mr: 1, color: 'error.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('tests.summary.failed')}
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {report.failedTests}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {t('tests.summary.successRate')}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {successRate}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(successRate)}
                    sx={{ mt: 2 }}
                    color={parseFloat(successRate) === 100 ? 'success' : parseFloat(successRate) > 50 ? 'warning' : 'error'}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Test Results Table */}
          <Card>
            <CardContent>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('tests.results.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('tests.results.duration')}: {report.duration}ms | Completed: {new Date(report.timestamp).toLocaleString()}
                </Typography>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>{t('tests.results.status')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t('tests.results.name')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t('tests.results.duration')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.results.map((result, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          {result.passed ? (
                            <Chip
                              icon={<CheckIcon />}
                              label="PASS"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<ErrorIcon />}
                              label="FAIL"
                              color="error"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>{result.name}</TableCell>
                        <TableCell>{result.duration}ms</TableCell>
                        <TableCell>
                          {result.error && (
                            <Typography
                              variant="body2"
                              color="error"
                              sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                            >
                              {result.error}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!report && !loading && !error && (
        <Card sx={{ textAlign: 'center', py: 8, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
          <CardContent>
            <ScienceIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              No Tests Run Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Click the "Run Tests" button to execute the comprehensive test suite
            </Typography>
            <Button variant="contained" startIcon={<PlayIcon />} onClick={runTests}>
              Run Tests Now
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
