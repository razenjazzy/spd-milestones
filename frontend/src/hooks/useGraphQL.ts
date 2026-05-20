import { useQuery, useMutation } from '@apollo/client/react';  
import {
  GET_PROJECTS,
  GET_PROJECT,
  GET_MILESTONES,
  GET_GANTT_DATA,
  GET_DASHBOARD_STATS,
  CREATE_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  CREATE_MILESTONE,
  UPDATE_MILESTONE,
  DELETE_MILESTONE,
  RESTORE_MILESTONE,
  COMPLETE_MILESTONE,
  UPDATE_MILESTONE_STATUS,
  UPDATE_MILESTONES_ORDER,
} from '../graphql/queries';

// Projects Hooks
export const useGetProjects = () => {
  return useQuery(GET_PROJECTS);
};

export const useGetProject = (id: string) => {
  return useQuery(GET_PROJECT, {
    variables: { id },
    skip: !id,
  });
};

export const useCreateProject = () => {
  return useMutation(CREATE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS }, { query: GET_DASHBOARD_STATS }],
  });
};

export const useUpdateProject = () => {
  return useMutation(UPDATE_PROJECT);
};

export const useDeleteProject = () => {
  return useMutation(DELETE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS }, { query: GET_DASHBOARD_STATS }],
  });
};

// Milestones Hooks
export const useGetMilestones = (projectId: string) => {
  return useQuery(GET_MILESTONES, {
    variables: { projectId },
    skip: !projectId,
  });
};

export const useGetGanttData = (projectId: string) => {
  return useQuery(GET_GANTT_DATA, {
    variables: { projectId },
    skip: !projectId,
  });
};

export const useCreateMilestone = (projectId: string) => {
  return useMutation(CREATE_MILESTONE, {
    refetchQueries: [
      { query: GET_PROJECT, variables: { id: projectId } },
      { query: GET_MILESTONES, variables: { projectId } },
      { query: GET_DASHBOARD_STATS },
    ],
  });
};

export const useUpdateMilestone = (projectId: string) => {
  return useMutation(UPDATE_MILESTONE, {
    refetchQueries: [
      { query: GET_PROJECT, variables: { id: projectId } },
      { query: GET_MILESTONES, variables: { projectId } },
    ],
  });
};

export const useDeleteMilestone = (projectId: string) => {
  return useMutation(DELETE_MILESTONE, {
    refetchQueries: [
      { query: GET_PROJECT, variables: { id: projectId } },
      { query: GET_MILESTONES, variables: { projectId } },
      { query: GET_DASHBOARD_STATS },
    ],
  });
};

export const useRestoreMilestone = (projectId: string) => {
  return useMutation(RESTORE_MILESTONE, {
    refetchQueries: [
      { query: GET_PROJECT, variables: { id: projectId } },
      { query: GET_MILESTONES, variables: { projectId } },
    ],
  });
};

export const useCompleteMilestone = (projectId: string) => {
  return useMutation(COMPLETE_MILESTONE, {
    refetchQueries: [
      { query: GET_PROJECT, variables: { id: projectId } },
      { query: GET_MILESTONES, variables: { projectId } },
      { query: GET_DASHBOARD_STATS },
    ],
  });
};

export const useUpdateMilestoneStatus = (projectId: string) => {
  return useMutation(UPDATE_MILESTONE_STATUS, {
    refetchQueries: [
      { query: GET_PROJECT, variables: { id: projectId } },
      { query: GET_MILESTONES, variables: { projectId } },
    ],
  });
};

export const useUpdateMilestonesOrder = () => {
  return useMutation(UPDATE_MILESTONES_ORDER);
};

// Dashboard Hooks
export const useGetDashboardStats = () => {
  return useQuery(GET_DASHBOARD_STATS);
};

// Helper function to handle GraphQL errors
export const handleGraphQLError = (error: any): string => {
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    return error.graphQLErrors[0].message;
  }
  if (error.networkError) {
    return 'Network error. Please check your connection.';
  }
  return error.message || 'An unknown error occurred';
};
