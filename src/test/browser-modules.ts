import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import type { Page } from "@playwright/test";

/** Test-only serving of actual source modules; never a production debug endpoint. */
export async function serveBrowserModules(page: Page) {
  await page.route("**/__modules/**", async route => {
    const name = decodeURIComponent(new URL(route.request().url()).pathname.slice("/__modules/".length));
    if (name.includes("..")) return route.abort();
    if (name === "ort.mjs") return route.fulfill({ contentType: "text/javascript", body: await readFile("node_modules/onnxruntime-web/dist/ort.wasm.min.mjs", "utf8") });
    const source = await readFile(name, "utf8");
    if (name.endsWith(".json")) return route.fulfill({ contentType: "text/javascript", body: `export default ${source};` });
    let code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    code = code.replace(/(from\s+|import\s*\()(["'])([^"']+)\2/g, (match, prefix: string, quote: string, specifier: string) => {
      if (specifier === "onnxruntime-web/wasm") return `${prefix}${quote}/__modules/ort.mjs${quote}`;
      let resolved = specifier.startsWith("@/") ? `src/${specifier.slice(2)}` : specifier.startsWith(".") ? path.posix.normalize(path.posix.join(path.posix.dirname(name), specifier)) : null;
      if (!resolved) return match;
      if (!/\.(ts|json)$/.test(resolved)) resolved += ".ts";
      return `${prefix}${quote}/__modules/${resolved}${quote}`;
    });
    await route.fulfill({ contentType: "text/javascript", body: code });
  });
}
