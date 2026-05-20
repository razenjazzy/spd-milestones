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
const express_1 = require("express");
const milestoneController = __importStar(require("../controllers/milestoneController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)({ mergeParams: true });
router.post("/", authMiddleware_1.authenticate, (0, authMiddleware_1.requirePermission)("add"), milestoneController.createMilestone);
// when mounted nested under /projects/:projectId/milestones
router.get("/", authMiddleware_1.authenticate, milestoneController.getMilestonesByProject);
router.get("/deleted", authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, milestoneController.getDeletedMilestones);
router.get("/project/:projectId", authMiddleware_1.authenticate, milestoneController.getMilestonesByProject);
router.put("/reorder", authMiddleware_1.authenticate, (0, authMiddleware_1.requirePermission)("edit"), milestoneController.reorderMilestones);
router.put("/order/:projectId", authMiddleware_1.authenticate, (0, authMiddleware_1.requirePermission)("edit"), milestoneController.updateMilestoneOrder);
router.put("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.requirePermission)("edit"), milestoneController.updateMilestone);
router.put("/:id/dates", authMiddleware_1.authenticate, (0, authMiddleware_1.requirePermission)("edit"), milestoneController.updateMilestoneDates);
router.delete("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.requirePermission)("delete"), milestoneController.deleteMilestone);
router.put("/:id/restore", authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, milestoneController.restoreMilestone);
router.delete("/:id/permanent", authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, milestoneController.permanentDeleteMilestone);
exports.default = router;
//# sourceMappingURL=milestoneRoutes.js.map