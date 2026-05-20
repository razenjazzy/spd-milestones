import mongoose, { Document, Schema } from "mongoose";

export interface IReleaseAccessCode extends Document {
  _id: mongoose.Types.ObjectId;
  releaseId: mongoose.Types.ObjectId;
  code: string;
  expiresAt: Date;
  used: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReleaseAccessCodeSchema = new Schema(
  {
    releaseId: { type: Schema.Types.ObjectId, ref: "Release", required: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ReleaseAccessCodeSchema.index({ releaseId: 1, code: 1 });
ReleaseAccessCodeSchema.index({ expiresAt: 1 });

export default mongoose.model<IReleaseAccessCode>("ReleaseAccessCode", ReleaseAccessCodeSchema);
