import { Router } from "express";
import * as releaseController from "../controllers/releaseController";
import { authenticate, requireAdmin, requirePermission } from "../middlewares/authMiddleware";

const router = Router({ mergeParams: true });

router.get("/", authenticate, releaseController.listReleases);
router.post("/", authenticate, requirePermission("add"), releaseController.createRelease);
router.put("/:id", authenticate, requirePermission("edit"), releaseController.updateRelease);
router.delete("/:id", authenticate, requirePermission("delete"), releaseController.deleteRelease);

router.post("/:id/link/admin-revalidate", authenticate, requireAdmin, releaseController.validateAdminAndGetLink);
router.post("/:id/link/one-time-code", authenticate, requireAdmin, releaseController.createOneTimeShareCode);
router.post("/:id/link/redeem", authenticate, releaseController.resolveLinkByOneTimeCode);
router.post("/:id/artifacts/reveal", authenticate, releaseController.revealProtectedArtifact);

export default router;
