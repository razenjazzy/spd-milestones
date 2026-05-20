/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActivityManager from "./ActivityManager";

const mockAPIs = vi.hoisted(() => ({
  activityAPI: {
    list: vi.fn(),
    create: vi.fn(),
    createStandalone: vi.fn(),
    createByRelease: vi.fn(),
    update: vi.fn(),
    updateStandalone: vi.fn(),
    updateByRelease: vi.fn(),
    delete: vi.fn(),
    deleteStandalone: vi.fn(),
    deleteByRelease: vi.fn(),
  },
  projectAPI: { getAll: vi.fn() },
  releaseAPI: { list: vi.fn() },
  settingsAPI: { get: vi.fn() },
}));

vi.mock("../api/api", () => ({
  activityAPI: mockAPIs.activityAPI,
  projectAPI: mockAPIs.projectAPI,
  releaseAPI: mockAPIs.releaseAPI,
  settingsAPI: mockAPIs.settingsAPI,
}));

describe("ActivityManager edit UI", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          Object.keys(store).forEach((key) => delete store[key]);
        },
      },
    });
    globalThis.localStorage.setItem("user", JSON.stringify({ role: "admin", email: "admin@test.com" }));

    mockAPIs.projectAPI.getAll.mockResolvedValue({ data: [{ _id: "p1", name: "Core Project" }] });
    mockAPIs.releaseAPI.list.mockResolvedValue({ data: [] });
    mockAPIs.settingsAPI.get.mockResolvedValue({ data: {} });
    mockAPIs.activityAPI.list.mockResolvedValue({
      data: [
        {
          _id: "a1",
          title: "Security patch",
          date: "2026-05-20T00:00:00.000Z",
          scope: "project",
          projectId: "p1",
          type: "security",
          status: "planned",
          environment: "staging",
        },
      ],
    });
    mockAPIs.activityAPI.updateStandalone.mockResolvedValue({ data: {} });
    mockAPIs.activityAPI.update.mockResolvedValue({ data: {} });
    mockAPIs.activityAPI.updateByRelease.mockResolvedValue({ data: {} });
  });

  it("switches edited project activity to standalone and calls updateStandalone", async () => {
    render(
      <MemoryRouter initialEntries={["/activities"]}>
        <Routes>
          <Route path="/activities" element={<ActivityManager />} />
        </Routes>
      </MemoryRouter>
    );

    const editBtn = await screen.findByLabelText("Edit activity");
    await userEvent.click(editBtn);

    const scopeSelect = screen.getByTestId("activity-form-scope");
    fireEvent.change(scopeSelect.querySelector("input") as HTMLInputElement, {
      target: { value: "standalone" },
    });

    await userEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(mockAPIs.activityAPI.updateStandalone).toHaveBeenCalled();
    });

    expect(mockAPIs.activityAPI.update).not.toHaveBeenCalled();
    expect(mockAPIs.activityAPI.updateByRelease).not.toHaveBeenCalled();
  });
});