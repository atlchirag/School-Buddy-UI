/*
 * Global bus loader (#globalLoader, Views/Shared/_Loader.cshtml).
 *
 * Shown automatically for:
 *   - the initial page load, kept up until the page's startup AJAX calls finish,
 *     so navigating old page -> new page shows one continuous loader
 *   - navigating to another page (link click / normal form submit)
 *   - every jQuery $.ajax call and every fetch() call
 *
 * Opt out for a single request:
 *   $.ajax({ ..., loader: false })          (or global: false)
 *   fetch(url, { ..., loader: false })
 * Opt out for background work (polling, auto refresh):
 *   SBLoader.silent(function () { loadData(); });
 *
 * Manual control (kept for existing pages): showLoader() / hideLoader().
 */
(function (window, document) {
    "use strict";

    // Fast requests finish before this and never flash the loader.
    var AJAX_SHOW_DELAY_MS = 150;
    // Safety net when a "navigation" does not leave the page (e.g. file download).
    var NAVIGATION_TIMEOUT_MS = 20000;
    // After window load, the page counts as ready once no request has run for this long
    // (covers calls that start another call when they finish).
    var PAGE_SETTLE_MS = 300;
    // Never keep the page-load loader longer than this (slow or hanging startup calls).
    var PAGE_LOAD_MAX_MS = 10000;

    var pageLoading = true;
    var windowLoaded = false;
    var settleTimer = null;
    var navigating = false;
    var manual = false;
    var ajaxVisible = false;
    var pending = 0;
    var silentDepth = 0;
    var ajaxTimer = null;
    var navTimer = null;

    function loaderEl() {
        return document.getElementById("globalLoader");
    }

    function render() {
        var loader = loaderEl();
        if (loader) {
            var visible = pageLoading || navigating || manual || ajaxVisible;
            loader.classList.toggle("is-hidden", !visible);
        }
    }

    // A SweetAlert progress dialog already tells the user something is running.
    function sweetAlertOpen() {
        return !!document.body && document.body.classList.contains("swal2-shown");
    }

    // ---------- AJAX tracking ----------

    function beginRequest() {
        pending++;
        clearTimeout(settleTimer);
        // While the page is still loading the loader is already up: nothing to schedule.
        if (pageLoading || ajaxTimer || ajaxVisible) return;

        ajaxTimer = setTimeout(function () {
            ajaxTimer = null;
            if (pending > 0 && !sweetAlertOpen()) {
                ajaxVisible = true;
                render();
            }
        }, AJAX_SHOW_DELAY_MS);
    }

    function endRequest() {
        pending = Math.max(0, pending - 1);
        if (pending > 0) return;

        clearTimeout(ajaxTimer);
        ajaxTimer = null;
        ajaxVisible = false;
        render();
        checkPageSettled();
    }

    if (window.jQuery) {
        // ajaxSend/ajaxComplete receive the same settings object for a request.
        window.jQuery(document)
            .on("ajaxSend", function (event, xhr, settings) {
                if (settings.loader === false || silentDepth > 0) {
                    settings.sbLoaderSkipped = true;
                    return;
                }
                beginRequest();
            })
            .on("ajaxComplete", function (event, xhr, settings) {
                if (!settings.sbLoaderSkipped) endRequest();
            });
    }

    if (typeof window.fetch === "function") {
        var nativeFetch = window.fetch;

        window.fetch = function (input, init) {
            if (silentDepth > 0 || (init && init.loader === false)) {
                return nativeFetch.apply(window, arguments);
            }

            beginRequest();
            return nativeFetch.apply(window, arguments).then(
                function (response) { endRequest(); return response; },
                function (error) { endRequest(); throw error; }
            );
        };
    }

    // ---------- Page navigation ----------

    function startNavigation() {
        navigating = true;
        render();

        clearTimeout(navTimer);
        navTimer = setTimeout(function () {
            navigating = false;
            render();
        }, NAVIGATION_TIMEOUT_MS);
    }

    function isPageNavigationLink(link, event) {
        var href = link.getAttribute("href");

        if (!href || href.charAt(0) === "#") return false;
        if (/^(javascript|mailto|tel):/i.test(href)) return false;
        if (link.hasAttribute("download") || link.hasAttribute("data-bs-toggle")) return false;
        if (link.target && link.target !== "_self") return false;
        // Ctrl/Cmd/Shift click or middle click opens a new tab/window.
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return false;

        // Same page, only the hash changes.
        var url = new URL(link.href, window.location.href);
        if (url.origin === window.location.origin &&
            url.pathname === window.location.pathname &&
            url.search === window.location.search &&
            url.hash) {
            return false;
        }
        return true;
    }

    // Decide after the event has finished dispatching: handlers delegated on document
    // (e.g. jQuery $(document).on('click', ...)) run after this listener and may still
    // call preventDefault() to handle the click/submit with AJAX instead.
    function afterDispatch(event, callback) {
        setTimeout(function () {
            if (!event.defaultPrevented) callback();
        }, 0);
    }

    document.addEventListener("click", function (event) {
        var link = event.target.closest && event.target.closest("a[href]");
        if (link && isPageNavigationLink(link, event)) {
            afterDispatch(event, startNavigation);
        }
    });

    document.addEventListener("submit", function (event) {
        var form = event.target;
        if (form.target && form.target !== "_self") return;
        if (form.hasAttribute("data-no-loader")) return;
        afterDispatch(event, startNavigation);
    });

    // ---------- Page load ----------

    function finishPageLoad() {
        if (!pageLoading) return;
        pageLoading = false;
        clearTimeout(settleTimer);
        render();
    }

    function checkPageSettled() {
        if (!pageLoading || !windowLoaded || pending > 0) return;
        clearTimeout(settleTimer);
        settleTimer = setTimeout(function () {
            if (pending === 0) finishPageLoad();
        }, PAGE_SETTLE_MS);
    }

    window.addEventListener("load", function () {
        windowLoaded = true;
        checkPageSettled();
    });

    setTimeout(finishPageLoad, PAGE_LOAD_MAX_MS);

    // Back/forward cache restores the page as it was when we left (loader visible).
    window.addEventListener("pageshow", function (event) {
        if (!event.persisted) return;
        navigating = false;
        clearTimeout(navTimer);
        finishPageLoad();
        render();
    });

    // ---------- Public API ----------

    window.SBLoader = {
        show: function () { manual = true; render(); },
        hide: function () { manual = false; navigating = false; render(); },
        // Requests started synchronously inside fn do not show the loader.
        silent: function (fn) {
            silentDepth++;
            try {
                return fn();
            } finally {
                silentDepth--;
            }
        }
    };

    window.showLoader = window.SBLoader.show;
    window.hideLoader = window.SBLoader.hide;
})(window, document);
