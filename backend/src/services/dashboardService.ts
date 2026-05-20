import ReleaseModel from "../models/Release";

export const getReleasePipelineSummary = async () => {
  const [standalone, merged, upcoming] = await Promise.all([
    ReleaseModel.countDocuments({ isDeleted: { $ne: true }, pipelineStage: "standalone" }),
    ReleaseModel.countDocuments({ isDeleted: { $ne: true }, pipelineStage: "merged" }),
    ReleaseModel.countDocuments({ isDeleted: { $ne: true }, pipelineStage: "release-for-production-upcoming" }),
  ]);

  return {
    standalone,
    merged,
    releaseForProductionUpcoming: upcoming,
  };
};
