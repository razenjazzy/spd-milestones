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
const IterationSchema = new mongoose_1.Schema({
    changedAt: { type: Date, default: () => new Date() },
    oldPlannedStart: Date,
    oldPlannedEnd: Date,
    newPlannedStart: Date,
    newPlannedEnd: Date,
    reason: String,
}, { _id: false });
const MilestoneSchema = new mongoose_1.Schema({
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true },
    plannedStart: { type: Date, required: true },
    plannedEnd: { type: Date, required: true },
    actualStart: Date,
    actualEnd: Date,
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    responsible: String,
    teamName: String,
    color: { type: String, default: "#6b8cff" },
    delayReason: String,
    note: String,
    subtitle: String,
    order: { type: Number, default: 0 },
    iterations: { type: [IterationSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
}, { timestamps: true });
// indexes for queries
MilestoneSchema.index({ projectId: 1 });
MilestoneSchema.index({ plannedEnd: 1 });
// virtual for delay calculation
MilestoneSchema.virtual("delayDays").get(function () {
    if (this.actualEnd && this.plannedEnd) {
        const delayMs = this.actualEnd.getTime() - this.plannedEnd.getTime();
        return Math.max(0, Math.ceil(delayMs / (1000 * 60 * 60 * 24)));
    }
    return 0;
});
exports.default = mongoose_1.default.model("Milestone", MilestoneSchema);
//# sourceMappingURL=Milestone.js.map