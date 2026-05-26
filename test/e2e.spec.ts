import { describe, expect, test } from "vitest";
import packageJson from "../package.json";
import builderConfig from "../electron-builder.json";

describe("Wingrid release smoke checks", () => {
  test("package metadata matches the desktop app", () => {
    expect(packageJson.name).toBe("wingrid");
    expect(packageJson.productName).toBe("Wingrid");
    expect(packageJson.main).toBe("dist-electron/main/index.js");
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("electron builder writes versioned Windows releases", () => {
    expect(builderConfig.productName).toBe("Wingrid");
    expect(builderConfig.directories.output).toBe("release/${version}");
    expect(builderConfig.win.target[0]?.target).toBe("nsis");
    expect(builderConfig.win.target[0]?.arch).toContain("x64");
  });
});
