const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const dist = path.join(root, "dist");
const productName = "오지렌 네임스티커 감열식 라벨프린터 라벨기 핑크";
const required = [
  productName,
  "폰·카드·케이블",
  "문구 한 줄로 내 스타일 완성",
  "초안, 실제 광고 전 확인 필요",
  "초안 안전장치",
  "AI로 만든 예시 이미지(실제 상품 아님)",
  "상품 사진 자리",
  "구매하기",
  'target="_blank"',
  'rel="noopener"',
  "/events.js",
  "/pixel.js",
  "/app.js"
];
const forbidden = [
  "쿠팡 2만",
  "19,900",
  "19900",
  "블루투스",
  "QR코드",
  "잉크",
  "리본",
  "한국어 지원",
  "라벨지",
  "미니",
  "예시 후기",
  "실제 제품 사진",
  "hero.jpg",
  "fbevents",
  "facebook.com/tr",
  "Lead",
  "2만 원"
];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function sharedShell(html) {
  return html
    .replace(/data-variant="[AB]"/, 'data-variant="X"')
    .replace(/<title>[\s\S]*?<\/title>/, "<title></title>")
    .replace(/<meta name="description" content="[\s\S]*?">/, '<meta name="description" content="">')
    .replace(/<section class="motive"[\s\S]*?<\/section>/, "<section class=\"motive\"></section>");
}

function assertSource() {
  const a = read("a/index.html");
  const b = read("b/index.html");
  const home = read("index.html");
  const events = read("events.js");
  const app = read("app.js");
  const pixel = read("pixel.js");
  const config = read("config.js");
  for (const html of [a, b, home]) {
    if (!html.includes("초안, 실제 광고 전 확인 필요")) {
      throw new Error("초안 안내가 없습니다.");
    }
    if (!html.includes(productName)) throw new Error("상품명이 없습니다.");
    for (const text of forbidden) {
      if (html.includes(text)) throw new Error("빼야 할 문구: " + text);
    }
  }
  for (const html of [a, b]) {
    for (const text of required) {
      if (!html.includes(text)) throw new Error("랜딩 공통 문구 누락: " + text);
    }
  }
  if (!a.includes("/assets/scene-a.jpg") || a.includes("/assets/scene-b.jpg")) {
    throw new Error("A 장면 이미지가 올바르지 않습니다.");
  }
  if (!b.includes("/assets/scene-b.jpg") || b.includes("/assets/scene-a.jpg")) {
    throw new Error("B 장면 이미지가 올바르지 않습니다.");
  }
  if (!a.includes("세상에 하나뿐인 문구, 남들과 겹치지 않게")) throw new Error("A 헤드라인 누락");
  if (!b.includes("친구랑 맞춰 붙이는 우리 편 라벨")) throw new Error("B 헤드라인 누락");
  if (sharedShell(a) !== sharedShell(b)) {
    throw new Error("A/B는 가운데 동기 구간과 제목만 달라야 합니다.");
  }
  if (home.includes("/pixel.js") || home.includes("fbq(") || home.includes("/events.js")) {
    throw new Error("루트 페이지에는 픽셀을 넣지 않습니다.");
  }
  if (!home.includes('location.replace("/" + variant')) throw new Error("루트 리다이렉트가 없습니다.");
  if (!events.includes('pageView: "PageView"') || !events.includes('buyClick: "BuyClick"')) {
    throw new Error("이벤트 이름 상수가 없습니다.");
  }
  if (!events.includes("구매하기 클릭 = 전환")) throw new Error("전환 주석이 없습니다.");
  if (app.includes('"Lead"') || app.includes("'Lead'")) throw new Error("Lead가 남아 있습니다.");
  if (!app.includes("events.pageView") || !app.includes("events.buyClick")) {
    throw new Error("이벤트 상수를 쓰지 않습니다.");
  }
  if (!app.includes('trackCustom')) throw new Error("trackCustom이 없습니다.");
  if (pixel.includes("fbq(") && pixel.indexOf("activate") === -1) {
    throw new Error("픽셀 파일이 바로 실행되면 안 됩니다.");
  }
  if (!config.includes('pixelId: ""')) throw new Error("픽셀 ID 자리가 비어 있지 않습니다.");
  if (/pixelId:\s*"\d+"/.test(config)) throw new Error("소스에 픽셀 숫자가 있습니다.");
  for (const file of ["app.js", "pixel.js", "config.js", "events.js", "server.js"]) {
    const result = spawnSync(process.execPath, ["--check", path.join(root, file)], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(result.stderr || file + " 구문 오류");
  }
}

function pixelIdFrom(configSource, env) {
  const match = /pixelId:\s*"([^"]*)"/.exec(configSource);
  const fromFile = match ? match[1].trim() : "";
  if (env && Object.prototype.hasOwnProperty.call(env, "META_PIXEL_ID")) {
    const id = String(env.META_PIXEL_ID).trim();
    if (id && !/^\d{5,20}$/.test(id)) {
      throw new Error("META_PIXEL_ID는 숫자 픽셀 ID여야 합니다.");
    }
    return id;
  }
  return fromFile;
}

function withPixelId(configSource, id) {
  return configSource.replace(/pixelId:\s*"[^"]*"/, "pixelId: " + JSON.stringify(id));
}

function copyFile(rel) {
  const target = path.join(dist, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, rel), target);
}

function build(env) {
  const sourceEnv = env || process.env;
  assertSource();
  fs.rmSync(dist, { recursive: true, force: true });
  const configSource = read("config.js");
  const pixelId = pixelIdFrom(configSource, sourceEnv);
  const files = [
    "index.html",
    "a/index.html",
    "b/index.html",
    "styles.css",
    "app.js",
    "events.js",
    "pixel.js",
    "server.js",
    "assets/scene-a.jpg",
    "assets/scene-b.jpg",
    "assets/fonts/pretendard-400.woff2",
    "assets/fonts/pretendard-700.woff2",
    "assets/fonts/pretendard-900.woff2"
  ];
  if (fs.existsSync(path.join(root, "assets/product.jpg"))) files.push("assets/product.jpg");
  for (const rel of files) copyFile(rel);
  fs.writeFileSync(path.join(dist, "config.js"), withPixelId(configSource, pixelId));
  const landing = fs.readFileSync(path.join(dist, "a/index.html"), "utf8");
  if (landing.includes("fbevents") || landing.includes("facebook.com/tr")) {
    throw new Error("빌드 결과에 Meta 스크립트가 들어가면 안 됩니다.");
  }
  return { pixelId: pixelId };
}

if (require.main === module) {
  try {
    const result = build(process.env);
    console.log(result.pixelId ? "build ok, pixel " + result.pixelId : "build ok, pixel id 없음");
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}

module.exports = { assertSource, build, sharedShell };
