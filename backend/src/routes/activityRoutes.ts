import { Router } from "express";
import * as activityController from "../controllers/activityController";
import { authenticate, requireAdmin, requirePermission } from "../middlewares/authMiddleware";

const router = Router({ mergeParams: true });

router.post("/", authenticate, requirePermission("add"), activityController.createActivity);
router.get("/", authenticate, activityController.getActivitiesByProject);
router.get("/deleted", authenticate, requireAdmin, activityController.getDeletedActivities);
router.post("/copy-month", authenticate, requirePermission("add"), activityController.copyMonthActivities);
router.put("/:id", authenticate, requirePermission("edit"), activityController.updateActivity);
router.put("/:id/restore", authenticate, requireAdmin, activityController.restoreActivity);
router.delete("/:id", authenticate, requirePermission("delete"), activityController.deleteActivity);
router.delete("/:id/permanent", authenticate, requireAdmin, activityController.permanentDeleteActivity);

export default router;
