"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const Setting_1 = __importDefault(require("../models/Setting"));
const getSettings = async () => {
    let settings = await Setting_1.default.findOne();
    if (!settings)
        settings = await Setting_1.default.create({});
    return settings;
};
exports.getSettings = getSettings;
const updateSettings = async (payload) => {
    const current = await (0, exports.getSettings)();
    Object.assign(current, payload);
    await current.save();
    return current;
};
exports.updateSettings = updateSettings;
//# sourceMappingURL=settingService.js.map