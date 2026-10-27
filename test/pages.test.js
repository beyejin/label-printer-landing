const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { assertSource, build } = require("../build.js");

test("A/B 원본 페이지 구조", () => {
  assert.doesNotThrow(() => assertSource());
});

test("환경변수 픽셀 ID를 dist에 넣고 빈 값으로 되돌릴 수 있다", () => {
  const withId = build({ META_PIXEL_ID: "123456789012345" });
  assert.equal(withId.numericId, "123456789012345");
  const config = fs.readFileSync(path.join("dist", "config.js"), "utf8");
  assert.match(config, /pixelId: "123456789012345"/);
  const html = fs.readFileSync(path.join("dist", "a", "index.html"), "utf8");
  assert.match(html, /id=123456789012345&ev=PageView/);
  assert.doesNotMatch(html, /<!-- pixel-noscript -->/);
  const home = fs.readFileSync(path.join("dist", "index.html"), "utf8");
  assert.doesNotMatch(home, /fbq\(/);

  const cleared = build({});
  assert.equal(cleared.numericId, "");
  const clearedHtml = fs.readFileSync(path.join("dist", "a", "index.html"), "utf8");
  assert.doesNotMatch(clearedHtml, /facebook\.com\/tr/);
});

test("잘못된 픽셀 ID는 빌드를 멈춘다", () => {
  assert.throws(() => build({ META_PIXEL_ID: "not-a-pixel" }), /숫자/);
});
