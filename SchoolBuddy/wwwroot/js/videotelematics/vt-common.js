/* =========================================================
   School Buddy - Video Telematics: shared helpers
   - API calls to VideoTelematicsController (forwards to Trackofy)
   - Material-style dropdowns (single / multi with search + Select All)
   - Table toolbar (Rows, range, pager, export icons, search)
   - Export (Excel, CSV, PDF, Print, Copy) through DataTables Buttons
   - Evidence drawer shared by Dashboard and Report
   Mirrors the Trackofy v6 Video Telematics UI.
========================================================= */
(function (window, document, $) {
    'use strict';

    var root = document.getElementById('vtRoot');
    var apiBase = root ? root.getAttribute('data-api') : '/VideoTelematics/';
    var cache = {};

    // =====================================================
    // API
    // =====================================================

    function antiForgeryToken() {
        var input = root && root.querySelector('input[name="__RequestVerificationToken"]');
        return input ? input.value : '';
    }

    function request(method, action, data) {
        var options = {
            url: apiBase + action,
            type: method,
            dataType: 'json',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        };

        if (method === 'GET') {
            options.data = data || {};
        } else {
            options.contentType = 'application/json';
            options.data = JSON.stringify(data || {});
            options.headers.RequestVerificationToken = antiForgeryToken();
        }

        return new Promise(function (resolve, reject) {
            $.ajax(options)
                .done(resolve)
                .fail(function (xhr) {
                    if (xhr.status === 401) {
                        window.location.href = (window.location.pathname.toLowerCase().indexOf('/schoolbuddy/') === 0 ? '/schoolbuddy' : '') + '/Home/Index';
                        return;
                    }
                    var body = xhr.responseJSON || {};
                    reject(new Error(body.msg || body.message || 'Request failed. Please try again.'));
                });
        });
    }

    function get(action, data) { return request('GET', action, data); }
    function post(action, data) { return request('POST', action, data); }

    /** Trackofy PHP responses use status 1 / true for success. */
    function isOk(response) {
        return !!response && (response.status === 1 || response.status === '1' || response.status === true);
    }

    function messageOf(response, fallback) {
        return (response && (response.msg || response.message)) || fallback;
    }

    /** getAdasVehicleList, cached for the page. Each vehicle gets device_imei like Trackofy does. */
    function loadVehicles() {
        if (!cache.vehicles) {
            cache.vehicles = get('Vehicles').then(function (response) {
                if (!response || !response.status || !Array.isArray(response.data)) {
                    return [];
                }
                return response.data
                    .map(function (v) {
                        v.device_imei = String(v.device_imei || v.imei || '').trim();
                        return v;
                    })
                    .filter(function (v) { return !!v.device_imei; });
            });
        }
        return cache.vehicles;
    }

    /** get_adas_alert_master, cached for the page (sorted by sort_order like Trackofy). */
    function loadAlertMaster() {
        if (!cache.master) {
            cache.master = get('AlertMaster').then(function (response) {
                var list = isOk(response) && Array.isArray(response.data) ? response.data.slice() : [];
                return list.sort(function (a, b) { return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0); });
            });
        }
        return cache.master;
    }

    /** Street address for an alert (caladdress.php returns [["address"]]), cached per alert id. */
    function loadAddress(alert) {
        var key = String(alert.id);
        cache.addresses = cache.addresses || {};
        if (!cache.addresses[key]) {
            cache.addresses[key] = get('Address', { lat: alert.latitude, lng: alert.longitude, id: alert.id })
                .then(function (response) {
                    var address = Array.isArray(response) && Array.isArray(response[0]) ? String(response[0][0] || '').trim() : '';
                    return address || 'Location not available';
                })
                .catch(function () {
                    delete cache.addresses[key];
                    return 'Location not available';
                });
        }
        return cache.addresses[key];
    }

    function cachedAddress(alert) {
        return cache.resolved && cache.resolved[String(alert.id)];
    }

    function rememberAddress(alert, address) {
        cache.resolved = cache.resolved || {};
        cache.resolved[String(alert.id)] = address;
    }

    // =====================================================
    // Formatting
    // =====================================================

    function escapeHtml(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function formatDate(date) {
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    }

    function today() { return formatDate(new Date()); }

    function firstOfMonth() {
        var d = new Date();
        return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }

    /** yyyy-MM-dd -> "01 Oct 2026" */
    function prettyDate(value) {
        var parts = String(value || '').split('-');
        if (parts.length !== 3) return value || '';
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return parts[2] + ' ' + months[Number(parts[1]) - 1] + ' ' + parts[0];
    }

    function secondsToTime(total) {
        var s = Math.max(0, Math.floor(Number(total) || 0));
        return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60);
    }

    function titleCase(value) {
        var s = String(value || '').trim().toLowerCase();
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
    }

    /** Tone class for any Trackofy status word. */
    function toneOf(value) {
        switch (String(value || '').trim().toLowerCase()) {
            case 'critical': case 'severe': case 'failed': case 'high':
                return 'danger';
            case 'warning': case 'warn': case 'pending': case 'moderate':
                return 'warning';
            case 'sent': case 'enabled': case 'yes': case 'delivered': case 'success':
                return 'success';
            case 'info':
                return 'info';
            default:
                return 'neutral';
        }
    }

    function pill(text, tone) {
        return '<span class="vt-pill vt-tone-' + (tone || toneOf(text)) + '">' + escapeHtml(text) + '</span>';
    }

    // =====================================================
    // SweetAlert2 boxes (same style as the rest of School Buddy)
    // =====================================================

    var SWAL_CONFIRM_COLOR = '#0f2d4e';
    var SWAL_TITLES = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Information' };

    /** Alert box for a result or a validation message. */
    function notify(type, message, title) {
        if (window.Swal) {
            return window.Swal.fire({
                icon: SWAL_TITLES[type] ? type : 'info',
                title: title || SWAL_TITLES[type] || 'Information',
                text: message || '',
                confirmButtonColor: SWAL_CONFIRM_COLOR,
                customClass: { container: 'vt-swal' }
            });
        }
        window.alert(message);
        return Promise.resolve();
    }

    /** Small non-blocking SweetAlert toast for progress (exports). */
    function progress(message, icon) {
        if (window.Swal) {
            window.Swal.fire({
                toast: true,
                position: 'top-end',
                icon: icon || 'info',
                title: message,
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
                customClass: { container: 'vt-swal vt-swal-toast' }
            });
        }
    }

    /** SweetAlert confirm box; resolves true when the user confirms. */
    function confirmBox(title, text, confirmText) {
        if (!window.Swal) {
            return Promise.resolve(window.confirm(text));
        }
        return window.Swal.fire({
            icon: 'warning',
            title: title,
            text: text,
            showCancelButton: true,
            confirmButtonText: confirmText || 'Yes',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#c81e1e',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
            focusCancel: true,
            customClass: { container: 'vt-swal' }
        }).then(function (result) { return !!result.isConfirmed; });
    }

    function toggleFullscreen(element) {
        if (!element) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else if (element.requestFullscreen) {
            element.requestFullscreen();
        }
    }

    function hasLocation(alert) {
        var lat = Number(alert && alert.latitude), lng = Number(alert && alert.longitude);
        return isFinite(lat) && isFinite(lng) && !(lat === 0 && lng === 0) && alert.latitude !== null && alert.latitude !== '';
    }

    function mapUrl(alert) {
        return alert.map_url || ('https://maps.google.com/?q=' + alert.latitude + ',' + alert.longitude);
    }

    function snapshotsOf(alert) {
        if (Array.isArray(alert.snapshots) && alert.snapshots.length) {
            return alert.snapshots.map(function (s) { return typeof s === 'string' ? s : (s && (s.url || s.snapshot_url)); }).filter(Boolean);
        }
        if (typeof alert.snapshot_urls === 'string' && alert.snapshot_urls) {
            try {
                var parsed = JSON.parse(alert.snapshot_urls);
                return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    // =====================================================
    // Dropdown (Material-style select)
    // =====================================================

    var openDropdown = null;

    /**
     * Turns <div class="vt-field" data-label="Vehicle" data-required> into an interactive select.
     * opts: { multiple, search, selectAll, placeholder, icon, options:[{value,label}], value, allLabel, onChange }
     */
    function Dropdown(host, opts) {
        this.host = typeof host === 'string' ? document.querySelector(host) : host;
        this.opts = $.extend({ multiple: false, search: false, selectAll: false, placeholder: '', options: [] }, opts || {});
        this.options = [];
        this.value = this.opts.multiple ? [] : '';
        this.query = '';
        this.build();
        this.setOptions(this.opts.options, this.opts.value);
    }

    Dropdown.prototype.build = function () {
        var label = this.host.getAttribute('data-label') || '';
        var required = this.host.hasAttribute('data-required');
        this.host.classList.add('vt-field', 'vt-dd');
        if (this.opts.icon) this.host.classList.add('has-icon');

        this.host.innerHTML =
            '<button type="button" class="vt-field-control" aria-haspopup="listbox" aria-expanded="false">' +
            (this.opts.icon ? '<i class="bi ' + this.opts.icon + ' vt-field-icon" aria-hidden="true"></i>' : '') +
            '<span class="vt-field-body">' +
            (label ? '<span class="vt-field-label">' + escapeHtml(label) + (required ? '<span class="vt-req">*</span>' : '') + '</span>' : '') +
            '<span class="vt-field-value"></span>' +
            '</span>' +
            '<i class="bi bi-caret-down-fill vt-caret" aria-hidden="true"></i>' +
            '</button>' +
            '<div class="vt-field-error" hidden></div>';

        this.button = this.host.querySelector('.vt-field-control');
        this.valueEl = this.host.querySelector('.vt-field-value');
        this.errorEl = this.host.querySelector('.vt-field-error');

        this.panel = document.createElement('div');
        this.panel.className = 'vt-dd-panel';
        this.panel.setAttribute('role', 'listbox');
        if (this.opts.multiple) this.panel.setAttribute('aria-multiselectable', 'true');
        this.panel.hidden = true;
        this.panel.innerHTML =
            (this.opts.search ? '<div class="vt-dd-search"><i class="bi bi-search" aria-hidden="true"></i><input type="text" aria-label="Search" autocomplete="off" /></div>' : '') +
            (this.opts.multiple && this.opts.selectAll ? '<button type="button" class="vt-dd-option vt-dd-all" data-all="1"><span class="vt-check"></span><span>Select All</span></button>' : '') +
            '<div class="vt-dd-options"></div>';
        document.body.appendChild(this.panel);
        this.listEl = this.panel.querySelector('.vt-dd-options');
        this.searchEl = this.panel.querySelector('.vt-dd-search input');

        var self = this;
        this.button.addEventListener('click', function () { self.isOpen() ? self.close() : self.open(); });
        this.panel.addEventListener('click', function (e) {
            var option = e.target.closest('.vt-dd-option');
            if (!option) return;
            if (option.hasAttribute('data-all')) {
                self.toggleAll();
            } else {
                self.pick(option.getAttribute('data-value'));
            }
        });
        this.panel.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { self.close(); self.button.focus(); }
        });
        if (this.searchEl) {
            this.searchEl.addEventListener('input', function () {
                self.query = self.searchEl.value.trim().toLowerCase();
                self.renderOptions();
            });
        }
    };

    Dropdown.prototype.setOptions = function (options, value) {
        this.options = (options || []).map(function (o) { return { value: String(o.value), label: String(o.label) }; });
        if (value !== undefined) {
            this.setValue(value, true);
        } else {
            var valid = this.options.map(function (o) { return o.value; });
            if (this.opts.multiple) {
                this.value = this.value.filter(function (v) { return valid.indexOf(v) !== -1; });
            } else if (valid.indexOf(this.value) === -1) {
                this.value = '';
            }
            this.render();
        }
    };

    Dropdown.prototype.setValue = function (value, silent) {
        if (this.opts.multiple) {
            this.value = (Array.isArray(value) ? value : []).map(String);
        } else {
            this.value = value === null || value === undefined ? '' : String(value);
        }
        this.render();
        if (!silent) this.changed();
    };

    Dropdown.prototype.getValue = function () {
        return this.opts.multiple ? this.value.slice() : this.value;
    };

    Dropdown.prototype.allSelected = function () {
        return this.opts.multiple && this.options.length > 0 && this.value.length === this.options.length;
    };

    Dropdown.prototype.selectAll = function (silent) {
        this.value = this.options.map(function (o) { return o.value; });
        this.render();
        if (!silent) this.changed();
    };

    Dropdown.prototype.labelOf = function (value) {
        var match = this.options.filter(function (o) { return o.value === value; })[0];
        return match ? match.label : '';
    };

    Dropdown.prototype.render = function () {
        var text;
        if (this.opts.multiple) {
            text = this.value.map(this.labelOf, this).filter(Boolean).join(', ');
        } else {
            text = this.labelOf(this.value);
        }
        this.host.classList.toggle('has-value', !!text);
        this.valueEl.textContent = text || this.opts.placeholder || '';
        this.valueEl.classList.toggle('is-placeholder', !text);
        this.renderOptions();
    };

    Dropdown.prototype.renderOptions = function () {
        var self = this;
        var query = this.query;
        var visible = this.options.filter(function (o) { return !query || o.label.toLowerCase().indexOf(query) !== -1; });

        this.listEl.innerHTML = visible.length
            ? visible.map(function (o) {
                var selected = self.opts.multiple ? self.value.indexOf(o.value) !== -1 : self.value === o.value;
                return '<button type="button" class="vt-dd-option' + (selected ? ' selected' : '') + '" role="option" aria-selected="' + selected + '" data-value="' + escapeHtml(o.value) + '">' +
                    (self.opts.multiple ? '<span class="vt-check"></span>' : '') +
                    '<span class="vt-dd-text">' + escapeHtml(o.label) + '</span>' +
                    (!self.opts.multiple && selected ? '<i class="bi bi-check2 vt-dd-tick" aria-hidden="true"></i>' : '') +
                    '</button>';
            }).join('')
            : '<div class="vt-dd-empty">No matches</div>';

        var all = this.panel.querySelector('.vt-dd-all');
        if (all) {
            all.classList.toggle('selected', this.allSelected());
            all.classList.toggle('partial', this.value.length > 0 && !this.allSelected());
        }
    };

    Dropdown.prototype.pick = function (value) {
        if (this.opts.multiple) {
            var index = this.value.indexOf(value);
            if (index === -1) this.value.push(value); else this.value.splice(index, 1);
            // keep option order
            var order = this.options.map(function (o) { return o.value; });
            this.value.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
            this.render();
            this.changed();
        } else {
            this.value = value;
            this.render();
            this.close();
            this.changed();
        }
    };

    Dropdown.prototype.toggleAll = function () {
        if (this.allSelected()) {
            this.value = [];
        } else {
            this.value = this.options.map(function (o) { return o.value; });
        }
        this.render();
        this.changed();
    };

    Dropdown.prototype.changed = function () {
        this.setError('');
        if (typeof this.opts.onChange === 'function') this.opts.onChange(this.getValue(), this);
    };

    Dropdown.prototype.isOpen = function () { return !this.panel.hidden; };

    Dropdown.prototype.position = function () {
        var rect = this.button.getBoundingClientRect();
        var panelHeight = Math.min(this.panel.scrollHeight, 320);
        var below = window.innerHeight - rect.bottom;
        this.panel.style.minWidth = rect.width + 'px';
        this.panel.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 200) - 8)) + 'px';
        if (below < panelHeight + 12 && rect.top > below) {
            this.panel.style.top = Math.max(8, rect.top - panelHeight - 4) + 'px';
        } else {
            this.panel.style.top = (rect.bottom + 4) + 'px';
        }
    };

    Dropdown.prototype.open = function () {
        if (this.host.classList.contains('is-disabled')) return;
        if (openDropdown && openDropdown !== this) openDropdown.close();
        openDropdown = this;
        this.query = '';
        if (this.searchEl) this.searchEl.value = '';
        this.renderOptions();
        this.panel.hidden = false;
        this.host.classList.add('is-open');
        this.button.setAttribute('aria-expanded', 'true');
        this.position();
        if (this.searchEl) this.searchEl.focus();
        else {
            var first = this.panel.querySelector('.vt-dd-option.selected') || this.panel.querySelector('.vt-dd-option');
            if (first) first.focus();
        }
    };

    Dropdown.prototype.close = function () {
        if (this.panel.hidden) return;
        this.panel.hidden = true;
        this.host.classList.remove('is-open');
        this.button.setAttribute('aria-expanded', 'false');
        if (openDropdown === this) openDropdown = null;
    };

    Dropdown.prototype.setDisabled = function (disabled) {
        this.host.classList.toggle('is-disabled', !!disabled);
        this.button.disabled = !!disabled;
    };

    Dropdown.prototype.setError = function (message) {
        this.host.classList.toggle('is-invalid', !!message);
        this.errorEl.hidden = !message;
        this.errorEl.innerHTML = message ? '<i class="bi bi-exclamation-circle"></i> ' + escapeHtml(message) : '';
    };

    document.addEventListener('mousedown', function (e) {
        if (!openDropdown) return;
        if (openDropdown.panel.contains(e.target) || openDropdown.host.contains(e.target)) return;
        openDropdown.close();
    });
    window.addEventListener('resize', function () { if (openDropdown) openDropdown.position(); });
    document.addEventListener('scroll', function (e) {
        if (openDropdown && !openDropdown.panel.contains(e.target)) openDropdown.position();
    }, true);

    function dropdown(host, opts) { return new Dropdown(host, opts); }

    // =====================================================
    // Pagination footer: same markup as the project's other DataTables
    // (dataTables.bootstrap5: "Showing x to y of z entries" + ul.pagination),
    // so datatables-global.css / theme.css style it the same way.
    // =====================================================

    /** DataTables' default page list (7 buttons): 1 … 4 5 6 … 10 */
    function pageNumbers(page, pages) {
        var list = [];
        if (pages <= 7) {
            for (var i = 1; i <= pages; i++) list.push(i);
            return list;
        }
        if (page <= 4) return [1, 2, 3, 4, 5, '…', pages];
        if (page >= pages - 3) return [1, '…', pages - 4, pages - 3, pages - 2, pages - 1, pages];
        return [1, '…', page - 1, page, page + 1, '…', pages];
    }

    /**
     * Finds the footer container, or creates it right after opts.after when the page
     * markup does not have it (e.g. an older view is still being served).
     */
    function resolveFooter(host, after) {
        var el = typeof host === 'string' ? document.querySelector(host) : host;
        if (el) return el;

        var anchor = typeof after === 'string' ? document.querySelector(after) : after;
        if (!anchor || !anchor.parentNode) return null;

        el = document.createElement('div');
        if (typeof host === 'string' && host.charAt(0) === '#') el.id = host.slice(1);
        el.hidden = true;
        anchor.parentNode.insertBefore(el, anchor.nextSibling);
        return el;
    }

    /**
     * Renders the info text and Bootstrap pagination into host.
     * opts: { onPage(page), after }   after: element/selector to place the footer after if host is missing.
     * Returns { update(total, page, pageSize, filteredFrom), hide() }
     */
    function pagination(host, opts) {
        var el = resolveFooter(host, opts && opts.after);
        if (!el) {
            console.warn('[Video Telematics] Pagination footer not found:', host);
            return { update: function () { }, hide: function () { } };
        }
        var state = { total: 0, page: 1, size: 10 };

        el.classList.add('dt-container', 'vt-dt-footer');
        el.innerHTML =
            '<div class="row align-items-center g-2">' +
            '<div class="col-12 col-md-6 text-center text-md-start"><div class="dt-info" role="status" aria-live="polite"></div></div>' +
            '<div class="col-12 col-md-6 d-flex justify-content-center justify-content-md-end">' +
            '<div class="dt-paging"><nav aria-label="pagination"><ul class="pagination"></ul></nav></div>' +
            '</div>' +
            '</div>';

        var info = el.querySelector('.dt-info');
        var list = el.querySelector('.pagination');

        function pages() { return Math.max(1, Math.ceil(state.total / state.size)); }

        function button(label, target, aria, cls, disabled, active) {
            return '<li class="dt-paging-button page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '') + '">' +
                '<button type="button" class="page-link ' + cls + '"' +
                (active ? ' aria-current="page"' : '') +
                (disabled ? ' disabled tabindex="-1"' : '') +
                ' data-page="' + target + '" aria-label="' + aria + '">' + label + '</button></li>';
        }

        list.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-page]');
            if (!btn || btn.disabled) return;
            var target = Number(btn.getAttribute('data-page'));
            if (target && target !== state.page && opts && opts.onPage) {
                opts.onPage(Math.min(Math.max(1, target), pages()));
            }
        });

        return {
            update: function (total, page, size, filteredFrom) {
                state.total = Math.max(0, Number(total) || 0);
                state.size = size;
                state.page = Math.min(Math.max(1, page), pages());

                var start = state.total ? (state.page - 1) * size + 1 : 0;
                var end = Math.min(state.page * size, state.total);
                info.textContent = 'Showing ' + start + ' to ' + end + ' of ' + state.total + ' entries' +
                    (filteredFrom !== undefined && filteredFrom !== state.total ? ' (filtered from ' + filteredFrom + ' total entries)' : '');

                var last = pages();
                var atFirst = state.page <= 1;
                var atLast = state.page >= last;
                var html = button('«', 1, 'First', 'first', atFirst) +
                    button('‹', state.page - 1, 'Previous', 'previous', atFirst);
                pageNumbers(state.page, last).forEach(function (n) {
                    html += n === '…'
                        ? '<li class="dt-paging-button page-item disabled"><button type="button" class="page-link ellipsis" disabled tabindex="-1">…</button></li>'
                        : button(n, n, 'Page ' + n, '', false, n === state.page);
                });
                html += button('›', state.page + 1, 'Next', 'next', atLast) +
                    button('»', last, 'Last', 'last', atLast);
                list.innerHTML = html;
                el.hidden = false;
            },
            hide: function () { el.hidden = true; }
        };
    }

    // =====================================================
    // Table toolbar: Rows ... export | search  (pagination footer below the table)
    // =====================================================

    /**
     * opts: { pageSizes, pageSize, searchPlaceholder, footer, onPage(page), onPageSize(size), onSearch(text), onExport(format) }
     * footer: element / selector under the table for the pagination footer.
     * Returns { update(total, page, pageSize, filteredFrom), setBusy(format, busy), searchText() }
     */
    function toolbar(host, opts) {
        var el = typeof host === 'string' ? document.querySelector(host) : host;
        // The footer goes under the table that follows the toolbar.
        var tableWrap = el && el.parentNode ? el.parentNode.querySelector('.vt-table-wrap') : null;
        var pager = opts.footer ? pagination(opts.footer, { onPage: opts.onPage, after: tableWrap }) : null;

        el.classList.add('vt-toolbar');
        el.innerHTML =
            '<div class="vt-pager">' +
            '<div class="vt-rows"><span>Rows</span><div class="vt-rows-select"></div></div>' +
            '</div>' +
            '<div class="vt-toolbar-right">' +
            '<div class="vt-export-group" role="group" aria-label="Export">' +
            '<button type="button" data-export="excel" class="vt-exp-excel" title="Export to Excel" aria-label="Export to Excel"><i class="bi bi-file-earmark-spreadsheet-fill"></i></button>' +
            '<button type="button" data-export="csv" class="vt-exp-csv" title="Export to CSV" aria-label="Export to CSV"><i class="bi bi-file-earmark-text-fill"></i></button>' +
            '<button type="button" data-export="pdf" class="vt-exp-pdf" title="Export to PDF" aria-label="Export to PDF"><i class="bi bi-file-earmark-pdf-fill"></i></button>' +
            '<button type="button" data-export="print" class="vt-exp-print" title="Print" aria-label="Print"><i class="bi bi-printer-fill"></i></button>' +
            '<button type="button" data-export="copy" class="vt-exp-copy" title="Copy" aria-label="Copy"><i class="bi bi-copy"></i></button>' +
            '</div>' +
            '<label class="vt-search"><i class="bi bi-search" aria-hidden="true"></i>' +
            '<input type="search" placeholder="' + escapeHtml(opts.searchPlaceholder || 'Search...') + '" aria-label="' + escapeHtml(opts.searchPlaceholder || 'Search') + '" /></label>' +
            '</div>';

        var rows = dropdown(el.querySelector('.vt-rows-select'), {
            options: opts.pageSizes.map(function (n) { return { value: n, label: n }; }),
            value: opts.pageSize,
            onChange: function (v) {
                if (opts.onPageSize) opts.onPageSize(Number(v));
            }
        });
        rows.host.classList.add('vt-field-compact');

        el.querySelector('.vt-export-group').addEventListener('click', function (e) {
            var btn = e.target.closest('button');
            if (!btn || btn.disabled) return;
            if (opts.onExport) opts.onExport(btn.getAttribute('data-export'), btn);
        });

        var search = el.querySelector('.vt-search input');
        var timer = null;
        search.addEventListener('input', function () {
            clearTimeout(timer);
            timer = setTimeout(function () { if (opts.onSearch) opts.onSearch(search.value.trim()); }, 200);
        });

        return {
            update: function (total, page, size, filteredFrom) {
                if (pager) pager.update(total, page, size, filteredFrom);
            },
            setBusy: function (format, busy) {
                var btn = el.querySelector('[data-export="' + format + '"]');
                if (!btn) return;
                btn.disabled = !!busy;
                btn.classList.toggle('is-busy', !!busy);
            },
            searchText: function () { return search.value.trim(); }
        };
    }

    // =====================================================
    // Export (DataTables Buttons on a hidden table)
    // =====================================================

    var EXPORT_BUTTONS = { excel: 'excelHtml5', csv: 'csvHtml5', pdf: 'pdfHtml5', print: 'print', copy: 'copyHtml5' };
    var EXPORT_LABELS = { excel: 'Excel', csv: 'CSV', pdf: 'PDF', print: 'Print', copy: 'Copy' };

    /**
     * cfg: { title, columns:[{ title, value(row) }], rows }
     * Builds a hidden DataTable with the rows and triggers the matching Buttons action.
     */
    function exportRows(format, cfg) {
        if (!$.fn.DataTable || !$.fn.dataTable.Buttons) {
            notify('error', 'Export is not available on this page.');
            return;
        }
        if (!cfg.rows.length) {
            notify('info', 'There are no rows to export.');
            return;
        }

        var stamp = formatDate(new Date());
        var fileName = cfg.title.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' + stamp;
        var data = cfg.rows.map(function (row, index) {
            return cfg.columns.map(function (c) {
                var v = c.value(row, index);
                return v === null || v === undefined ? '' : String(v);
            });
        });

        var $table = $('<table class="d-none"></table>').appendTo(document.body);
        var dt = $table.DataTable({
            data: data,
            columns: cfg.columns.map(function (c) { return { title: escapeHtml(c.title) }; }),
            paging: false,
            searching: false,
            ordering: false,
            info: false,
            layout: { topStart: null, topEnd: null, bottomStart: null, bottomEnd: null }
        });

        new $.fn.dataTable.Buttons(dt, {
            buttons: [{
                extend: EXPORT_BUTTONS[format],
                title: cfg.title,
                filename: fileName,
                orientation: 'landscape',
                pageSize: 'A4',
                customize: format === 'pdf' ? function (doc) {
                    doc.defaultStyle.fontSize = 7;
                    doc.styles.tableHeader.fontSize = 8;
                } : undefined
            }]
        });

        dt.button(0).trigger();
        if (format !== 'print' && format !== 'copy') {
            progress(EXPORT_LABELS[format] + ' export ready: ' + cfg.rows.length + ' rows.', 'success');
        }

        setTimeout(function () {
            dt.destroy();
            $table.remove();
        }, 1500);
    }

    // =====================================================
    // Evidence drawer (Dashboard alert eye icon + Report evidence icons)
    // =====================================================

    var drawer = null;

    /**
     * School Buddy's fixed #header sits above Bootstrap overlays (z-index 1100), so the drawer
     * and the module's modals start below it, the way Trackofy's drawer starts below its top bar.
     */
    function syncHeaderOffset() {
        var header = document.getElementById('header') || document.querySelector('.header');
        var offset = header ? Math.max(0, Math.round(header.getBoundingClientRect().bottom)) : 0;
        document.documentElement.style.setProperty('--vt-header-offset', offset + 'px');
    }

    syncHeaderOffset();
    window.addEventListener('resize', syncHeaderOffset);
    document.addEventListener('show.bs.modal', syncHeaderOffset);

    function ensureDrawer() {
        if (drawer) return drawer;

        var el = document.createElement('div');
        el.className = 'offcanvas offcanvas-end vt-drawer';
        el.id = 'vtEvidenceDrawer';
        el.tabIndex = -1;
        el.setAttribute('aria-labelledby', 'vtEvTitle');
        el.innerHTML =
            '<div class="vt-drawer-head">' +
            '<span class="vt-drawer-icon"><i class="bi bi-play-btn-fill"></i></span>' +
            '<div class="vt-drawer-heading"><h2 id="vtEvTitle"></h2><p id="vtEvMeta"></p></div>' +
            '<button type="button" class="vt-drawer-close" data-bs-dismiss="offcanvas" aria-label="Close"><i class="bi bi-x-lg"></i></button>' +
            '</div>' +
            '<div class="vt-drawer-stats">' +
            '<div class="vt-stat"><span>Severity</span><div id="vtEvSeverity"></div></div>' +
            '<div class="vt-stat"><span>Speed</span><div id="vtEvSpeed"></div></div>' +
            '<div class="vt-stat"><span>Notification</span><div id="vtEvNotify"></div></div>' +
            '</div>' +
            '<div class="vt-drawer-body" id="vtEvBody"></div>';
        document.body.appendChild(el);

        drawer = {
            el: el,
            body: el.querySelector('#vtEvBody'),
            offcanvas: new bootstrap.Offcanvas(el)
        };

        el.addEventListener('hidden.bs.offcanvas', function () {
            // stop the evidence video when the drawer closes
            var video = el.querySelector('video');
            if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
            drawer.body.innerHTML = '';
        });

        el.addEventListener('click', function (e) {
            var load = e.target.closest('[data-ev-load-address]');
            if (load) {
                var alert = drawer.current;
                load.textContent = 'Loading address...';
                loadAddress(alert).then(function (address) {
                    rememberAddress(alert, address);
                    load.outerHTML = '<span class="vt-ev-address">' + escapeHtml(address) + '</span>';
                    if (typeof drawer.onAddress === 'function') drawer.onAddress(alert, address);
                });
                return;
            }
            var nav = e.target.closest('[data-ev-nav]');
            if (nav) { showSnapshot(drawer.index + Number(nav.getAttribute('data-ev-nav'))); return; }
            var thumb = e.target.closest('[data-ev-thumb]');
            if (thumb) { showSnapshot(Number(thumb.getAttribute('data-ev-thumb'))); }
        });

        return drawer;
    }

    function showSnapshot(index) {
        var snaps = drawer.snapshots;
        if (!snaps.length) return;
        drawer.index = (index + snaps.length) % snaps.length;
        var img = drawer.el.querySelector('#vtEvSnapImg');
        if (img) {
            img.src = snaps[drawer.index];
            img.alt = 'Snapshot ' + (drawer.index + 1);
        }
        var open = drawer.el.querySelector('#vtEvSnapOpen');
        if (open) open.href = snaps[drawer.index];
        drawer.el.querySelectorAll('[data-ev-thumb]').forEach(function (t) {
            t.classList.toggle('active', Number(t.getAttribute('data-ev-thumb')) === drawer.index);
        });
    }

    function statusCard(label, value) {
        return '<div class="vt-delivery-item"><span class="vt-delivery-label">' + label + '</span>' + pill(titleCase(value) || '-', toneOf(value)) + '</div>';
    }

    /**
     * Opens the evidence drawer for one alert-history row.
     * opts: { mode: 'all' | 'images' | 'video', severityLabel, onAddress(alert, address) }
     */
    function openEvidence(alert, opts) {
        opts = opts || {};
        var d = ensureDrawer();
        var snaps = snapshotsOf(alert);
        var severity = opts.severityLabel || titleCase(alert.severity) || '-';
        var address = cachedAddress(alert);

        d.current = alert;
        d.snapshots = snaps;
        d.index = 0;
        d.onAddress = opts.onAddress;

        d.el.querySelector('#vtEvTitle').textContent = alert.alert_type || 'Video telematics alert';
        d.el.querySelector('#vtEvMeta').innerHTML = [alert.veh_reg || alert.device_imei, alert.alert_time_local || alert.alert_time, alert.device_imei]
            .filter(Boolean).map(escapeHtml).join(' <span class="vt-dot">&bull;</span> ');
        d.el.querySelector('#vtEvSeverity').innerHTML = pill(severity, toneOf(alert.severity || severity));
        d.el.querySelector('#vtEvSpeed').innerHTML = '<strong>' + escapeHtml(Math.round(Number(alert.speed_kph) || 0)) + '</strong> km/h';
        d.el.querySelector('#vtEvNotify').innerHTML = pill(titleCase(alert.notify_state) || '-', toneOf(alert.notify_state));

        var html = '';

        // Location
        html += '<section class="vt-ev-card" id="vtEvLocation"><div class="vt-ev-card-head"><div class="vt-ev-card-title"><i class="bi bi-geo-alt-fill"></i><div><h3>Location</h3>';
        if (hasLocation(alert)) {
            html += address
                ? '<span class="vt-ev-address">' + escapeHtml(address) + '</span>'
                : '<button type="button" class="vt-link" data-ev-load-address>Load address...</button>';
            html += '</div></div><a class="vt-link" href="' + escapeHtml(mapUrl(alert)) + '" target="_blank" rel="noopener">Open Maps <i class="bi bi-box-arrow-up-right"></i></a></div>';
            html += '<iframe class="vt-ev-map" title="Alert location" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=' +
                encodeURIComponent(alert.latitude + ',' + alert.longitude) + '&z=16&output=embed"></iframe>';
        } else {
            html += '</div></div></div><div class="vt-ev-empty"><i class="bi bi-geo-alt"></i><span>Location unavailable</span></div>';
        }
        html += '</section>';

        // Snapshots + video, or the no-media notice
        if (!snaps.length && !alert.video_url) {
            html += '<div class="vt-ev-notice"><i class="bi bi-info-circle-fill"></i><div><strong>No media evidence available</strong>' +
                '<span>No image or video was received for this alert.</span></div></div>';
        }

        if (snaps.length) {
            html += '<section class="vt-ev-card" id="vtEvSnapshots"><div class="vt-ev-card-head"><div class="vt-ev-card-title"><i class="bi bi-images"></i><h3>Snapshots</h3>' +
                '<span class="vt-count-chip">' + snaps.length + '</span></div>' +
                '<a id="vtEvSnapOpen" class="vt-icon-link" href="' + escapeHtml(snaps[0]) + '" target="_blank" rel="noopener" title="Open snapshot" aria-label="Open snapshot"><i class="bi bi-box-arrow-up-right"></i></a></div>' +
                '<div class="vt-ev-carousel"><img id="vtEvSnapImg" src="' + escapeHtml(snaps[0]) + '" alt="Snapshot 1" />' +
                (snaps.length > 1
                    ? '<button type="button" class="vt-ev-nav prev" data-ev-nav="-1" aria-label="Previous snapshot"><i class="bi bi-chevron-left"></i></button>' +
                    '<button type="button" class="vt-ev-nav next" data-ev-nav="1" aria-label="Next snapshot"><i class="bi bi-chevron-right"></i></button>'
                    : '') +
                '</div><div class="vt-ev-thumbs">' +
                snaps.map(function (s, i) {
                    return '<button type="button" class="vt-ev-thumb' + (i === 0 ? ' active' : '') + '" data-ev-thumb="' + i + '" aria-label="Snapshot ' + (i + 1) + '">' +
                        '<img src="' + escapeHtml(s) + '" alt="" loading="lazy" /><span>' + (i + 1) + '</span></button>';
                }).join('') +
                '</div></section>';
        }

        if (alert.video_url) {
            html += '<section class="vt-ev-card" id="vtEvVideo"><div class="vt-ev-card-head"><div class="vt-ev-card-title"><i class="bi bi-camera-video-fill"></i><h3>Video Evidence</h3></div>' +
                '<div class="vt-ev-actions">' +
                '<a class="vt-icon-link" href="' + escapeHtml(alert.video_url) + '" target="_blank" rel="noopener" download title="Download video" aria-label="Download video"><i class="bi bi-download"></i></a>' +
                '<a class="vt-icon-link" href="' + escapeHtml(alert.video_url) + '" target="_blank" rel="noopener" title="Open video" aria-label="Open video"><i class="bi bi-box-arrow-up-right"></i></a>' +
                '</div></div>' +
                '<video class="vt-ev-video" controls playsinline preload="metadata" src="' + escapeHtml(alert.video_url) + '"></video></section>';
        }

        // Delivery status
        html += '<section class="vt-ev-card" id="vtEvDelivery"><div class="vt-ev-card-head"><div class="vt-ev-card-title"><i class="bi bi-send-fill"></i><h3>Delivery Status</h3></div></div>' +
            '<div class="vt-delivery-grid">' + statusCard('WhatsApp', alert.whatsapp_status) + statusCard('SMS', alert.sms_status) + statusCard('Email', alert.email_status) + '</div>' +
            (alert.last_error ? '<p class="vt-ev-error"><i class="bi bi-exclamation-circle"></i> ' + escapeHtml(alert.last_error) + '</p>' : '') +
            '</section>';

        d.body.innerHTML = html;
        d.body.scrollTop = 0;
        syncHeaderOffset();
        d.offcanvas.show();

        var target = opts.mode === 'images' ? 'vtEvSnapshots' : opts.mode === 'video' ? 'vtEvVideo' : null;
        if (target) {
            setTimeout(function () {
                var section = document.getElementById(target);
                if (section) section.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }, 350);
        }
    }

    window.VT = {
        root: root,
        get: get,
        post: post,
        isOk: isOk,
        messageOf: messageOf,
        loadVehicles: loadVehicles,
        loadAlertMaster: loadAlertMaster,
        loadAddress: loadAddress,
        cachedAddress: cachedAddress,
        rememberAddress: rememberAddress,
        escapeHtml: escapeHtml,
        formatDate: formatDate,
        today: today,
        firstOfMonth: firstOfMonth,
        prettyDate: prettyDate,
        secondsToTime: secondsToTime,
        titleCase: titleCase,
        toneOf: toneOf,
        pill: pill,
        notify: notify,
        progress: progress,
        confirm: confirmBox,
        toggleFullscreen: toggleFullscreen,
        hasLocation: hasLocation,
        mapUrl: mapUrl,
        snapshotsOf: snapshotsOf,
        dropdown: dropdown,
        toolbar: toolbar,
        pagination: pagination,
        exportRows: exportRows,
        openEvidence: openEvidence
    };
})(window, document, window.jQuery);
