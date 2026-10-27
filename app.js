(function (factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof document === "undefined" || typeof window === "undefined") return;
  var start = function () {
    api.boot(document, window);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(function () {
  var CONSENT_KEY = "ojillen-draft-consent";

  function normalizePixelId(value) {
    var id = String(value || "").trim();
    return /^\d{5,20}$/.test(id) ? id : "";
  }

  function normalizeVariant(value) {
    return String(value || "").toUpperCase() === "B" ? "B" : "A";
  }

  function buyClickKey(variant) {
    return "ojillen-buyclick-" + normalizeVariant(variant);
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

  function readConsent(win) {
    try {
      var value = win.localStorage.getItem(CONSENT_KEY);
      return value === "agree" || value === "decline" ? value : "";
    } catch (error) {
      return "";
    }
  }

  function writeConsent(win, choice) {
    try {
      win.localStorage.setItem(CONSENT_KEY, choice);
    } catch (error) {}
  }

  function readBuySent(win, variant) {
    try {
      return win.sessionStorage.getItem(buyClickKey(variant)) === "1";
    } catch (error) {
      return false;
    }
  }

  function markBuySent(win, variant) {
    try {
      win.sessionStorage.setItem(buyClickKey(variant), "1");
    } catch (error) {}
  }

  function showConsent(doc, show) {
    var box = doc.getElementById("consent");
    if (!box) return;
    box.hidden = !show;
  }

  function renderPhoto(doc, config, productName) {
    var slot = doc.querySelector("[data-product-photo]");
    if (!slot) return;
    var src = config && String(config.productPhoto || "").trim();
    if (!src) return;
    while (slot.firstChild) slot.removeChild(slot.firstChild);
    var img = doc.createElement("img");
    img.src = src;
    img.alt = productName;
    slot.appendChild(img);
  }

  function boot(doc, win) {
    var events = win.OJILLEN_EVENTS;
    var pixelApi = win.OJILLEN_PIXEL;
    if (!events || !pixelApi) return;
    var config = win.OJILLEN || {};
    var variant = normalizeVariant(doc.documentElement.getAttribute("data-variant"));
    renderPhoto(doc, config, events.productName);

    var link = doc.querySelector("[data-buy]");
    if (link) {
      try {
        link.href = buildDestination(config, variant, new URLSearchParams(win.location.search));
      } catch (error) {}
      link.target = "_blank";
      link.rel = "noopener";
    }

    var stored = readConsent(win);
    showConsent(doc, stored !== "agree" && stored !== "decline");

    var pageViewSent = false;
    var buySent = readBuySent(win, variant);

    function startPixel() {
      if (readConsent(win) !== "agree") return;
      if (pageViewSent) return;
      var id = normalizePixelId((win.OJILLEN || {}).pixelId);
      if (!id) return;
      if (!pixelApi.activate(win, doc, id)) return;
      pageViewSent = true;
      try {
        win.fbq("init", id);
        win.fbq("track", events.pageView, { variant: variant });
      } catch (error) {}
    }

    function sendBuyClick() {
      if (buySent || readBuySent(win, variant)) {
        buySent = true;
        return;
      }
      if (readConsent(win) !== "agree") return;
      var id = normalizePixelId((win.OJILLEN || {}).pixelId);
      if (!id || typeof win.fbq !== "function") return;
      buySent = true;
      markBuySent(win, variant);
      try {
        win.fbq("trackCustom", events.buyClick, {
          variant: variant,
          content_name: events.productName
        });
      } catch (error) {}
    }

    if (link) {
      // 이동은 막지 않는다. target="_blank"가 새 탭을 연다.
      // 왼쪽 클릭, Ctrl/Shift/Meta 클릭, 가운데 클릭(auxclick) 모두 같은 이벤트를 한 번만 보낸다.
      link.addEventListener("click", function () {
        sendBuyClick();
      });
      link.addEventListener("auxclick", function () {
        sendBuyClick();
      });
    }

    var agree = doc.getElementById("consent-agree");
    var decline = doc.getElementById("consent-decline");
    if (agree) {
      agree.addEventListener("click", function () {
        writeConsent(win, "agree");
        showConsent(doc, false);
        startPixel();
      });
    }
    if (decline) {
      decline.addEventListener("click", function () {
        writeConsent(win, "decline");
        showConsent(doc, false);
      });
    }

    if (stored === "agree") startPixel();
  }

  return {
    consentKey: CONSENT_KEY,
    buyClickKey: buyClickKey,
    normalizePixelId: normalizePixelId,
    normalizeVariant: normalizeVariant,
    buildDestination: buildDestination,
    readConsent: readConsent,
    boot: boot
  };
});
