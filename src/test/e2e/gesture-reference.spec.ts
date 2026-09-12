import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { gestureReferences } from "../../features/gesture-reference/references";

test("every published character links reviewed evidence and one shared valid pose", () => {
  for (const pose of gestureReferences) {
    expect(pose.viewpoint).toBe("SOURCE_CAMERA_FRONT");
    expect(pose.review).toBe("PHOTO_SOURCE_ONLY");
    expect(pose.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(pose.sourceUrl).toContain("githubusercontent.com");
    expect(pose.hands.length).toBe(pose.requiredHands === "TWO" ? 2 : 1);
    for (const hand of pose.hands) {
      expect(hand.radius).toBeGreaterThanOrEqual(.06);
      expect(hand.radius).toBeLessThanOrEqual(.3);
      expect(hand.joints).toHaveLength(21);
      expect(hand.joints.every(p => p.length === 3 && p.every(Number.isFinite))).toBe(true);
    }
    expect(existsSync(`public${pose.posterUrl}`)).toBe(true);
  }
});

test("character 3D loads on request, can reset, and falls back after context loss", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/lesson/huruf-c/observe");
  await expect(page.getByAltText("Karakter tangan Sinyal, contoh bentuk C")).toBeVisible();
  expect(await page.locator(".gesture-stage canvas").count()).toBe(0);
  await page.getByRole("button", { name: "Lihat karakter 3D" }).click();
  await expect(page.locator(".gesture-stage canvas")).toBeVisible();
  await page.getByRole("button", { name: "Sudut kanan" }).click();
  await page.getByRole("button", { name: "Reset sudut" }).click();
  await expect(page.locator(".gesture-stage canvas")).toHaveAttribute("data-reference-ready", "true");
  await page.locator(".gesture-stage").screenshot({ path: ".tools/alphabet-review/character-c.png" });
  await page.locator(".gesture-stage canvas").evaluate(canvas => canvas.dispatchEvent(new Event("webglcontextlost")));
  await expect(page.getByText("3D belum tersedia di perangkat ini.", { exact: false })).toBeVisible();
  await expect(page.getByAltText("Karakter tangan Sinyal, contoh bentuk C")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
