import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  useTheme,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  Folder as FolderIcon,
  Timeline as TimelineIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

interface ProjectCardProps {
  project: {
    _id: string;
    name: string;
    description?: string;
    createdAt: string;
    milestones?: any[];
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const theme = useTheme();
  const milestoneCount = project.milestones?.length || 0;

  return (
    <Card
      component={Link}
      to={`/project/${project._id}`}
      sx={{
        height: '100%',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          '& .project-arrow': {
            transform: 'translateX(4px)',
          },
        },
      }}
    >
      <CardContent sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <FolderIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.3 }}>
              {project.name}
            </Typography>
            <Chip
              label={new Date(project.createdAt).toLocaleDateString()}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          </Box>
        </Box>

        {project.description && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {milestoneCount} {milestoneCount === 1 ? 'milestone' : 'milestones'}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
        <Typography
          variant="body2"
          sx={{
            color: 'primary.main',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          View Project
          <ArrowForwardIcon
            className="project-arrow"
            sx={{
              fontSize: 16,
              transition: 'transform 0.2s ease',
            }}
          />
        </Typography>
        
        <IconButton
          component={Link}
          to={`/project/${project._id}/gantt`}
          size="small"
          onClick={(e) => e.stopPropagation()}
          sx={{
            color: 'text.secondary',
            '&:hover': { color: 'primary.main' },
          }}
        >
          <TimelineIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </CardActions>
    </Card>
  );
}
