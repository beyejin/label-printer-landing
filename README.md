# 오지렌 미니 라벨프린터 랜딩페이지

폰, 카드, 케이블을 문구 한 줄로 꾸미는 핑크 미니 라벨프린터의 수업용 A/B 랜딩페이지입니다. HTML, CSS, JavaScript만 사용합니다. 광고는 Meta(Facebook/Instagram)에 걸고, 전환은 이 페이지의 **구매하기** 클릭입니다. 쿠팡에서 실제 결제까지 가지 않아도 전환으로 셉니다.

두 페이지는 위쪽 제품 사진, 특징 칩, 가격 영역이 같고, 가운데 동기 구간만 다릅니다.

- A 나만의 것: `/a`
- B 친구랑 함께: `/b`
- `/` 는 팀용 주소 안내입니다. 픽셀이 없고 구매 버튼도 없습니다. `/?v=a`, `/?v=b` 는 광고에 쓰던 예전 주소라서 각각 `/a`, `/b`로 넘깁니다.

후기는 모두 **예시 후기**로 표시합니다. 가운데 장면 사진은 예시 이미지이고, 위쪽은 실제 제품 사진입니다.

## 로컬에서 보기

```sh
npm start
```

브라우저에서 다음 주소를 엽니다.

- http://127.0.0.1:8765/a
- http://127.0.0.1:8765/b
- http://127.0.0.1:8765/

`python3 -m http.server 8765` 로 열 수도 있습니다. 그 서버는 `/a/` 처럼 끝에 슬래시가 필요합니다.

확인:

```sh
npm test
npm run build
```

## 픽셀 ID 설정

픽셀 ID는 숫자입니다. 이벤트 관리자 → 데이터 소스 → 픽셀에서 복사합니다. 이 값은 페이지 소스에 그대로 들어가므로 숨길 수 없습니다. **액세스 토큰은 넣지 마세요.**

둘 중 하나만 하면 됩니다.

1. `config.js`의 `pixelId`에 숫자만 넣습니다. 로컬 `npm start`로 바로 확인할 수 있습니다.
2. 배포 환경변수 `META_PIXEL_ID`에 같은 숫자를 넣습니다. `node build.js`가 `dist/config.js`의 `pixelId`를 이 값으로 바꿉니다. 환경변수가 있으면 `config.js`보다 우선합니다.

ID가 비어 있거나 숫자가 아니면 픽셀을 불러오지 않습니다. 구매하기는 그대로 쿠팡으로 이동합니다.

쿠팡 파트너스 링크가 생기면 `config.js`의 `partnersUrl`에 넣습니다. 비어 있으면 아래 상품 주소로 갑니다.

`https://www.coupang.com/vp/products/8113159630?itemId=22992058726&vendorItemId=95681947785`

광고 주소에 붙어 온 `utm_*`와 `fbclid`는 구매 링크에 다시 붙입니다. `variant`는 A 또는 B로 붙습니다. 구매 링크에 이미 같은 `utm_`이 있으면 그쪽 값을 유지합니다.

## 배포

이 저장소는 Vercel 정적 사이트입니다. `vercel.json`에 빌드 명령 `node build.js`, 출력 폴더 `dist`가 들어 있습니다.

1. [Vercel](https://vercel.com)에서 이 저장소를 연결합니다. Framework Preset은 Other입니다.
2. Environment Variables에 `META_PIXEL_ID`를 숫자로 추가합니다. Production에 넣어야 광고 랜딩에 픽셀이 들어갑니다.
3. 배포합니다. 빌드는 두 랜딩의 공통 구조가 깨지지 않았는지 확인합니다. 구매 링크 전달은 `npm test`로 확인합니다.
4. 배포가 끝나면 `https://프로젝트.vercel.app/a` 와 `/b`가 열려야 합니다.

`config.js`에 ID를 적어 커밋해도 동작합니다. 저장소에 ID를 남기기 싫으면 환경변수만 사용하고 `pixelId`는 빈 문자열로 둡니다.

## 광고 세트 주소

캠페인 하나에 광고 세트 두 개를 두고, 도착 URL만 다르게 합니다.

| 광고 세트 | 페이지 | 도착 URL |
| --- | --- | --- |
| A 나만의 것 | `/a` | `https://프로젝트.vercel.app/a` |
| B 친구랑 함께 | `/b` | `https://프로젝트.vercel.app/b` |

UTM을 광고에서 직접 붙이면 구매 링크까지 전달됩니다.

```text
https://프로젝트.vercel.app/a?utm_source=meta&utm_medium=paid&utm_campaign=ojillen&utm_content=A
https://프로젝트.vercel.app/b?utm_source=meta&utm_medium=paid&utm_campaign=ojillen&utm_content=B
```

`/` 는 광고 도착 URL로 쓰지 않습니다. 픽셀이 없어서 그 트래픽은 측정되지 않습니다.

Meta가 보고하는 CTR은 광고 관리자의 노출·클릭입니다. CVR은 랜딩의 구매하기 클릭입니다. 구매하기를 누르면 표준 이벤트 `Lead`가 나가고, 매개변수 `variant`는 `A` 또는 `B`입니다. `content_name`은 `오지렌 미니 라벨프린터`입니다. 픽셀이 이벤트를 보낸 뒤에 쿠팡으로 이동합니다. 픽셀이 없으면 바로 이동합니다.

## 이벤트 확인

광고 차단을 끄고 확인합니다.

1. 크롬에 [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)를 설치합니다.
2. 이벤트 관리자 → 해당 픽셀 → **테스트 이벤트**를 엽니다. 안내하는 테스트 브라우저로 배포된 `/a`를 엽니다.
3. Pixel Helper에 PageView와 픽셀 ID가 보여야 합니다. 테스트 이벤트 목록에도 PageView가 찍힙니다.
4. **구매하기**를 누릅니다. 페이지가 쿠팡으로 넘어가기 전에 `Lead`가 떠야 하고, 매개변수 `variant`가 `A`여야 합니다. `/b`에서도 같게 하되 `variant`는 `B`입니다.
5. 테스트 이벤트 목록에서 `Lead`의 `variant`를 확인합니다. 여기까지 보이면 픽셀 설치는 된 것입니다.
6. ID를 바꾸었다면 배포를 다시 한 뒤, 시크릿 창에서 새로고침하고 다시 확인합니다. Helper에 픽셀이 없다고 나오면 `config.js` 또는 `META_PIXEL_ID`가 비어 있는 배포입니다.

이벤트 관리자에서 웹사이트 URL을 배포 주소로 저장해 두면 테스트 이벤트에서 그 주소를 바로 열 수 있습니다. 도메인 인증은 전환 API나 일부 광고 최적화에 필요할 수 있습니다. PageView와 Lead가 테스트 이벤트에 보이는지만 먼저 확인하면 됩니다.

## 파일

```text
index.html          루트 안내. 픽셀 없음
a/index.html        변형 A
b/index.html        변형 B
styles.css          공통 스타일
app.js              구매 링크, UTM 전달, Lead
pixel.js            픽셀 기본 코드와 PageView
config.js           픽셀 ID, 쿠팡 주소, 파트너스 주소
build.js            dist 생성. META_PIXEL_ID 반영
server.js           로컬 서버
assets/hero.jpg     실제 제품 사진
assets/scene-a.jpg  A 예시 장면
assets/scene-b.jpg  B 예시 장면
```

페이지의 제품 사진 위 헤드라인과 사용 예시는 수업용 표현입니다. 가격은 쿠팡에서 시기마다 달라지고, 전용 라벨지는 별도입니다. 상표와 제품명은 해당 권리자의 소유이며 이 페이지는 공식 판매 사이트가 아닙니다.
