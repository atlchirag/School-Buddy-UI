/* =========================================================
   Video Telematics - Dashboard
   KPI strip (get_adas_kpi_header), live MDVR video (808GPS
   web player iframe) and today's alerts (get_adas_alert_history)
   with the evidence drawer on the eye icon, as in Trackofy.
========================================================= */
(function (window, document, $, VT) {
    'use strict';

    var REFRESH_MS = 60000;

    var frameHost = document.getElementById('vtLiveFrameHost');
    var liveEmpty = document.getElementById('vtLiveEmpty');
    var liveEmptyText = document.getElementById('vtLiveEmptyText');
    var vehicles = [];
    var alerts = [];
    var liveToken = 0;

    var vehicleSelect = VT.dropdown('#vtLiveVehicle', {
        icon: 'bi-car-front-fill',
        placeholder: 'Loading vehicles...',
        onChange: startLive
    });
    vehicleSelect.setDisabled(true);

    // Same window counts as Trackofy (1, 4, 6, 9).
    var channelSelect = VT.dropdown('#vtLiveChannels', {
        icon: 'bi-camera-video-fill',
        options: [1, 4, 6, 9].map(function (n) { return { value: n, label: n }; }),
        value: 4,
        onChange: startLive
    });

    // ---------- KPI strip ----------

    function loadKpis() {
        return VT.get('KpiHeader').then(function (response) {
            if (!VT.isOk(response) || !response.data) return;
            var d = response.data;
            var counts = d.alert_severity_counts || {};
            var values = {
                total_vehicles: d.total_vehicles,
                online_vehicles: d.online_vehicles,
                offline_vehicles: d.offline_vehicles,
                total_alerts_today: d.total_alerts_today,
                critical: counts.critical !== undefined ? counts.critical : d.critical_alerts,
                warning: counts.warning,
                info: counts.info
            };
            Object.keys(values).forEach(function (key) {
                var value = values[key];
                $('[data-kpi="' + key + '"]').text(value === undefined || value === null ? 0 : value);
            });
        }).catch(function (err) {
            VT.notify('error', err.message);
        });
    }

    // ---------- Live video ----------

    function loadVehicles() {
        return VT.loadVehicles().then(function (list) {
            vehicles = list;
            if (!list.length) {
                vehicleSelect.setOptions([], '');
                vehicleSelect.opts.placeholder = 'No MDVR vehicles';
                vehicleSelect.render();
                liveEmptyText.textContent = 'No vehicles with an MDVR camera are linked to this account.';
                return;
            }
            vehicleSelect.setOptions(list.map(function (v) {
                return { value: v.device_imei, label: v.veh_reg || v.device_imei };
            }), list[0].device_imei);
            vehicleSelect.setDisabled(false);
            startLive();
        }).catch(function (err) {
            vehicleSelect.opts.placeholder = 'Unable to load';
            vehicleSelect.render();
            VT.notify('error', err.message);
        });
    }

    function selectedVehicle() {
        var imei = vehicleSelect.getValue();
        return vehicles.filter(function (v) { return v.device_imei === imei; })[0] || null;
    }

    function stopLive() {
        var old = frameHost.querySelector('iframe');
        if (old) {
            old.src = 'about:blank';
            old.remove();
        }
    }

    function startLive() {
        var vehicle = selectedVehicle();
        var channels = Number(channelSelect.getValue()) || 1;
        stopLive();

        if (!vehicle) {
            liveEmpty.hidden = false;
            return;
        }

        $('#vtLiveSub').text(channels + ' Channels · ' + (vehicle.veh_reg || '') + ' · IMEI ' + vehicle.device_imei);

        var token = ++liveToken;
        checkDeviceOnline(vehicle, token);

        VT.get('LiveVideoUrl', { imei: vehicle.device_imei, channel: channels }).then(function (response) {
            if (token !== liveToken) return;
            if (!response || !response.url) {
                throw new Error(VT.messageOf(response, 'Unable to open live video.'));
            }
            var iframe = document.createElement('iframe');
            iframe.className = 'vt-video-iframe';
            iframe.title = 'Live video ' + (vehicle.veh_reg || vehicle.device_imei);
            iframe.allow = 'autoplay; fullscreen';
            iframe.allowFullscreen = true;
            iframe.setAttribute('scrolling', 'no');
            // The 808GPS player raises the browser's own alert() (e.g. "Device is not online").
            // Without allow-modals those native boxes are blocked; checkDeviceOnline shows a SweetAlert instead.
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-presentation allow-downloads');
            iframe.src = response.url;
            frameHost.appendChild(iframe);
            liveEmpty.hidden = true;
        }).catch(function (err) {
            if (token !== liveToken) return;
            liveEmpty.hidden = false;
            liveEmptyText.textContent = err.message;
        });
    }

    /** Asks Trackofy (getDeviceOlStatus) and shows a SweetAlert when the MDVR is offline. */
    function checkDeviceOnline(vehicle, token) {
        VT.get('DeviceStatus', { imei: vehicle.device_imei }).then(function (response) {
            if (token !== liveToken) return;
            var item = response && Array.isArray(response.onlines) ? response.onlines[0] : null;
            if (!response || Number(response.result) !== 0 || !item) return;

            var online = Number(item.online) === 1;
            $('#vtLiveSub').text($('#vtLiveSub').text().replace(/ · (Online|Offline)$/, '') + (online ? ' · Online' : ' · Offline'));
            if (!online) {
                VT.notify('warning', 'Device is not online! ' + (vehicle.veh_reg || vehicle.device_imei) +
                    ' is offline, so live video is not available right now.', 'Live Video');
            }
        }).catch(function () { /* status is optional; the player still loads */ });
    }

    // ---------- Today's alerts ----------

    /** Same mapping as Trackofy's dashboard: critical/severe -> Critical, high/warning -> High, else Moderate. */
    function severityLabel(value) {
        var s = String(value || '').trim().toLowerCase();
        if (s === 'critical' || s === 'severe') return 'Critical';
        if (s === 'high' || s === 'warning' || s === 'warn') return 'High';
        return 'Moderate';
    }

    function categoryLabel(value) {
        return String(value || '').trim().toLowerCase() === 'dms' ? 'DMS' : 'ADAS';
    }

    function alertCard(a, index) {
        var severity = severityLabel(a.severity);
        var tone = severity === 'Critical' ? 'danger' : severity === 'High' ? 'warning' : 'info';
        var address = VT.cachedAddress(a);
        var location = VT.hasLocation(a)
            ? '<div class="vt-feed-location"><i class="bi bi-geo-alt-fill"></i>' +
            (address ? '<span>' + VT.escapeHtml(address) + '</span>' : '<button type="button" class="vt-link" data-load-address="' + index + '">Load address...</button>') +
            '</div>'
            : '';

        return '<article class="vt-feed-item tone-' + tone + '">' +
            '<span class="vt-feed-icon"><i class="bi bi-bell-fill"></i></span>' +
            '<div class="vt-feed-body">' +
            '<div class="vt-feed-top"><strong>' + VT.escapeHtml(a.alert_type || 'Video telematics alert') + '</strong>' +
            '<span class="vt-feed-sev tone-' + tone + '">' + severity + '</span></div>' +
            '<div class="vt-feed-sub">' + VT.escapeHtml(a.veh_reg || 'Unknown vehicle') + (a.device_imei ? ' · ' + VT.escapeHtml(a.device_imei) : '') + '</div>' +
            location +
            '<div class="vt-feed-foot"><span><i class="bi bi-clock"></i> ' + VT.escapeHtml(a.alert_time_local || a.alert_time || '-') + ' · </span>' +
            '<span class="vt-mini-chip">' + categoryLabel(a.category) + '</span>' +
            '<button type="button" class="vt-feed-view" data-view="' + index + '" title="View details" aria-label="View alert details"><i class="bi bi-eye-fill"></i></button>' +
            '</div>' +
            '</div>' +
            '</article>';
    }

    function loadAlerts() {
        var date = VT.today();
        var feed = $('#vtAlertFeed');

        return VT.post('AlertHistory', {
            page: 1,
            limit: 25,
            scope: 'configured',
            from: date,
            to: date
        }).then(function (response) {
            if (!VT.isOk(response)) {
                throw new Error(VT.messageOf(response, 'Unable to load alerts.'));
            }
            alerts = Array.isArray(response.data) ? response.data : [];
            $('#vtAlertsCount').text(response.total !== undefined ? response.total : alerts.length);

            if (!alerts.length) {
                feed.html('<div class="vt-empty"><span class="vt-empty-icon"><i class="bi bi-bell-slash"></i></span><strong>No alerts found</strong>' +
                    '<span>There are no video telematics alerts today.</span></div>');
                return;
            }
            feed.html(alerts.map(alertCard).join(''));
        }).catch(function (err) {
            feed.html('<div class="vt-empty"><span class="vt-empty-icon"><i class="bi bi-exclamation-circle"></i></span><span>' +
                VT.escapeHtml(err.message) + '</span></div>');
        });
    }

    // ---------- Wiring ----------

    $('#vtAlertFeed').on('click', '[data-view]', function () {
        var alert = alerts[Number($(this).attr('data-view'))];
        if (alert) {
            VT.openEvidence(alert, {
                severityLabel: severityLabel(alert.severity),
                onAddress: function () { $('#vtAlertFeed').html(alerts.map(alertCard).join('')); }
            });
        }
    });

    $('#vtAlertFeed').on('click', '[data-load-address]', function () {
        var $btn = $(this);
        var alert = alerts[Number($btn.attr('data-load-address'))];
        if (!alert) return;
        $btn.text('Loading address...').prop('disabled', true);
        VT.loadAddress(alert).then(function (address) {
            VT.rememberAddress(alert, address);
            $btn.replaceWith('<span>' + VT.escapeHtml(address) + '</span>');
        });
    });

    $('#vtLiveRefresh').on('click', startLive);
    $('#vtLiveFullscreen').on('click', function () { VT.toggleFullscreen(frameHost); });
    $('#vtAlertsRefresh').on('click', loadAlerts);

    loadKpis();
    loadVehicles();
    loadAlerts();

    setInterval(function () {
        if (document.visibilityState === 'visible') {
            // Background refresh: no global loader.
            SBLoader.silent(function () {
                loadKpis();
                loadAlerts();
            });
        }
    }, REFRESH_MS);

    window.addEventListener('beforeunload', stopLive);
})(window, document, window.jQuery, window.VT);
