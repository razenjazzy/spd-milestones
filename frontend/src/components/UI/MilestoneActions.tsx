import React from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface MilestoneActionsProps {
  milestone: any;
  onEdit?: (milestone: any) => void;
  onDelete?: (milestone: any) => void;
  anchorEl?: HTMLElement | null;
  onMenuOpen?: (event: React.MouseEvent<HTMLElement>) => void;
  onMenuClose?: () => void;
}

export default function MilestoneActions({
  milestone,
  onEdit,
  onDelete,
  anchorEl,
  onMenuOpen,
  onMenuClose,
}: MilestoneActionsProps) {
  const handleEdit = () => {
    onEdit?.(milestone);
    onMenuClose?.();
  };

  const handleDelete = () => {
    onDelete?.(milestone);
    onMenuClose?.();
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={onMenuOpen}
        sx={{
          opacity: 0.7,
          '&:hover': { opacity: 1 },
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Milestone</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Milestone</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}