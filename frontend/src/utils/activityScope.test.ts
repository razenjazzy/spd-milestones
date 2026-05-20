import { describe, expect, it } from "vitest";
import { resolveEffectiveActivityScope } from "./activityScope";

describe("resolveEffectiveActivityScope", () => {
  it("keeps route scope for create when page is project-scoped", () => {
    const result = resolveEffectiveActivityScope({
      editingId: null,
      scopedProjectId: "project-1",
      formScope: "project",
      projectId: "project-2",
    });

    expect(result.effectiveProjectId).toBe("project-1");
    expect(result.effectiveReleaseId).toBeUndefined();
  });

  it("allows editing a previously scoped activity into standalone", () => {
    const result = resolveEffectiveActivityScope({
      editingId: "activity-1",
      scopedProjectId: "project-1",
      formScope: "standalone",
      projectId: "project-1",
      releaseId: "release-1",
    });

    expect(result.effectiveProjectId).toBeUndefined();
    expect(result.effectiveReleaseId).toBeUndefined();
  });

  it("uses release id on edit when scope is release", () => {
    const result = resolveEffectiveActivityScope({
      editingId: "activity-1",
      formScope: "release",
      releaseId: "release-9",
    });

    expect(result.effectiveReleaseId).toBe("release-9");
    expect(result.effectiveProjectId).toBeUndefined();
  });
});