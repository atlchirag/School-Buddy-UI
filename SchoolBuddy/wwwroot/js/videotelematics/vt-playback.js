/* =========================================================
   Video Telematics - Playback (Trackofy layout)
   Search: StandardApiAction_getVideoFileInfo (via PlaybackFiles)
   Play:   CMSV6 player (cmsv6player.min.js) in VOD mode over wss://
   Like Trackofy, files can only be played here (no download).
========================================================= */
(function (window, document, $, VT) {
    'use strict';

    var cmsOrigin = (VT.root.getAttribute('data-cms') || 'https://cctv.trackofy.com').replace(/\/+$/, '');
    var cmsPlayerBase = cmsOrigin + '/808gps/open/player/js/';
    var cmsPlayerScript = cmsPlayerBase + 'cmsv6player.min.js';
    var cmsDecoderWasm = cmsOrigin + '/libcmsv6decode.wasm';

    var playerHost = document.getElementById('vtPlayerHost');
    var playerEmpty = document.getElementById('vtPlayerEmpty');
    var playerEmptyTitle = document.getElementById('vtPlayerEmptyTitle');
    var playerEmptyText = document.getElementById('vtPlayerEmptyText');
    var playerLoading = document.getElementById('vtPlayerLoading');

    var vehicles = [];
    var files = [];
    var page = 1;
    var pageSize = 10;
    var activeKey = null;
    var player = null;
    var playToken = 0;
    var scriptPromise = null;
    var searching = false;

    // ---------- Filters ----------

    var vehicleSelect = VT.dropdown('#vtPbVehicle', {
        search: true,
        placeholder: 'Loading vehicles...',
        onChange: updatePlayerLabel
    });
    vehicleSelect.setDisabled(true);

    // Same fixed list as Trackofy: all -> CHN -1, "1" -> CHN 1, ...
    var channelSelect = VT.dropdown('#vtPbChannel', {
        options: [
            { value: 'all', label: 'All Channels' },
            { value: '1', label: 'Channel 1' },
            { value: '2', label: 'Channel 2' },
            { value: '3', label: 'Channel 3' }
        ],
        value: 'all'
    });

    function loadVehicles() {
        VT.loadVehicles().then(function (list) {
            vehicles = list;
            if (!list.length) {
                vehicleSelect.opts.placeholder = 'No MDVR vehicles';
                vehicleSelect.render();
                return;
            }
            vehicleSelect.setOptions(list.map(function (v) {
                return { value: v.device_imei, label: (v.veh_reg ? v.veh_reg + ' ' : '') + v.device_imei };
            }), list[0].device_imei);
            vehicleSelect.setDisabled(false);
            updatePlayerLabel();
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

    function updatePlayerLabel(file) {
        var vehicle = selectedVehicle();
        var name = vehicle ? (vehicle.veh_reg || vehicle.device_imei) : 'No vehicle selected';
        $('#vtPlayerLabel').text(name + ' · ' + (file && file.chn !== undefined ? 'Playing ' + channelLabel(file) : 'Select a file to start playback'));
    }

    function resetFilters() {
        if (vehicles.length) vehicleSelect.setValue(vehicles[0].device_imei, true);
        channelSelect.setValue('all', true);
        $('#vtPbDate').val(VT.today());
        $('#vtPbFrom').val('00:00:00');
        $('#vtPbTo').val('23:59:59');
        files = [];
        page = 1;
        activeKey = null;
        resetPlayer();
        renderFiles();
        updatePlayerLabel();
    }

    // ---------- File search ----------

    function search(event) {
        if (event) event.preventDefault();
        if (searching) return;

        var imei = vehicleSelect.getValue();
        var date = $('#vtPbDate').val();
        var from = $('#vtPbFrom').val();
        var to = $('#vtPbTo').val();
        var channel = channelSelect.getValue();

        if (!imei || !channel || !date || !from || !to) {
            VT.notify('info', 'Please select vehicle, channel, date and time range.');
            return;
        }

        searching = true;
        files = [];
        page = 1;
        activeKey = null;
        resetPlayer();
        renderFiles(null, true);

        VT.get('PlaybackFiles', {
            imei: imei,
            channel: channel === 'all' ? -1 : Number(channel),
            date: date,
            from: from,
            to: to
        }).then(function (response) {
            if (!response || Number(response.result) !== 0) {
                // e.g. result 32 "Device is not online!"
                var message = VT.messageOf(response, 'Unable to load playback files.');
                renderFiles(message);
                VT.notify('warning', message, 'Video Playback');
                return;
            }
            files = Array.isArray(response.files) ? response.files : [];
            renderFiles(files.length ? null : 'No playback files found for the selected filters.');
        }).catch(function (err) {
            var message = err.message || 'Unable to load playback files.';
            renderFiles(message);
            VT.notify('error', message, 'Video Playback');
        }).finally(function () {
            searching = false;
        });
    }

    // ---------- File list (same fields as Trackofy's app-video-file-list) ----------

    function rowKey(file) {
        return [file.devIdno, file.chn, file.year, file.mon, file.day, file.beg, file.end, file.file].join('|');
    }

    function channelLabel(file) {
        var n = Number(file && file.chn);
        return isFinite(n) ? 'CH' + (n + 1) : 'CH—';
    }

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    /** dd/MM/yyyy HH:mm:ss from the file's date and seconds-of-day. */
    function fileTime(file, field) {
        var y = Number(file.year), m = Number(file.mon), d = Number(file.day);
        var date = y ? pad(d) + '/' + pad(m) + '/' + (y < 100 ? 2000 + y : y) : '';
        return (date ? date + ' ' : '') + VT.secondsToTime(file[field]);
    }

    function sizeMB(file) {
        var n = Number(file.len);
        return isFinite(n) ? (n / (1024 * 1024)).toFixed(2) : '0.00';
    }

    function duration(file) {
        return VT.secondsToTime(Math.max((Number(file.end) || 0) - (Number(file.beg) || 0), 0));
    }

    // Same pagination footer as the project's other tables ("Showing x to y of z entries" + pages).
    var filePager = VT.pagination('#vtFileFooter', {
        after: '#vtFileList',
        onPage: function (p) { page = p; renderFiles(); }
    });

    function renderPager() {
        filePager.update(files.length, page, pageSize);
    }

    function hidePager() {
        filePager.hide();
    }

    function renderFiles(message, loading) {
        var $list = $('#vtFileList');
        $('#vtFileCount').text(files.length);
        $('#vtFileCountChip').text(files.length + ' files');
        $('#vtFilesSub').text(files.length ? 'Select a file to start playback' : 'Search to load recorded video files');

        if (loading) {
            hidePager();
            $list.html('<div class="vt-loading"><div class="spinner-border spinner-border-sm" role="status"></div><span>Loading playback files...</span></div>');
            return;
        }
        if (message || !files.length) {
            hidePager();
            $list.html(message
                ? '<div class="vt-empty"><span class="vt-empty-icon"><i class="bi bi-camera-video-off"></i></span><strong>No files</strong><span>' + VT.escapeHtml(message) + '</span></div>'
                : '<div class="vt-empty"><span class="vt-empty-icon"><i class="bi bi-search"></i></span><strong>Search playback files</strong><span>Set filters and click Find Files.</span></div>');
            return;
        }

        var lastPage = Math.max(1, Math.ceil(files.length / pageSize));
        page = Math.min(page, lastPage);
        var start = (page - 1) * pageSize;

        $list.html(files.slice(start, start + pageSize).map(function (file, i) {
            var index = start + i;
            var active = rowKey(file) === activeKey;
            return '<article class="vt-file' + (active ? ' active' : '') + '">' +
                '<div class="vt-file-top">' +
                '<span class="vt-file-icon"><i class="bi bi-file-earmark-play-fill"></i></span>' +
                '<div class="vt-file-name"><strong>File #' + (index + 1) + '</strong>' +
                (file.devIdno ? '<small title="' + VT.escapeHtml(file.devIdno) + '">IMEI: ' + VT.escapeHtml(file.devIdno) + '</small>' : '') + '</div>' +
                '<span class="vt-file-chn">' + channelLabel(file) + '</span>' +
                '</div>' +
                '<div class="vt-file-times" title="' + VT.escapeHtml(fileTime(file, 'beg') + ' → ' + fileTime(file, 'end')) + '">' +
                '<span>' + VT.escapeHtml(fileTime(file, 'beg')) + '</span><span class="vt-arrow">→</span><span>' + VT.escapeHtml(fileTime(file, 'end')) + '</span></div>' +
                '<div class="vt-file-foot">' +
                '<div class="vt-file-meta"><span>' + sizeMB(file) + ' MB</span><span>•</span><span>' + duration(file) + '</span></div>' +
                '<button type="button" class="vt-file-play' + (active ? ' playing' : '') + '" data-play="' + index + '" title="' + (active ? 'Currently playing' : 'Play recording') + '" aria-label="' + (active ? 'Currently playing' : 'Play recording') + '">' +
                '<i class="bi ' + (active ? 'bi-soundwave' : 'bi-play-fill') + '"></i></button>' +
                '</div>' +
                '</article>';
        }).join(''));

        renderPager();
    }

    // ---------- CMSV6 player ----------

    function loadPlayerScript() {
        if (window.Cmsv6Player) return Promise.resolve();
        if (scriptPromise) return scriptPromise;

        // The decoder looks up its .wasm through window.Module, as in the Trackofy app.
        var existing = window.Module || {};
        window.Module = $.extend({}, existing, {
            locateFile: function (path) {
                var lower = String(path || '').toLowerCase();
                return lower.indexOf('.wasm') !== -1 ? cmsDecoderWasm : new URL(path, cmsPlayerBase).toString();
            },
            mainScriptUrlOrBlob: cmsPlayerScript,
            printErr: function (text) { console.error('[CMSV6 WASM]', text); }
        });

        scriptPromise = new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.src = cmsPlayerScript;
            script.async = true;
            script.onload = function () {
                if (window.Cmsv6Player) resolve();
                else reject(new Error('cmsv6player.min.js loaded, but Cmsv6Player was not created.'));
            };
            script.onerror = function () { reject(new Error('Unable to load the video player.')); };
            document.head.appendChild(script);
        }).catch(function (err) {
            scriptPromise = null;
            throw err;
        });

        return scriptPromise;
    }

    function disposePlayer() {
        if (player) {
            ['stopVideo', 'stop', 'stopVod', 'close', 'destroy'].forEach(function (name) {
                try {
                    if (typeof player[name] === 'function') {
                        if (name === 'stopVideo') player[name](0); else player[name]();
                    }
                } catch (e) { /* player already gone */ }
            });
        }
        player = null;
        playerHost.innerHTML = '';
        playerHost.id = 'vtPlayerHost';
    }

    function resetPlayer() {
        playToken++;
        disposePlayer();
        playerLoading.hidden = true;
        playerEmpty.hidden = false;
        playerEmptyTitle.textContent = 'No playback selected';
        playerEmptyText.textContent = 'Search recorded files and select one from the Playback Files panel.';
    }

    function vodUrl(file) {
        var ws = String(file.PlaybackUrlWs || '').trim();
        if (ws) return ws;
        var http = String(file.PlaybackUrl || '').trim();
        return /^wss?:\/\//i.test(http) ? http : '';
    }

    function play(index) {
        var file = files[index];
        if (!file) return;

        var url = vodUrl(file);
        var token = ++playToken;

        activeKey = rowKey(file);
        renderFiles();
        disposePlayer();
        updatePlayerLabel(file);

        if (!url) {
            failPlayback();
            return;
        }
        if (window.location.protocol === 'https:' && url.toLowerCase().indexOf('ws://') === 0) {
            failPlayback();
            return;
        }

        playerEmpty.hidden = true;
        playerLoading.hidden = false;

        loadPlayerScript().then(function () {
            if (token !== playToken) return;

            player = new window.Cmsv6Player({
                domId: playerHost.id,
                isVodMode: true,
                width: playerHost.clientWidth || 640,
                height: playerHost.clientHeight || 360,
                lang: 'en'
            });
            startVodWhenReady(url, token, 0);
        }).catch(function (err) {
            console.error('[CMSV6]', err);
            if (token === playToken) failPlayback();
        });
    }

    /** Waits for the SDK to expose setWindowNum/startVod, then starts window 0 (as Trackofy does). */
    function startVodWhenReady(url, token, attempt) {
        if (token !== playToken || !player) return;

        if (typeof player.setWindowNum !== 'function' || typeof player.startVod !== 'function') {
            if (attempt >= 200) {
                failPlayback();
                return;
            }
            setTimeout(function () { startVodWhenReady(url, token, attempt + 1); }, 50);
            return;
        }

        try {
            player.setWindowNum(1);
            player.startVod(0, url);
            playerLoading.hidden = true;
        } catch (err) {
            console.error('[CMSV6] startVod failed.', err);
            failPlayback();
        }
    }

    function failPlayback() {
        disposePlayer();
        playerLoading.hidden = true;
        playerEmpty.hidden = false;
        playerEmptyTitle.textContent = 'Unable to start playback video';
        playerEmptyText.textContent = 'Please check the recording or connection and try another file.';
    }

    // ---------- Wiring ----------

    $('#vtPbDate').val(VT.today());
    loadVehicles();

    $('#vtPbToggle').on('click', function () {
        var expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', String(!expanded));
        $('#vtPbFilters').prop('hidden', expanded);
    });
    $('#vtPlaybackForm').on('submit', search);
    $('#vtPbReset').on('click', resetFilters);
    $('#vtPbRefresh').on('click', function () {
        if (vehicleSelect.getValue()) search();
    });
    $('#vtFileList').on('click', '[data-play]', function () { play(Number($(this).attr('data-play'))); });
    $('#vtPlayerFullscreen').on('click', function () { VT.toggleFullscreen(document.getElementById('vtPlayerFrame')); });
    window.addEventListener('beforeunload', disposePlayer);
})(window, document, window.jQuery, window.VT);
