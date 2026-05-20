import UserModel, { IUser, IUserPermissions } from "../models/User";

const defaultPermissions = (role: "admin" | "user"): IUserPermissions => ({
  pages: role === "admin"
    ? ["dashboard", "projects", "releases", "activities", "gantt", "calendar", "settings", "ai-cli", "tests"]
    : ["dashboard", "projects", "releases", "activities", "gantt", "calendar"],
  modules: role === "admin"
    ? ["projects", "milestones", "releases", "activities", "settings", "ai-cli"]
    : ["projects", "milestones", "releases", "activities"],
  actions: role === "admin" ? ["view", "add", "edit", "delete"] : ["view", "add", "edit"],
});

export const listUsers = async () => {
  return UserModel.find().sort({ createdAt: -1 });
};

export const createUser = async (data: {
  email: string;
  password: string;
  name?: string;
  role?: "admin" | "user";
  permissions?: IUserPermissions;
}) => {
  const normalizedEmail = data.email.trim().toLowerCase();
  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) throw new Error("User already exists");

  const role = data.role || "user";
  const user = new UserModel({
    email: normalizedEmail,
    password: data.password,
    name: data.name,
    role,
    permissions: data.permissions || defaultPermissions(role),
  });
  await user.save();
  return user;
};

export const updateUser = async (
  id: string,
  data: Partial<{ email: string; password: string; name: string; role: "admin" | "user"; permissions: IUserPermissions }>
) => {
  const user = await UserModel.findById(id);
  if (!user) return null;

  if (data.email) user.email = data.email.trim().toLowerCase();
  if (data.password) user.password = data.password;
  if (data.name !== undefined) user.name = data.name;
  if (data.role) user.role = data.role;
  if (data.permissions) user.permissions = data.permissions;

  if (!user.permissions || !user.permissions.pages?.length) {
    user.permissions = defaultPermissions(user.role);
  }

  return user.save();
};

export const deleteUser = async (id: string) => {
  return UserModel.findByIdAndDelete(id);
};
