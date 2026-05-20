import SettingModel from "../models/Setting";

export const getSettings = async () => {
  let settings = await SettingModel.findOne();
  if (!settings) settings = await SettingModel.create({});
  return settings;
};

export const updateSettings = async (payload: Record<string, unknown>) => {
  const current = await getSettings();
  Object.assign(current, payload);
  await current.save();
  return current;
};
