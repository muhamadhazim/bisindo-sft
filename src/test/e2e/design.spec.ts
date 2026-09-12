import { expect, test } from "@playwright/test";
import { readdirSync,readFileSync } from "node:fs";
import path from "node:path";

for (const width of [320,360,768,1440]) {
  test(`Sinyal scenes and layouts at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:960});
    const errors:string[]=[];
    page.on("pageerror",error=>errors.push(error.message));
    for(const [route,name] of [["/","home"],["/learn","map"],["/lesson/huruf-c/observe","lesson"],["/practice/bisindo-c-sanjaya-v1","practice"]]){
      await page.goto(route!);
      const scene=page.locator(".decorative-scene");
      if(name==="home"||name==="map") {
        await scene.scrollIntoViewIfNeeded();
        await expect(scene).toHaveAttribute("data-scene-state","ready",{timeout:20000});
        await expect(scene.locator("canvas")).toBeVisible();
        // Wait for the bounded greeting to finish before capturing visual evidence.
        await page.waitForTimeout(1700);
        await page.evaluate(()=>window.scrollTo(0,0));
        if(width>=768) await expect(scene).toHaveAttribute("data-scene-state","ready");
      } else await expect(page.locator(".decorative-scene")).toHaveCount(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:`test-results/sinyal-final-${name}-${width}.png`,fullPage:true});
      if(name==="home"||name==="map") await expect(scene).toHaveAttribute("data-scene-state","ready");
    }
    expect(errors).toEqual([]);
  });
}

test("2D map preserves links and handles unavailable WebGL",async({page})=>{
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,...args:Parameters<typeof original>){
      if(String(args[0]).startsWith("webgl")) return null;
      return original.apply(this,args);
    } as typeof original;
  });
  await page.goto("/learn");
  await expect(page.locator(".decorative-scene")).toHaveAttribute("data-scene-state","fallback");
  await expect(page.locator(".scene-poster")).toBeVisible();
  await page.getByRole("navigation",{name:"Pilih huruf di peta"}).getByRole("link",{name:/Huruf G–L/}).click();
  await expect(page).toHaveURL(/\/learn\/alfabet-g-l$/);
});

test("practice does not download Three.js; map remains keyboard usable with zoom",async({page})=>{
  const chunkRoot=path.join(process.cwd(),".next/static/chunks");
  const rendererChunks=readdirSync(chunkRoot).filter(file=>file.endsWith(".js")&&readFileSync(path.join(chunkRoot,file),"utf8").includes("THREE.WebGLRenderer"));
  expect(rendererChunks.length).toBeGreaterThan(0);
  const requests:string[]=[];
  page.on("request",request=>requests.push(request.url()));
  await page.goto("/practice/bisindo-c-sanjaya-v1");
  await expect(page.getByRole("button",{name:"Mulai kamera",exact:true})).toBeVisible();
  expect(requests.some(url=>rendererChunks.some(chunk=>url.endsWith(chunk)))).toBe(false);
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.setViewportSize({width:360,height:900});
  await page.goto("/learn");
  await page.addStyleTag({content:"body {zoom:2}"});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const link=page.getByRole("navigation",{name:"Pilih huruf di peta"}).getByRole("link",{name:/Huruf A–F/});
  await link.focus();await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/learn\/alfabet-a-f$/);
});

test("scene toggle and context loss keep the learning map usable",async({page})=>{
  await page.goto("/learn");
  const scene=page.locator(".decorative-scene");
  await expect(scene).toHaveAttribute("data-scene-state","ready",{timeout:20000});
  await page.getByRole("button",{name:"Tampilan 2D"}).click();
  await expect(scene.locator("canvas")).toHaveCount(0);
  await expect(scene).toHaveAttribute("data-scene-state","2d");
  await page.getByRole("button",{name:"Tampilan 3D"}).click();
  await expect(scene).toHaveAttribute("data-scene-state","ready");
  await scene.locator("canvas").evaluate(canvas=>canvas.dispatchEvent(new Event("webglcontextlost")));
  await expect(scene).toHaveAttribute("data-scene-state","fallback");
  await expect(page.getByRole("navigation",{name:"Pilih huruf di peta"}).getByRole("link")).toHaveCount(4);
});
