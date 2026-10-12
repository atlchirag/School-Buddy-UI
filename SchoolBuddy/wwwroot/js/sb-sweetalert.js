/* =========================================================
   School Buddy - SweetAlert boxes everywhere
   Loaded by _Layout.cshtml right after sweetalert2.min.js.

   1. window.alert(...) shows a SweetAlert box instead of the
      browser's default alert (same style as the rest of the app).
      Alerts raised one after another are shown one after another.
   2. window.sbConfirm(message, options) is the SweetAlert
      replacement for confirm(); it returns a Promise<boolean>.
   3. window.sbAlert(message, options) returns a Promise that
      resolves when the box is closed (use it before a reload).

   The browser's own alert is kept as window.nativeAlert.
========================================================= */
(function (window) {
    'use strict';

    if (!window.Swal || window.sbAlert) {
        return;
    }

    var CONFIRM_COLOR = '#0f2d4e';
    var TITLES = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Information' };
    var nativeAlert = window.alert.bind(window);
    var queue = Promise.resolve();

    /** Picks the icon from the message, since alert() has no type. */
    function iconFor(text) {
        var t = text.toLowerCase();
        if (/(error|fail|unable|not found|invalid|wrong|cannot|can't|denied|expired)/.test(t)) return 'error';
        if (/(success|submitted|saved|added|updated|deleted|created|removed|assigned)/.test(t)) return 'success';
        if (/(please|select|required|should|must|fill|enter)/.test(t)) return 'warning';
        return 'info';
    }

    function sbAlert(message, options) {
        var text = message === undefined || message === null ? '' : String(message);
        var icon = (options && options.icon) || iconFor(text);

        queue = queue.then(function () {
            return window.Swal.fire({
                icon: icon,
                title: (options && options.title) || TITLES[icon] || 'Information',
                text: text,
                confirmButtonColor: CONFIRM_COLOR,
                customClass: { container: 'sb-swal', htmlContainer: 'sb-swal-text' }
            });
        }).catch(function () {
            nativeAlert(text);
        });

        return queue;
    }

    function sbConfirm(message, options) {
        options = options || {};
        return window.Swal.fire({
            icon: options.icon || 'warning',
            title: options.title || 'Are you sure?',
            text: message || '',
            showCancelButton: true,
            confirmButtonText: options.confirmText || 'Yes',
            cancelButtonText: options.cancelText || 'Cancel',
            confirmButtonColor: options.danger === false ? CONFIRM_COLOR : '#c81e1e',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
            focusCancel: true,
            customClass: { container: 'sb-swal', htmlContainer: 'sb-swal-text' }
        }).then(function (result) {
            return !!result.isConfirmed;
        });
    }

    window.nativeAlert = nativeAlert;
    window.sbAlert = sbAlert;
    window.sbConfirm = sbConfirm;
    window.alert = function (message) {
        sbAlert(message);
    };

    // Above the fixed #header (z-index 1100); keep line breaks in messages.
    var style = document.createElement('style');
    style.textContent =
        '.swal2-container.sb-swal{z-index:1200;}' +
        '.sb-swal-text{white-space:pre-line;}';
    document.head.appendChild(style);
})(window);
