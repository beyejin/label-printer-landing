const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { JSDOM } = require("jsdom");
const app = require("../app.js");
const events = require("../events.js");
const pixel = require("../pixel.js");

const product = "https://www.coupang.com/vp/products/8113159630?itemId=22992058726&vendorItemId=95681947785";
// 테스트 안에서만 쓰는 가짜 픽셀 ID. 소스와 광고에는 넣지 않는다.
const mockPixelId = "123456789012345";

function callsOf(win) {
  return win.__calls;
}

function load(file, url, options) {
  const html = fs.readFileSync(file, "utf8");
  const dom = new JSDOM(html, { url: url });
  const win = dom.window;
  const calls = [];
  win.__calls = calls;
  win.fbq = function () {
    calls.push(Array.from(arguments));
  };
  win.OJILLEN_EVENTS = events;
  win.OJILLEN_PIXEL = pixel;
  win.OJILLEN = Object.assign({
    pixelId: "",
    coupangUrl: product,
    partnersUrl: "",
    productPhoto: ""
  }, options || {});
  app.boot(win.document, win);
  return win;
}

function pixelScripts(win) {
  return Array.from(win.document.querySelectorAll("script")).filter(function (el) {
    return (el.getAttribute("src") || "").indexOf("fbevents.js") !== -1;
  });
}

function named(win, method, name) {
  return callsOf(win).filter(function (call) {
    return call[0] === method && call[1] === name;
  });
}

test("동의 전에는 Meta 호출과 스크립트가 없다", () => {
  const win = load("a/index.html", "http://127.0.0.1:8765/a?utm_source=meta&fbclid=abc");
  const link = win.document.querySelector("[data-buy]");
  assert.equal(pixelScripts(win).length, 0);
  assert.equal(callsOf(win).length, 0);
  assert.equal(win.document.getElementById("consent").hidden, false);
  link.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
  link.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true, button: 0 }));
  link.dispatchEvent(new win.MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }));
  assert.equal(callsOf(win).length, 0);
  assert.equal(pixelScripts(win).length, 0);
  assert.equal(link.getAttribute("target"), "_blank");
  assert.equal(link.getAttribute("rel"), "noopener");
  assert.equal(new URL(link.href).searchParams.get("utm_source"), "meta");
  assert.equal(new URL(link.href).searchParams.get("fbclid"), "abc");
  assert.equal(new URL(link.href).searchParams.get("variant"), "A");
  assert.equal(link.href.includes("coupang.com"), true);
});

test("동의 후 PageView에 변형이 실리고 BuyClick은 한 번만 나간다", () => {
  const win = load("a/index.html", "http://127.0.0.1:8765/a", { pixelId: mockPixelId });
  win.document.getElementById("consent-agree").click();
  assert.equal(pixelScripts(win).length, 1);
  assert.equal(pixelScripts(win)[0].getAttribute("src"), pixel.scriptUrl);
  const views = named(win, "track", events.pageView);
  assert.equal(views.length, 1);
  assert.deepEqual(views[0][2], { variant: "A" });
  assert.equal(named(win, "init", mockPixelId).length, 1);
  const link = win.document.querySelector("[data-buy]");
  link.dispatchEvent(new win.MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }));
  link.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true, button: 0 }));
  link.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, shiftKey: true, button: 0 }));
  link.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
  const buys = named(win, "trackCustom", events.buyClick);
  assert.equal(buys.length, 1);
  assert.equal(buys[0][2].variant, "A");
  assert.equal(buys[0][2].content_name, events.productName);
  assert.equal(win.sessionStorage.getItem(app.buyClickKey("A")), "1");
  assert.equal(win.document.getElementById("consent").hidden, true);
});

test("같은 탭 세션에서 새로고침하면 PageView만 다시 보내고 BuyClick은 보내지 않는다", () => {
  const first = load("b/index.html", "http://127.0.0.1:8765/b", { pixelId: mockPixelId });
  first.document.getElementById("consent-agree").click();
  first.document.querySelector("[data-buy]").dispatchEvent(new first.MouseEvent("click", { bubbles: true, cancelable: true }));
  assert.equal(named(first, "track", events.pageView).length, 1);
  assert.equal(named(first, "trackCustom", events.buyClick).length, 1);
  assert.equal(named(first, "trackCustom", events.buyClick)[0][2].variant, "B");

  const second = load("b/index.html", "http://127.0.0.1:8765/b", { pixelId: mockPixelId });
  second.localStorage.setItem(app.consentKey, "agree");
  second.sessionStorage.setItem(app.buyClickKey("B"), "1");
  app.boot(second.document, second);
  assert.equal(named(second, "track", events.pageView).length, 1);
  assert.deepEqual(named(second, "track", events.pageView)[0][2], { variant: "B" });
  second.document.querySelector("[data-buy]").dispatchEvent(new second.MouseEvent("click", { bubbles: true, cancelable: true }));
  second.document.querySelector("[data-buy]").dispatchEvent(new second.MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }));
  assert.equal(named(second, "trackCustom", events.buyClick).length, 0);
});

test("거절하면 스크립트를 넣지 않고 구매 링크는 남는다", () => {
  const win = load("a/index.html", "http://127.0.0.1:8765/a?utm_campaign=class", { pixelId: mockPixelId });
  win.document.getElementById("consent-decline").click();
  assert.equal(win.localStorage.getItem(app.consentKey), "decline");
  assert.equal(pixelScripts(win).length, 0);
  assert.equal(callsOf(win).length, 0);
  const link = win.document.querySelector("[data-buy]");
  link.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true }));
  assert.equal(callsOf(win).length, 0);
  assert.equal(link.getAttribute("target"), "_blank");
  assert.equal(link.getAttribute("rel"), "noopener");
  assert.equal(new URL(link.href).hostname, "www.coupang.com");
  assert.equal(new URL(link.href).searchParams.get("utm_campaign"), "class");

  const again = load("a/index.html", "http://127.0.0.1:8765/a", { pixelId: mockPixelId });
  again.localStorage.setItem(app.consentKey, "decline");
  app.boot(again.document, again);
  assert.equal(again.document.getElementById("consent").hidden, true);
  assert.equal(pixelScripts(again).length, 0);
  assert.equal(callsOf(again).length, 0);
  again.document.querySelector("[data-buy]").click();
  assert.equal(callsOf(again).length, 0);
});

test("픽셀 ID가 비어 있으면 동의해도 스크립트를 넣지 않는다", () => {
  const win = load("a/index.html", "http://127.0.0.1:8765/a");
  win.document.getElementById("consent-agree").click();
  assert.equal(win.localStorage.getItem(app.consentKey), "agree");
  assert.equal(pixelScripts(win).length, 0);
  assert.equal(callsOf(win).length, 0);
  const link = win.document.querySelector("[data-buy]");
  assert.equal(link.getAttribute("target"), "_blank");
  link.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true }));
  assert.equal(callsOf(win).length, 0);
});

test("상품 사진 경로가 비어 있으면 이미지를 넣지 않는다", () => {
  const win = load("a/index.html", "http://127.0.0.1:8765/a");
  const slot = win.document.querySelector("[data-product-photo]");
  assert.equal(slot.querySelector("img"), null);
  assert.equal(slot.textContent.includes("상품 사진 자리"), true);
  win.OJILLEN.productPhoto = "/assets/product.jpg";
  app.boot(win.document, win);
  assert.equal(slot.querySelector("img").getAttribute("src"), "/assets/product.jpg");
  assert.equal(slot.querySelector("img").getAttribute("alt"), events.productName);
});

test("utm_content와 utm_campaign이 있으면 PageView와 BuyClick에 싣고 variant는 유지한다", () => {
  const win = load(
    "a/index.html",
    "http://127.0.0.1:8765/a?utm_source=meta&utm_medium=paid&utm_campaign=ojillen_hw9&utm_content=control",
    { pixelId: mockPixelId }
  );
  win.document.getElementById("consent-agree").click();
  assert.deepEqual(named(win, "track", events.pageView)[0][2], {
    variant: "A",
    utm_content: "control",
    utm_campaign: "ojillen_hw9"
  });
  win.document.querySelector("[data-buy]").dispatchEvent(new win.MouseEvent("click", { bubbles: true, button: 0 }));
  assert.deepEqual(named(win, "trackCustom", events.buyClick)[0][2], {
    variant: "A",
    utm_content: "control",
    utm_campaign: "ojillen_hw9",
    content_name: events.productName
  });
});

test("utm_content만 있으면 utm_campaign은 넣지 않는다", () => {
  const win = load("a/index.html", "http://127.0.0.1:8765/a?utm_content=exp", { pixelId: mockPixelId });
  win.document.getElementById("consent-agree").click();
  assert.deepEqual(named(win, "track", events.pageView)[0][2], {
    variant: "A",
    utm_content: "exp"
  });
  assert.equal(Object.prototype.hasOwnProperty.call(named(win, "track", events.pageView)[0][2], "utm_campaign"), false);
});

test("utm_campaign만 있어도 variant와 함께 보낸다", () => {
  const win = load("b/index.html", "http://127.0.0.1:8765/b?utm_campaign=ojillen_hw9", { pixelId: mockPixelId });
  win.document.getElementById("consent-agree").click();
  assert.deepEqual(named(win, "track", events.pageView)[0][2], {
    variant: "B",
    utm_campaign: "ojillen_hw9"
  });
});

test("config.js 상품 사진을 빈 자리에 그리고 A 포인트 제목을 유지한다", () => {
  const config = fs.readFileSync("config.js", "utf8");
  const match = /productPhoto:\s*"([^"]*)"/.exec(config);
  assert.equal(match && match[1], "/assets/product.jpg");
  const win = load("a/index.html", "http://127.0.0.1:8765/a", { productPhoto: match[1] });
  const img = win.document.querySelector("[data-product-photo] img");
  assert.equal(img.getAttribute("src"), "/assets/product.jpg");
  assert.equal(img.getAttribute("alt"), events.productName);
  assert.equal(win.document.body.textContent.includes("상품 사진 자리"), false);
  assert.equal(win.document.body.textContent.includes("초안, 실제 광고 전 확인 필요"), false);
  assert.equal(win.document.body.textContent.includes("방문 기록 동의"), true);
  const titles = Array.from(win.document.querySelectorAll(".pt strong")).map((el) => el.textContent);
  assert.deepEqual(titles, ["나만 아는 문구", "겹치지 않는 한 줄", "같은 폰도 다르게"]);
});

test("오른쪽 클릭은 전환을 소비하지 않고 다음 실제 클릭을 센다", () => {
  const win = load("a/index.html", "http://127.0.0.1:8765/a", { pixelId: mockPixelId });
  win.document.getElementById("consent-agree").click();
  const link = win.document.querySelector("[data-buy]");
  link.dispatchEvent(new win.MouseEvent("auxclick", { bubbles: true, button: 2 }));
  assert.equal(named(win, "trackCustom", events.buyClick).length, 0);
  assert.equal(win.sessionStorage.getItem(app.buyClickKey("A")), null);
  link.dispatchEvent(new win.MouseEvent("click", { bubbles: true, button: 0 }));
  assert.equal(named(win, "trackCustom", events.buyClick).length, 1);
});

test("브라우저 저장소가 차단돼도 현재 페이지의 동의와 중복 방지가 동작한다", () => {
  const win = load("b/index.html", "http://127.0.0.1:8765/b", { pixelId: mockPixelId });
  for (const name of ["localStorage", "sessionStorage"]) {
    Object.defineProperty(win, name, { get() { throw new Error("storage blocked"); } });
  }
  win.document.getElementById("consent-agree").click();
  assert.equal(pixelScripts(win).length, 1);
  assert.equal(named(win, "track", events.pageView).length, 1);
  assert.deepEqual(callsOf(win)[0], ["set", "autoConfig", false, mockPixelId]);
  const link = win.document.querySelector("[data-buy]");
  link.dispatchEvent(new win.MouseEvent("click", { bubbles: true, button: 0 }));
  link.dispatchEvent(new win.MouseEvent("auxclick", { bubbles: true, button: 1 }));
  assert.equal(named(win, "trackCustom", events.buyClick).length, 1);
});
