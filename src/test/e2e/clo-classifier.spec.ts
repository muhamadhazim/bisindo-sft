import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { CloClassifier, type CloModel } from "../../features/recognition/clo-classifier";
import { extractFeatures } from "../../features/recognition/features";
import type { HandFrame } from "../../types/tracking";
const modelText = readFileSync("public/models/rhio-clo-v1/model.json", "utf8");
const model = JSON.parse(modelText) as CloModel;
const report = JSON.parse(readFileSync("ml/rhio/evaluation.json", "utf8")) as { modelSha256: string; golden: Array<{ frame: HandFrame; vector: number[]; votes: number[]; predicted: string | null }> };

test("trained forest export preserves extractor and predictions on held-out golden vectors", () => {
  expect(createHash("sha256").update(modelText).digest("hex")).toBe(report.modelSha256);
  const classifier = new CloClassifier(model);
  for (const row of report.golden) {
    const actual = extractFeatures(row.frame)!;
    expect(actual).toHaveLength(row.vector.length);
    actual.forEach((value,index)=>expect(value).toBeCloseTo(row.vector[index]!,10));
    expect(classifier.votes(row.vector)).toEqual(row.votes);
    expect(classifier.classifyVector(row.vector)).toBe(row.predicted);
  }
});
test("classifier rejects invalid inputs, absent/opposite hands and out-of-distribution geometry", () => {
  const classifier = new CloClassifier(model);
  expect(classifier.classifyVector(Array(52).fill(0))).toBeNull();
  expect(classifier.classifyVector([NaN])).toBeNull();
  expect(classifier.classifyVector([...Array(50).fill(1000),0,1])).toBeNull();
  expect(() => new CloClassifier({...model, runtime:{name:"unsupported",version:"2.1.0"}})).toThrow();
  expect(() => new CloClassifier({...model, featureSchema:{...model.featureSchema,id:"wrong"}})).toThrow();
});

for (const symbol of ["C", "L", "O"]) {
  test(`real VIDEO + trained forest recognizes ${symbol}, fits mobile, releases and repeats`, async ({ page }) => {
    await page.setViewportSize({width:360,height:800});
    await page.addInitScript((letter) => {
      navigator.mediaDevices.getUserMedia = async () => {
        const image = new Image();image.src=`/assets/signs/rhio-clo/${letter.toLowerCase()}.jpg`;await image.decode();
        const canvas=document.createElement("canvas");canvas.width=640;canvas.height=480;
        const ctx=canvas.getContext("2d")!;
        let blank=false;
        const clear=()=>{blank=true;};const restore=()=>{blank=false;};
        window.addEventListener("fixture-clear",clear);window.addEventListener("fixture-restore",restore);
        const draw=()=>{ctx.fillStyle="#eee";ctx.fillRect(0,0,640,480);if(!blank)ctx.drawImage(image,0,0,640,480);};
        draw();const stream=canvas.captureStream(12);const timer=setInterval(draw,80);
        for(const track of stream.getTracks()){const stop=track.stop.bind(track);track.stop=()=>{clearInterval(timer);window.removeEventListener("fixture-clear",clear);window.removeEventListener("fixture-restore",restore);stop();};}
        return stream;
      };
    },symbol);
    await page.goto(`/practice/bisindo-${symbol.toLowerCase()}-sanjaya-v1`);
    await page.getByRole("button",{name:"Mulai kamera",exact:true}).click();
    await expect(page.getByRole("heading",{name:`Sesuai target ${symbol}`,exact:true})).toBeVisible({timeout:20000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.evaluate(()=>window.dispatchEvent(new Event("fixture-clear")));
    await expect(page.getByRole("heading",{name:"Tampilkan tangan",exact:true})).toBeVisible({timeout:10000});
    await page.evaluate(()=>window.dispatchEvent(new Event("fixture-restore")));
    await expect(page.getByRole("heading",{name:`Sesuai target ${symbol}`,exact:true})).toBeVisible({timeout:20000});
    await page.getByRole("button",{name:"Hentikan kamera"}).click();
    if (symbol === "L") {
      await page.goto("/practice/bisindo-c-sanjaya-v1");
      await page.getByRole("button",{name:"Mulai kamera",exact:true}).click();
      await expect(page.getByRole("heading",{name:"Coba lagi",exact:true})).toBeVisible({timeout:20000});
      await expect(page.locator(".detected-letter")).toHaveText("Terbaca: L");
      await page.getByRole("button",{name:"Hentikan kamera"}).click();
    }
  });
}


test("classifier download failure is recoverable without leaving camera controls unusable", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas=document.createElement("canvas");canvas.width=640;canvas.height=480;
      const ctx=canvas.getContext("2d")!;const draw=()=>{ctx.fillStyle="#eee";ctx.fillRect(0,0,640,480);};
      draw();const stream=canvas.captureStream(12);const timer=setInterval(draw,80);
      for(const track of stream.getTracks()){const stop=track.stop.bind(track);track.stop=()=>{clearInterval(timer);stop();};}
      return stream;
    };
  });
  await page.route("**/models/rhio-clo-v1/model.json",route=>route.abort());
  await page.goto("/practice/bisindo-c-sanjaya-v1");
  await page.getByRole("button",{name:"Mulai kamera",exact:true}).click();
  await expect(page.getByRole("button",{name:"Coba pelacakan lagi"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Hentikan kamera"})).toBeVisible();
  await page.unroute("**/models/rhio-clo-v1/model.json");
  await page.getByRole("button",{name:"Coba pelacakan lagi"}).click();
  await expect(page.getByRole("heading",{name:"Tampilkan tangan",exact:true})).toBeVisible({timeout:20000});
  await page.getByRole("button",{name:"Hentikan kamera"}).click();
  await context.close();
});
