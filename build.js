const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const dist = path.join(root, "dist");
const required = [
  "폰·카드·케이블",
  "문구 한 줄로 내 스타일 완성",
  "쿠팡 2만 원대",
  "판매가는 시기마다 달라요",
  "전용 라벨지 별도",
  "예시 후기",
  "구매하기",
  "/pixel.js",
  "/assets/hero.jpg",
  "잉크·리본 필요 없는 감열식",
  "블루투스로 휴대폰 앱 연결",
  "글자·그림·날짜·QR코드 출력",
  "한국어 지원 · 핑크"
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
  for (const html of [a, b]) {
    for (const text of required) {
      if (!html.includes(text)) throw new Error("랜딩 공통 문구 누락: " + text);
    }
    if (!html.includes("<!-- pixel-noscript -->")) throw new Error("픽셀 noscript 표시가 없습니다.");
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
  if (home.includes("/pixel.js") || home.includes("fbq(")) {
    throw new Error("루트 페이지에는 픽셀을 넣지 않습니다.");
  }
  if (!home.includes('location.replace("/" + variant')) throw new Error("루트 리다이렉트가 없습니다.");
  const pixel = read("pixel.js");
  if (!pixel.includes('fbq("track", "PageView")')) throw new Error("PageView가 없습니다.");
  const app = read("app.js");
  if (!app.includes('"Lead"') || !app.includes("variant:")) throw new Error("Lead 이벤트가 없습니다.");
  for (const file of ["app.js", "pixel.js", "config.js", "server.js"]) {
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
  return configSource.replace(/pixelId:\s*"[^"]*"/, 'pixelId: ' + JSON.stringify(id));
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
  const numericId = /^\d{5,20}$/.test(pixelId) ? pixelId : "";
  const noscript = numericId
    ? '<noscript><img height="1" width="1" alt="" style="display:none" src="https://www.facebook.com/tr?id=' +
      numericId +
      '&ev=PageView&noscript=1"></noscript>'
    : "";

  for (const rel of [
    "index.html",
    "a/index.html",
    "b/index.html",
    "styles.css",
    "app.js",
    "pixel.js",
    "server.js",
    "assets/hero.jpg",
    "assets/scene-a.jpg",
    "assets/scene-b.jpg",
    "assets/fonts/pretendard-400.woff2",
    "assets/fonts/pretendard-700.woff2",
    "assets/fonts/pretendard-900.woff2"
  ]) {
    copyFile(rel);
  }
  fs.writeFileSync(path.join(dist, "config.js"), withPixelId(configSource, pixelId));
  for (const rel of ["a/index.html", "b/index.html"]) {
    const file = path.join(dist, rel);
    const html = fs.readFileSync(file, "utf8").replace("<!-- pixel-noscript -->", noscript);
    fs.writeFileSync(file, html);
  }
  return { pixelId: pixelId, numericId: numericId };
}

if (require.main === module) {
  try {
    const result = build(process.env);
    console.log(result.numericId ? "build ok, pixel " + result.numericId : "build ok, pixel id 없음");
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}

module.exports = { assertSource, build, sharedShell };
