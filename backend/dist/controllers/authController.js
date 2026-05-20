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
exports.me = exports.login = exports.register = void 0;
const authService = __importStar(require("../services/authService"));
const env_1 = require("../config/env");
const register = async (req, res) => {
    try {
        const { email, password, name, role, registrationKey } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const requestedRole = role === "admin" ? "admin" : "user";
        if (requestedRole === "admin" && (!env_1.config.adminRegistrationKey || registrationKey !== env_1.config.adminRegistrationKey)) {
            return res.status(403).json({ error: "Invalid admin registration key" });
        }
        const user = await authService.register(email, password, name, requestedRole);
        res.status(201).json(user);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Registration failed" });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const result = await authService.login(email, password);
        res.json(result);
    }
    catch (err) {
        res.status(401).json({ error: err.message || "Login failed" });
    }
};
exports.login = login;
const me = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        res.json(req.user);
    }
    catch (err) {
        res.status(500).json({ error: err.message || "Failed to fetch user info" });
    }
};
exports.me = me;
//# sourceMappingURL=authController.js.map