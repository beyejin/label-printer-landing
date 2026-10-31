# 오지렌 네임스티커 감열식 라벨프린터 라벨기 핑크

광고 실험용 랜딩입니다. 화면에 적는 가격은 ₩19,900 하나이고, 할인·판매량·순위·만족도·후기·확인하지 않은 사양은 넣지 않습니다.

- 광고 도착 주소는 `/a` 하나입니다. 실험 광고는 `utm_content=exp`, 대조 광고는 `utm_content=control` 입니다.
- `/b` 는 레포에 남겨 둔 보관용 페이지이며 광고에 쓰지 않습니다.
- `/` 는 주소 안내입니다. Meta 스크립트를 불러오지 않습니다. `/?v=a`, `/?v=b` 는 `/a`, `/b`로 넘깁니다.

## 로컬에서 보기

```sh
npm install
npm start
```

- http://127.0.0.1:8765/a
- http://127.0.0.1:8765/b
- http://127.0.0.1:8765/

`python3 -m http.server 8765` 는 `/a/` 처럼 끝에 슬래시가 필요합니다.

```sh
npm test
npm run build
```

## 상품 사진

`config.js`의 `productPhoto`는 `"/assets/product.jpg"`입니다. 이 파일은 아래 쿠팡 CDN 대표 이미지(1000×1000)에서 테이프 문구와 파우치를 지운 JPEG입니다. 본체 앞면, 버튼, 로고, 옆 슬라이더는 원본 픽셀입니다. 파우치가 가렸던 왼쪽 아래 모서리는 그 자리에서 잘라 냈습니다.

`https://thumbnail.coupangcdn.com/thumbnails/remote/1000x1000ex/image/vendor_inventory/e8f9/a0703e42dcd726aef299748f42f322c7438ba747220cc221c626f15b93ec.png`

`assets/hero.jpg`는 쿠팡 상품 페이지의 대표 이미지와 같은 파일로 확인되지 않아 페이지에서 쓰지 않습니다.

경로가 비어 있으면 사진 없이 “상품 사진 자리”만 보입니다. 지금 빌드는 그 경로와 `assets/product.jpg`(JPEG)가 있어야 통과하고, 파일이 있을 때만 `dist`에 복사합니다.

가운데 `assets/scene-a.jpg`, `assets/scene-b.jpg`는 예시 장면입니다. 각 이미지 바로 위에 **AI로 만든 예시 이미지(실제 상품 아님)** 라고 적혀 있습니다.

## 방문 기록 동의

제목은 방문 기록 동의입니다. 방문자가 **동의**를 누르기 전에는 `fbevents.js`를 넣지 않고 이벤트도 보내지 않습니다. `noscript` 픽셀 이미지도 없습니다.

동의하시면 이 페이지 방문과 구매하기 클릭을 Meta 광고 측정에 보냅니다. Meta 스크립트가 브라우저에 기록을 남길 수 있습니다.

**거절**하면 그 선택을 이 브라우저에 남겨 두고 스크립트를 불러오지 않습니다. 구매하기는 동의와 상관없이 새 탭에서 쿠팡을 엽니다. 거절을 지우려면 그 사이트의 저장 데이터를 지우면 됩니다.

픽셀 ID가 비어 있으면 동의해도 스크립트를 넣지 않습니다.

브라우저 저장소 접근이 막혀도 현재 페이지에서 동의하거나 거절한 선택은 적용됩니다. 이 경우 새로고침 뒤에는 다시 선택해야 합니다. Meta의 자동 버튼 정보 수집은 끄고 아래 두 이벤트를 직접 보냅니다.

## 이벤트 이름

이름은 `events.js` 한 곳에만 있습니다.

- `PageView`: 동의 뒤 방문마다 보냅니다. 매개변수 `variant`는 페이지 값 `A` 또는 `B`입니다. 랜딩 주소에 `utm_content`가 있으면 그 값을, `utm_campaign`이 있으면 그 값을 같은 이벤트에 같이 보냅니다. 없거나 공백인 값은 넣지 않습니다. 새로고침과 재방문도 다시 보냅니다.
- `BuyClick`: 구매하기 클릭입니다. `trackCustom`으로 보내고 `variant`, 상품명, 그리고 있을 때 `utm_content`와 `utm_campaign`을 담습니다. 표준 이벤트 `Lead`는 쓰지 않습니다.

과제 기준: 구매하기 클릭 = 전환. 집계 문장은 **방문당 구매 클릭 비율**입니다. 방문은 `PageView`, 구매 클릭은 `BuyClick`입니다.

`PageView`는 동의 뒤 방문마다 셉니다. 새로고침도 방문이고, 막을 수 없습니다.

같은 탭에서 구매하기를 여러 번 눌러도 `BuyClick`은 한 번입니다. 그 탭을 새로고침해도 그 변형의 `BuyClick`은 다시 보내지 않습니다(`sessionStorage`). A와 B는 따로 셉니다. 같은 사람이 다른 탭을 열거나 새 세션에서 다시 오면 `BuyClick`을 다시 보낼 수 있습니다.

이 비율은 사람을 한 명으로 묶은 전환율이 아닙니다. 채택 기준: 링크 CTR ≥ 1.7%이면서 대조군의 1.3배 이상, 구매하기 클릭률(BuyClick/PageView) ≥ 10%, 광고별 노출 5,000회 미만이면 보류. 10%는 업계 기준이 아니라 팀이 미리 정한 기준값입니다.

구매하기는 `target="_blank"` `rel="noopener"` 로 새 탭을 엽니다. 이 페이지는 그대로 둡니다. 왼쪽 클릭, Ctrl, Shift, 가운데 클릭도 같은 이벤트를 보냅니다. 오른쪽 클릭으로 메뉴만 열 때는 전환을 세지 않습니다. 이벤트를 기다리느라 이동을 늦추지 않습니다. Meta가 받았다고 적지 않습니다.

두 광고 모두 `/a`로 오므로 `variant`는 둘 다 `A`입니다. 광고별 구분은 `utm_content`(`exp` / `control`)로 합니다.

## 픽셀 ID

픽셀 ID는 숫자입니다. 이벤트 관리자에서 복사합니다. 페이지에 보이는 값입니다. 액세스 토큰은 넣지 마세요. 가짜 숫자는 넣지 마세요.

`config.js`의 `pixelId`는 빈 문자열로 유지합니다. 배포 환경변수 `META_PIXEL_ID`에 숫자 ID를 넣으면 `node build.js`가 `dist/config.js`에 반영합니다. 숫자가 아니면 빌드가 멈춥니다. 계정, 픽셀, 환경변수, 재배포는 4번 담당입니다. 절차는 `docs/hw9-handoff.md`에 있습니다.

비어 있으면 픽셀을 불러오지 않습니다. 구매하기는 그대로 동작합니다.

쿠팡 파트너스 링크가 생기면 `config.js`의 `partnersUrl`에 넣습니다. 비어 있으면 아래 상품 주소로 갑니다.

`https://www.coupang.com/vp/products/8113159630?itemId=22992058726&vendorItemId=95681947785`

광고 주소의 `utm_*`와 `fbclid`는 구매 링크에 다시 붙입니다. 구매 링크의 `variant`는 A 또는 B입니다. 구매 링크에 이미 같은 `utm_`이 있으면 그 값을 유지합니다.

## 배포

2026년 10월 30일에 올린 Vercel 배포에는 이 변경(초안 문구 제거, 상품 사진, 광고별 utm)이 없습니다. GitHub에 푸시하는 것만으로 배포가 갱신되지는 않습니다. 소스의 `pixelId`는 `""`로 둡니다. Production 환경변수 `META_PIXEL_ID`를 넣은 뒤 재배포하는 일은 4번 담당입니다.

```sh
npx vercel deploy --prod --scope hanyejin8844-9549s-projects
```

`vercel.json`의 빌드 명령은 `node build.js`, 출력 폴더는 `dist`입니다.

1. Vercel에서 이 저장소를 연결합니다. Framework Preset은 Other입니다.
2. 픽셀을 만든 뒤 Production 환경변수 `META_PIXEL_ID`에 숫자만 넣습니다.
3. 위 명령으로 배포합니다.
4. `https://label-printer-landing.vercel.app/config.js`에 `pixelId`가 숫자로 나오는지 확인합니다. `/`와 `/b`는 광고 주소로 쓰지 않습니다.

| 광고 | 도착 URL |
| --- | --- |
| 실험 (문구 한 줄로 내 스타일 완성) | `https://label-printer-landing.vercel.app/a?utm_source=meta&utm_medium=paid&utm_campaign=ojillen_hw9&utm_content=exp` |
| 대조 (상품명) | `https://label-printer-landing.vercel.app/a?utm_source=meta&utm_medium=paid&utm_campaign=ojillen_hw9&utm_content=control` |

## 자동 테스트와 실제 Meta 확인

`npm test`는 가짜 `fbq`와 jsdom으로만 확인합니다. Meta 서버로 이벤트를 보내지 않습니다. 테스트 파일 안의 숫자는 목업 ID이며 `config.js`에 넣지 않습니다.

Meta가 이벤트를 받았는지는 이 테스트로 알 수 없습니다. 배포 후 이벤트 관리자의 테스트 이벤트에서 `PageView`와 `BuyClick`의 `variant`, `utm_content`, `utm_campaign`을 직접 봐야 합니다. 광고 차단은 끄고, 페이지에서 동의를 누른 다음 구매하기를 누릅니다.

## 파일

```text
index.html       루트 안내. 픽셀 없음
a/index.html     광고 랜딩 /a
b/index.html     보관용 /b
events.js        PageView, BuyClick, 상품명
app.js           동의, 구매 링크, BuyClick, utm 매개변수
pixel.js         동의 후에만 fbevents.js
config.js        픽셀 ID, 쿠팡 주소, 상품 사진 경로
build.js         dist 생성과 문구 검사
styles.css
server.js
assets/product.jpg
assets/scene-a.jpg
assets/scene-b.jpg
docs/hw9-handoff.md
docs/ads/experiment_ad.png
docs/ads/control_ad.png
```

이 페이지는 공식 판매 사이트가 아닙니다. 상품명은 과제에 적힌 이름을 그대로 씁니다.
