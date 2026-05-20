import { Router } from "express";
import * as milestoneController from "../controllers/milestoneController";
import { authenticate, requireAdmin, requirePermission } from "../middlewares/authMiddleware";

const router = Router({ mergeParams: true });

router.post("/", authenticate, requirePermission("add"), milestoneController.createMilestone);
// when mounted nested under /projects/:projectId/milestones
router.get("/", authenticate, milestoneController.getMilestonesByProject);
router.get("/deleted", authenticate, requireAdmin, milestoneController.getDeletedMilestones);
router.get("/project/:projectId", authenticate, milestoneController.getMilestonesByProject);
router.put("/reorder", authenticate, requirePermission("edit"), milestoneController.reorderMilestones);
router.put("/order/:projectId", authenticate, requirePermission("edit"), milestoneController.updateMilestoneOrder);
router.put("/:id", authenticate, requirePermission("edit"), milestoneController.updateMilestone);
router.put("/:id/dates", authenticate, requirePermission("edit"), milestoneController.updateMilestoneDates);
router.delete("/:id", authenticate, requirePermission("delete"), milestoneController.deleteMilestone);
router.put("/:id/restore", authenticate, requireAdmin, milestoneController.restoreMilestone);
router.delete("/:id/permanent", authenticate, requireAdmin, milestoneController.permanentDeleteMilestone);

export default router;
