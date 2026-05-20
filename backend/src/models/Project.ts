import mongoose, { Document, Schema } from "mongoose";

export interface IProject extends Document {
  name: string;
  description?: string;
  createdBy?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    createdBy: String,
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
);

// Index for sorting by creation date
ProjectSchema.index({ createdAt: -1 });

export default mongoose.model<IProject>("Project", ProjectSchema);
