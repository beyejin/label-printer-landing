const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const outDir = process.argv[2] || "/tmp/shots";
const base = process.env.BASE_URL || "http://127.0.0.1:8765";
const chrome = process.env.CHROME || "/usr/local/bin/google-chrome";

function overlaps(a, b) {
  if (!a || !b || a.width === 0 || b.width === 0) return false;
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

async function inspect(page) {
  return page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el || el.hidden) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    const overflows = [];
    document.querySelectorAll("body *").forEach((el) => {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return;
      if (el.scrollWidth > el.clientWidth + 1 && el.getBoundingClientRect().width > 0) {
        overflows.push((el.className && String(el.className)) || el.tagName);
      }
    });
    const text = document.body.innerText;
    return {
      overflows,
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      draft: text.includes("초안, 실제 광고 전 확인 필요"),
      consent: text.includes("초안 안전장치"),
      consentHidden: document.getElementById("consent") ? document.getElementById("consent").hidden : null,
      buy: text.includes("구매하기"),
      productShown: text.includes("오지렌 네임스티커 감열식 라벨프린터 라벨기 핑크"),
      ai: text.includes("AI로 만든 예시 이미지(실제 상품 아님)"),
      slot: text.includes("상품 사진 자리"),
      banned: ["쿠팡 2만", "19,900", "블루투스", "QR코드", "예시 후기", "실제 제품 사진", "미니", "한정판", "딱 한 장", "세상에 하나뿐"].filter((item) => text.includes(item)),
      boxes: {
        draft: box(".draft-banner"),
        consent: box("#consent"),
        buy: box(".cta"),
        name: box(".product-name"),
        ai: box(".ai-label"),
        slot: box(".photo-slot")
      }
    };
  });
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"]
  });
  const shots = [
    ["mobile-a-consent", "/a", 390, null],
    ["mobile-a-after-agree", "/a", 390, "agree"],
    ["mobile-b-consent", "/b", 390, null],
    ["mobile-b-after-agree", "/b", 390, "agree"],
    ["desktop-a-consent", "/a", 1280, null],
    ["desktop-a-after-agree", "/a", 1280, "agree"],
    ["desktop-b-consent", "/b", 1280, null],
    ["desktop-b-after-agree", "/b", 1280, "agree"]
  ];
  const report = [];
  let failed = false;
  for (const [name, route, width, choice] of shots) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width, height: width < 700 ? 844 : 900, deviceScaleFactor: 1 });
    await page.goto(base + route, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    if (choice) {
      const selector = choice === "agree" ? "#consent-agree" : "#consent-decline";
      await page.waitForFunction((sel) => {
        const el = document.querySelector(sel);
        if (!el || el.hidden) return false;
        const r = el.getBoundingClientRect();
        return r.width >= 44 && r.height >= 44;
      }, {}, selector);
      const hit = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        el.click();
        return { id: el.id, top: top && (top.id || top.className || top.tagName), width: r.width, height: r.height };
      }, selector);
      if (!hit || hit.height < 44 || hit.width < 44) throw new Error("button too small " + JSON.stringify(hit));
      await page.waitForSelector("#consent[hidden]");
    }
    const info = await inspect(page);
    const pairs = [
      ["draft", "consent"],
      ["draft", "buy"],
      ["consent", "buy"],
      ["name", "buy"],
      ["ai", "slot"],
      ["buy", "ai"]
    ];
    const hits = [];
    for (const [left, right] of pairs) {
      if (overlaps(info.boxes[left], info.boxes[right])) hits.push(left + "+" + right);
    }
    info.overlaps = hits;
    info.name = name;
    info.width = width;
    report.push(info);
    if (info.pageOverflow > 0 || info.overflows.length || info.overlaps.length || info.banned.length || !info.draft || !info.buy || !info.productShown || !info.ai || !info.slot) {
      failed = true;
      console.error("CHECK_FAIL", name, JSON.stringify(info));
    }
    await page.screenshot({ path: path.join(outDir, name + ".png"), fullPage: true });
    await context.close();
  }
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  if (failed) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
