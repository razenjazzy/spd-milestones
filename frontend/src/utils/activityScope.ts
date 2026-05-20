export type ActivityScope = "standalone" | "project" | "release";

export function resolveEffectiveActivityScope(params: {
  editingId?: string | null;
  scopedProjectId?: string;
  scopedReleaseId?: string;
  formScope: ActivityScope;
  projectId?: string;
  releaseId?: string;
}) {
  const isScopedCreate = !params.editingId;

  const effectiveProjectId = isScopedCreate
    ? params.scopedProjectId || (params.formScope === "project" ? params.projectId || undefined : undefined)
    : params.formScope === "project"
      ? params.projectId || undefined
      : undefined;

  const effectiveReleaseId = isScopedCreate
    ? params.scopedReleaseId || (params.formScope === "release" ? params.releaseId || undefined : undefined)
    : params.formScope === "release"
      ? params.releaseId || undefined
      : undefined;

  return {
    effectiveProjectId,
    effectiveReleaseId,
    scope: params.formScope,
  };
}