(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.OJILLEN_EVENTS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  // 과제 기준: 구매하기 클릭 = 전환.
  // 그 클릭은 표준 이벤트 Lead가 아니라 맞춤 이벤트 BuyClick으로 보낸다.
  // PageView는 방문마다 다시 보낸다. 사람 단위로 묶거나 목표 수치로 세지 않는다.
  return {
    pageView: "PageView",
    buyClick: "BuyClick",
    productName: "오지렌 네임스티커 감열식 라벨프린터 라벨기 핑크"
  };
});
