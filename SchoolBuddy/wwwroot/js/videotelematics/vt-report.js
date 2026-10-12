/* =========================================================
   Video Telematics - Report (Trackofy layout)
   get_adas_alert_history with the Trackofy report filters,
   paged on the server, evidence drawer per row, and exports
   of the whole report (Copy = current page, like Trackofy).
========================================================= */
(function (window, document, $, VT) {
    'use strict';

    var PAGE_SIZES = [10, 25, 50, 100];
    var EXPORT_PAGE = 500;

    var master = [];
    var categoryByAlarm = {};
    var filters = null;     // filters of the last generated report
    var rows = [];          // current page from the API
    var visible = [];       // current page after the search box
    var total = 0;
    var page = 1;
    var pageSize = 50;
    var search = '';
    var exporting = false;

    // ---------- Filters ----------

    var vehicleSelect = VT.dropdown('#vtRpVehicles', {
        multiple: true, search: true, selectAll: true, placeholder: 'All Vehicles',
        onChange: renderChips
    });
    var alertSelect = VT.dropdown('#vtRpAlerts', {
        multiple: true, search: true, selectAll: true, placeholder: 'All Alerts',
        onChange: renderChips
    });
    var notifySelect = VT.dropdown('#vtRpNotify', {
        options: [
            { value: '', label: 'All Status' },
            { value: 'SENT', label: 'Sent' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'FAILED', label: 'Failed' },
            { value: 'SKIPPED', label: 'Skipped' }
        ],
        value: '',
        onChange: renderChips
    });
    var dataSelect = VT.dropdown('#vtRpData', {
        options: [
            { value: '', label: 'All Data' },
            { value: 'evidence', label: 'Evidence' }
        ],
        value: '',
        onChange: renderChips
    });

    function setDefaultDates() {
        $('#vtRpFrom').val(VT.firstOfMonth());
        $('#vtRpTo').val(VT.today());
    }

    function loadFilterOptions() {
        VT.loadVehicles().then(function (vehicles) {
            vehicleSelect.setOptions(vehicles.map(function (v) {
                return { value: v.device_imei, label: v.veh_reg || v.device_imei };
            }));
            vehicleSelect.selectAll(true);
            renderChips();
        }).catch(function (err) { VT.notify('error', err.message); });

        VT.loadAlertMaster().then(function (list) {
            master = list;
            list.forEach(function (a) { categoryByAlarm[String(a.alarm_id)] = a.category; });
            // Report filters by alarm code (alarm_id), not by master id.
            alertSelect.setOptions(list.map(function (a) { return { value: a.alarm_id, label: a.alarm_name }; }));
            alertSelect.selectAll(true);
            renderChips();
        }).catch(function (err) { VT.notify('error', err.message); });
    }

    function renderChips() {
        var from = $('#vtRpFrom').val(), to = $('#vtRpTo').val();
        var vehicles = vehicleSelect.getValue(), alerts = alertSelect.getValue();
        var chips = [];

        if (from && to) chips.push('<i class="bi bi-calendar3"></i> ' + VT.prettyDate(from) + ' - ' + VT.prettyDate(to));
        chips.push(!vehicles.length || vehicleSelect.allSelected() ? 'All Vehicles' : vehicles.length + (vehicles.length === 1 ? ' Vehicle' : ' Vehicles'));
        chips.push(!alerts.length || alertSelect.allSelected() ? 'All Alerts' : alerts.length + (alerts.length === 1 ? ' Alert' : ' Alerts'));
        if (notifySelect.getValue()) chips.push(VT.titleCase(notifySelect.getValue()));
        if (dataSelect.getValue()) chips.push(dataSelect.getValue());

        $('#vtRpChips').html('<span class="vt-chips-label">Active:</span>' + chips.map(function (c) {
            return '<span class="vt-active-chip">' + (c.indexOf('<i ') === 0 ? c : VT.escapeHtml(c)) + '</span>';
        }).join(''));
    }

    function readFilters() {
        var from = $('#vtRpFrom').val();
        var to = $('#vtRpTo').val();

        if (!from || !to) {
            VT.notify('info', 'Please select From and To date.');
            return null;
        }
        if (from > to) {
            VT.notify('info', 'From date must be on or before To date.');
            return null;
        }

        var vehicles = vehicleSelect.getValue();
        var alerts = alertSelect.getValue().map(Number).filter(isFinite);

        return {
            from: from,
            to: to,
            // All vehicles selected = no device filter (the account's vehicles).
            deviceImei: vehicleSelect.allSelected() ? [] : vehicles,
            // No / all alert types = every alarm code from the master list, as Trackofy sends.
            alarmCode: alerts.length ? alerts : master.map(function (a) { return Number(a.alarm_id); }).filter(isFinite),
            notifyState: notifySelect.getValue() || '',
            filter: dataSelect.getValue() || ''
        };
    }

    // ---------- Data ----------

    function fetchPage(p, limit) {
        return VT.post('AlertHistory', $.extend({}, filters, { page: p, limit: limit })).then(function (response) {
            if (!VT.isOk(response)) {
                throw new Error(VT.messageOf(response, 'Unable to load report.'));
            }
            return response;
        });
    }

    function loadReport() {
        if (!filters) return;
        var tbody = document.querySelector('#vtReportTable tbody');
        tbody.innerHTML = '<tr><td colspan="8"><div class="vt-loading"><div class="spinner-border spinner-border-sm" role="status"></div><span>Loading report...</span></div></td></tr>';

        fetchPage(page, pageSize).then(function (response) {
            rows = Array.isArray(response.data) ? response.data : [];
            total = Number(response.total) || rows.length;
            $('#vtRpCount').text(total + ' records');
            applySearch();
        }).catch(function (err) {
            VT.notify('error', err.message);
            rows = [];
            total = 0;
            $('#vtRpCount').text('0 records');
            applySearch();
        });
    }

    function categoryOf(r) {
        return categoryByAlarm[String(r.alarm_code)] || (r.category ? String(r.category).toUpperCase() : '-');
    }

    function rowSearchText(r) {
        return [r.veh_reg, r.device_imei, r.alert_time_local, categoryOf(r), r.alert_type, r.severity, r.notify_state, VT.cachedAddress(r)]
            .join(' ').toLowerCase();
    }

    function applySearch() {
        visible = search ? rows.filter(function (r) { return rowSearchText(r).indexOf(search) !== -1; }) : rows.slice();
        render();
    }

    // ---------- Table ----------

    function locationCell(r, index) {
        if (!VT.hasLocation(r)) return '<span class="vt-muted">-</span>';
        var address = VT.cachedAddress(r);
        return '<div class="vt-location"><i class="bi bi-geo-alt-fill"></i>' +
            (address
                ? '<span>' + VT.escapeHtml(address) + '</span>'
                : '<button type="button" class="vt-link" data-address="' + index + '" title="Load address">Load address...</button>') +
            '</div>';
    }

    function evidenceCell(r, index) {
        var snaps = VT.snapshotsOf(r).length > 0;
        var video = !!r.video_url;
        return '<div class="vt-evidence-icons">' +
            '<button type="button" class="vt-row-btn" data-evidence="' + index + '" data-mode="all" title="View all evidence" aria-label="View all evidence"><i class="bi bi-eye-fill"></i></button>' +
            '<button type="button" class="vt-row-btn" data-evidence="' + index + '" data-mode="images" title="View snapshots" aria-label="View snapshots"' + (snaps ? '' : ' disabled') + '><i class="bi bi-images"></i></button>' +
            '<button type="button" class="vt-row-btn" data-evidence="' + index + '" data-mode="video" title="Play video" aria-label="Play video"' + (video ? '' : ' disabled') + '><i class="bi bi-play-circle-fill"></i></button>' +
            '</div>';
    }

    function render() {
        bar.update(total, page, pageSize);

        var tbody = document.querySelector('#vtReportTable tbody');
        if (!visible.length) {
            tbody.innerHTML = '<tr><td colspan="8"><div class="vt-empty"><span class="vt-empty-icon"><i class="bi bi-bar-chart-fill"></i></span>' +
                '<strong>No records found</strong><span>' + (search ? 'No rows on this page match your search.' : 'No alerts found for the selected filters.') + '</span></div></td></tr>';
            return;
        }

        var offset = (page - 1) * pageSize;
        tbody.innerHTML = visible.map(function (r, i) {
            var index = rows.indexOf(r);
            return '<tr>' +
                '<td class="text-center">' + (offset + index + 1) + '</td>' +
                '<td><div class="vt-vehicle-cell"><span class="vt-vehicle-icon"><i class="bi bi-car-front-fill"></i></span>' +
                '<div><span>' + VT.escapeHtml(r.veh_reg || '-') + '</span><small>' + VT.escapeHtml(r.device_imei) + '</small></div></div></td>' +
                '<td><strong>' + VT.escapeHtml(r.alert_time_local || r.alert_time) + '</strong></td>' +
                '<td class="text-center">' + VT.pill(categoryOf(r), 'accent') + '</td>' +
                '<td>' + VT.escapeHtml(r.alert_type) + '</td>' +
                '<td>' + locationCell(r, index) + '</td>' +
                '<td class="text-center">' + VT.pill(String(r.notify_state || '-').toUpperCase(), VT.toneOf(r.notify_state)) + '</td>' +
                '<td class="text-center">' + evidenceCell(r, index) + '</td>' +
                '</tr>';
        }).join('');
    }

    // ---------- Toolbar ----------

    var bar = VT.toolbar('#vtRpToolbar', {
        pageSizes: PAGE_SIZES,
        pageSize: pageSize,
        searchPlaceholder: 'Search report...',
        footer: '#vtRpFooter',
        onPage: function (p) { page = p; loadReport(); },
        onPageSize: function (size) { pageSize = size; page = 1; loadReport(); },
        onSearch: function (text) { search = text.toLowerCase(); applySearch(); },
        onExport: exportReport
    });
    // The pagination footer stays hidden until a report is generated.

    // ---------- Export (all rows; Copy = current page) ----------

    var EXPORT_COLUMNS = [
        { title: 'Sr No', value: function (r, i) { return i + 1; } },
        { title: 'Vehicle', value: function (r) { return r.veh_reg; } },
        { title: 'IMEI', value: function (r) { return r.device_imei; } },
        { title: 'Date / Time', value: function (r) { return r.alert_time_local || r.alert_time; } },
        { title: 'Category', value: categoryOf },
        { title: 'Alert', value: function (r) { return r.alert_type; } },
        { title: 'Severity', value: function (r) { return VT.titleCase(r.severity); } },
        { title: 'Speed (km/h)', value: function (r) { return r.speed_kph; } },
        { title: 'Location', value: function (r) { return VT.cachedAddress(r) || (VT.hasLocation(r) ? r.latitude + ', ' + r.longitude : ''); } },
        { title: 'Notification', value: function (r) { return r.notify_state; } },
        { title: 'WhatsApp', value: function (r) { return VT.titleCase(r.whatsapp_status); } },
        { title: 'SMS', value: function (r) { return VT.titleCase(r.sms_status); } },
        { title: 'Email', value: function (r) { return VT.titleCase(r.email_status); } },
        { title: 'Evidence', value: function (r) { return Number(r.has_evidence) === 1 || VT.snapshotsOf(r).length || r.video_url ? 'Yes' : 'No'; } }
    ];

    function loadAllRows() {
        var pages = Math.max(1, Math.ceil(total / EXPORT_PAGE));
        var all = [];
        var chain = Promise.resolve();
        for (var p = 1; p <= pages; p++) {
            (function (pageNo) {
                chain = chain.then(function () {
                    VT.progress('Preparing export: page ' + pageNo + ' of ' + pages + '...');
                    return fetchPage(pageNo, EXPORT_PAGE).then(function (response) {
                        all = all.concat(Array.isArray(response.data) ? response.data : []);
                    });
                });
            })(p);
        }
        return chain.then(function () {
            return search ? all.filter(function (r) { return rowSearchText(r).indexOf(search) !== -1; }) : all;
        });
    }

    /** Resolves street addresses before export, a few at a time, like Trackofy's resolveExportLocations. */
    function resolveAddresses(list) {
        var pending = list.filter(function (r) { return VT.hasLocation(r) && !VT.cachedAddress(r); });
        var index = 0;
        function worker() {
            if (index >= pending.length) return Promise.resolve();
            var row = pending[index++];
            return VT.loadAddress(row).then(function (address) {
                VT.rememberAddress(row, address);
                return worker();
            });
        }
        if (pending.length) VT.progress('Resolving ' + pending.length + ' locations...');
        var workers = [];
        for (var i = 0; i < Math.min(6, pending.length); i++) workers.push(worker());
        return Promise.all(workers).then(function () { return list; });
    }

    function exportReport(format) {
        if (!filters) {
            VT.notify('info', 'Generate a report first.');
            return;
        }
        if (exporting) return;

        if (format === 'copy') {
            VT.exportRows(format, { title: 'Video Telematics Reports', columns: EXPORT_COLUMNS, rows: visible });
            return;
        }

        exporting = true;
        bar.setBusy(format, true);
        loadAllRows()
            .then(resolveAddresses)
            .then(function (list) {
                VT.exportRows(format, { title: 'Video Telematics Reports', columns: EXPORT_COLUMNS, rows: list });
                render();
            })
            .catch(function (err) { VT.notify('error', err.message); })
            .finally(function () {
                exporting = false;
                bar.setBusy(format, false);
            });
    }

    // ---------- Wiring ----------

    function generate(event) {
        event.preventDefault();
        var next = readFilters();
        if (!next) return;
        filters = next;
        page = 1;
        loadReport();
    }

    function clearAll() {
        setDefaultDates();
        vehicleSelect.selectAll(true);
        alertSelect.selectAll(true);
        notifySelect.setValue('', true);
        dataSelect.setValue('', true);
        renderChips();
        filters = null;
        rows = [];
        visible = [];
        total = 0;
        page = 1;
        $('#vtRpCount').text('0 records');
        document.getElementById('vtRpFooter').hidden = true;
        document.querySelector('#vtReportTable tbody').innerHTML =
            '<tr><td colspan="8"><div class="vt-empty"><span class="vt-empty-icon"><i class="bi bi-bar-chart-fill"></i></span>' +
            '<strong>Generate a report</strong><span>Select your report filters and click Generate Report</span></div></td></tr>';
    }

    $('#vtRpToggle').on('click', function () {
        var expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', String(!expanded));
        $('#vtRpFilters').prop('hidden', expanded);
    });
    $('#vtRpFrom, #vtRpTo').on('change', renderChips);
    $('#vtReportForm').on('submit', generate);
    $('#vtRpClear').on('click', clearAll);

    $('#vtReportTable').on('click', '[data-address]', function () {
        var $btn = $(this);
        var row = rows[Number($btn.attr('data-address'))];
        if (!row) return;
        $btn.text('Loading...').prop('disabled', true);
        VT.loadAddress(row).then(function (address) {
            VT.rememberAddress(row, address);
            $btn.replaceWith('<span>' + VT.escapeHtml(address) + '</span>');
        });
    });

    $('#vtReportTable').on('click', '[data-evidence]', function () {
        var row = rows[Number($(this).attr('data-evidence'))];
        if (!row) return;
        VT.openEvidence(row, { mode: $(this).attr('data-mode'), onAddress: render });
    });

    setDefaultDates();
    renderChips();
    loadFilterOptions();
})(window, document, window.jQuery, window.VT);
