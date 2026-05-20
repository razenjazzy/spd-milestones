import mongoose, { Document, Schema } from "mongoose";

export type ReleaseStatus = "production" | "staging" | "overwritten" | "halted" | "dc2";
export type ReleaseType =
  | "financial-glitch-hotfix"
  | "new-feature-changes"
  | "security-fix"
  | "application-glitch"
  | "system-enhancement"
  | "mobile-app-glitch";
export type ReleasePipelineStage = "standalone" | "merged" | "release-for-production-upcoming";
export type ReleaseLifecycleAction = "rejected" | "reopened" | "redeployed" | "updated";

export interface IReleaseHistoryEntry {
  changedAt: Date;
  action: ReleaseLifecycleAction;
  reason?: string;
  oldStatus?: string;
  newStatus?: string;
  oldPipelineStage?: string;
  newPipelineStage?: string;
}

export interface IRelease extends Document {
  _id: mongoose.Types.ObjectId;
  activityId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  releasePackage: string;
  status: ReleaseStatus;
  type: ReleaseType;
  received?: Date;
  staging?: Date;
  live?: Date;
  downloadLink?: string;
  downloadPassword?: string;
  dbScriptLink?: string;
  jarAppLink?: string;
  components?: string;
  dbScripts?: string;
  comments?: string;
  history?: IReleaseHistoryEntry[];
  pipelineStage: ReleasePipelineStage;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReleaseSchema = new Schema(
  {
    activityId: { type: Schema.Types.ObjectId, ref: "Activity" },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    releasePackage: { type: String, required: true, trim: true },
    status: { type: String, default: "staging", trim: true },
    type: { type: String, default: "application-glitch", trim: true },
    received: Date,
    staging: Date,
    live: Date,
    downloadLink: String,
    downloadPassword: String,
    dbScriptLink: String,
    jarAppLink: String,
    components: String,
    dbScripts: String,
    comments: String,
    history: {
      type: [
        {
          changedAt: { type: Date, default: () => new Date() },
          action: { type: String, enum: ["rejected", "reopened", "redeployed", "updated"], default: "updated" },
          reason: String,
          oldStatus: String,
          newStatus: String,
          oldPipelineStage: String,
          newPipelineStage: String,
        },
      ],
      default: [],
    },
    pipelineStage: {
      type: String,
      enum: ["standalone", "merged", "release-for-production-upcoming"],
      default: "standalone",
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true }
);

ReleaseSchema.index({ projectId: 1, activityId: 1, status: 1, pipelineStage: 1 });

export default mongoose.model<IRelease>("Release", ReleaseSchema);
