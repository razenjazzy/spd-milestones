import { describe, expect, it } from "vitest";
import { applyReleaseTemplate, DEFAULT_RELEASE_MESSAGE_TEMPLATE } from "./releaseTemplate";

describe("applyReleaseTemplate", () => {
  it("fills in release package, link, and password placeholders", () => {
    const text = applyReleaseTemplate(DEFAULT_RELEASE_MESSAGE_TEMPLATE, {
      releasePackage: "CR-3.12.015 - Bangla QR",
      downloadLink: "https://share.example/release",
      downloadPassword: "pj#W5g$*rMRy",
    });

    expect(text).toContain("CR-3.12.015 - Bangla QR");
    expect(text).toContain("https://share.example/release");
    expect(text).toContain("pj#W5g$*rMRy");
    expect(text).not.toContain("{{releasePackage}}");
    expect(text).not.toContain("{{downloadLink}}");
    expect(text).not.toContain("{{downloadPassword}}");
  });
});