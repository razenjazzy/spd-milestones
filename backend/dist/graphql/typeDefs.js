"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const graphql_tag_1 = __importDefault(require("graphql-tag"));
exports.typeDefs = (0, graphql_tag_1.default) `
  scalar Date

  type Project {
    id: ID!
    name: String!
    description: String
    createdAt: Date!
    updatedAt: Date!
    milestones: [Milestone!]!
    stats: ProjectStats!
  }

  type ProjectStats {
    totalMilestones: Int!
    completedMilestones: Int!
    inProgressMilestones: Int!
    overdueMilestones: Int!
    completionRate: Float!
  }

  type Milestone {
    id: ID!
    projectId: ID!
    title: String!
    plannedStart: Date!
    plannedEnd: Date!
    actualStart: Date
    actualEnd: Date
    responsible: String
    teamName: String
    color: String
    status: MilestoneStatus!
    order: Int!
    isDeleted: Boolean!
    deletedAt: Date
    createdAt: Date!
    updatedAt: Date!
    plannedDuration: Int
    actualDuration: Int
    delay: Int
    project: Project!
  }

  enum MilestoneStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
  }

  input CreateProjectInput {
    name: String!
    description: String
  }

  input UpdateProjectInput {
    name: String
    description: String
  }

  input CreateMilestoneInput {
    projectId: ID!
    title: String!
    plannedStart: Date!
    plannedEnd: Date!
    responsible: String
    teamName: String
    color: String
  }

  input UpdateMilestoneInput {
    title: String
    plannedStart: Date
    plannedEnd: Date
    actualStart: Date
    actualEnd: Date
    responsible: String
    teamName: String
    color: String
    status: MilestoneStatus
  }

  input CompleteMilestoneInput {
    actualStart: Date!
    actualEnd: Date!
  }

  type Query {
    # Projects
    projects: [Project!]!
    project(id: ID!): Project
    
    # Milestones
    milestones(projectId: ID!): [Milestone!]!
    milestone(id: ID!): Milestone
    ganttData(projectId: ID!): GanttData!
    
    # Analytics
    dashboardStats: DashboardStats!
  }

  type Mutation {
    # Project mutations
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
    
    # Milestone mutations
    createMilestone(input: CreateMilestoneInput!): Milestone!
    updateMilestone(id: ID!, input: UpdateMilestoneInput!): Milestone!
    deleteMilestone(id: ID!): Milestone!
    restoreMilestone(id: ID!): Milestone!
    completeMilestone(id: ID!, input: CompleteMilestoneInput!): Milestone!
    updateMilestoneStatus(id: ID!, status: MilestoneStatus!): Milestone!
    updateMilestonesOrder(projectId: ID!, milestoneIds: [ID!]!): [Milestone!]!
  }

  type GanttData {
    project: Project!
    milestones: [Milestone!]!
  }

  type DashboardStats {
    totalProjects: Int!
    totalMilestones: Int!
    completionRate: Float!
    criticalProjects: Int!
  }
`;
//# sourceMappingURL=typeDefs.js.map