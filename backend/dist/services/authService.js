"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.verifyToken = exports.generateToken = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const env_1 = require("../config/env");
const getDefaultPermissions = (role) => ({
    pages: role === "admin" ? ["dashboard", "projects", "releases", "activities", "gantt", "calendar", "settings", "ai-cli", "tests"] : ["dashboard", "projects", "releases", "activities", "gantt", "calendar"],
    modules: role === "admin" ? ["projects", "milestones", "releases", "activities", "settings", "ai-cli"] : ["projects", "milestones", "releases", "activities"],
    actions: role === "admin" ? ["view", "add", "edit", "delete"] : ["view", "add", "edit"],
});
const register = async (email, password, name, role = "user") => {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User_1.default.findOne({ email: normalizedEmail });
    if (existingUser) {
        throw new Error("User already exists");
    }
    const user = new User_1.default({ email: normalizedEmail, password, name, role, permissions: getDefaultPermissions(role) });
    await user.save();
    return { id: user._id, email: user.email, role: user.role, permissions: user.permissions };
};
exports.register = register;
const login = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User_1.default.findOne({ email: normalizedEmail });
    if (!user) {
        throw new Error("Invalid email or password");
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
        throw new Error("Invalid email or password");
    }
    const token = (0, exports.generateToken)({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        permissions: user.permissions,
    });
    return { id: user._id, email: user.email, role: user.role, permissions: user.permissions, token };
};
exports.login = login;
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.config.jwtSecret, { expiresIn: env_1.config.jwtExpiresIn });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret);
    }
    catch (err) {
        throw new Error("Invalid or expired token");
    }
};
exports.verifyToken = verifyToken;
const isAdmin = (user) => {
    return user.role === "admin";
};
exports.isAdmin = isAdmin;
//# sourceMappingURL=authService.js.map