"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.listUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const defaultPermissions = (role) => ({
    pages: role === "admin"
        ? ["dashboard", "projects", "releases", "activities", "gantt", "calendar", "settings", "ai-cli", "tests"]
        : ["dashboard", "projects", "releases", "activities", "gantt", "calendar"],
    modules: role === "admin"
        ? ["projects", "milestones", "releases", "activities", "settings", "ai-cli"]
        : ["projects", "milestones", "releases", "activities"],
    actions: role === "admin" ? ["view", "add", "edit", "delete"] : ["view", "add", "edit"],
});
const listUsers = async () => {
    return User_1.default.find().sort({ createdAt: -1 });
};
exports.listUsers = listUsers;
const createUser = async (data) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = await User_1.default.findOne({ email: normalizedEmail });
    if (existing)
        throw new Error("User already exists");
    const role = data.role || "user";
    const user = new User_1.default({
        email: normalizedEmail,
        password: data.password,
        name: data.name,
        role,
        permissions: data.permissions || defaultPermissions(role),
    });
    await user.save();
    return user;
};
exports.createUser = createUser;
const updateUser = async (id, data) => {
    const user = await User_1.default.findById(id);
    if (!user)
        return null;
    if (data.email)
        user.email = data.email.trim().toLowerCase();
    if (data.password)
        user.password = data.password;
    if (data.name !== undefined)
        user.name = data.name;
    if (data.role)
        user.role = data.role;
    if (data.permissions)
        user.permissions = data.permissions;
    if (!user.permissions || !user.permissions.pages?.length) {
        user.permissions = defaultPermissions(user.role);
    }
    return user.save();
};
exports.updateUser = updateUser;
const deleteUser = async (id) => {
    return User_1.default.findByIdAndDelete(id);
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=userService.js.map