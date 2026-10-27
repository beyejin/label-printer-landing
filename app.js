(function (factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;
  var start = function () {
    api.bindLanding(document, window);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(function () {
  function normalizePixelId(value) {
    var id = String(value || "").trim();
    return /^\d{5,20}$/.test(id) ? id : "";
  }

  function normalizeVariant(value) {
    return String(value || "").toUpperCase() === "B" ? "B" : "A";
  }

  function buildDestination(config, variant, search) {
    var partners = config && String(config.partnersUrl || "").trim();
    var product = config && String(config.coupangUrl || "").trim();
    var base = partners || product;
    if (!base) throw new Error("구매 링크가 설정되지 않았습니다.");
    var url = new URL(base);
    var params = search instanceof URLSearchParams ? search : new URLSearchParams(search || "");
    params.forEach(function (value, key) {
      if (!value) return;
      if ((key.indexOf("utm_") === 0 || key === "fbclid") && !url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });
    url.searchParams.set("variant", normalizeVariant(variant));
    return url.toString();
  }

  // fbevents.js가 callMethod를 붙이기 전에는 이벤트가 메모리 큐에만 있습니다.
  // 그 상태에서 페이지를 떠나면 Lead가 사라지므로, 라이브러리가 준비된 뒤에 보냅니다.
  function whenPixelReady(win, timeoutMs, done) {
    var started = Date.now();
    (function check() {
      var fbq = win.fbq;
      if (fbq && typeof fbq.callMethod === "function") {
        done(true);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        done(false);
        return;
      }
      win.setTimeout(check, 50);
    })();
  }

  function bindLanding(doc, win) {
    var link = doc.querySelector("[data-buy]");
    if (!link) return;
    var config = win.OJILLEN || {};
    var variant = normalizeVariant(doc.documentElement.getAttribute("data-variant"));
    var destination = link.href;
    try {
      destination = buildDestination(config, variant, new URLSearchParams(win.location.search));
      link.href = destination;
    } catch (error) {
      destination = link.href;
    }

    link.addEventListener("click", function (event) {
      if (event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var pixelId = win.OJILLEN_PIXEL_ID || normalizePixelId(config.pixelId);
      if (!pixelId) return;

      event.preventDefault();
      if (link.getAttribute("aria-busy") === "true") return;
      link.setAttribute("aria-busy", "true");

      var finished = false;
      function go() {
        if (finished) return;
        finished = true;
        win.location.assign(destination);
      }

      whenPixelReady(win, 1000, function (ready) {
        if (!ready || typeof win.fbq !== "function") {
          go();
          return;
        }
        try {
          win.fbq(
            "track",
            "Lead",
            {
              variant: variant,
              content_name: "오지렌 미니 라벨프린터",
              content_category: "label-printer"
            },
            { eventCallback: go }
          );
        } catch (error) {
          go();
          return;
        }
        win.setTimeout(go, 800);
      });
    });
  }

  return {
    normalizePixelId: normalizePixelId,
    normalizeVariant: normalizeVariant,
    buildDestination: buildDestination,
    bindLanding: bindLanding
  };
});
