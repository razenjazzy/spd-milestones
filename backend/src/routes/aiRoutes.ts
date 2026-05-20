import { Router } from "express";
import * as aiController from "../controllers/aiController";

const router = Router();

router.post("/command", aiController.runCommand);

export default router;
