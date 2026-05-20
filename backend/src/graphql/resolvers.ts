import { GraphQLScalarType, Kind } from 'graphql';
import Project from '../models/Project';
import Milestone from '../models/Milestone';

// Date scalar type
const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

// Helper function to calculate working days
const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return count;
};

export const resolvers = {
  Date: dateScalar,

  Query: {
    // Get all projects
    projects: async () => {
      try {
        const projects = await Project.find().sort({ createdAt: -1 });
        return projects;
      } catch (error) {
        throw new Error('Failed to fetch projects');
      }
    },

    // Get single project
    project: async (_: any, { id }: { id: string }) => {
      try {
        const project = await Project.findById(id);
        if (!project) {
          throw new Error('Project not found');
        }
        return project;
      } catch (error) {
        throw new Error('Failed to fetch project');
      }
    },

    // Get milestones for a project
    milestones: async (_: any, { projectId }: { projectId: string }) => {
      try {
        const milestones = await Milestone.find({ projectId, isDeleted: false }).sort({ order: 1 });
        return milestones;
      } catch (error) {
        throw new Error('Failed to fetch milestones');
      }
    },

    // Get single milestone
    milestone: async (_: any, { id }: { id: string }) => {
      try {
        const milestone = await Milestone.findById(id);
        if (!milestone) {
          throw new Error('Milestone not found');
        }
        return milestone;
      } catch (error) {
        throw new Error('Failed to fetch milestone');
      }
    },

    // Get Gantt data for a project
    ganttData: async (_: any, { projectId }: { projectId: string }) => {
      try {
        const project = await Project.findById(projectId);
        if (!project) {
          throw new Error('Project not found');
        }
        const milestones = await Milestone.find({ projectId, isDeleted: false }).sort({ order: 1 });
        return { project, milestones };
      } catch (error) {
        throw new Error('Failed to fetch Gantt data');
      }
    },

    // Get dashboard statistics
    dashboardStats: async () => {
      try {
        const totalProjects = await Project.countDocuments();
        const totalMilestones = await Milestone.countDocuments({ isDeleted: false });
        const completedMilestones = await Milestone.countDocuments({ status: 'completed', isDeleted: false });
        const completionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
        
        // Critical projects have overdue milestones
        const now = new Date();
        const overdueMilestones = await Milestone.find({
          isDeleted: false,
          status: { $ne: 'completed' },
          plannedEnd: { $lt: now }
        });
        const criticalProjectIds = [...new Set(overdueMilestones.map(m => m.projectId.toString()))];
        
        return {
          totalProjects,
          totalMilestones,
          completionRate,
          criticalProjects: criticalProjectIds.length,
        };
      } catch (error) {
        throw new Error('Failed to fetch dashboard stats');
      }
    },
  },

  Mutation: {
    // Create project
    createProject: async (_: any, { input }: { input: any }) => {
      try {
        const project = new Project(input);
        await project.save();
        return project;
      } catch (error) {
        throw new Error('Failed to create project');
      }
    },

    // Update project
    updateProject: async (_: any, { id, input }: { id: string; input: any }) => {
      try {
        const project = await Project.findByIdAndUpdate(id, input, { new: true });
        if (!project) {
          throw new Error('Project not found');
        }
        return project;
      } catch (error) {
        throw new Error('Failed to update project');
      }
    },

    // Delete project
    deleteProject: async (_: any, { id }: { id: string }) => {
      try {
        const project = await Project.findByIdAndDelete(id);
        if (!project) {
          throw new Error('Project not found');
        }
        // Also delete all associated milestones
        await Milestone.deleteMany({ projectId: id });
        return true;
      } catch (error) {
        throw new Error('Failed to delete project');
      }
    },

    // Create milestone
    createMilestone: async (_: any, { input }: { input: any }) => {
      try {
        // Get the highest order number for this project
        const lastMilestone = await Milestone.findOne({ projectId: input.projectId })
          .sort({ order: -1 });
        const order = lastMilestone?.order != null ? lastMilestone.order + 1 : 0;

        const milestone = new Milestone({
          ...input,
          order,
          status: 'pending',
        });
        await milestone.save();
        return milestone;
      } catch (error) {
        throw new Error('Failed to create milestone');
      }
    },

    // Update milestone
    updateMilestone: async (_: any, { id, input }: { id: string; input: any }) => {
      try {
        const milestone = await Milestone.findByIdAndUpdate(id, input, { new: true });
        if (!milestone) {
          throw new Error('Milestone not found');
        }
        return milestone;
      } catch (error) {
        throw new Error('Failed to update milestone');
      }
    },

    // Soft delete milestone
    deleteMilestone: async (_: any, { id }: { id: string }) => {
      try {
        const milestone = await Milestone.findByIdAndUpdate(
          id,
          { isDeleted: true, deletedAt: new Date() },
          { new: true }
        );
        if (!milestone) {
          throw new Error('Milestone not found');
        }
        return milestone;
      } catch (error) {
        throw new Error('Failed to delete milestone');
      }
    },

    // Restore milestone
    restoreMilestone: async (_: any, { id }: { id: string }) => {
      try {
        const milestone = await Milestone.findByIdAndUpdate(
          id,
          { isDeleted: false, deletedAt: null },
          { new: true }
        );
        if (!milestone) {
          throw new Error('Milestone not found');
        }
        return milestone;
      } catch (error) {
        throw new Error('Failed to restore milestone');
      }
    },

    // Complete milestone
    completeMilestone: async (_: any, { id, input }: { id: string; input: any }) => {
      try {
        const milestone = await Milestone.findByIdAndUpdate(
          id,
          {
            actualStart: input.actualStart,
            actualEnd: input.actualEnd,
            status: 'completed',
          },
          { new: true }
        );
        if (!milestone) {
          throw new Error('Milestone not found');
        }
        return milestone;
      } catch (error) {
        throw new Error('Failed to complete milestone');
      }
    },

    // Update milestone status
    updateMilestoneStatus: async (_: any, { id, status }: { id: string; status: string }) => {
      try {
        const milestone = await Milestone.findByIdAndUpdate(
          id,
          { status: status.toLowerCase().replace('_', '-') },
          { new: true }
        );
        if (!milestone) {
          throw new Error('Milestone not found');
        }
        return milestone;
      } catch (error) {
        throw new Error('Failed to update milestone status');
      }
    },

    // Update milestones order
    updateMilestonesOrder: async (_: any, { projectId, milestoneIds }: { projectId: string; milestoneIds: string[] }) => {
      try {
        const updates = milestoneIds.map((id, index) =>
          Milestone.findByIdAndUpdate(id, { order: index }, { new: true })
        );
        const milestones = await Promise.all(updates);
        return milestones.filter(m => m !== null);
      } catch (error) {
        throw new Error('Failed to update milestones order');
      }
    },
  },

  // Field resolvers
  Project: {
    milestones: async (parent: any) => {
      return await Milestone.find({ projectId: parent._id, isDeleted: false }).sort({ order: 1 });
    },
    stats: async (parent: any) => {
      const milestones = await Milestone.find({ projectId: parent._id, isDeleted: false });
      const total = milestones.length;
      const completed = milestones.filter(m => m.status === 'completed').length;
      const inProgress = milestones.filter(m => m.status === 'in-progress').length;
      const now = new Date();
      const overdue = milestones.filter(m => 
        m.status !== 'completed' && new Date(m.plannedEnd) < now
      ).length;
      
      return {
        totalMilestones: total,
        completedMilestones: completed,
        inProgressMilestones: inProgress,
        overdueMilestones: overdue,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
      };
    },
  },

  Milestone: {
    project: async (parent: any) => {
      return await Project.findById(parent.projectId);
    },
    plannedDuration: (parent: any) => {
      if (parent.plannedStart && parent.plannedEnd) {
        return calculateWorkingDays(new Date(parent.plannedStart), new Date(parent.plannedEnd));
      }
      return null;
    },
    actualDuration: (parent: any) => {
      if (parent.actualStart && parent.actualEnd) {
        return calculateWorkingDays(new Date(parent.actualStart), new Date(parent.actualEnd));
      }
      return null;
    },
    delay: (parent: any) => {
      if (parent.actualEnd && parent.plannedEnd) {
        const actual = new Date(parent.actualEnd);
        const planned = new Date(parent.plannedEnd);
        return calculateWorkingDays(planned, actual);
      }
      return null;
    },
  },
};
