import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { getMilestoneStatus } from '../../utils/milestoneUtils';
import { APP_CONFIG } from '../../config/constants';
import { format } from 'date-fns';

interface DraggableMilestone {
  _id: string;
  title: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  responsible: string;
  teamName: string;
  color: string;
  order: number;
  delayDays?: number;
}

interface DraggableMilestoneListProps {
  milestones: DraggableMilestone[];
  onReorder: (milestones: DraggableMilestone[]) => void;
  onEdit: (milestone: DraggableMilestone) => void;
  onDelete: (milestone: DraggableMilestone) => void;
  onChangeStatus: (milestone: DraggableMilestone) => void;
}

export default function DraggableMilestoneList({
  milestones,
  onReorder,
  onEdit,
  onDelete,
  onChangeStatus,
}: DraggableMilestoneListProps) {
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [selectedMilestone, setSelectedMilestone] = React.useState<DraggableMilestone | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(milestones);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const reorderedMilestones = items.map((milestone, index) => ({
      ...milestone,
      order: index + 1,
    }));

    onReorder(reorderedMilestones);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, milestone: DraggableMilestone) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedMilestone(milestone);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedMilestone(null);
  };

  const handleMenuAction = (action: 'edit' | 'delete' | 'status') => {
    if (!selectedMilestone) return;
    
    switch (action) {
      case 'edit':
        onEdit(selectedMilestone);
        break;
      case 'delete':
        onDelete(selectedMilestone);
        break;
      case 'status':
        onChangeStatus(selectedMilestone);
        break;
    }
    handleMenuClose();
  };

  const getStatusChip = (milestone: DraggableMilestone) => {
    const statusInfo = getMilestoneStatus(milestone);
    
    const colorMap = {
      default: 'default' as const,
      warning: 'warning' as const,
      success: 'success' as const,
      error: 'error' as const,
    };

    return (
      <Chip
        label={statusInfo.label}
        size="small"
        color={colorMap[statusInfo.color]}
        variant="filled"
      />
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="milestones">
        {(provided, snapshot) => (
          <Box
            {...provided.droppableProps}
            ref={provided.innerRef}
            sx={{
              backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
              borderRadius: 1,
              transition: 'background-color 0.2s ease',
              minHeight: '100px',
            }}
          >
            {milestones.map((milestone, index) => (
              <Draggable key={milestone._id} draggableId={milestone._id} index={index}>
                {(provided, snapshot) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    sx={{
                      mb: 2,
                      transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                      boxShadow: snapshot.isDragging ? 4 : 1,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                      '&:hover': {
                        boxShadow: 2,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        {/* Drag Handle */}
                        <Box
                          {...provided.dragHandleProps}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: 'text.secondary',
                            cursor: 'grab',
                            '&:active': { cursor: 'grabbing' },
                          }}
                        >
                          <DragIcon />
                        </Box>

                        {/* Order Number */}
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${milestone.color} 0%, ${milestone.color}CC 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            flexShrink: 0,
                          }}
                        >
                          {milestone.order || index + 1}
                        </Box>

                        {/* Milestone Content */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                              {milestone.title}
                            </Typography>
                            {getStatusChip(milestone)}
                          </Box>

                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                            <Chip
                              label={`Start: ${format(new Date(milestone.plannedStart), 'MMM dd')}`}
                              size="small"
                              variant="outlined"
                              icon={<ScheduleIcon />}
                            />
                            <Chip
                              label={`End: ${format(new Date(milestone.plannedEnd), 'MMM dd')}`}
                              size="small"
                              variant="outlined"
                              icon={<CheckCircleIcon />}
                            />
                            {milestone.responsible && (
                              <Chip
                                label={milestone.responsible}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {milestone.teamName && (
                              <Chip
                                label={milestone.teamName}
                                size="small"
                                sx={{
                                  backgroundColor: milestone.color,
                                  color: 'white',
                                  '& .MuiChip-label': { color: 'white' },
                                }}
                              />
                            )}
                          </Box>

                          {typeof milestone.delayDays === 'number' && milestone.delayDays > 0 && (
                            <Chip
                              label={`Delay: ${milestone.delayDays}d`}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          )}
                        </Box>

                        {/* Actions Menu */}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, milestone)}
                          sx={{ color: 'text.secondary' }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Milestone</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction('status')}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Status</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Milestone</ListItemText>
        </MenuItem>
      </Menu>
    </DragDropContext>
  );
}