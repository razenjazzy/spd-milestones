import { gql } from '@apollo/client';

// Project Queries
export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
      description
      createdAt
      updatedAt
      stats {
        totalMilestones
        completedMilestones
        inProgressMilestones
        overdueMilestones
        completionRate
      }
    }
  }
`;

export const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description
      createdAt
      updatedAt
      stats {
        totalMilestones
        completedMilestones
        inProgressMilestones
        overdueMilestones
        completionRate
      }
      milestones {
        id
        title
        plannedStart
        plannedEnd
        actualStart
        actualEnd
        responsible
        teamName
        color
        status
        order
        isDeleted
        deletedAt
        plannedDuration
        actualDuration
        delay
      }
    }
  }
`;

// Milestone Queries
export const GET_MILESTONES = gql`
  query GetMilestones($projectId: ID!) {
    milestones(projectId: $projectId) {
      id
      projectId
      title
      plannedStart
      plannedEnd
      actualStart
      actualEnd
      responsible
      teamName
      color
      status
      order
      isDeleted
      deletedAt
      plannedDuration
      actualDuration
      delay
    }
  }
`;

export const GET_MILESTONE = gql`
  query GetMilestone($id: ID!) {
    milestone(id: $id) {
      id
      projectId
      title
      plannedStart
      plannedEnd
      actualStart
      actualEnd
      responsible
      teamName
      color
      status
      order
      isDeleted
      deletedAt
      plannedDuration
      actualDuration
      delay
      project {
        id
        name
      }
    }
  }
`;

// Gantt Data Query
export const GET_GANTT_DATA = gql`
  query GetGanttData($projectId: ID!) {
    ganttData(projectId: $projectId) {
      project {
        id
        name
        description
      }
      milestones {
        id
        title
        plannedStart
        plannedEnd
        actualStart
        actualEnd
        responsible
        teamName
        color
        status
        order
        plannedDuration
        actualDuration
        delay
      }
    }
  }
`;

// Dashboard Stats Query
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalProjects
      totalMilestones
      completionRate
      criticalProjects
    }
  }
`;

// Project Mutations
export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      description
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
    updateProject(id: $id, input: $input) {
      id
      name
      description
      updatedAt
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

// Milestone Mutations
export const CREATE_MILESTONE = gql`
  mutation CreateMilestone($input: CreateMilestoneInput!) {
    createMilestone(input: $input) {
      id
      projectId
      title
      plannedStart
      plannedEnd
      responsible
      teamName
      color
      status
      order
    }
  }
`;

export const UPDATE_MILESTONE = gql`
  mutation UpdateMilestone($id: ID!, $input: UpdateMilestoneInput!) {
    updateMilestone(id: $id, input: $input) {
      id
      title
      plannedStart
      plannedEnd
      actualStart
      actualEnd
      responsible
      teamName
      color
      status
      updatedAt
    }
  }
`;

export const DELETE_MILESTONE = gql`
  mutation DeleteMilestone($id: ID!) {
    deleteMilestone(id: $id) {
      id
      isDeleted
      deletedAt
    }
  }
`;

export const RESTORE_MILESTONE = gql`
  mutation RestoreMilestone($id: ID!) {
    restoreMilestone(id: $id) {
      id
      isDeleted
      deletedAt
    }
  }
`;

export const COMPLETE_MILESTONE = gql`
  mutation CompleteMilestone($id: ID!, $input: CompleteMilestoneInput!) {
    completeMilestone(id: $id, input: $input) {
      id
      actualStart
      actualEnd
      status
      actualDuration
      delay
    }
  }
`;

export const UPDATE_MILESTONE_STATUS = gql`
  mutation UpdateMilestoneStatus($id: ID!, $status: MilestoneStatus!) {
    updateMilestoneStatus(id: $id, status: $status) {
      id
      status
      updatedAt
    }
  }
`;

export const UPDATE_MILESTONES_ORDER = gql`
  mutation UpdateMilestonesOrder($projectId: ID!, $milestoneIds: [ID!]!) {
    updateMilestonesOrder(projectId: $projectId, milestoneIds: $milestoneIds) {
      id
      order
    }
  }
`;
