// 동의 전에는 이 파일을 불러도 Meta 스크립트를 넣지 않는다.
// activate는 동의 뒤에서만 호출한다.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.OJILLEN_PIXEL = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var scriptUrl = "https://connect.facebook.net/en_US/fbevents.js";

  function normalizePixelId(value) {
    var id = String(value || "").trim();
    return /^\d{5,20}$/.test(id) ? id : "";
  }

  function activate(win, doc, pixelId) {
    var id = normalizePixelId(pixelId);
    if (!id || !win || !doc) return false;
    if (!win.fbq) {
      var queue = function () {
        queue.callMethod ? queue.callMethod.apply(queue, arguments) : queue.queue.push(arguments);
      };
      win.fbq = queue;
      if (!win._fbq) win._fbq = queue;
      queue.push = queue;
      queue.loaded = true;
      queue.version = "2.0";
      queue.queue = [];
    }
    var selector = 'script[src="' + scriptUrl + '"]';
    if (!doc.querySelector(selector)) {
      var tag = doc.createElement("script");
      tag.async = true;
      tag.src = scriptUrl;
      var first = doc.getElementsByTagName("script")[0];
      if (first && first.parentNode) first.parentNode.insertBefore(tag, first);
      else (doc.head || doc.documentElement).appendChild(tag);
    }
    return true;
  }

  return {
    scriptUrl: scriptUrl,
    normalizePixelId: normalizePixelId,
    activate: activate
  };
});
