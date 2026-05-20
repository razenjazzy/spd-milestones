import { Router } from "express";
import * as settingController from "../controllers/settingController";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticate, settingController.getSettings);
router.put("/", authenticate, requireAdmin, settingController.updateSettings);

export default router;
