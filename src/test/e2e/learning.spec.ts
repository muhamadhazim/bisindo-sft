import { expect, test } from "@playwright/test";

for (const width of [320, 360, 768, 1440]) {
  test(`learning click-through and licensed references at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const fits = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto("/");
    await page.getByRole("main").getByRole("link", { name: "Mulai belajar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Kenalan dengan BISINDO" })).toBeVisible();
    await fits();
    await page.getByRole("link", { name: "Lihat peta belajar" }).click();
    await page.locator('a[href="/learn/alfabet-a-f"]').last().click();
    await fits();
    await page.getByRole("link", { name: /Huruf C/ }).click();
    await page.getByRole("link", { name: "Amati huruf C" }).click();
    await expect(page.getByRole("img")).toHaveCount(1);
    const observedImage = await page.getByRole("img").getAttribute("src");
    expect(new URL(observedImage!, page.url()).pathname).toBe("/assets/signs/sinyal-v2/c.svg");
    await expect(page.getByRole("img")).toHaveAttribute("alt", /HANDSIGN/);
    await expect.poll(() => page.getByRole("img").evaluateAll((images) => images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
    await fits();
    if (width === 360) await page.screenshot({ path: "test-results/observe-360.png", fullPage: true });
    await page.getByRole("link", { name: "Lanjut ke praktik C" }).click();
    await expect(page.getByRole("heading", { name: "Siap berlatih langsung?" })).toBeVisible();
    await expect(page.getByText("Lihat contoh karakter: C", {exact:true})).toBeVisible();
    await expect(page.getByRole("img")).toHaveAttribute("src", observedImage!);
    await fits();
    await page.getByRole("link", { name: "Kembali ke peta", exact: true }).click();
    await page.getByRole("link", { name: "Sumber & lisensi" }).click();
    await page.getByText("Telusuri setiap gambar").click();
    await expect(page.locator("details li")).toHaveCount(9);
    await fits();
    expect(errors).toEqual([]);
  });
}

test("reference image failure keeps the lesson and next action usable", async ({ page }) => {
  await page.route("**/assets/signs/sinyal-v2/c.svg", (route) => route.abort());
  await page.goto("/lesson/huruf-c/observe");
  await expect(page.getByRole("status")).toContainText("belum dapat dimuat");
  await expect(page.getByRole("link", { name: "Lanjut ke praktik C" })).toBeVisible();
});

test("unknown curriculum ids return a recoverable 404", async ({ page }) => {
  for (const route of ["/learn/unknown", "/lesson/unknown", "/lesson/unknown/observe", "/practice/unknown", "/challenge/unknown"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("link", { name: "Kembali ke beranda" })).toBeVisible();
  }
});

