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
const releaseController = __importStar(require("../controllers/releaseController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)({ mergeParams: true });
router.get("/", authMiddleware_1.authenticate, releaseController.listReleases);
router.post("/", authMiddleware_1.authenticate, (0, authMiddleware_1.requirePermission)("add"), releaseController.createRelease);
router.put("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.requirePermission)("edit"), releaseController.updateRelease);
router.delete("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.requirePermission)("delete"), releaseController.deleteRelease);
router.post("/:id/link/admin-revalidate", authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, releaseController.validateAdminAndGetLink);
router.post("/:id/link/one-time-code", authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, releaseController.createOneTimeShareCode);
router.post("/:id/link/redeem", authMiddleware_1.authenticate, releaseController.resolveLinkByOneTimeCode);
router.post("/:id/artifacts/reveal", authMiddleware_1.authenticate, releaseController.revealProtectedArtifact);
exports.default = router;
//# sourceMappingURL=releaseRoutes.js.map