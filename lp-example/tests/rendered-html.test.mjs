import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished Fern & Clay page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();

  assert.match(html, /<title>Fern &amp; Clay/);
  assert.match(html, /Plants raised with care/);
  assert.match(html, /Plants currently available/);
  assert.match(html, /Practical plant care/);
  assert.match(html, /Small greenhouse workshops/);
  assert.match(html, /Local delivery/);
  assert.match(html, /Opening hours/);
  assert.match(html, /Skip to main content/);
  assert.match(html, /aria-label="Main navigation"/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
});

test("ships the generated editorial image set and responsive styles", async () => {
  const requiredAssets = [
    "../public/images/greenhouse-hero.jpg",
    "../public/images/plants-bench.jpg",
    "../public/images/potting-workshop.jpg",
    "../public/images/shopfront.jpg",
    "../public/og.jpg",
  ];
  await Promise.all(requiredAssets.map((path) => access(new URL(path, import.meta.url))));
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);
});
