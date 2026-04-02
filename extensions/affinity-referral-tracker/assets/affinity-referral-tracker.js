(function () {
  var ROOT_ID = "affinity-referral-tracker-root";
  var DEFAULT_COOKIE_NAME = "affinity_ref";
  var STORAGE_KEY = "affinity_ref";
  var ATTR_REF_KEY = "attributes[affiliate_ref]";
  var ATTR_LINK_KEY = "attributes[affiliate_landing]";
  var COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

  function getRoot() {
    return document.getElementById(ROOT_ID);
  }

  function getCookieName() {
    var root = getRoot();
    var configuredName = root && root.dataset.cookieName;
    return configuredName || DEFAULT_COOKIE_NAME;
  }

  function shouldCaptureCartAttributes() {
    var root = getRoot();
    return !root || root.dataset.captureCartAttributes !== "false";
  }

  function getSearchParam(name) {
    try {
      return new URL(window.location.href).searchParams.get(name);
    } catch {
      return null;
    }
  }

  function readCookie(name) {
    var prefix = name + "=";
    var parts = document.cookie.split(";");

    for (var index = 0; index < parts.length; index += 1) {
      var value = parts[index].trim();

      if (value.indexOf(prefix) === 0) {
        return decodeURIComponent(value.slice(prefix.length));
      }
    }

    return null;
  }

  function writeCookie(name, value) {
    document.cookie =
      name +
      "=" +
      encodeURIComponent(value) +
      "; path=/; max-age=" +
      COOKIE_MAX_AGE +
      "; SameSite=Lax";
  }

  function persistReferral(value) {
    if (!value) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {}

    writeCookie(getCookieName(), value);
  }

  function getPersistedReferral() {
    var refFromUrl = getSearchParam("ref");

    if (refFromUrl) {
      persistReferral(refFromUrl);
      return refFromUrl;
    }

    try {
      var storageValue = window.localStorage.getItem(STORAGE_KEY);

      if (storageValue) {
        return storageValue;
      }
    } catch {}

    return readCookie(getCookieName());
  }

  function ensureHiddenInput(form, name, value) {
    if (!form || !value) {
      return;
    }

    var field = form.querySelector('input[name="' + name + '"]');

    if (!field) {
      field = document.createElement("input");
      field.type = "hidden";
      field.name = name;
      form.appendChild(field);
    }

    field.value = value;
  }

  function decorateCartForms(referralCode) {
    if (!referralCode) {
      return;
    }

    if (!shouldCaptureCartAttributes()) {
      return;
    }

    var forms = document.querySelectorAll('form[action*="/cart"], form[action$="/cart/add"]');

    forms.forEach(function (form) {
      ensureHiddenInput(form, ATTR_REF_KEY, referralCode);
      ensureHiddenInput(form, ATTR_LINK_KEY, window.location.pathname + window.location.search);
    });
  }

  async function updateCartAttributes(referralCode) {
    if (!referralCode || !window.fetch || !window.Shopify || !window.Shopify.routes) {
      return;
    }

    try {
      await window.fetch(window.Shopify.routes.root + "cart/update.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          attributes: {
            affiliate_ref: referralCode,
            affiliate_landing: window.location.pathname + window.location.search,
          },
        }),
        credentials: "same-origin",
      });
    } catch {}
  }

  function init() {
    var root = getRoot();

    if (!root) {
      return;
    }

    var referralCode = getPersistedReferral();

    if (!referralCode) {
      return;
    }

    root.dataset.referralCode = referralCode;
    decorateCartForms(referralCode);
    updateCartAttributes(referralCode);

    document.addEventListener(
      "submit",
      function (event) {
        decorateCartForms(referralCode);
        var target = event.target;

        if (!(target instanceof HTMLFormElement)) {
          return;
        }

        if (!shouldCaptureCartAttributes()) {
          return;
        }

        ensureHiddenInput(target, ATTR_REF_KEY, referralCode);
        ensureHiddenInput(
          target,
          ATTR_LINK_KEY,
          window.location.pathname + window.location.search,
        );
      },
      true,
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
