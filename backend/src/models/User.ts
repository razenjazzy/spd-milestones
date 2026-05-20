import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "user";

export type UserAction = "view" | "add" | "edit" | "delete";

export interface IUserPermissions {
  pages: string[];
  modules: string[];
  actions: UserAction[];
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name?: string;
  role: UserRole;
  permissions?: IUserPermissions;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, trim: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    permissions: {
      pages: { type: [String], default: ["dashboard", "projects", "releases", "activities", "gantt", "calendar"] },
      modules: { type: [String], default: ["projects", "milestones", "releases", "activities"] },
      actions: { type: [String], default: ["view"] },
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
