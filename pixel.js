// Meta Pixel 기본 코드. /a 와 /b 에서만 불러옵니다.
// pixelId가 비어 있으면 요청을 보내지 않습니다.
(function (window, document) {
  var raw = window.OJILLEN && window.OJILLEN.pixelId;
  var id = String(raw || "").trim();
  if (!/^\d{5,20}$/.test(id)) {
    window.OJILLEN_PIXEL_ID = "";
    return;
  }
  window.OJILLEN_PIXEL_ID = id;

  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("init", id);
  window.fbq("track", "PageView");
})(window, document);
