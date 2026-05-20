import React from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
} from '@mui/material';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  secondaryAction 
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 4,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ color: 'grey.400', fontSize: 40 }}>
          {icon}
        </Box>
      </Box>
      
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
        {title}
      </Typography>
      
      <Typography 
        variant="body1" 
        sx={{ 
          color: 'text.secondary', 
          mb: 4, 
          maxWidth: 400,
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {action && (
          <Button
            variant="contained"
            onClick={action.onClick}
            sx={{ minWidth: 120 }}
          >
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button
            variant="outlined"
            onClick={secondaryAction.onClick}
            sx={{ minWidth: 120 }}
          >
            {secondaryAction.label}
          </Button>
        )}
      </Box>
    </Box>
  );
}
