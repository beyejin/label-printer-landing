const test = require("node:test");
const assert = require("node:assert/strict");
const { buildDestination, normalizePixelId, normalizeVariant } = require("../app.js");

const product = "https://www.coupang.com/vp/products/8113159630?itemId=22992058726&vendorItemId=95681947785";

test("쿠팡 파라미터를 유지하고 utm, fbclid, variant를 붙인다", () => {
  const url = new URL(buildDestination({
    coupangUrl: product,
    partnersUrl: ""
  }, "A", "utm_source=meta&utm_medium=paid&utm_campaign=class&utm_content=mine&fbclid=IwAR123&v=a"));
  assert.equal(url.searchParams.get("itemId"), "22992058726");
  assert.equal(url.searchParams.get("vendorItemId"), "95681947785");
  assert.equal(url.searchParams.get("utm_source"), "meta");
  assert.equal(url.searchParams.get("utm_medium"), "paid");
  assert.equal(url.searchParams.get("utm_campaign"), "class");
  assert.equal(url.searchParams.get("utm_content"), "mine");
  assert.equal(url.searchParams.get("fbclid"), "IwAR123");
  assert.equal(url.searchParams.get("variant"), "A");
  assert.equal(url.searchParams.get("v"), null);
});

test("파트너스 링크가 있으면 그 주소로 보낸다", () => {
  const url = new URL(buildDestination({
    coupangUrl: product,
    partnersUrl: "https://link.coupang.com/a/example?subid=class"
  }, "b", ""));
  assert.equal(url.hostname, "link.coupang.com");
  assert.equal(url.searchParams.get("subid"), "class");
  assert.equal(url.searchParams.get("variant"), "B");
});

test("구매 링크에 이미 있는 utm은 덮어쓰지 않는다", () => {
  const url = new URL(buildDestination({
    coupangUrl: "https://example.com/p?utm_source=coupang",
    partnersUrl: ""
  }, "A", "utm_source=meta&utm_medium=paid"));
  assert.equal(url.searchParams.get("utm_source"), "coupang");
  assert.equal(url.searchParams.get("utm_medium"), "paid");
});

test("픽셀 ID와 변형 이름", () => {
  assert.equal(normalizePixelId(""), "");
  assert.equal(normalizePixelId(" 123456789012345 "), "123456789012345");
  assert.equal(normalizePixelId("YOUR_PIXEL"), "");
  assert.equal(normalizePixelId("abc12345"), "");
  assert.equal(normalizeVariant("b"), "B");
  assert.equal(normalizeVariant(""), "A");
});

test("구매 링크가 없으면 실패한다", () => {
  assert.throws(() => buildDestination({ coupangUrl: "", partnersUrl: "  " }, "A", ""));
});
