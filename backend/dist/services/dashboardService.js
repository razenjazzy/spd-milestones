"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleasePipelineSummary = void 0;
const Release_1 = __importDefault(require("../models/Release"));
const getReleasePipelineSummary = async () => {
    const [standalone, merged, upcoming] = await Promise.all([
        Release_1.default.countDocuments({ isDeleted: { $ne: true }, pipelineStage: "standalone" }),
        Release_1.default.countDocuments({ isDeleted: { $ne: true }, pipelineStage: "merged" }),
        Release_1.default.countDocuments({ isDeleted: { $ne: true }, pipelineStage: "release-for-production-upcoming" }),
    ]);
    return {
        standalone,
        merged,
        releaseForProductionUpcoming: upcoming,
    };
};
exports.getReleasePipelineSummary = getReleasePipelineSummary;
//# sourceMappingURL=dashboardService.js.map