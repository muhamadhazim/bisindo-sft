import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

type FixtureWindow = Window & { fixtureLetter: string; streams: MediaStream[] };
const photos: Record<string, string> = {
  C: "public/assets/signs/rhio-clo/c.jpg", L: "public/assets/signs/rhio-clo/l.jpg", O: "public/assets/signs/rhio-clo/o.jpg",
  D: "src/test/fixtures/rhio-d.jpg",
};

async function camera(page: Page, initial: string) {
  await page.route("**/__photo/*", async route => {
    const letter = new URL(route.request().url()).pathname.split("/").at(-1)!;
    await route.fulfill({ contentType: "image/jpeg", body: await readFile(photos[letter]!) });
  });
  await page.addInitScript(async ({ initial, letters }) => {
    const state = window as unknown as FixtureWindow; state.fixtureLetter = initial; state.streams = [];
    navigator.mediaDevices.getUserMedia = async () => {
      const images: Record<string, HTMLImageElement> = {};
      await Promise.all(letters.map(async l => { const image = new Image(); image.src = `/__photo/${l}`; await image.decode(); images[l] = image; }));
      const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 480;
      const ctx = canvas.getContext("2d")!;
      const draw = () => { ctx.fillStyle = "#eee"; ctx.fillRect(0, 0, 640, 480); const im = images[state.fixtureLetter]; if (im) ctx.drawImage(im, 0, 0, 640, 480); };
      draw(); const stream = canvas.captureStream(12); const timer = setInterval(draw, 80);
      for (const track of stream.getTracks()) { const stop = track.stop.bind(track); track.stop = () => { clearInterval(timer); stop(); }; }
      state.streams.push(stream); return stream;
    };
  }, { initial, letters: Object.keys(photos) });
}
const pose = (page: Page, value: string) => page.evaluate(l => { (window as unknown as FixtureWindow).fixtureLetter = l; }, value);

for (const letter of ["C", "L", "O"]) {
  test(`real VIDEO + ONNX ${letter} celebrates once and waits for Continue`, async ({ page }) => {
    await camera(page, letter); await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`/practice/bisindo-${letter.toLowerCase()}-sanjaya-v1`);
    await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Hebat!", exact: true })).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole("button", { name: letter === "L" ? "Lihat hasil sesi" : `Lanjut ke ${letter === "C" ? "D" : "P"}` })).toBeVisible();
    await expect(page.getByRole("heading", { name: `Latihan huruf ${letter}`, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator(".gesture-stage canvas").count()).toBe(0);
    await page.locator(".practice-feedback").screenshot({ path: `.tools/alphabet-review/success-${letter}.png` });
    await page.getByRole("button", { name: "Ulangi huruf ini" }).click();
    await expect(page.getByRole("heading", { name: "Turunkan tangan sebentar" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hebat!", exact: true })).toHaveCount(0);
    await pose(page, "NONE"); await expect(page.getByRole("heading", { name: "Tampilkan tangan", exact: true })).toBeVisible({ timeout: 10000 });
    await pose(page, letter); await expect(page.getByRole("heading", { name: "Hebat!", exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".session-progress")).toContainText("1 diterima");
    await page.getByRole("button", { name: "Hentikan kamera" }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as FixtureWindow).streams.every(s => s.getTracks().every(t => t.readyState === "ended")))).toBe(true);
  });
}

test("Continue changes target while preserving stream and requires fresh released pose", async ({ page }) => {
  test.setTimeout(60000); await camera(page, "C");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/practice/bisindo-c-sanjaya-v1");
  await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
  await page.getByRole("button", { name: "Lanjut ke D" }).click({ timeout: 25000 });
  await expect(page.getByRole("heading", { name: "Latihan huruf D", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Turunkan tangan sebentar" })).toBeVisible();
  await pose(page, "NONE"); await expect(page.getByRole("heading", { name: "Tampilkan tangan", exact: true })).toBeVisible({ timeout: 15000 });
  await pose(page, "D"); await expect(page.getByRole("button", { name: "Lanjut ke E" })).toBeVisible({ timeout: 20000 });
  expect(await page.evaluate(() => (window as unknown as FixtureWindow).streams.length)).toBe(1);
  await expect(page.locator(".session-progress")).toContainText("2 diterima");
  await page.getByRole("link", { name: "Amati lagi", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as FixtureWindow).streams.every(s => s.getTracks().every(t => t.readyState === "ended")))).toBe(true);
});

test("last letter gives an honest partial summary and restarts at group beginning", async ({ page }) => {
  await camera(page, "L"); await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/practice/bisindo-l-sanjaya-v1");
  await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
  await page.getByRole("button", { name: "Lihat hasil sesi" }).click({ timeout: 25000 });
  await expect(page.getByRole("heading", { name: "Sesi selesai", exact: true })).toBeVisible();
  await expect(page.getByText("Huruf yang diterima dalam sesi ini: L.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Kelompok berikutnya" })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await expect.poll(() => page.evaluate(() => (window as unknown as FixtureWindow).streams.every(s => s.getTracks().every(t => t.readyState === "ended")))).toBe(true);
  await page.getByRole("button", { name: "Ulangi kelompok" }).click();
  await expect(page.getByRole("heading", { name: "Latihan huruf G", exact: true })).toBeVisible();
});

test("model failure is recoverable and never celebrates or disables camera stop", async ({ page }) => {
  await camera(page, "NONE");
  await page.route("**/models/alphabet-mlp-v2/model.onnx", route => route.abort());
  await page.goto("/practice/bisindo-c-sanjaya-v1");
  await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
  await expect(page.getByRole("button", { name: "Coba pengenal lagi" })).toBeVisible({ timeout: 25000 });
  await expect(page.getByRole("button", { name: "Hentikan kamera" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hebat!", exact: true })).toHaveCount(0);
  await page.unroute("**/models/alphabet-mlp-v2/model.onnx");
  await page.getByRole("button", { name: "Coba pengenal lagi" }).click();
  await expect(page.getByRole("heading", { name: "Tampilkan tangan", exact: true })).toBeVisible({ timeout: 25000 });
});

test("manual selection cancels animation; hidden tab preserves acceptance without advancing", async ({ page }) => {
  test.setTimeout(60000); await camera(page, "C");
  await page.goto("/practice/bisindo-c-sanjaya-v1");
  await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hebat!", exact: true })).toBeVisible({ timeout: 25000 });
  await page.getByRole("navigation", { name: "Pilih huruf latihan" }).getByRole("button", { name: "D", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Turunkan tangan sebentar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lanjut ke D" })).toHaveCount(0);
  await pose(page, "NONE");
  await expect(page.getByRole("heading", { name: "Tampilkan tangan", exact: true })).toBeVisible({ timeout: 15000 });
  await pose(page, "D");
  await expect(page.getByRole("heading", { name: "Hebat!", exact: true })).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByRole("button", { name: "Mulai kamera", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lanjut ke E" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Latihan huruf D", exact: true })).toBeVisible();
  await expect(page.locator(".session-progress")).toContainText("2 diterima");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => (window as unknown as FixtureWindow).streams.every(s => s.getTracks().every(t => t.readyState === "ended")))).toBe(true);
  await page.getByRole("button", { name: "Lanjut ke E" }).dblclick();
  await expect(page.getByRole("heading", { name: "Latihan huruf E", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mulai kamera", exact: true })).toBeVisible();
});
