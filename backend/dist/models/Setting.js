"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const CustomFieldSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    section: { type: String, required: true },
    fieldType: { type: String, enum: ["text", "dropdown", "radio"], default: "text" },
    options: { type: [String], default: [] },
    hidden: { type: Boolean, default: false },
}, { _id: false });
const SettingsSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
exports.default = mongoose_1.default.model("Setting", SettingsSchema);
//# sourceMappingURL=Setting.js.map