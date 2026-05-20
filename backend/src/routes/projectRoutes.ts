import { Router } from "express";
import * as projectController from "../controllers/projectController";
import { authenticate, requirePermission } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", authenticate, requirePermission("add"), projectController.createProject);
router.get("/", authenticate, projectController.getProjects);
router.get("/dashboard/pipeline", authenticate, projectController.getDashboardPipeline);
router.get("/:id", authenticate, projectController.getProjectById);
router.get("/:id/gantt", authenticate, projectController.getGantt);
router.put("/:id", authenticate, requirePermission("edit"), projectController.updateProject);
router.delete("/:id", authenticate, requirePermission("delete"), projectController.deleteProject);

export default router;
