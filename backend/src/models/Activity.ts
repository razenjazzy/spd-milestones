import mongoose, { Document, Schema } from "mongoose";

export type ActivityKind = "release" | "maintenance" | "hotfix" | "security";
export type ActivityScope = "standalone" | "project" | "release";
export type ActivityEnvironment = "staging" | "production";
export type ActivityStatus = "planned" | "in-progress" | "completed" | "rejected" | "reopened";
export type ReleaseStatus = "production" | "staging" | "overwritten" | "halted" | "dc2";
export type ReleaseType =
  | "financial-glitch-hotfix"
  | "new-feature-changes"
  | "security-fix"
  | "application-glitch"
  | "system-enhancement"
  | "mobile-app-glitch";

export interface IActivityHistory {
  changedAt: Date;
  oldStatus?: ActivityStatus;
  newStatus?: ActivityStatus;
  reason?: string;
}

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  releaseId?: mongoose.Types.ObjectId;
  scope?: ActivityScope;
  title: string;
  date: Date;
  type: ActivityKind;
  environment?: ActivityEnvironment;
  status?: ActivityStatus;
  platform?: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  note?: string;
  color?: string;
  releasePackage?: string;
  releaseStatus?: ReleaseStatus;
  releaseType?: ReleaseType;
  received?: Date;
  staging?: Date;
  live?: Date;
  downloadLink?: string;
  downloadPassword?: string;
  components?: string;
  dbScripts?: string;
  comments?: string;
  approverName?: string;
  stakeholders?: string;
  impactedArea?: string;
  downtime?: string;
  participants?: string;
  history?: IActivityHistory[];
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema: Schema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: false },
    releaseId: { type: Schema.Types.ObjectId, ref: "Release", required: false },
    scope: {
      type: String,
      enum: ["standalone", "project", "release"],
      default: "standalone",
    },
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ["release", "maintenance", "hotfix", "security"],
      default: "maintenance",
    },
    environment: {
      type: String,
      enum: ["staging", "production"],
      default: "staging",
    },
    status: {
      type: String,
      enum: ["planned", "in-progress", "completed", "rejected", "reopened"],
      default: "planned",
    },
    platform: { type: String, trim: true },
    startTime: String,
    endTime: String,
    duration: String,
    note: String,
    color: String,
    releasePackage: { type: String, trim: true },
    releaseStatus: {
      type: String,
      enum: ["production", "staging", "overwritten", "halted", "dc2"],
    },
    releaseType: {
      type: String,
      enum: [
        "financial-glitch-hotfix",
        "new-feature-changes",
        "security-fix",
        "application-glitch",
        "system-enhancement",
        "mobile-app-glitch",
      ],
    },
    received: Date,
    staging: Date,
    live: Date,
    downloadLink: String,
    downloadPassword: String,
    components: String,
    dbScripts: String,
    comments: String,
    approverName: String,
    stakeholders: String,
    impactedArea: String,
    downtime: String,
    participants: String,
    history: {
      type: [
        {
          changedAt: { type: Date, default: () => new Date() },
          oldStatus: {
            type: String,
            enum: ["planned", "in-progress", "completed", "rejected", "reopened"],
          },
          newStatus: {
            type: String,
            enum: ["planned", "in-progress", "completed", "rejected", "reopened"],
          },
          reason: String,
        },
      ],
      default: [],
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true }
);

ActivitySchema.index({ date: 1, isDeleted: 1 });
ActivitySchema.index({ projectId: 1, releaseId: 1, scope: 1, date: 1 });

export default mongoose.model<IActivity>("Activity", ActivitySchema);
