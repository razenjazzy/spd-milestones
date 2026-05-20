import { Router } from "express";
import * as userController from "../controllers/userController";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticate, requireAdmin, userController.listUsers);
router.post("/", authenticate, requireAdmin, userController.createUser);
router.put("/:id", authenticate, requireAdmin, userController.updateUser);
router.delete("/:id", authenticate, requireAdmin, userController.deleteUser);

export default router;
