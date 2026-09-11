import { expect, test } from "@playwright/test";

for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
  test(`shell and unavailable route fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (width === 360 || width === 1440) {
      await page.screenshot({ path: `test-results/foundation-${width}.png`, fullPage: true });
    }
    await page.getByRole("link", { name: "Lihat kesiapan materi" }).click();
    await expect(page.getByRole("heading", { name: "Materi belum tersedia" })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const response = await page.goto("/halaman-tidak-ada");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Sepertinya Anda tersesat" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole("link", { name: "Kembali ke beranda" }).click();
    await expect(page.getByRole("heading", { name: "Ruang untuk belajar," })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("keyboard access, text zoom, reduced motion, and no camera prompt", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () => { throw new Error("Unexpected camera access on shell"); },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Lewati ke konten" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.addStyleTag({ content: "body { zoom: 2; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("baseline privacy headers and no heavy runtime downloads", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const response = await page.goto("/");
  const headers = response?.headers();
  expect(headers?.["x-content-type-options"]).toBe("nosniff");
  expect(headers?.["permissions-policy"]).toBe("camera=(self), microphone=(), geolocation=()");
  expect(headers?.["x-frame-options"]).toBe("DENY");
  expect(headers?.["x-powered-by"]).toBeUndefined();
  expect(requests.filter((url) => /mediapipe|tensorflow|\.wasm|\.task|\.glb|supabase/.test(url))).toEqual([]);
});
