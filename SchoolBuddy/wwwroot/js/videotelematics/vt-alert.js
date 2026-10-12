/* =========================================================
   Video Telematics - Alert configuration (Trackofy layout)
   List: get_adas_alert_config   Master: get_adas_alert_master
   Create: save_adas_alert_config
   Update: update_adas_alert_config / toggle_adas_alert_config
   Delete: delete_adas_alert_config
========================================================= */
(function (window, document, $, VT) {
    'use strict';

    var PAGE_SIZES = [10, 25, 50, 100];

    var rules = [];
    var filtered = [];
    var page = 1;
    var pageSize = 10;
    var search = '';
    var editing = null;

    // focus: false so a SweetAlert box opened over a dialog keeps keyboard focus.
    var addModal = new bootstrap.Modal(document.getElementById('vtAddModal'), { focus: false });
    var editModal = new bootstrap.Modal(document.getElementById('vtEditModal'), { focus: false });

    // ---------- Header filters ----------

    var vehicleFilter = VT.dropdown('#vtFilterVehicle', {
        icon: 'bi-car-front-fill',
        options: [{ value: '', label: 'All vehicles' }],
        value: '',
        onChange: function () { page = 1; applyFilters(); }
    });

    var priorityFilter = VT.dropdown('#vtFilterPriority', {
        icon: 'bi-exclamation-lg',
        options: [
            { value: '', label: 'All priorities' },
            { value: 'Critical', label: 'Critical' },
            { value: 'Warning', label: 'Warning' },
            { value: 'Moderate', label: 'Moderate' }
        ],
        value: '',
        onChange: function () { page = 1; applyFilters(); }
    });

    // ---------- Toolbar ----------

    var bar = VT.toolbar('#vtRuleToolbar', {
        pageSizes: PAGE_SIZES,
        pageSize: pageSize,
        searchPlaceholder: 'Search alerts...',
        footer: '#vtRuleFooter',
        onPage: function (p) { page = p; renderTable(); },
        onPageSize: function (size) { pageSize = size; page = 1; renderTable(); },
        onSearch: function (text) { search = text.toLowerCase(); page = 1; applyFilters(); },
        onExport: exportRules
    });

    // ---------- Table ----------

    function deliveryText(r) {
        return r.delivery_mode === 'INTERVAL' ? 'Every ' + (r.interval_minutes || '-') + ' min' : 'Real time';
    }

    function cooldownText(r) {
        return 'Cooldown ' + (r.cooldown_minutes === null || r.cooldown_minutes === undefined ? '-' : r.cooldown_minutes) + ' min';
    }

    function yesNo(value) {
        var yes = Number(value) === 1 || value === true;
        return VT.pill(yes ? 'Yes' : 'No', yes ? 'success' : 'neutral');
    }

    function searchText(r) {
        return [r.category, r.veh_reg, r.device_imei, r.alarm_name, r.priority, deliveryText(r), cooldownText(r),
            Number(r.is_active) === 1 ? 'Enabled' : 'Disabled'].join(' ').toLowerCase();
    }

    function applyFilters() {
        var vehicle = vehicleFilter.getValue();
        var priority = priorityFilter.getValue();
        filtered = rules.filter(function (r) {
            return (!vehicle || r.device_imei === vehicle) &&
                (!priority || String(r.priority).toLowerCase() === priority.toLowerCase()) &&
                (!search || searchText(r).indexOf(search) !== -1);
        });
        renderTable();
    }

    function renderTable() {
        var lastPage = Math.max(1, Math.ceil(filtered.length / pageSize));
        page = Math.min(page, lastPage);
        var start = (page - 1) * pageSize;
        var rows = filtered.slice(start, start + pageSize);

        // "(filtered from N total entries)" like the other tables when filters or search narrow the list.
        bar.update(filtered.length, page, pageSize, rules.length);

        var tbody = document.querySelector('#vtRuleTable tbody');
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="11"><div class="vt-empty"><span class="vt-empty-icon"><i class="bi bi-bell-slash"></i></span>' +
                '<strong>No alert rules found</strong><span>' + (rules.length ? 'Try a different filter or search.' : 'Click Add Alert to create one.') + '</span></div></td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(function (r, i) {
            var active = Number(r.is_active) === 1;
            return '<tr>' +
                '<td class="text-center">' + (start + i + 1) + '</td>' +
                '<td class="text-center">' + VT.pill(r.category || '-', 'accent') + '</td>' +
                '<td><div class="vt-vehicle-cell"><span class="vt-vehicle-icon"><i class="bi bi-car-front-fill"></i></span><span>' + VT.escapeHtml(r.veh_reg || r.device_imei) + '</span></div></td>' +
                '<td>' + VT.escapeHtml(r.alarm_name) + '</td>' +
                '<td class="text-center">' + VT.pill(r.priority || '-', VT.toneOf(r.priority)) + '</td>' +
                '<td class="text-center">' + yesNo(r.whatsapp_enabled) + '</td>' +
                '<td class="text-center">' + yesNo(r.email_enabled) + '</td>' +
                '<td class="text-center"><div class="vt-delivery"><strong>' + VT.escapeHtml(deliveryText(r)) + '</strong><small>' + VT.escapeHtml(cooldownText(r)) + '</small></div></td>' +
                '<td class="text-center">' + VT.pill(active ? 'Enabled' : 'Disabled', active ? 'success' : 'neutral') + '</td>' +
                '<td class="text-center"><button type="button" class="vt-row-btn" data-edit="' + VT.escapeHtml(r.id) + '" title="Edit" aria-label="Edit"><i class="bi bi-pencil-fill"></i></button></td>' +
                '<td class="text-center"><button type="button" class="vt-row-btn" data-delete="' + VT.escapeHtml(r.id) + '" title="Delete" aria-label="Delete"><i class="bi bi-trash3-fill"></i></button></td>' +
                '</tr>';
        }).join('');
    }

    function loadRules() {
        return VT.get('AlertConfig').then(function (response) {
            if (!VT.isOk(response)) {
                throw new Error(VT.messageOf(response, 'Unable to load alert configuration.'));
            }
            rules = Array.isArray(response.data) ? response.data : [];
            $('#vtRuleCount').text((response.total !== undefined ? response.total : rules.length) + ' alerts');
            applyFilters();
        }).catch(function (err) {
            VT.notify('error', err.message);
            rules = [];
            applyFilters();
        });
    }

    function findRule(id) {
        return rules.filter(function (r) { return String(r.id) === String(id); })[0] || null;
    }

    // ---------- Export (all filtered rows; Copy = current page, like Trackofy) ----------

    var EXPORT_COLUMNS = [
        { title: 'Sr No', value: function (r, i) { return i + 1; } },
        { title: 'Category', value: function (r) { return r.category; } },
        { title: 'Vehicle', value: function (r) { return r.veh_reg || r.device_imei; } },
        { title: 'Alert', value: function (r) { return r.alarm_name; } },
        { title: 'Priority', value: function (r) { return r.priority; } },
        { title: 'WhatsApp', value: function (r) { return Number(r.whatsapp_enabled) === 1 ? 'Yes' : 'No'; } },
        { title: 'Email', value: function (r) { return Number(r.email_enabled) === 1 ? 'Yes' : 'No'; } },
        { title: 'Delivery', value: function (r) { return deliveryText(r) + ' - ' + cooldownText(r); } },
        { title: 'Status', value: function (r) { return Number(r.is_active) === 1 ? 'Enabled' : 'Disabled'; } }
    ];

    function exportRules(format) {
        var rows = format === 'copy'
            ? filtered.slice((page - 1) * pageSize, page * pageSize)
            : filtered;
        VT.exportRows(format, { title: 'Video Telematics Alert Configuration', columns: EXPORT_COLUMNS, rows: rows });
    }

    // ---------- Create Video Alert ----------

    var addVehicles = VT.dropdown('#vtAddVehicles', {
        multiple: true,
        search: true,
        selectAll: true,
        placeholder: 'Select Vehicles',
        onChange: function (v) {
            $('#vtAddVehicleCount').text(v.length + ' selected');
        }
    });

    var addAlerts = VT.dropdown('#vtAddAlerts', {
        multiple: true,
        search: true,
        selectAll: true
    });

    var addPriority = VT.dropdown('#vtAddPriority', {
        options: [
            { value: 'Critical', label: 'Critical' },
            { value: 'Warning', label: 'Warning' },
            { value: 'Moderate', label: 'Moderate' }
        ],
        value: 'Warning'
    });

    function fillLookups() {
        return Promise.all([VT.loadVehicles(), VT.loadAlertMaster()]).then(function (results) {
            var vehicles = results[0], master = results[1];
            var vehicleOptions = vehicles.map(function (v) { return { value: v.device_imei, label: v.veh_reg || v.device_imei }; });

            vehicleFilter.setOptions([{ value: '', label: 'All vehicles' }].concat(vehicleOptions), vehicleFilter.getValue());
            addVehicles.setOptions(vehicleOptions, []);
            addAlerts.setOptions(master.map(function (a) { return { value: a.id, label: a.alarm_name }; }), []);
        }).catch(function (err) {
            VT.notify('error', err.message);
        });
    }

    function fieldError(input, message) {
        var field = input.closest('.vt-field');
        var error = field.querySelector('.vt-field-error');
        field.classList.toggle('is-invalid', !!message);
        error.hidden = !message;
        error.innerHTML = message ? '<i class="bi bi-exclamation-circle"></i> ' + VT.escapeHtml(message) : '';
    }

    function syncInputState(input) {
        input.closest('.vt-field').classList.toggle('has-value', input.value !== '');
    }

    function deliveryMode() {
        return $('input[name="vtAddDelivery"]:checked').val();
    }

    function resetAddForm() {
        addVehicles.setValue([], true);
        addAlerts.setValue([], true);
        addPriority.setValue('Warning', true);
        addVehicles.setError('');
        addAlerts.setError('');
        $('#vtAddVehicleCount').text('0 selected');
        $('#vtAddEmail').prop('checked', false);
        $('#vtAddWhatsapp').prop('checked', true);
        $('#vtAddEnabled').prop('checked', true);
        $('input[name="vtAddDelivery"][value="REALTIME"]').prop('checked', true);
        $('#vtAddIntervalWrap').prop('hidden', true);
        $('#vtAddIntervalMinutes').val('');
        $('#vtAddCooldown').val(30);
        ['vtAddIntervalMinutes', 'vtAddCooldown'].forEach(function (id) {
            var input = document.getElementById(id);
            fieldError(input, '');
            syncInputState(input);
        });
    }

    function submitAdd(event) {
        event.preventDefault();

        var vehicles = addVehicles.getValue().map(function (v) { return String(v).trim(); }).filter(Boolean);
        var alerts = addAlerts.getValue().map(Number).filter(function (n) { return isFinite(n) && n > 0; });
        var mode = deliveryMode();
        var intervalInput = document.getElementById('vtAddIntervalMinutes');
        var cooldownInput = document.getElementById('vtAddCooldown');
        var interval = Number(intervalInput.value);
        var cooldown = Number(cooldownInput.value);
        var valid = true;

        addVehicles.setError(vehicles.length ? '' : 'Select at least one vehicle.');
        addAlerts.setError(alerts.length ? '' : 'Select at least one alert.');
        if (!vehicles.length || !alerts.length) valid = false;

        if (mode === 'INTERVAL' && (intervalInput.value === '' || !isFinite(interval) || interval < 1)) {
            fieldError(intervalInput, 'Enter a valid interval in minutes.');
            valid = false;
        } else {
            fieldError(intervalInput, '');
        }

        if (cooldownInput.value === '' || !isFinite(cooldown) || cooldown < 0) {
            fieldError(cooldownInput, 'Enter a valid cooldown value.');
            valid = false;
        } else {
            fieldError(cooldownInput, '');
        }

        if (!valid) return;

        var $submit = $('#vtAddSubmit').prop('disabled', true);
        VT.post('SaveAlertConfig', {
            alertMasterIds: alerts,
            deviceImeis: vehicles,
            priority: addPriority.getValue(),
            whatsappEnabled: $('#vtAddWhatsapp').is(':checked'),
            emailEnabled: $('#vtAddEmail').is(':checked'),
            deliveryMode: mode,
            intervalMinutes: mode === 'INTERVAL' ? interval : null,
            cooldownMinutes: cooldown,
            isActive: $('#vtAddEnabled').is(':checked')
        }).then(function (response) {
            if (!VT.isOk(response)) {
                VT.notify('info', VT.messageOf(response, 'Unable to create alert configuration.'));
                return;
            }
            addModal.hide();
            loadRules();
            VT.notify('success', VT.messageOf(response, 'Alert configuration created successfully.'));
        }).catch(function (err) {
            VT.notify('error', err.message);
        }).finally(function () {
            $submit.prop('disabled', false);
        });
    }

    // ---------- Update Video Alert ----------

    function openEdit(id) {
        editing = findRule(id);
        if (!editing) return;
        var input = document.getElementById('vtEditCooldown');
        input.value = editing.cooldown_minutes === null || editing.cooldown_minutes === undefined ? 0 : editing.cooldown_minutes;
        syncInputState(input);
        fieldError(input, '');
        $('#vtEditSummary').text((editing.veh_reg || editing.device_imei) + ' · ' + (editing.alarm_name || '') + ' · ' + (editing.priority || ''));
        $('#vtEditEnabled').prop('checked', Number(editing.is_active) === 1);
        editModal.show();
    }

    function submitEdit(event) {
        event.preventDefault();
        if (!editing) return;

        var id = Number(editing.id);
        var input = document.getElementById('vtEditCooldown');
        var cooldown = Number(input.value);
        var active = $('#vtEditEnabled').is(':checked');

        if (!id) { VT.notify('info', 'Unable to identify this alert configuration.'); return; }
        if (input.value === '' || !isFinite(cooldown) || cooldown < 0) {
            fieldError(input, 'Enter a valid cooldown value.');
            return;
        }
        fieldError(input, '');

        // Same as Trackofy: update the cooldown and/or toggle the status, only for what changed.
        var calls = [];
        if (cooldown !== Number(editing.cooldown_minutes)) {
            calls.push(VT.post('UpdateAlertConfig', { id: id, cooldownMinutes: cooldown }));
        }
        if (active !== (Number(editing.is_active) === 1)) {
            calls.push(VT.post('ToggleAlertConfig', { id: id, isActive: active }));
        }
        if (!calls.length) {
            editModal.hide();
            return;
        }

        var $submit = $('#vtEditSubmit').prop('disabled', true);
        Promise.all(calls).then(function (responses) {
            var failed = responses.filter(function (r) { return !VT.isOk(r); })[0];
            if (failed) {
                VT.notify('info', VT.messageOf(failed, 'Unable to update alert configuration.'));
                return;
            }
            editModal.hide();
            loadRules();
            VT.notify('success', VT.messageOf(responses[0], 'Alert configuration updated successfully.'));
        }).catch(function (err) {
            VT.notify('error', err.message);
        }).finally(function () {
            $submit.prop('disabled', false);
        });
    }

    // ---------- Delete Alert Configuration ----------

    function deleteRule(id) {
        var ruleId = Number(id);
        if (!ruleId) return;

        VT.confirm(
            'Delete Alert Configuration',
            'Are you sure you want to delete this alert configuration? This action cannot be undone.',
            'Delete'
        ).then(function (confirmed) {
            if (!confirmed) return;
            return VT.post('DeleteAlertConfig', { ids: [ruleId] }).then(function (response) {
                if (!VT.isOk(response)) {
                    VT.notify('info', VT.messageOf(response, 'Unable to delete alert configuration.'));
                    return;
                }
                VT.notify('success', VT.messageOf(response, 'Alert configuration deleted successfully.'));
                loadRules();
            });
        }).catch(function (err) {
            VT.notify('error', err.message);
        });
    }

    // ---------- Wiring ----------

    $('#vtAddAlert').on('click', function () { resetAddForm(); addModal.show(); });
    $('input[name="vtAddDelivery"]').on('change', function () {
        $('#vtAddIntervalWrap').prop('hidden', deliveryMode() !== 'INTERVAL');
    });
    $('.vt-modal .vt-input input').on('input change', function () { syncInputState(this); fieldError(this, ''); });
    $('#vtAddForm').on('submit', submitAdd);
    $('#vtEditForm').on('submit', submitEdit);
    $('#vtRuleTable').on('click', '[data-edit]', function () { openEdit($(this).attr('data-edit')); });
    $('#vtRuleTable').on('click', '[data-delete]', function () { deleteRule($(this).attr('data-delete')); });

    fillLookups();
    loadRules();
})(window, document, window.jQuery, window.VT);
