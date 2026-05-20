/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Releases from "./Releases";

const mockAPIs = vi.hoisted(() => ({
  releaseAPI: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    adminRevalidateLink: vi.fn(),
    issueOneTimeCode: vi.fn(),
    redeemOneTimeCode: vi.fn(),
    revealArtifact: vi.fn(),
  },
  settingsAPI: { get: vi.fn() },
  dashboardAPI: { pipeline: vi.fn() },
  projectAPI: { getAll: vi.fn() },
}));

vi.mock("../api/api", () => ({
  releaseAPI: mockAPIs.releaseAPI,
  settingsAPI: mockAPIs.settingsAPI,
  dashboardAPI: mockAPIs.dashboardAPI,
  projectAPI: mockAPIs.projectAPI,
}));

describe("Releases copy button", () => {
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

    mockAPIs.releaseAPI.list.mockResolvedValue({
      data: [
        {
          _id: "r1",
          releasePackage: "CR-3.12.015 - Bangla QR",
          status: "staging",
          type: "security-fix",
          downloadLink: "https://share.example/release",
          downloadPassword: "pass-123",
          pipelineStage: "standalone",
        },
      ],
    });
    mockAPIs.settingsAPI.get.mockResolvedValue({
      data: {
        releaseMessageTemplate: "Package: {{releasePackage}} Link: {{downloadLink}} Password: {{downloadPassword}}",
      },
    });
    mockAPIs.dashboardAPI.pipeline.mockResolvedValue({ data: { standalone: 1, merged: 0, releaseForProductionUpcoming: 0 } });
    mockAPIs.projectAPI.getAll.mockResolvedValue({ data: [] });

    Object.assign(globalThis.navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("copies formatted deployment text to clipboard", async () => {
    render(
      <MemoryRouter>
        <Releases />
      </MemoryRouter>
    );

    const copyBtn = await screen.findByLabelText("Copy deployment text");
    await userEvent.click(copyBtn);

    await waitFor(() => {
      expect(globalThis.navigator.clipboard.writeText).toHaveBeenCalled();
    });

    const payload = (globalThis.navigator.clipboard.writeText as any).mock.calls[0][0] as string;
    expect(payload).toContain("CR-3.12.015 - Bangla QR");
    expect(payload).toContain("https://share.example/release");
    expect(payload).toContain("pass-123");
  });
});