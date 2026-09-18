import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [360,1440]) {
  for (const route of ["/","/learn","/learn/alfabet-awal","/lesson/huruf-c","/lesson/huruf-c/observe","/practice/bisindo-c-sanjaya-v1","/about-bisindo","/credits","/challenge/alfabet-awal"]) {
    test(`accessible HANDSIGN interface ${route} at ${width}px`,async({page})=>{
      await page.setViewportSize({width,height:960});
      await page.emulateMedia({reducedMotion:"reduce"});
      await page.goto(route);
      const results=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
      expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,reason:n.failureSummary}))}))).toEqual([]);
    });
  }
}

// axe marks some gradients as needing manual review. Check their actual CSS stops
// against the text color too, including the hover state used by mouse users.
test("primary button gradients keep readable white labels",async({page})=>{
  await page.goto("/");
  const button=page.locator(".hero-cta");
  for(const hover of [false,true]){
    if(hover) await button.hover();
    const styles=await button.evaluate(element=>{
      const style=getComputedStyle(element);
      return {color:style.color,background:style.backgroundImage};
    });
    const luminance=(rgb:string)=>{
      const [r=0,g=0,b=0]=rgb.match(/[\d.]+/g)!.slice(0,3).map(Number).map(v=>{
        const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;
      });
      return .2126*r+.7152*g+.0722*b;
    };
    const foreground=luminance(styles.color);
    const stops=styles.background.match(/rgba?\([^)]+\)/g)??[];
    expect(stops.length).toBeGreaterThanOrEqual(2);
    for(const stop of stops){
      const background=luminance(stop);
      expect((Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05)).toBeGreaterThanOrEqual(4.5);
    }
  }
});
