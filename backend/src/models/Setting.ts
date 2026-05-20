import mongoose, { Document, Schema } from "mongoose";

export interface ISettings extends Document {
  _id: mongoose.Types.ObjectId;
  statusOptions: string[];
  typeOptions: string[];
  packageTypes: string[];
  packageContents: string[];
  responsibleOptions: string[];
  teamOptions: string[];
  departmentOptions: string[];
  passwordRevealKey?: string;
  linkVisibilityTtlMinutes: number;
  approvalEmailTemplate?: string;
  releaseMessageTemplate?: string;
  customFields?: Array<{
    id: string;
    name: string;
    section: string;
    fieldType: "text" | "dropdown" | "radio";
    options: string[];
    hidden: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const CustomFieldSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    section: { type: String, required: true },
    fieldType: { type: String, enum: ["text", "dropdown", "radio"], default: "text" },
    options: { type: [String], default: [] },
    hidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const SettingsSchema = new Schema(
  {
    statusOptions: {
      type: [String],
      default: ["production", "staging", "overwritten", "halted", "dc2"],
    },
    typeOptions: {
      type: [String],
      default: [
        "financial-glitch-hotfix",
        "new-feature-changes",
        "security-fix",
        "application-glitch",
        "system-enhancement",
        "mobile-app-glitch",
      ],
    },
    packageTypes: { type: [String], default: [] },
    packageContents: { type: [String], default: [] },
    responsibleOptions: { type: [String], default: [] },
    teamOptions: { type: [String], default: [] },
    departmentOptions: { type: [String], default: [] },
    passwordRevealKey: { type: String, default: "" },
    linkVisibilityTtlMinutes: { type: Number, default: 10 },
    approvalEmailTemplate: {
      type: String,
      default: `Dear {{approverName}},

{{contextParagraph}}

Seeking your kind approval for the {{activityWindow}} activity to start from {{scheduleStart}}.

Activity Title: {{activityTitle}}
Schedule: {{schedule}}
Impacted Area: {{impactedArea}}
Downtime: {{downtime}}

Participants: {{participants}}

RELEASE PACKAGE:
{{releasePackage}}

Package Name: {{packageName}}
Link: {{downloadLink}}

ACTIVITY BREAKDOWN:
{{activityBreakdown}}

ACTIVITY STEPS:

Deployment:
{{deploymentSteps}}

Testing & Rollout:
{{testingSteps}}

ROLLBACK:
{{rollbackSteps}}

{{closureNote}}`,
    },
    releaseMessageTemplate: {
      type: String,
      default: `<STAGING> DEPLOYMENT - <{{releasePackage}}>

<Deployers Names> <Requesting your kind assignment for <STAGING> deployment of the <{{releasePackage}}>.>

<The release is large in comparison to other, please follow preparation, caution, study, recommendation as per documentation of release doc & deployment plan. Please let me know of any required assistance or query.>

Package Name : <{{releasePackage}}>
Package Link : <{{downloadLink}}>
Password : <{{downloadPassword}}>`
    },
    customFields: { type: [CustomFieldSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<ISettings>("Setting", SettingsSchema);
