import mongoose, { Document, Schema } from "mongoose";

export interface IIteration {
  changedAt: Date;
  oldPlannedStart?: Date;
  oldPlannedEnd?: Date;
  newPlannedStart?: Date;
  newPlannedEnd?: Date;
  reason?: string;
}

export interface IMilestone extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  title: string;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status?: 'pending' | 'in-progress' | 'completed';
  responsible?: string;
  teamName?: string;
  color?: string;
  delayReason?: string;
  note?: string;
  subtitle?: string;
  order?: number;
  iterations?: IIteration[];
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  delayDays?: number; // virtual
}

const IterationSchema: Schema = new Schema(
  {
    changedAt: { type: Date, default: () => new Date() },
    oldPlannedStart: Date,
    oldPlannedEnd: Date,
    newPlannedStart: Date,
    newPlannedEnd: Date,
    reason: String,
  },
  { _id: false }
);

const MilestoneSchema: Schema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
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
  },
  { timestamps: true }
);

// indexes for queries
MilestoneSchema.index({ projectId: 1 });
MilestoneSchema.index({ plannedEnd: 1 });

// virtual for delay calculation
MilestoneSchema.virtual("delayDays").get(function (this: IMilestone) {
  if (this.actualEnd && this.plannedEnd) {
    const delayMs = this.actualEnd.getTime() - this.plannedEnd.getTime();
    return Math.max(0, Math.ceil(delayMs / (1000 * 60 * 60 * 24)));
  }
  return 0;
});

export default mongoose.model<IMilestone>("Milestone", MilestoneSchema);
