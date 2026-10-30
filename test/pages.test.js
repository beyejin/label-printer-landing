const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { assertSource, build } = require("../build.js");

test("A/B 원본 페이지 구조", () => {
  assert.doesNotThrow(() => assertSource());
});

test("환경변수 픽셀 ID는 dist 설정에만 넣고 HTML에는 Meta 태그를 넣지 않는다", () => {
  const mockId = "123456789012345";
  const withId = build({ META_PIXEL_ID: mockId });
  assert.equal(withId.pixelId, mockId);
  const config = fs.readFileSync(path.join("dist", "config.js"), "utf8");
  assert.match(config, new RegExp('pixelId: "' + mockId + '"'));
  const html = fs.readFileSync(path.join("dist", "a", "index.html"), "utf8");
  assert.doesNotMatch(html, /fbevents/);
  assert.doesNotMatch(html, /facebook\.com\/tr/);
  assert.doesNotMatch(html, /noscript/);
  const home = fs.readFileSync(path.join("dist", "index.html"), "utf8");
  assert.doesNotMatch(home, /fbq\(/);
  const source = fs.readFileSync("config.js", "utf8");
  assert.match(source, /pixelId: ""/);
  assert.doesNotMatch(source, /123456789012345/);

  const cleared = build({});
  assert.equal(cleared.pixelId, "");
  const clearedConfig = fs.readFileSync(path.join("dist", "config.js"), "utf8");
  assert.match(clearedConfig, /pixelId: ""/);
});

test("잘못된 픽셀 ID는 빌드를 멈춘다", () => {
  assert.throws(() => build({ META_PIXEL_ID: "not-a-pixel" }), /숫자/);
});
