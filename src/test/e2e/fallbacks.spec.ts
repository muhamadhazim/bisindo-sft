import { expect, test } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ErrorPage from "../../app/error";
import GlobalError from "../../app/global-error";
import Loading from "../../app/loading";

test("error fallbacks expose recovery without leaking exception details", () => {
  const error = new Error("PRIVATE_SERVER_DIAGNOSTIC");
  for (const component of [ErrorPage, GlobalError]) {
    const html = renderToStaticMarkup(createElement(component, { error, reset: () => {} }));
    expect(html).toContain('role="alert"');
    expect(html).toContain("Coba lagi");
    expect(html).not.toContain(error.message);
    expect(html).not.toContain(error.stack);
  }
});

test("loading has a textual live status", () => {
  const html = renderToStaticMarkup(createElement(Loading));
  expect(html).toContain('role="status"');
  expect(html).toContain('aria-live="polite"');
  expect(html).toContain("Memuat halaman");
});
