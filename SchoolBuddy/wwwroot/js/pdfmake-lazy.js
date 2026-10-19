/*
 * Lazy pdfmake.
 *
 * pdfmake and its fonts are about 2 MB and are only needed when someone exports a table
 * to PDF. DataTables' PDF button only checks that window.pdfMake exists and then calls
 * pdfMake.createPdf(doc).download(name) or .open(), so this stand-in loads the real
 * library on first use and forwards the call. Loading the real script replaces
 * window.pdfMake with the real library.
 *
 * Pages that include pdfmake themselves keep using it: this file does nothing when
 * window.pdfMake already exists.
 */
(function () {
    "use strict";

    if (window.pdfMake) {
        return;
    }

    var PDFMAKE_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js";
    var FONTS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js";
    var loading = null;

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = function () {
                reject(new Error("Could not load " + src));
            };
            document.head.appendChild(script);
        });
    }

    function loadPdfMake() {
        if (!loading) {
            loading = loadScript(PDFMAKE_URL)
                .then(function () { return loadScript(FONTS_URL); })
                .then(function () { return window.pdfMake; });

            // Allow a retry on the next click if the CDN failed.
            loading.catch(function () { loading = null; });
        }
        return loading;
    }

    function callRealPdf(doc, method, args) {
        return loadPdfMake()
            .then(function (pdfMake) {
                var pdf = pdfMake.createPdf(doc);
                return pdf[method].apply(pdf, args);
            })
            .catch(function (error) {
                console.error("PDF export failed:", error);
                if (window.toastr) {
                    toastr.error("PDF export could not be loaded. Please try again.");
                }
            });
    }

    window.pdfMake = {
        createPdf: function (doc) {
            return {
                download: function () {
                    return callRealPdf(doc, "download", arguments);
                },
                // open/print need a window opened during the click, before the async load,
                // or the browser's popup blocker stops them.
                open: function (win) {
                    return callRealPdf(doc, "open", [win || window.open("", "_blank")]);
                },
                print: function (win) {
                    return callRealPdf(doc, "print", [win || window.open("", "_blank")]);
                },
                getBlob: function () {
                    return callRealPdf(doc, "getBlob", arguments);
                },
                getBase64: function () {
                    return callRealPdf(doc, "getBase64", arguments);
                },
                getDataUrl: function () {
                    return callRealPdf(doc, "getDataUrl", arguments);
                }
            };
        }
    };
})();
