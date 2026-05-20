"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/spd";
async function connectDB() {
    try {
        await mongoose_1.default.connect(MONGO_URI, {
        // options are generally optional with mongoose 7+
        });
        console.log("MongoDB connected");
    }
    catch (error) {
        console.error("MongoDB connection failed", error);
        process.exit(1);
    }
}
//# sourceMappingURL=db.js.map