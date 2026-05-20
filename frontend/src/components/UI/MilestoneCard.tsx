import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Avatar,
  Button,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

interface MilestoneCardProps {
  milestone: {
    id: string;
    title: string;
    plannedStart: string;
    plannedEnd: string;
    actualStart?: string;
    actualEnd?: string;
    responsible?: string;
    teamName?: string;
    color?: string;
    plannedDuration?: number;
    delayDays?: number | null;
    status?: string;
    iterations?: any[];
  };
  index: number;
  onComplete?: (milestone: any) => void;
  onMenuOpen?: (event: React.MouseEvent<HTMLElement>, milestone: any) => void;
  showActions?: boolean;
}

export default function MilestoneCard({
  milestone,
  index,
  onComplete,
  onMenuOpen,
  showActions = true,
}: MilestoneCardProps) {
  const theme = useTheme();

  const isCompleted = !!milestone.actualEnd;
  const hasDelay = (milestone.delayDays ?? 0) > 0;
  const isOnTime = isCompleted && !hasDelay;

  const getStatusColor = () => {
    if (isOnTime) return 'success';
    if (hasDelay) return 'error';
    if (isCompleted) return 'warning';
    return 'info';
  };

  const getStatusText = () => {
    if (isOnTime) return 'Completed on time';
    if (hasDelay) return 'Delayed';
    if (isCompleted) return 'Completed';
    return 'In progress';
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onMenuOpen?.(event, milestone);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        boxShadow: 'none',
        transition: 'all 0.2s ease',
        '&:hover': { borderColor: theme.palette.primary.main },
        height: '100%',
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: milestone.color || theme.palette.primary.main,
              mr: 1.5,
            }}
          >
            {index + 1}
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1, lineHeight: 1.2 }}>
            {milestone.title}
          </Typography>
          {showActions && onMenuOpen && (
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{
                opacity: 0.7,
                '&:hover': { opacity: 1 },
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Status Chips */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Chip
            label={getStatusText()}
            size="small"
            color={getStatusColor() as any}
            variant="outlined"
          />
          {milestone.plannedDuration && milestone.plannedDuration > 0 && (
            <Chip
              label={`${milestone.plannedDuration}WD`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          )}
          {hasDelay && (
            <Chip
              label={`Delay: ${milestone.delayDays}d`}
              size="small"
              color="error"
              variant="outlined"
            />
          )}
        </Box>

        {/* Dates & Details */}
        <Typography variant="body2" color="text.secondary">
          <CalendarIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
          Planned: {new Date(milestone.plannedStart).toLocaleDateString()} →{' '}
          {new Date(milestone.plannedEnd).toLocaleDateString()}
        </Typography>

        {milestone.actualStart && milestone.actualEnd && (
          <Typography variant="body2" color="success.main">
            <CheckCircleIcon
              sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }}
            />
            Actual: {new Date(milestone.actualStart).toLocaleDateString()} →{' '}
            {new Date(milestone.actualEnd).toLocaleDateString()}
          </Typography>
        )}

        {milestone.responsible && (
          <Typography variant="body2" color="text.secondary">
            <PersonIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
            {milestone.responsible}
          </Typography>
        )}

        {milestone.teamName && (
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Team: {milestone.teamName}
          </Typography>
        )}

        {milestone.iterations && milestone.iterations.length > 0 && (
          <Typography variant="body2" color="warning.main" fontWeight={500}>
            {milestone.iterations.length} iteration
            {milestone.iterations.length > 1 ? 's' : ''}
          </Typography>
        )}

        {/* Mark Complete Button */}
        {!isCompleted && onComplete && (
          <Box sx={{ mt: 1 }}>
            <Button
              variant="contained"
              size="small"
              color="success"
              fullWidth
              onClick={() => onComplete(milestone)}
            >
              Mark as Complete
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
