(function ($) {
    'use strict';
    

    var R = window.SchoolBuddyReports = window.SchoolBuddyReports || {};
    var urls = window.SchoolBuddyReportsUrls || {};
    var localToday = new Date();
    var today = new Date(localToday.getTime() - localToday.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    R.state = { category: 'all', report: null, lastTrigger: null, request: null, requestSequence: 0, modal: null, drawer: null, table: null, chart: null, distanceChart: null, meta: {}, page: 1, perPage: 10, students: [], routes: [], vehicles: [], selectedColumns: new Set(), lastPayload: null, alertResult: null, currentRows: [], addressCache: {} };

    var trackofyColumns = {
        'fleet-summary': ['Vehicle No', 'Distance', 'Max Idle', 'Total Engine Hours', 'Max Halt', 'Max Speed', 'Current Speed', 'Battery Voltage', 'Battery Percent', 'Last Contact', 'GPS Validity', 'Ignition', 'Door Status', 'Average Load', 'Initial Load', 'Final Load', 'Total Alerts', 'Group', 'Odometer Reading', 'Location Lat/Long', 'Utilization %'],
        'distance-chart': ['Units', 'Total(km)', 'Dates'],
        'cumulative-distance': ['Unit', 'Start Date', 'End Date', 'Total Distance(KM)'],
        'vehicle-summary': ['Vehicle', 'Driver', 'IMEI', 'Start Location', 'Total Distance', 'Total Running Time', 'Total Idle Time', 'Total Halt Time', 'Max Idle Time', 'Max Idle Location', 'Idle Duration(HH:MM:SS)', 'Max Halt', 'Max Halt Location', 'Halt Duration(HH:MM:SS)', 'No of Idle', 'Avg Speed', 'Max Speed', 'No of Overspeed', 'Alerts', 'End Location'],
        'max-speed-chart': ['Units', 'Dates']
    };
    var newTrackofyColumns = {
        'stoppage-summary': ['Unit', 'Driver', 'IMEI', 'Total halt', 'Max halt', 'Max Halt Location', 'Halt duration', 'Total distance', 'Total running', 'Total idle', 'Initial weight', 'Final weight', 'Avg speed', 'Max speed', 'Alerts count'],
        'running-summary': ['Unit', 'Total running time', 'Total halt time', 'Max Halt duration', 'Max Halt Location', 'Total distance', 'Total idle time', 'Max idle duration'],
        'alerts': ['Unit', 'Alert Name', 'Count'],
        'engine-hour-report': ['Unit', 'Date Time', 'Start Location', 'End Location', 'Total time /engine duration', 'Total Distance', 'Total idle duration', 'Total running duration', 'Status'],
        'driver-performance': ['Driver', 'Max speed', 'Avg speed', 'Total distance', 'Harsh breaking', 'Harsh acceleration', 'Fuel consumption', 'Mileage', 'Rating', 'No of trips']
    };

    function field(name, label, type, extra) { return $.extend({ name: name, label: label, type: type }, extra || {}); }
    function tdFields(dateName, label) { return [field(dateName, label || 'Date', 'date', { required: true, defaultValue: today })]; }

    R.reportDefinitions = {
        'fleet-summary': { id: 'fleet-summary', title: 'Fleet Summary', category: 'Fleet Reports', source: 'trackofy', icon: 'bi-truck', description: 'Overview of vehicle distance, engine hours, battery, status, alerts and utilization.', endpoint: urls.generate, method: 'POST', contentType: 'json', endpointType: 'fleet-summary', requiresVehicles: true, columns: trackofyColumns['fleet-summary'], requiredColumns: ['Vehicle No'], defaultColumns: ['Vehicle No', 'Distance', 'Total Engine Hours', 'Max Speed', 'Current Speed', 'Battery Percent', 'Last Contact', 'Ignition', 'Total Alerts', 'Location Lat/Long', 'Utilization %'], emptyState: 'No fleet-summary records found for the selected vehicles.' },
        'distance-chart': { id: 'distance-chart', title: 'Distance Chart', category: 'Distance Reports', source: 'trackofy', icon: 'bi-bar-chart', description: 'Compare vehicle distance across a selected date range.', endpoint: urls.generate, method: 'POST', contentType: 'json', endpointType: 'distance-chart', requiresVehicles: true, requiresDateRange: true, requiresDistanceRange: true, columns: trackofyColumns['distance-chart'], requiredColumns: ['Units', 'Dates'], defaultColumns: trackofyColumns['distance-chart'], emptyState: 'No distance data found for the selected criteria.', specialRenderer: 'dynamic-dates' },
        'cumulative-distance': { id: 'cumulative-distance', title: 'Cumulative Distance', category: 'Distance Reports', source: 'trackofy', icon: 'bi-signpost-split', description: 'Total distance travelled by each vehicle for the selected period.', endpoint: urls.generate, method: 'POST', contentType: 'json', endpointType: 'cumulative-distance', requiresVehicles: true, requiresDateRange: true, columns: trackofyColumns['cumulative-distance'], requiredColumns: ['Unit'], defaultColumns: trackofyColumns['cumulative-distance'], emptyState: 'No cumulative-distance records found.' },
        'vehicle-summary': { id: 'vehicle-summary', title: 'Vehicle Summary', category: 'Fleet Reports', source: 'trackofy', icon: 'bi-card-list', description: 'Detailed vehicle movement, idle, halt, speed, alert and playback summary.', endpoint: urls.generate, method: 'POST', contentType: 'json', endpointType: 'vehicle-summary', requiresVehicles: true, requiresDateRange: true, columns: trackofyColumns['vehicle-summary'], requiredColumns: ['Vehicle'], defaultColumns: ['Vehicle', 'Driver', 'Total Distance', 'Total Running Time', 'Total Idle Time', 'Avg Speed', 'Max Speed', 'Alerts', 'Playback'], emptyState: 'No vehicle-summary records found.' },
        'temperature-report': { id: 'temperature-report', title: 'Temperature Report', category: 'Fleet Reports', source: 'trackofy', icon: 'bi-thermometer-half', description: 'Review minimum, average and maximum vehicle temperatures by date.', endpoint: urls.temperature, method: 'POST', contentType: 'json', endpointType: 'temperature-report', temperatureReport: true, requiresVehicles: true, fields: [field('temperatureStartDate', 'Start Date', 'date', { required: true, defaultValue: today }), field('temperatureStartTime', 'Start Time', 'time', { required: true, defaultValue: '00:00' }), field('temperatureEndDate', 'End Date', 'date', { required: true, defaultValue: today }), field('temperatureEndTime', 'End Time', 'time', { required: true, defaultValue: '23:59' }), field('temperaturePageSize', 'Page Size', 'select', { required: true, defaultValue: '10', options: [{ value: '10', text: '10' }, { value: '50', text: '50' }, { value: '100', text: '100' }, { value: '200', text: '200' }] })], columns: ['Date', 'Min Temperature(°C)', 'Min Temp Lat/Long', 'Min Temp Status', 'Avg Temperature(°C)', 'Max Temperature(°C)', 'Max Temp Lat/Long', 'Max Temp Status'], defaultColumns: [], emptyState: 'No temperature data found for the selected filters.', apiPagination: true },
        'idle-summary-report': { id: 'idle-summary-report', title: 'Idle Summary Report', category: 'Fleet Reports', source: 'trackofy', icon: 'bi-hourglass-split', description: 'Review idle time, distance and running time for selected vehicles.', endpoint: urls.idleSummary, method: 'POST', contentType: 'json', endpointType: 'idle-summary-report', idleSummaryReport: true, requiresVehicles: true, fields: [field('idleStartDate', 'Start Date', 'date', { required: true, defaultValue: today.slice(0, 8) + '01' }), field('idleStartTime', 'Start Time', 'time', { required: true, defaultValue: '00:00' }), field('idleEndDate', 'End Date', 'date', { required: true, defaultValue: today }), field('idleEndTime', 'End Time', 'time', { required: true, defaultValue: '23:59' }), field('idlePageSize', 'Page Size', 'select', { required: true, defaultValue: '10', options: [{ value: '10', text: '10' }, { value: '50', text: '50' }, { value: '100', text: '100' }, { value: '200', text: '200' }] })], columns: [], defaultColumns: [], emptyState: 'No idle summary data found for the selected filters.', apiPagination: true },
        'max-speed-chart': { id: 'max-speed-chart', title: 'Max Speed Chart', category: 'Speed Reports', source: 'trackofy', icon: 'bi-speedometer2', description: 'Compare maximum recorded speed for vehicles across multiple dates.', endpoint: urls.generate, method: 'POST', contentType: 'json', endpointType: 'max-speed-chart', requiresVehicles: true, requiresDateRange: true, columns: trackofyColumns['max-speed-chart'], requiredColumns: ['Units', 'Dates'], defaultColumns: trackofyColumns['max-speed-chart'], emptyState: 'No maximum-speed data found.', specialRenderer: 'dynamic-dates' },
        'stoppage-summary': { id: 'stoppage-summary', title: 'Stoppage Summary', category: 'Fleet Reports', source: 'trackofy', icon: 'bi-pause-circle', description: 'Review vehicle stoppage, halt duration, distance and alert totals.', endpoint: urls.generate, method: 'POST', contentType: 'json', endpointType: 'stoppage-summary', requiresVehicles: true, requiresDateRange: true, apiPagination: true, columns: newTrackofyColumns['stoppage-summary'], requiredColumns: ['Unit'], defaultColumns: newTrackofyColumns['stoppage-summary'], emptyState: 'No stoppage summary records found.', format: 'stoppage' },
        'running-summary': { id: 'running-summary', title: 'Running Summary', category: 'Fleet Reports', source: 'trackofy', icon: 'bi-play-circle', description: 'Review running, halt, idle and distance totals by unit.', endpoint: urls.generate, method: 'POST', contentType: 'json', endpointType: 'running-summary', requiresVehicles: true, requiresDateRange: true, apiPagination: true, columns: newTrackofyColumns['running-summary'], requiredColumns: ['Unit'], defaultColumns: newTrackofyColumns['running-summary'], emptyState: 'No running summary records found.', format: 'running' },
        'alerts': { id: 'alerts', title: 'Alerts', category: 'Fleet Reports', source: 'trackofy', icon: 'bi-exclamation-triangle', description: 'Show alert counters per unit organized by alert type.', endpoint: urls.generate, method: 'POST', contentType: 'json', endpointType: 'alerts', requiresVehicles: true, requiresDateRange: true, apiPagination: true, columns: newTrackofyColumns['alerts'], requiredColumns: ['Unit', 'Alert Name', 'Count'], defaultColumns: newTrackofyColumns['alerts'], emptyState: 'No alerts found.', actions: ['alert-summary'], format: 'alerts' },
        'engine-hour-report': { id: 'engine-hour-report', title: 'Engine Hour', category: 'Fleet Reports', source: 'trackofy', icon: 'bi-clock-history', description: 'Review engine duration, distance, idle and running time by unit.', endpoint: urls.generate, method: 'POST', contentType: 'json', endpointType: 'engine-hour-report', requiresVehicles: true, requiresDateRange: true, apiPagination: true, columns: newTrackofyColumns['engine-hour-report'], requiredColumns: ['Unit'], defaultColumns: newTrackofyColumns['engine-hour-report'], emptyState: 'No engine-hour records found.', format: 'engine-hour', columnMappings: [{ title: 'Unit', data: 'Unit' }, { title: 'Date Time', data: 'Date Time' }, { title: 'Start Location', data: 'Start Location' }, { title: 'End Location', data: 'End Location' }, { title: 'Engine Duration', data: 'Total time /engine duration' }, { title: 'Total Distance', data: 'Total Distance' }, { title: 'Idle Duration', data: 'Total idle duration' }, { title: 'Running Duration', data: 'Total running duration' }, { title: 'Status', data: 'Status' }] },
        'driver-performance': { id: 'driver-performance', title: 'Driver Performance', category: 'Fleet Reports', source: 'trackofy', icon: 'bi-person-check', description: 'Review the existing Dashboard Driver Performance report.', endpoint: urls.driverPerformance, method: 'POST', contentType: 'form', endpointType: 'driver-performance', requiresDateRange: true, legacyDriverPerformance: true, columns: newTrackofyColumns['driver-performance'], requiredColumns: [], defaultColumns: newTrackofyColumns['driver-performance'], emptyState: 'No driver performance records found.' },
        'alert-summary': { id: 'alert-summary', title: 'Alert Summary', category: 'Fleet Reports', source: 'trackofy', icon: 'bi-list-check', description: 'Alert detail records.', endpoint: urls.generate, method: 'POST', contentType: 'json', endpointType: 'alert-summary', requiresDateRange: true, apiPagination: true, alertSummary: true, columns: ['Unit', 'Alert Name', 'Received Time', 'Messages', 'Driver Name', 'Driver Number', 'Location'], defaultColumns: ['Unit', 'Alert Name', 'Received Time', 'Messages', 'Driver Name', 'Driver Number', 'Location'], requiredColumns: [], emptyState: 'No alert summary records found.' },

        'notification-log': { id: 'notification-log', title: 'Notification Log', category: 'School Transport Reports', source: 'schoolbuddy', icon: 'bi-bell', description: 'Review notification activity for a date.', endpoint: urls.notification, method: 'POST', contentType: 'form', fields: tdFields('fdate', 'Date To'), columns: ['Student Name', 'Admission No', 'Route Name', 'Mobile No', 'Message', 'Status'], emptyState: 'No notification records found.', responseAdapter: 'array' },
        'student-notification': { id: 'student-notification', title: 'Student Notification', category: 'School Transport Reports', source: 'schoolbuddy', icon: 'bi-people', description: 'Review notifications sent to selected students over a date range.', endpoint: urls.studentReport, method: 'POST', contentType: 'json', fields: [field('selectedValues', 'Students', 'searchable-select', { required: true, dataSource: 'students' }), field('from', 'Date From', 'date', { required: true, defaultValue: today }), field('to', 'Date To', 'date', { required: true, defaultValue: today })], columns: ['Student Name', 'Admission No', 'Route Name', 'Mobile No', 'Message'], emptyState: 'No student notification records found.', responseAdapter: 'array' },
        'login-reports': { id: 'login-reports', title: 'Login Reports', category: 'School Transport Reports', source: 'schoolbuddy', icon: 'bi-box-arrow-in-right', description: 'Review student login activity for a date.', endpoint: urls.loginReport, method: 'POST', contentType: 'form', fields: tdFields('fdate', 'Date'), columns: ['Student Name', 'Class', 'Admission No', 'Login Time', 'Source'], emptyState: 'No login records found.', responseAdapter: 'array' },
        // 'alert-reports': { id:'alert-reports', title:'Alert Reports', category:'School Transport Reports', source:'schoolbuddy', icon:'bi-exclamation-triangle', description:'Review stop-violation alerts for selected routes and date.', endpoint:urls.alertReport, method:'POST', contentType:'json', fields:[field('selectedValues','Routes','multiselect',{required:true,dataSource:'routes'}),field('from','Date','date',{required:true,defaultValue:today})], columns:['S.No','Route Name','Count'], emptyState:'No alert records found.', responseAdapter:'array' },
        'no-gps-report': { id: 'no-gps-report', title: 'No GPS Report', category: 'School Transport Reports', source: 'schoolbuddy', icon: 'bi-geo-alt', description: 'Review vehicles that have not reported GPS data.', endpoint: urls.noGps, method: 'POST', contentType: 'form', noPayload: true, fields: [], columns: ['Vehicle', 'Last Updated'], emptyState: 'No vehicles without GPS data were found.', responseAdapter: 'array' },
        'rfid-report': { id: 'rfid-report', title: 'RFID Report', category: 'School Transport Reports', source: 'schoolbuddy', icon: 'bi-upc-scan', description: 'Review RFID attendance totals by route for a date.', endpoint: urls.rfidReport, method: 'POST', contentType: 'form', fields: tdFields('fdate', 'Date'), columns: ['Route Name', 'Total Students', 'Punched', 'Not Punched', 'Other Punched'], columnMappings: [{ title: 'Route Name', data: 'route_name' }, { title: 'Total Students', data: 'total' }, { title: 'Punched', data: 'punched' }, { title: 'Not Punched', data: 'not_punched' }, { title: 'Other Punched', data: 'other' }], emptyState: 'No RFID records found.', responseAdapter: 'array' },
        'uhf-report': { id: 'uhf-report', title: 'UHF Report', category: 'School Transport Reports', source: 'schoolbuddy', icon: 'bi-broadcast', description: 'The legacy UHF tab has no working submit endpoint or result source.', endpoint: null, method: null, fields: [field('modified', 'Date To', 'datetime-local', { required: true, defaultValue: new Date().toISOString().slice(0, 16).replace('T', ' ') })], columns: [], resultType: 'unavailable', emptyState: 'It\'s looks like the UHF services were not considered in your plan.' }
    };

    R.escapeHtml = function (v) { return $('<div>').text(v == null ? '' : String(v)).html(); };
    R.isEmptyValue = function (v) { return v == null || String(v).trim() === '' || /^(na|n\/a)$/i.test(String(v).trim()); };
    R.init = function () {
        ['temperature-report', 'idle-summary-report'].forEach(function (id) { var report = R.reportDefinitions[id]; if (report) report.fields = (report.fields || []).filter(function (f) { return f.name !== 'temperaturePageSize' && f.name !== 'idlePageSize'; }); });
        var temperature = R.reportDefinitions['temperature-report']; if (temperature) { temperature.columns = ['Date', 'Min Temperature(°C)', 'Min Temp Lat/Long', 'Min Temp Status', 'Avg Temperature(°C)', 'Max Temperature(°C)', 'Max Temp Lat/Long', 'Max Temp Status']; temperature.defaultColumns = temperature.columns.slice(); }
        var drawerElement =
            document.getElementById('reportFilterDrawer');

        if (!drawerElement) {
            console.error(
                'Report filter drawer element was not found.'
            );
            return;
        }

        R.state.drawer =
            bootstrap.Offcanvas.getOrCreateInstance(
                drawerElement
            );

        /*
         * Bootstrap modals are viewport-level UI. Keep the report modal out of
         * #layoutmain, whose horizontal overflow can otherwise become a second
         * scroll container around wide report tables.
         */
        var modalElement = document.getElementById('reportResultModal');

        if (modalElement && modalElement.parentElement !== document.body) {
            document.body.appendChild(modalElement);
        }

        R.state.modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        R.renderCards(); R.bindEvents(); R.loadVehicles();
    };
    R.handleLocationClick = function (e) {
        e.preventDefault();
        e.stopPropagation();

        var button = e.currentTarget;

        if (!button || button.disabled) {
            return;
        }

        var latitude = $(button).attr('data-latitude');
        var longitude = $(button).attr('data-longitude');

        console.debug('[SchoolBuddyReports] Load address clicked.', {
            latitude: latitude,
            longitude: longitude
        });

        var coordinates = R.parseCoordinates(
            latitude + ',' + longitude
        );

        if (!coordinates) {
            console.error('[SchoolBuddyReports] Invalid coordinates.', {
                latitude: latitude,
                longitude: longitude
            });

            R.showPopup(
                'warning',
                'Invalid Location',
                'Latitude or longitude is invalid.'
            );

            return;
        }

        console.debug('[SchoolBuddyReports] Parsed coordinates.', coordinates);

        if (typeof R.loadAddressForCell === 'function') {
            R.loadAddressForCell(button, coordinates.latitude, coordinates.longitude, coordinates.key);
        } else if (typeof R.loadRowAddress === 'function') {
            R.loadRowAddress(button);
        }
    };
    R.bindEvents = function () {
        $(document).off('.schoolBuddyReports')
            .on('input.schoolBuddyReports', '#reportSearch', R.filterCards)
            .on('click.schoolBuddyReports', '.report-category-filter button', function () { R.state.category = String($(this).data('category') || 'all'); $('.report-category-filter button').removeClass('active'); $(this).addClass('active'); R.filterCards(); })
            .on('click.schoolBuddyReports keydown.schoolBuddyReports', '.report-card[data-report-id]', function (e) { if (e.type === 'click' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); R.openReport($(this).data('report-id'), this); } })
            .on('click.schoolBuddyReports', '#generateReportBtn', function () { R.generateReport(); })
            .on('click.schoolBuddyReports', '#resetReportFilters', function () { R.resetFilters(); })
            .on('click.schoolBuddyReports', '#changeReportFilters', function () { R.state.modal.hide(); R.state.drawer.show(); })
            .on('click.schoolBuddyReports', '#backToAlerts', function () { R.backToAlerts(); })
            .on('click.schoolBuddyReports', '.report-alert-summary', function () { var table = $('#reportResultTable').DataTable(); R.openAlertSummary(table.row($(this).closest('tr')).data()); })
            .on('click.schoolBuddyReports', '.report-distance-chart', function () { var table = $('#reportResultTable').DataTable(); R.openDistanceChart(table.row($(this).closest('tr')).data()); })
            .on(
                'click.schoolBuddyReports',
                '#reportResultTable .report-load-address',
                function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    console.log('LOCATION BUTTON CLICKED');

                    R.handleLocationClick.call(this, e);
                }
            )
            .on('change.schoolBuddyReports input.schoolBuddyReports', '[data-report-field]', function () { R.clearError($(this).data('report-field')); })
            .on('click.schoolBuddyReports', '.report-multiselect-trigger', function () { var m = $(this).next('.report-multiselect-menu'); m.toggleClass('d-none'); $(this).attr('aria-expanded', !m.hasClass('d-none')); })
            .on('click.schoolBuddyReports', '.report-multiselect-menu', function (e) { e.stopPropagation(); })
            .on('change.schoolBuddyReports', '.report-vehicle-check', function () { if (R.state.report && R.state.report.temperatureReport && this.checked) { $('.report-vehicle-check').not(this).prop('checked', false); } })
            .on('change.schoolBuddyReports', '#reportField_idlePageSize', function () { if (R.state.report && R.state.report.idleSummaryReport && R.validateForm()) R.goToPage(1, true); })
            .on('click.schoolBuddyReports', '#reportColumnsAll', function () { var checked = this.checked; $('.report-column-check').each(function () { if (!$(this).prop('disabled')) $(this).prop('checked', checked); }); R.updateColumnsSelectAll(); R.clearError('columns'); })
            .on('change.schoolBuddyReports', '.report-column-check', function () { R.updateColumnsSelectAll(); R.clearError('columns'); })
            .on('click.schoolBuddyReports', '#reportResultTable tbody tr', R.handleReportRowClick)
            .on('click.schoolBuddyReports', '#reportApiPager [data-page-direction]', function () { var d = $(this).data('page-direction'); if (d === 'previous' && R.state.page > 1) R.goToPage(R.state.page - 1); if (d === 'next') R.goToPage(R.state.page + 1); });
        
        $(window).off('resize.schoolBuddyReports').on('resize.schoolBuddyReports', function () { clearTimeout(R.state.tableResizeTimer); R.state.tableResizeTimer = setTimeout(R.adjustReportTable, 150); });
        $('#reportResultModal')
            .off('shown.bs.modal.reportTableAdjust')
            .on('shown.bs.modal.reportTableAdjust', function () {
                if ($.fn.DataTable.isDataTable('#reportResultTable')) {
                    $('#reportResultTable')
                        .DataTable()
                        .columns.adjust()
                        .draw(false);
                }
            })
            .off('hidden.bs.modal.reportReset')
            .on('hidden.bs.modal.reportReset', function () {
                R.setLoading(false);
                $('#generateReportBtn').removeClass('d-none').show();
            });
        $(document).off('hidden.bs.modal.reportDistanceChart').on('hidden.bs.modal.reportDistanceChart', '#distanceChartModal', function () {
            if (R.state.distanceChart) { R.state.distanceChart.destroy(); R.state.distanceChart = null; }
        });
    };
    R.renderCards = function () { var html = Object.keys(R.reportDefinitions).filter(function (id) { return !R.reportDefinitions[id].alertSummary; }).map(function (id) { var d = R.reportDefinitions[id]; return '<article class="report-card" tabindex="0" role="button" data-report-id="' + R.escapeHtml(id) + '"><div class="report-card-top"><span class="report-card-icon"><i class="bi ' + R.escapeHtml(d.icon) + '"></i></span><span class="report-card-category">' + R.escapeHtml(d.category) + '</span></div><h2>' + R.escapeHtml(d.title) + '</h2><p>' + R.escapeHtml(d.description) + '</p><div class="report-card-meta">' + R.escapeHtml(d.source === 'trackofy' ? 'Trackofy' : 'School Transport') + '</div></article>'; }).join(''); $('#reportCardGrid').html(html); R.filterCards(); };
    R.filterCards = function () { var q = String($('#reportSearch').val() || '').toLowerCase(), n = 0; $('.report-card').each(function () { var ok = (R.state.category === 'all' || $(this).find('.report-card-category').text().trim() === R.state.category) && $(this).text().toLowerCase().indexOf(q) > -1; $(this).toggleClass('d-none', !ok); if (ok) n++; }); $('#reportNoResults').toggleClass('d-none', n > 0); };
    R.openReport = function (id, trigger) {

        var report = R.reportDefinitions[id];

        if (!report || report.alertSummary) {
            return;
        }

        R.cancelRequest();
        R.destroyChart();
        R.setLoading(false);
        $('#generateReportBtn').removeClass('d-none').show();

        /*
         * This already destroys and recreates the table.
         * Do not call R.destroyDataTable() separately.
         */
        R.resetResultTableContainer();

        $('#temperatureReportKpis, #idleSummaryKpis, #idleSummaryNotice')
            .hide();

        $('#reportResultLoading, #reportResultError, #reportResultEmpty, #reportApiPager')
            .addClass('d-none')
            .hide()
            .empty();

        $('#reportTableWrap')
            .addClass('d-none')
            .removeAttr('style');

        R.state.report = report;
        R.state.alertResult = null;
        R.state.lastTrigger = trigger;
        R.state.meta = {};
        R.state.page = 1;
        R.state.perPage = 10;
        R.state.lastPayload = null;

        R.state.selectedColumns =
            new Set(report.defaultColumns || []);

        (report.requiredColumns || []).forEach(function (column) {
            R.state.selectedColumns.add(column);
        });

        $('#backToAlerts').addClass('d-none');

        $('#drawerIcon').html(
            '<i class="bi ' +
            R.escapeHtml(report.icon) +
            '"></i>'
        );

        $('#reportFilterDrawerTitle').text(report.title);
        $('#drawerDescription').text(report.description);

        R.renderForm();

        R.state.drawer.show();

        if (report.noPayload) {
            R.goToPage(1, true);
        }
    };

    R.openAlertSummary = function (row) { var parent = R.reportDefinitions.alerts; if (!row) return; R.state.alertResult = { definition: parent, rows: R.state.table.rows().data().toArray(), meta: R.state.meta, payload: R.state.lastPayload }; R.state.report = $.extend({}, R.reportDefinitions['alert-summary'], { alertId: row.alert_id || row.AlertId || row.alertId, alertVehicleList: row.service_id || row.ServiceId || row.service_id, alertStartDate: R.state.lastPayload && R.state.lastPayload.startDate, alertEndDate: R.state.lastPayload && R.state.lastPayload.endDate, alertName: row['Alert Name'] || row.AlertName || 'Alert', alertUnit: row.Unit || 'Unit' }); R.destroyDataTable(); R.state.page = 1; R.state.meta = {}; R.state.modal.hide(); R.goToPage(1, false); };
    R.backToAlerts = function () { if (!R.state.alertResult) return; var saved = R.state.alertResult; R.state.report = saved.definition; R.state.meta = saved.meta || {}; R.state.lastPayload = saved.payload; R.showResult({ success: true, rows: saved.rows || [], meta: saved.meta || {} }); R.state.alertResult = null; };
    R.renderForm = function () {
        var d = R.state.report, html = ''; if (d.resultType === 'unavailable') { html += '<div class="alert alert-info">' + R.escapeHtml(d.emptyState) + '</div>'; }
        (d.fields || []).forEach(function (f) { html += R.renderField(f); }); if (d.source === 'trackofy') { if (!d.temperatureReport && !d.idleSummaryReport) html += R.renderTrackofyFields(d); if (d.legacyDriverPerformance) { html += R.renderColumnField(d); } else { html += R.renderVehicleField(); if (!d.temperatureReport && !d.idleSummaryReport) html += R.renderColumnField(d); } } $('#reportFilterForm').html(html); R.initDatePickers(); if (d.id === 'student-notification') R.initStudentDropdown(); (d.fields || []).forEach(function (f) { if (f.dataSource) R.loadOptions(f); }); R.renderVehicleOptions(); if (d.temperatureReport) $('#reportVehiclesAll').closest('label').hide(); R.updateColumnsSelectAll();
    };
    R.initDatePickers = function () { if (!window.flatpickr) return; $('#reportFilterForm .report-date-picker').each(function () { if (this._flatpickr) this._flatpickr.destroy(); flatpickr(this, { dateFormat: 'Y-m-d', altInput: true, altFormat: 'd M Y', allowInput: true, maxDate: today }); }); $('#reportFilterForm .report-datetime-picker').each(function () { if (this._flatpickr) this._flatpickr.destroy(); flatpickr(this, { enableTime: true, time_24hr: true, dateFormat: 'Y-m-d H:i', altInput: true, altFormat: 'd M Y H:i', allowInput: true, maxDate: new Date() }); }); };
    R.renderTrackofyFields = function (d) { var html = '', now = new Date(), pad = function (value) { return String(value).padStart(2, '0'); }, formatDateTime = function (value) { return value.getFullYear() + '-' + pad(value.getMonth() + 1) + '-' + pad(value.getDate()) + ' ' + pad(value.getHours()) + ':' + pad(value.getMinutes()); }, endDateTime = formatDateTime(now), startDate = new Date(now); startDate.setDate(startDate.getDate() - 1); var startDateTime = formatDateTime(startDate); if (d.requiresDateRange) html += '<div class="row"><div class="col-6 report-field">' + R.renderField(field('start', 'Start date and time', 'datetime-local', { required: true, defaultValue: startDateTime })) + '</div><div class="col-6 report-field">' + R.renderField(field('end', 'End date and time', 'datetime-local', { required: true, defaultValue: endDateTime })) + '</div></div>'; if (d.requiresDistanceRange) html += '<div class="row"><div class="col-6 report-field">' + R.renderField(field('minDistance', 'Minimum distance', 'number', { required: true, defaultValue: '0', min: 0, step: 'any' })) + '</div><div class="col-6 report-field">' + R.renderField(field('maxDistance', 'Maximum distance', 'number', { required: true, defaultValue: '10', min: 0, step: 'any' })) + '</div></div>'; return html; };
    R.renderField = function (f) { var id = 'reportField_' + f.name, req = f.required ? '<span class="text-danger">*</span>' : ''; var value = f.defaultValue || '', attrs = ' data-report-field="' + R.escapeHtml(f.name) + '" ' + (f.required ? 'required' : '') + ' ' + (f.placeholder ? 'placeholder="' + R.escapeHtml(f.placeholder) + '"' : '') + (f.min != null ? ' min="' + R.escapeHtml(f.min) + '"' : '') + (f.max != null ? ' max="' + R.escapeHtml(f.max) + '"' : '') + (f.step != null ? ' step="' + R.escapeHtml(f.step) + '"' : ''); var isDate = f.type === 'date', isDateTime = f.type === 'datetime-local', inputType = (isDate || isDateTime) ? 'text' : f.type, pickerClass = isDate ? ' report-date-picker' : (isDateTime ? ' report-datetime-picker' : ''); var control; if (f.type === 'select' || f.type === 'searchable-select') control = '<select id="' + id + '" name="' + R.escapeHtml(f.name) + '" class="form-select' + (f.type === 'searchable-select' ? ' report-searchable-select' : '') + '"' + attrs + '>' + (f.options || []).map(function (o) { var x = typeof o === 'object' ? o : { value: o, text: o }; return '<option value="' + R.escapeHtml(x.value) + '" ' + (String(x.value) === String(value) ? 'selected' : '') + '>' + R.escapeHtml(x.text) + '</option>'; }).join('') + '</select>'; else if (f.type === 'textarea') control = '<textarea id="' + id + '" name="' + R.escapeHtml(f.name) + '" class="form-control"' + attrs + '>' + R.escapeHtml(value) + '</textarea>'; else if (f.type === 'hidden') control = '<input id="' + id + '" name="' + R.escapeHtml(f.name) + '" type="hidden" value="' + R.escapeHtml(value) + '"' + attrs + '>'; else if (f.type === 'checkbox' || f.type === 'radio') control = '<div><input id="' + id + '" name="' + R.escapeHtml(f.name) + '" type="' + R.escapeHtml(f.type) + '" value="' + R.escapeHtml(value || 'true') + '"' + attrs + '></div>'; else control = '<input id="' + id + '" name="' + R.escapeHtml(f.name) + '" type="' + inputType + '" class="form-control' + pickerClass + '" value="' + R.escapeHtml(value) + '"' + attrs + '>'; return '<div class="report-field"><label for="' + id + '">' + R.escapeHtml(f.label) + ' ' + req + '</label>' + control + '<div class="report-field-error" data-error="' + R.escapeHtml(f.name) + '"></div></div>'; };
    R.renderVehicleField = function () { return '<div class="report-field"><label>Vehicles <span class="text-danger">*</span></label><div class="report-multiselect"><button type="button" class="report-multiselect-trigger" aria-expanded="false"><span id="reportVehicleLabel">Select vehicles</span><i class="bi bi-chevron-down"></i></button><div class="report-multiselect-menu d-none"><div class="report-multiselect-search"><i class="bi bi-search"></i><input id="reportVehicleSearch" type="search" placeholder="Search vehicles" aria-label="Search vehicles"></div><div class="report-multiselect-actions"><label class="small mb-0"><input id="reportVehiclesAll" type="checkbox"> Select all</label><button id="reportVehicleClear" type="button" class="btn btn-link btn-sm p-0">Clear</button></div><div id="reportVehicleOptions" class="report-multiselect-options"><span class="small text-muted">Loading vehicles...</span></div></div></div><div class="report-field-error" data-error="vehicles"></div></div>'; };
    R.renderColumnField = function (d) { return '<div class="report-field"><label>Columns <span class="text-danger">*</span></label><label class="float-end small"><input id="reportColumnsAll" type="checkbox"> Select all</label><div id="reportColumns" class="report-columns">' + d.columns.map(function (c) { return '<label class="report-column-option"><input class="report-column-check" type="checkbox" value="' + R.escapeHtml(c) + '" ' + (R.state.selectedColumns.has(c) ? 'checked ' : '') + ((d.requiredColumns || []).indexOf(c) > -1 ? 'disabled' : '') + '> ' + R.escapeHtml(c) + '</label>'; }).join('') + '</div><div class="report-field-error" data-error="columns"></div></div>'; };
    R.initStudentDropdown = function () { var select = $('#reportField_selectedValues'); if (!select.length || !$.fn.select2) return; if (select.hasClass('select2-hidden-accessible')) select.select2('destroy'); select.select2({ width: '100%', placeholder: 'Select student', allowClear: true, minimumResultsForSearch: 0, dropdownParent: $('#reportFilterDrawer') }).on('change.schoolBuddyStudent', function () { R.clearError('selectedValues'); }); };
    R.loadOptions = function (f) { var target = f.type === 'searchable-select' ? $('#reportField_' + f.name) : $('#reportOptions_' + f.name), url = f.dataSource === 'students' ? urls.students : urls.routes; if (!url || !target.length) return; if ((f.dataSource === 'students' ? R.state.students : R.state.routes).length) { R.renderOptions(f); return; } $.ajax({ url: url, type: 'POST', data: { uid: urls.uid || '' } }).done(function (raw) { var values = R.getApiRecords(raw); var normalized = values.map(function (x) { return { id: x.id || x.student_id || x.route_id, text: x.student_name || x.route_name || x.name || x.text || x.id }; }); if (f.dataSource === 'students') R.state.students = normalized; else R.state.routes = normalized; R.renderOptions(f); }).fail(function () { if (f.type === 'searchable-select') target.html('<option value="">Unable to load options.</option>'); else target.html('<span class="text-danger small">Unable to load options.</span>'); }); };
    R.renderOptions = function (f) { var list = f.dataSource === 'students' ? R.state.students : R.state.routes, target = f.type === 'searchable-select' ? $('#reportField_' + f.name) : $('#reportOptions_' + f.name); if (f.type === 'searchable-select') { target.html('<option value=""></option>' + list.map(function (x) { return '<option value="' + R.escapeHtml(x.id) + '">' + R.escapeHtml(x.text) + '</option>'; }).join('')).trigger('change'); return; } target.html(list.map(function (x) { return '<label class="report-column-option"><input type="checkbox" class="report-option-check" data-report-field="' + R.escapeHtml(f.name) + '" value="' + R.escapeHtml(x.id) + '"> ' + R.escapeHtml(x.text) + '</label>'; }).join('') || '<span class="small text-muted">No options found.</span>'); };
    R.loadVehicles = function () { if (R.state.vehicles.length) return; $.getJSON(urls.vehicles).done(function (x) { R.state.vehicles = (x.data || []).map(function (v) { return { id: String(v.id), text: v.text || String(v.id) }; }); R.renderVehicleOptions(); }); };
    R.updateColumnsSelectAll = function () { var boxes = $('.report-column-check:not(:disabled)'), selected = boxes.filter(':checked').length; $('#reportColumnsAll').prop('checked', boxes.length > 0 && selected === boxes.length).prop('indeterminate', selected > 0 && selected < boxes.length); };
    R.renderVehicleOptions = function () { var t = $('#reportVehicleOptions'); if (!t.length) return; t.html(R.state.vehicles.map(function (v) { return '<label class="report-vehicle-option"><input type="checkbox" class="report-vehicle-check" data-report-field="vehicles" value="' + R.escapeHtml(v.id) + '"> <span>' + R.escapeHtml(v.text) + '</span></label>'; }).join('') || '<span class="small text-muted">Loading vehicles...</span>'); var updateLabel = function () { var boxes = $('.report-vehicle-check'), names = boxes.filter(':checked').map(function () { return $(this).siblings('span').text(); }).get(); $('#reportVehicleLabel').text(names.length ? names.join(', ') : 'Select vehicles'); $('#reportVehiclesAll').prop('checked', boxes.length > 0 && names.length === boxes.length).prop('indeterminate', names.length > 0 && names.length < boxes.length); $('.report-vehicle-option').each(function () { $(this).toggleClass('selected', $(this).find('.report-vehicle-check').prop('checked')); }); }; $('#reportVehicleSearch').off('input.schoolBuddyVehicles').on('input.schoolBuddyVehicles', function () { var q = String(this.value || '').toLowerCase(); $('.report-vehicle-option').each(function () { $(this).toggle($(this).text().toLowerCase().indexOf(q) > -1); }); }); $('#reportVehiclesAll').off('change.schoolBuddyVehicles').on('change.schoolBuddyVehicles', function () { $('.report-vehicle-check').prop('checked', this.checked); R.clearError('vehicles'); updateLabel(); }); $('.report-vehicle-check').off('change.schoolBuddyVehicles').on('change.schoolBuddyVehicles', function () { R.clearError('vehicles'); updateLabel(); }); $('#reportVehicleClear').off('click.schoolBuddyVehicles').on('click.schoolBuddyVehicles', function () { $('.report-vehicle-check').prop('checked', false); R.clearError('vehicles'); updateLabel(); }); updateLabel(); };
    R.resetFilters = function () { var d = R.state.report; if (!d) return; R.state.page = 1; R.state.perPage = 10; R.state.selectedColumns = new Set(d.defaultColumns || []); (d.requiredColumns || []).forEach(function (c) { R.state.selectedColumns.add(c); }); $('.report-field-error').hide().text(''); R.renderForm(); if (d.temperatureReport) { R.destroyDataTable(); R.resetTemperatureKpis(); $('#temperatureReportKpis,#reportResultLoading,#reportResultError,#reportResultEmpty,#reportApiPager').hide(); $('#reportResultError').empty(); } if (d.idleSummaryReport) { R.destroyDataTable(); R.resetIdleKpis(); $('#idleSummaryKpis,#idleSummaryNotice,#reportResultLoading,#reportResultError,#reportResultEmpty,#reportApiPager').hide(); $('#reportResultError').empty(); R.cancelRequest(); } };
    R.clearError = function (n) { $('[data-error="' + n + '"]').hide().text(''); }; R.showError = function (n, m) { $('[data-error="' + n + '"]').text(m).show(); };
    R.values = function () { var d = R.state.report, o = {}; (d.fields || []).forEach(function (f) { o[f.name] = $('[data-report-field="' + f.name + '"]').val() || ''; }); return o; };
    R.parseReportDate = function (value) { if (!value) return NaN; var normalized = String(value).trim().replace(' ', 'T'); var parsed = Date.parse(normalized); return Number.isNaN(parsed) ? Date.parse(String(value).trim()) : parsed; }; R.isFutureReportDate = function (value) { var parsed = R.parseReportDate(value); return !Number.isNaN(parsed) && parsed > Date.now(); };
    R.validateForm = function () { var d = R.state.report, ok = true; if (d.resultType === 'unavailable') return false; var v = R.values(); (d.fields || []).forEach(function (f) { if (f.required && ((Array.isArray(v[f.name]) && !v[f.name].length) || (!Array.isArray(v[f.name]) && !String(v[f.name]).trim()))) { R.showError(f.name, f.validationMessage || f.label + ' is required.'); ok = false; } }); if (d.temperatureReport) { var ts = v.temperatureStartDate + ' ' + v.temperatureStartTime, te = v.temperatureEndDate + ' ' + v.temperatureEndTime; if (R.parseReportDate(ts) > R.parseReportDate(te)) { R.showError('temperatureEndDate', 'End date/time cannot be earlier than start.'); ok = false; } } if (d.source === 'trackofy') { if (!d.legacyDriverPerformance && !$('.report-vehicle-check:checked').length) { R.showError('vehicles', 'Select a vehicle.'); ok = false; } if (!d.temperatureReport && !$('.report-column-check:checked').length) { R.showError('columns', 'Select at least one column.'); ok = false; } if (d.requiresDateRange) { var s = $('#reportField_start').val(), e = $('#reportField_end').val(), startTime = R.parseReportDate(s), endTime = R.parseReportDate(e); if (!s || !e) { R.showError('start', 'Start and end date/time are required.'); ok = false; } else if (Number.isNaN(startTime) || Number.isNaN(endTime)) { R.showError('end', 'Enter valid start and end date/time values.'); ok = false; } else if (startTime > endTime) { R.showError('end', 'End date/time cannot be earlier than start.'); ok = false; } } if (d.requiresDistanceRange) { var min = Number($('#reportField_minDistance').val()), max = Number($('#reportField_maxDistance').val()); if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) { R.showError('maxDistance', 'Enter valid distances; maximum cannot be lower than minimum.'); ok = false; } } } if (v.from && v.to) { var fromTime = R.parseReportDate(v.from), toTime = R.parseReportDate(v.to); if (Number.isNaN(fromTime) || Number.isNaN(toTime)) { R.showError('to', 'Enter valid date values.'); ok = false; } else if (fromTime > toTime) { R.showError('to', 'Date To cannot be earlier than Date From.'); ok = false; } } return ok; };
    R.validateReportDates = R.validateForm; R.validateForm = function () { var valid = R.validateReportDates(), d = R.state.report, hasFuture = false, check = function (name, value) { if (String(value || '').trim() && R.isFutureReportDate(value)) { R.showError(name, 'Future date/time cannot be selected.'); hasFuture = true; } }; (d.fields || []).forEach(function (f) { if (f.type === 'date' || f.type === 'datetime-local') check(f.name, R.values()[f.name]); }); if (d.requiresDateRange) { check('start', $('#reportField_start').val()); check('end', $('#reportField_end').val()); } return valid && !hasFuture; };
    R.buildPayload = function (page) { var d = R.state.report, v = R.values(), start = d.alertStartDate || ((d.requiresDateRange && $('#reportField_start').length) ? $('#reportField_start').val().replace('T', ' ') : null), end = d.alertEndDate || ((d.requiresDateRange && $('#reportField_end').length) ? $('#reportField_end').val().replace('T', ' ') : null), selectedVehicleList = function () { return $('.report-vehicle-check:checked').map(function () { return String(this.value).trim(); }).get().filter(Boolean).join(','); }, selectedColumnList = function () { return d.columns.filter(function (c) { return $('.report-column-check[value="' + c.replace(/"/g, '\\"') + '"]').is(':checked'); }).join(', '); }; if (d.legacyDriverPerformance) return { columns: selectedColumnList(), start_date: start, end_date: end, timezoneDiff: '330', page: String(page || 1), per_page: '1000' }; if (d.alertSummary) return { reportType: d.endpointType, alertId: d.alertId, startDate: start, endDate: end, page: String(page || 1), perPage: String(R.state.perPage || 10), vehicleList: d.alertVehicleList || '' }; if (d.id === 'student-notification') return { selectedValues: v.selectedValues ? [v.selectedValues] : [], from: v.from, to: v.to }; if (d.source === 'trackofy') return { reportType: d.endpointType, alertId: d.alertId || null, columns: d.payloadColumns || selectedColumnList(), vehicleList: selectedVehicleList(), startDate: start, endDate: end, minDistance: d.requiresDistanceRange ? $('#reportField_minDistance').val() : '0', maxDistance: d.requiresDistanceRange ? $('#reportField_maxDistance').val() : '0', page: String(page || 1), perPage: String(R.state.perPage || 10), timezoneDiff: String(-new Date().getTimezoneOffset()) }; return v; };
    R.buildTemperaturePayload = function (page) { var v = R.values(), selectedColumns = $('.report-column-check:checked').map(function () { return String(this.value).trim(); }).get(); return { columns: selectedColumns.join(', '), vehicleList: $('.report-vehicle-check:checked').map(function () { return String(this.value).trim(); }).get()[0] || '', startDate: v.temperatureStartDate + ' ' + v.temperatureStartTime, endDate: v.temperatureEndDate + ' ' + v.temperatureEndTime, page: Number(page || 1), perPage: Number(R.state.perPage || 10) }; };
    // UI helpers: popup, no-data notification and empty-result check
    R.showPopup = function (icon, title, message) {
        if (window.Swal) {
            // Use SweetAlert2 when available for a nicer UX
            Swal.fire({
                icon: icon,
                title: title,
                text: message || '',
                confirmButtonColor: 'midnightblue'
            });
        }
        else {
            // Fallback to browser alert
            window.alert((title ? title + ': ' : '') + (message || ''));
        }
    };

    R.showNoData = function () {
        if (window.Swal) {
            Swal.fire('No data found');
        }
        else {
            window.alert('No data found');
        }
    };

    R.hasNoData = function (result) {

        if (!result) {
            return true;
        }

        var rows = Array.isArray(result.rows)
            ? result.rows
            : [];

        var message = String(
            result.message || ''
        ).toLowerCase();

        return (
            rows.length === 0 ||
            message.includes('data not found') ||
            message.includes('no data found') ||
            message.includes('no record') ||
            message.includes('no notification')
        );
    };
    R.generateReport = function () { var d = R.state.report; if (d.resultType === 'unavailable') { R.showPopup('error', 'Report unavailable', d.emptyState); return; } if (d.noPayload) { R.goToPage(1, true); return; } if (!R.validateForm()) return; R.goToPage(1, true); };
    R.goToPage = function (page, fromDrawer, dataTableCallback, background) {

        var d = R.state.report;
        var payload = R.buildPayload(page);

        R.state.lastPayload = payload;
        R.cancelRequest();

        var requestId = ++R.state.requestSequence;

        if (!background) R.setLoading(true);

        var ajaxOptions = {
            url: d.endpoint,
            type: d.method || 'POST'
        };

        if (!d.noPayload) {
            ajaxOptions.data =
                d.contentType === 'json'
                    ? JSON.stringify(payload)
                    : payload;
        }

        if (d.contentType === 'json') {
            ajaxOptions.dataType = 'json';
            ajaxOptions.contentType =
                'application/json; charset=utf-8';
        }

        if (
            d.source === 'trackofy' &&
            d.contentType === 'json'
        ) {
            ajaxOptions.headers = {
                RequestVerificationToken:
                    $('input[name="__RequestVerificationToken"]').val()
            };
        }

        R.state.request = $.ajax(ajaxOptions)

            .done(function (response) {

                if (requestId !== R.state.requestSequence) {
                    return;
                }

                if (typeof dataTableCallback === 'function') {
                    var normalized = R.normalize(response);
                    if (normalized.success) {
                        R.state.page = Number(normalized.meta.page || page);
                        R.state.perPage = Number(normalized.meta.per_page || R.state.perPage);
                        R.state.meta = normalized.meta;
                        R.state.currentRows = normalized.rows;
                    }
                    dataTableCallback(normalized);
                    return;
                }

                R.handleSuccess(response, page, fromDrawer);
            })

            .fail(function (xhr, status) {

                if (
                    status === 'abort' ||
                    requestId !== R.state.requestSequence
                ) {
                    return;
                }

                var response =
                    xhr.responseJSON ||
                    R.parseJson(xhr.responseText) ||
                    {};

                var message = String(
                    response.message ||
                    response.Message ||
                    xhr.responseText ||
                    ''
                ).trim();

                var lowerMessage =
                    message.toLowerCase();

                var records =
                    R.getApiRecords(response);

                var isStudentNotification =
                    d &&
                    d.id === 'student-notification';

                var isNoDataResponse =
                    records.length === 0 &&
                    (
                        lowerMessage.includes('data not found') ||
                        lowerMessage.includes('no data found') ||
                        lowerMessage.includes('no record') ||
                        lowerMessage.includes('no notification') ||
                        response.status === false ||
                        response.success === false ||
                        xhr.status === 204
                    );

                /*
                 * A no-data response is not a system error.
                 * Show the empty table instead of
                 * "Unable to generate".
                 */
                if (
                    isStudentNotification &&
                    isNoDataResponse
                ) {
                    R.handleSuccess(
                        {
                            status: true,
                            success: true,
                            message: 'No data found',
                            data: [],
                            response: []
                        },
                        page,
                        fromDrawer
                    );

                    return;
                }

                if (typeof dataTableCallback === 'function') {
                    dataTableCallback({ success: false, rows: [], meta: R.state.meta || {}, message: message || 'Unable to load the selected report page.' });
                    return;
                }

                if (xhr.status === 401) {
                    R.showResult({
                        success: false,
                        message:
                            'Session expired. Please log in again.'
                    });

                    return;
                }

                R.showResult({
                    success: false,
                    message:
                        message ||
                        'Unable to generate the selected report.'
                });
            })

            .always(function () {

                if (!background && requestId === R.state.requestSequence) {
                    R.setLoading(false);
                }
            });
    };
    R.cancelRequest = function () { if (R.state.request) { R.state.request.abort(); R.state.request = null; } R.state.requestSequence++; }; R.setLoading = function (x) { var b = $('#generateReportBtn'); b.prop('disabled', x).find('.button-label').text(x ? 'Generating...' : 'Generate Report'); b.find('.spinner-border').remove(); if (x) b.prepend('<span class="spinner-border spinner-border-sm me-2"></span>'); };
    R.parseJson = function (x) { if (typeof x === 'string') { try { return JSON.parse(x); } catch (e) { return null; } } return x; };
    R.getApiRecords = function (response) { response = R.parseJson(response); if (!response) return []; if (Array.isArray(response)) return response; if (Array.isArray(response.response)) return response.response; if (Array.isArray(response.data)) return response.data; if (response.data && Array.isArray(response.data.response)) return response.data.response; return []; };
    R.normalize = function (raw) {

        var response =
            R.parseJson(raw) || {};

        var parsedData =
            R.parseJson(response.data);

        var message = String(
            response.message ||
            response.Message ||
            ''
        ).trim();

        var lowerMessage =
            message.toLowerCase();

        var rows =
            R.getApiRecords(response);

        var isNoData =
            rows.length === 0 ||
            lowerMessage.includes('data not found') ||
            lowerMessage.includes('no data found') ||
            lowerMessage.includes('no record') ||
            lowerMessage.includes('no notification');

        /*
         * status:false with a no-data message must be treated
         * as a valid empty result, not an API failure.
         */
        var isRealError =
            (
                response.status === false ||
                response.success === false
            ) &&
            !isNoData;

        var meta =
            (
                parsedData &&
                parsedData.meta
            ) ||
            response.meta ||
            {};

        var apiTotal =
            meta.total ??
            response.total ??
            (parsedData && parsedData.total) ??
            rows.length;

        var apiPage =
            meta.page ??
            meta.current_page ??
            response.page ??
            (parsedData && (parsedData.page ?? parsedData.current_page)) ??
            R.state.page;

        var apiPerPage =
            meta.per_page ??
            meta.perPage ??
            response.per_page ??
            (parsedData && (parsedData.per_page ?? parsedData.perPage)) ??
            R.state.perPage;

        meta = $.extend({}, meta, {
            page: Number(apiPage) || 1,
            per_page: Number(apiPerPage) || 10,
            total: Number(apiTotal) || 0
        });

        if (!meta.last_page && !meta.lastPage) {
            meta.last_page = Math.max(1, Math.ceil(meta.total / meta.per_page));
        }

        return {
            success: !isRealError,
            empty: isNoData,
            rows: rows,
            meta: meta,
            message: message
        };
    };
    R.handleSuccess = function (raw, page, fromDrawer) { var n = R.normalize(raw); if (!n.success) { R.showResult(n); return; } R.state.page = Number(n.meta.page || page); R.state.perPage = Number(n.meta.per_page || R.state.perPage); R.state.meta = n.meta; R.state.currentRows = n.rows; R.showResult(n); if (fromDrawer) R.state.drawer.hide(); };
    R.showResult = function (result) {

        var report = R.state.report;

        if (report && report.temperatureReport) {
            R.renderTemperatureResult(result);
            return;
        }
        if (report && report.idleSummaryReport) {
            R.renderIdleSummaryResult(result);
            return;
        }

        R.destroyDataTable();
        R.destroyChart();

        $('#reportResultLoading')
            .addClass('d-none')
            .hide();

        $('#reportResultError')
            .addClass('d-none')
            .hide()
            .empty();

        $('#reportResultEmpty')
            .addClass('d-none')
            .hide()
            .empty();

        $('#reportApiPager')
            .addClass('d-none')
            .hide();

        if (!result || !result.success) {

            R.showPopup(
                'error',
                'Report error',
                result && result.message
                    ? result.message
                    : 'Unable to generate the selected report.'
            );

            return;
        }

        if (R.hasNoData(result) && (!report || report.id !== 'student-notification')) {
            R.showNoData();
            return;
        }

        var title =
            report.alertSummary
                ? (
                    (report.alertName || 'Alert') +
                    ' Alerts — ' +
                    (report.alertUnit || 'Unit')
                )
                : report.title;

        var rows =
            Array.isArray(result.rows)
                ? result.rows
                : [];

        $('#reportResultTitle').text(title);

        var resultTotal = result.meta && result.meta.total != null
            ? Number(result.meta.total)
            : rows.length;

        $('#reportResultSummary').text(
            rows.length
                ? (
                    resultTotal +
                    ' records • Generated ' +
                    new Date().toLocaleString()
                )
                : 'No data found'
        );

        $('#backToAlerts').toggleClass(
            'd-none',
            !report.alertSummary
        );

        R.state.modal.show();

        R.resetResultTableContainer();

        $('#reportTableWrap')
            .removeClass('d-none')
            .show();

        /*
         * Render the DataTable even when rows are empty.
         * DataTables will show "Data not found".
         */
        R.renderTable(rows);

        if (rows.length && report.source !== 'trackofy') {
            R.renderPager(result.meta || {});
        }

        setTimeout(function () {
            R.adjustReportTable();
        }, 200);
    };
    R.columnDefinitions = function (d, rows) {

        var selected = $('.report-column-check:checked')
            .map(function () {
                return String(this.value);
            })
            .get();

        /*
         * School Transport reports do not render column checkboxes.
         * In that case, use all columns configured in the report definition.
         */
        var hasColumnSelector =
            $('.report-column-check').length > 0;

        var isSelected = function (name) {
            return !hasColumnSelector ||
                selected.indexOf(String(name)) > -1;
        };

        if (d.specialRenderer === 'dynamic-dates') {

            var dynamicColumns = [];

            if (isSelected('Units')) {
                dynamicColumns.push({
                    title: 'Units',
                    data: 'Units'
                });
            }

            if (isSelected('Dates')) {

                var keys = [];

                rows.forEach(function (row) {
                    Object.keys(row.Dates || {}).forEach(function (key) {
                        if (keys.indexOf(key) < 0) {
                            keys.push(key);
                        }
                    });
                });

                dynamicColumns = dynamicColumns.concat(
                    keys.map(function (key) {
                        return {
                            title: key,
                            data: key,
                            dynamicDate: true
                        };
                    })
                );
            }

            return dynamicColumns;
        }

        var columns;

        if (d.columnMappings) {
            columns = d.columnMappings.filter(function (column) {
                return isSelected(column.data) ||
                    isSelected(column.title);
            });
        }
        else {
            columns = (d.columns || Object.keys(rows[0] || {}))
                .filter(function (column) {
                    return isSelected(column);
                });
        }

        return columns.map(function (column) {
            return typeof column === 'string'
                ? {
                    title: column,
                    data: column
                }
                : {
                    title: column.title,
                    data: column.data
                };
        });
    };
    R.getRowValue = function (row, key) { if (key === 'Units') return row.Units; if (row && Object.prototype.hasOwnProperty.call(row, key)) return row[key]; var wanted = String(key).replace(/[_\s]/g, '').toLowerCase(); var found = row && Object.keys(row).filter(function (k) { return k.replace(/[_\s]/g, '').toLowerCase() === wanted; })[0]; return found === undefined ? undefined : row[found]; };
    R.engineLocationValue = function (row, prefix, fallback) {
        var lat = R.getRowValue(row, prefix + ' Lat'), lon = R.getRowValue(row, prefix + ' Long');

        // Engine-hour responses use first_lat/first_long and last_lat/last_long.
        if (prefix === 'Start' && (lat === undefined || lat === null || String(lat).trim() === '' || lon === undefined || lon === null || String(lon).trim() === '')) {
            lat = R.getRowValue(row, 'first_lat');
            lon = R.getRowValue(row, 'first_long');
        }
        if (prefix === 'End' && (lat === undefined || lat === null || String(lat).trim() === '' || lon === undefined || lon === null || String(lon).trim() === '')) {
            lat = R.getRowValue(row, 'last_lat');
            lon = R.getRowValue(row, 'last_long');
        }

        if (lat === undefined || lat === null || String(lat).trim() === '' || lon === undefined || lon === null || String(lon).trim() === '') { return fallback; }
        return String(lat).trim() + ', ' + String(lon).trim();
    };
    R.haltLocationValue = function (row, fallback) {
        var latitude = R.getRowValue(row, 'halt_latitude'), longitude = R.getRowValue(row, 'halt_longitude');
        if (latitude === undefined || latitude === null || String(latitude).trim() === '' || longitude === undefined || longitude === null || String(longitude).trim() === '') {
            return fallback;
        }
        return String(latitude).trim() + ', ' + String(longitude).trim();
    };
    R.normalizeLocationKey = function (key) { return String(key || '').replace(/[^a-z0-9]/gi, '').toLowerCase(); };
    R.coordinateColumnPart = function (key) {
        var normalizedKey = R.normalizeLocationKey(key), match = normalizedKey.match(/^(.*?)(latitude|longitude|lat|long|lng)$/);
        return match ? { prefix: match[1], part: match[2] } : null;
    };
    R.coordinatePairForColumn = function (row, key) {
        if (!row || typeof row !== 'object') return null;
        var current = R.coordinateColumnPart(key);
        if (!current) return null;
        var normalized = {};
        Object.keys(row).forEach(function (rowKey) { normalized[R.normalizeLocationKey(rowKey)] = rowKey; });
        var latitudeKey = normalized[current.prefix + 'latitude'] || normalized[current.prefix + 'lat'];
        var longitudeKey = normalized[current.prefix + 'longitude'] || normalized[current.prefix + 'long'] || normalized[current.prefix + 'lng'];
        if (!latitudeKey || !longitudeKey) return null;
        var coordinates = R.parseCoordinates(row[latitudeKey] + ',' + row[longitudeKey]);
        return coordinates ? { coordinates: coordinates, latitudeKey: latitudeKey, longitudeKey: longitudeKey, part: current.part } : null;
    };
    R.locationColumnValue = function (row, key, fallback) {
        if (R.parseCoordinates(fallback)) return fallback;
        var pair = R.coordinatePairForColumn(row, key);
        return pair ? pair.coordinates.latitude + ', ' + pair.coordinates.longitude : fallback;
    };
    R.isLocationColumn = function (key) {
        var text = String(key || '');
        return /location|coordinates|lat\s*\/?\s*(?:long|lng)|latitude|longitude/i.test(text) || !!R.coordinateColumnPart(text);
    };
    R.parseCoordinates = function (value) {
        if (value === null || value === undefined) return null;
        var text = String(value).trim();
        if (!text) return null;
        var parts = text.split(/[,\|/]/).map(function (part) { return part.trim(); }).filter(Boolean);
        if (parts.length !== 2 || !/^\-?\d+(?:\.\d+)?$/.test(parts[0]) || !/^\-?\d+(?:\.\d+)?$/.test(parts[1])) {
            parts = (text.match(/-?\d+(?:\.\d+)?/g) || []).slice(0, 2);
        }
        if (parts.length !== 2) return null;
        var latitude = Number(parts[0]), longitude = Number(parts[1]);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
        return { latitude: latitude, longitude: longitude, key: latitude.toFixed(6) + ',' + longitude.toFixed(6) };
    };
    R.getResolvedAddress = function (row, coordinates) {
        if (!coordinates) return '';
        if (row && row.__resolvedAddresses && row.__resolvedAddresses[coordinates.key]) return row.__resolvedAddresses[coordinates.key];
        var cached = R.state.addressCache[coordinates.key];
        return typeof cached === 'string' ? cached : '';
    };
    R.setResolvedAddress = function (row, coordinates, address) {
        if (!row || !coordinates || !address) return;
        if (!row.__resolvedAddresses) {
            Object.defineProperty(row, '__resolvedAddresses', { value: {}, writable: true, configurable: true, enumerable: false });
        }
        row.__resolvedAddresses[coordinates.key] = address;
    };
    R.loadAddress = function (latitude, longitude) {
        var coordinates = R.parseCoordinates(latitude + ',' + longitude);
        if (!coordinates) return Promise.resolve('');
        var cached = R.state.addressCache[coordinates.key];
        if (typeof cached === 'string') return Promise.resolve(cached);
        if (cached && typeof cached.then === 'function') return cached;
        var addressUrl = urls.address || '/schoolbuddy/Home/address';
        if (!addressUrl.startsWith('/') && !addressUrl.startsWith('http')) {
            addressUrl = '/' + addressUrl; // fallback safety
        }
        console.debug('[SchoolBuddyReports] Executing AJAX request to:', addressUrl, 'for', coordinates);
        var request = Promise.resolve($.ajax({ url: addressUrl, type: 'GET', data: { latitude: coordinates.latitude, longitude: coordinates.longitude } }))
            .then(function (address) {
                if (address && typeof address === 'object') address = address.address || address.Address || address.data || '';
                if (typeof address === 'string') {
                    var text = address.trim();
                    try { var parsed = JSON.parse(text); if (Array.isArray(parsed)) address = parsed[0] && Array.isArray(parsed[0]) ? parsed[0][0] : parsed[0]; else if (parsed && typeof parsed === 'object') address = parsed.address || parsed.Address || parsed.data || text; } catch (e) { address = text; }
                }
                address = String(address || '').trim();
                if (address === '0') address = '';
                if (address) R.state.addressCache[coordinates.key] = address; else delete R.state.addressCache[coordinates.key];
                return address;
            })
            .catch(function (xhr, status, error) {
                console.error('[SchoolBuddyReports] Address request failed.', {
                    url: addressUrl,
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                    status: status,
                    error: error,
                    httpStatus: xhr && xhr.status
                });
                delete R.state.addressCache[coordinates.key];
                return '';
            });
        R.state.addressCache[coordinates.key] = request;
        return request;
    };
    R.renderLocation = function (value, row) {

        if (value === null || value === undefined || String(value).trim() === '') {
            return '';
        }

        var location = String(value).trim();
        var coordinates = R.parseCoordinates(location);

        if (!coordinates) {
            return R.escapeHtml(location);
        }

        var address = R.getResolvedAddress(row, coordinates);

        if (address) {
            return '<span class="report-location-display">' +
                '<i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ' +
                R.escapeHtml(address) +
                '</span>';
        }

        return '<span class="report-location-value" data-address-key="' + coordinates.key + '">' +
            '<button type="button" ' +
            'class="report-load-address btn btn-link p-0" ' +
            'data-latitude="' + coordinates.latitude + '" ' +
            'data-longitude="' + coordinates.longitude + '" ' +
            'title="Load address" ' +
            'style="color: midnightblue; font-size: 1.25rem; text-decoration: none; cursor: pointer;">' +
            '<i class="bi bi-geo-alt" aria-hidden="true"></i>' +
            '</button>' +
            '</span>';
    };
    R.findDataTableRow = function ($element) {
        if (!R.state.table) return { rowApi: null, row: null };
        var $row = $element.closest('tr');
        if ($row.hasClass('child')) $row = $row.prev();
        var rowApi = R.state.table.row($row);
        var row = rowApi && rowApi.data ? rowApi.data() : null;
        return { rowApi: rowApi, row: row };
    };
    R.fillVisibleAddress = function (coordinates, address) {
        $('[data-address-key="' + coordinates.key + '"].report-location-value').each(function () {
            var $location = $(this);
            $location.html('<span class="report-location-display"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ' + R.escapeHtml(address) + '</span>');
        });
    };
    R.loadAddressForCell = function (button, lat, lng, key) {
        try {
            var $button = $(button);
            if ($button.prop('disabled')) return;
            $button.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-label="Loading address"></span>');
            
            var tableRow = R.findDataTableRow($button), rowApi = tableRow.rowApi, row = tableRow.row;
            var coordinates = { latitude: lat, longitude: lng, key: key };
            
            console.debug('[SchoolBuddyReports] Calling address API directly for cell.', coordinates);
            R.loadAddress(lat, lng).then(function (address) {
                if (address) {
                    R.fillVisibleAddress(coordinates, address);
                    if (row) {
                        R.setResolvedAddress(row, coordinates, address);
                        if (rowApi) rowApi.data(row).invalidate('data').draw(false);
                    }
                } else {
                    $button.prop('disabled', false).html('<i class="bi bi-geo-alt" aria-hidden="true"></i>');
                    console.warn('[SchoolBuddyReports] Address API returned an empty address.', coordinates);
                    R.showPopup('warning', 'Address unavailable', 'No address was found for this location.');
                }
            }).catch(function (error) {
                console.error('[SchoolBuddyReports] loadAddressForCell API caught an error:', error);
                $button.prop('disabled', false).html('<i class="bi bi-geo-alt" aria-hidden="true"></i>');
            });
        } catch (e) {
            console.error('[SchoolBuddyReports] loadAddressForCell crashed synchronously:', e);
            $(button).prop('disabled', false).html('<i class="bi bi-geo-alt" aria-hidden="true"></i>');
        }
    };
    R.handleReportRowClick = function (e) {
        var target = e.target;
        if (target && target.closest && target.closest('a,button,input,select,textarea,label,.dt-button,.dataTables_empty,.dt-empty')) return;
        var tableRow = R.findDataTableRow($(this)), rowApi = tableRow.rowApi, row = tableRow.row;
        if (!row) return;
        var coordinatesList = R.collectRowCoordinates(row).filter(function (coordinates) {
            return !R.getResolvedAddress(row, coordinates);
        });
        if (!coordinatesList.length) return;
        var $row = $(this);
        $row.find('.report-load-address').prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-label="Loading address"></span>');
        Promise.all(coordinatesList.map(function (coordinates) {
            return R.loadAddress(coordinates.latitude, coordinates.longitude).then(function (address) {
                if (!address) return;
                R.setResolvedAddress(row, coordinates, address);
                R.fillVisibleAddress(coordinates, address);
            });
        })).then(function () {
            if (rowApi) rowApi.data(row).invalidate('data').draw(false);
        }).catch(function () {
            $row.find('.report-load-address').prop('disabled', false).html('<i class="bi bi-geo-alt" aria-hidden="true"></i>');
        });
    };
    R.formatReportValue = function (d, key, value, type, row) { if (key === 'Playback' && (!value || typeof value !== 'object' || Object.keys(value).length === 0)) return type === 'display' ? '<span class="report-na">N/A</span>' : 'N/A'; if (R.isEmptyValue(value)) return type === 'display' ? '<span class="report-na">N/A</span>' : 'N/A'; var clean = typeof value === 'string' ? value.trim() : value; if (R.isLocationColumn(key)) { if (typeof clean === 'object') clean = JSON.stringify(clean); var coordinates = R.parseCoordinates(clean), resolved = R.getResolvedAddress(row, coordinates); if (type === 'display') return R.renderLocation(clean, row); return resolved || clean; } if (type === 'sort' || type === 'type') { if (/count/i.test(key) && !Number.isNaN(Number(clean))) return Number(clean); if (/date|time/i.test(key)) { var parsed = Date.parse(clean); if (!Number.isNaN(parsed)) return parsed; } return clean; } if (typeof clean === 'object') clean = key === 'Playback' ? 'Unavailable' : JSON.stringify(clean); if (type === 'export') return clean; if (d.format === 'alerts' && key === 'Count') return type === 'display' ? R.escapeHtml(clean) : Number(clean); if (d.format === 'engine-hour' && key === 'Status') return '<span class="badge text-bg-secondary">' + R.escapeHtml(clean) + '</span>'; if (/distance|total distance/i.test(key) && !Number.isNaN(Number(clean))) return R.escapeHtml(clean) + ' km'; if (/speed/i.test(key) && !Number.isNaN(Number(clean))) return R.escapeHtml(clean) + ' km/h'; if (key === 'Messages' && type === 'display') return '<span class="report-message-cell">' + R.escapeHtml(clean) + '</span>'; return R.escapeHtml(clean); };
    R.openDistanceChart = function (row) {
        if (!window.Chart || !row) return;
        var dates = row.Dates || {}, keys = Object.keys(dates), isMaxSpeed = R.state.report && R.state.report.id === 'max-speed-chart';
        if (!keys.length) { R.showPopup('info', 'No chart data', 'No chart data is available for this vehicle.'); return; }
        if (!$('#distanceChartModal').length) $('body').append('<div class="modal fade sb-common-modal report-distance-chart-modal" id="distanceChartModal" tabindex="-1" aria-labelledby="distanceChartModalLabel" aria-hidden="true"><div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="distanceChartModalLabel"></h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div><div class="modal-body"><div class="report-distance-chart-wrap"><canvas id="distanceChartCanvas"></canvas></div></div></div></div></div>');
        if (R.state.distanceChart) { R.state.distanceChart.destroy(); R.state.distanceChart = null; }
        $('#distanceChartModal .modal-title').text((isMaxSpeed ? 'Max Speed Chart - ' : 'Distance Chart - ') + (row.Units || 'Vehicle'));
        R.state.distanceChart = new Chart(document.getElementById('distanceChartCanvas'), { type: 'line', data: { labels: keys, datasets: [{ label: isMaxSpeed ? 'Max Speed (km/h)' : 'Distance (km)', data: keys.map(function (k) { return Number(dates[k]) || 0; }), borderColor: 'midnightblue', backgroundColor: 'rgba(25,25,112,.12)', fill: true, tension: .25 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: isMaxSpeed ? 'Max Speed (km/h)' : 'Distance (km)' } } }, plugins: { legend: { display: true } } } });
        bootstrap.Modal.getOrCreateInstance(document.getElementById('distanceChartModal')).show();
    };


    R.collectRowCoordinates = function (row) {
        if (!row || typeof row !== 'object') return [];
        var found = {}, keys = Object.keys(row), normalized = {};
        keys.forEach(function (key) { normalized[key.replace(/[^a-z0-9]/gi, '').toLowerCase()] = key; var coordinates = R.isLocationColumn(key) ? R.parseCoordinates(row[key]) : null; if (coordinates) found[coordinates.key] = coordinates; });
        keys.forEach(function (key) {
            var normalizedKey = key.replace(/[^a-z0-9]/gi, '').toLowerCase(), match = normalizedKey.match(/^(.*?)(latitude|lat)$/);
            if (!match) return;
            var prefix = match[1], longitudeKey = normalized[prefix + 'longitude'] || normalized[prefix + 'long'] || normalized[prefix + 'lng'];
            if (!longitudeKey) return;
            var coordinates = R.parseCoordinates(row[key] + ',' + row[longitudeKey]);
            if (coordinates) found[coordinates.key] = coordinates;
        });
        return Object.keys(found).map(function (key) { return found[key]; });
    };
    R.resolveRowAddresses = function (rows) {
        var locations = {};
        (rows || []).forEach(function (row) { R.collectRowCoordinates(row).forEach(function (coordinates) { if (!locations[coordinates.key]) locations[coordinates.key] = { coordinates: coordinates, rows: [] }; locations[coordinates.key].rows.push(row); }); });
        return Promise.all(Object.keys(locations).map(function (key) { var entry = locations[key]; return R.loadAddress(entry.coordinates.latitude, entry.coordinates.longitude).then(function (address) { if (address) entry.rows.forEach(function (row) { R.setResolvedAddress(row, entry.coordinates, address); }); }); }));
    };
    R.fetchExportPage = function (page, perPage) {
        var report = R.state.report, payload = $.extend(true, {}, R.state.lastPayload || {});
        if (!report || !report.endpoint) return Promise.resolve([]);
        payload.page = String(page);
        if (Object.prototype.hasOwnProperty.call(payload, 'per_page')) payload.per_page = String(perPage); else payload.perPage = String(perPage);
        var ajaxOptions = { url: report.endpoint, type: report.method || 'POST', data: report.contentType === 'json' ? JSON.stringify(payload) : payload };
        if (report.contentType === 'json') { ajaxOptions.dataType = 'json'; ajaxOptions.contentType = 'application/json; charset=utf-8'; ajaxOptions.headers = { RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val() }; }
        return Promise.resolve($.ajax(ajaxOptions)).then(function (response) { var normalized = R.normalize(response); return normalized.success ? normalized.rows : []; }).catch(function () { return []; });
    };
    R.getRowsForExport = function (dt) {
        var report = R.state.report, total = Number(R.state.meta && R.state.meta.total || 0), isExternal = report && report.source === 'trackofy';
        if (!isExternal || total <= dt.rows().data().count()) return Promise.resolve(dt.rows({ search: 'applied' }).data().toArray());
        var perPage = Math.min(200, Math.max(1, total)), lastPage = Math.max(1, Math.ceil(total / perPage)), requests = [];
        for (var page = 1; page <= lastPage; page++)requests.push(R.fetchExportPage(page, perPage));
        return Promise.all(requests).then(function (pages) { var rows = []; pages.forEach(function (pageRows) { rows = rows.concat(pageRows || []); }); rows = rows.length ? rows : (R.state.currentRows || dt.rows().data().toArray()); var order = dt.order && dt.order(); return R.prepareExternalRows(rows, { search: { value: dt.search ? dt.search() : '' }, order: order && order.length ? [{ column: order[0][0], dir: order[0][1] }] : [] }, R.state.exportColumns || []); });
    };
    R.createExportDataTable = function (rows) {
        if (!R.state.exportColumns || !R.state.exportColumns.length) return null;
        var id = 'reportExportTable_' + Date.now(), $table = $('<table id="' + id + '" class="d-none"><thead></thead><tbody></tbody></table>').appendTo(document.body), table = $table.DataTable({ data: rows, columns: R.state.exportColumns, paging: false, searching: false, ordering: false, info: false, dom: 't' });
        return { table: table, element: $table };
    };
    R.exportWithAddresses = function (e, dt, node, config, done) {
        var $node = $(node), originalHtml = $node.html(), buttonType = config.addressExportType || config.extend, buttons = $.fn.dataTable.ext.buttons, baseButton = buttons && buttons[buttonType], baseAction = baseButton && baseButton.action;
        $node.prop('disabled', true).addClass('disabled').html('<span class="spinner-border spinner-border-sm" role="status" aria-label="Loading addresses"></span>');
        R.getRowsForExport(dt).then(function (rows) { return R.resolveRowAddresses(rows).then(function () { return rows; }); }).then(function (rows) {
            dt.rows().invalidate('data').draw(false);
            var temporary = R.createExportDataTable(rows), exportTable = temporary ? temporary.table : dt;
            if (typeof baseAction === 'function') baseAction.call(this, e, exportTable, node, config, done || function () { });
            if (temporary) setTimeout(function () { temporary.table.destroy(); temporary.element.remove(); }, 1000);
        }.bind(this)).finally(function () { $node.prop('disabled', false).removeClass('disabled').html(originalHtml); });
    };
    R.exportButtons = function (title, excludeLast) { var options = { columns: excludeLast ? ':visible:not(:last-child)' : ':visible' }, button = function (extend, text, titleAttr, className, extra) { return $.extend({ extend: extend, addressExportType: extend, text: text, titleAttr: titleAttr, className: className, title: title, exportOptions: options, action: R.exportWithAddresses }, extra || {}); }; return [button('copyHtml5', '<i class="bi bi-copy" aria-hidden="true"></i>', 'Copy', 'report-export-copy'), button('excelHtml5', '<i class="bi bi-file-earmark-excel-fill" aria-hidden="true"></i>', 'Excel', 'report-export-excel'), button('csvHtml5', '<i class="bi bi-table" aria-hidden="true"></i>', 'CSV', 'report-export-csv'), button('pdfHtml5', '<i class="bi bi-file-earmark-pdf-fill" aria-hidden="true"></i>', 'PDF', 'report-export-pdf', { orientation: 'landscape', pageSize: 'A4' }), button('print', '<i class="bi bi-printer-fill" aria-hidden="true"></i>', 'Print', 'report-export-print')]; };
    R.renderPager = function (m) { var last = Number(m.last_page || m.lastPage || 1), cur = Number(m.current_page || m.page || R.state.page); R.state.page = cur; $('#reportApiPager').toggleClass('d-none', last <= 1).find('span').text('Page ' + cur + ' of ' + last); $('#reportApiPager [data-page-direction="previous"]').prop('disabled', cur <= 1); $('#reportApiPager [data-page-direction="next"]').prop('disabled', cur >= last); };
    R.destroyDataTable = function () {

        var selector = '#reportResultTable';

        try {
            if (
                $.fn.dataTable &&
                $.fn.dataTable.isDataTable(selector)
            ) {
                $(selector)
                    .DataTable()
                    .clear()
                    .destroy();
            }
        }
        catch (error) {
            console.warn(
                'Unable to destroy report DataTable:',
                error
            );
        }

        /*
         * Remove any DataTables wrapper that may remain.
         */
        var wrapper = $('#reportResultTable_wrapper');

        if (wrapper.length) {
            wrapper.replaceWith(
                '<table id="reportResultTable" ' +
                'class="table table-bordered table-hover table-striped ' +
                'report-result-table w-100 align-middle">' +
                '<thead></thead>' +
                '<tbody></tbody>' +
                '</table>'
            );
        }
        else {
            $('#reportTableWrap').html(
                '<table id="reportResultTable" ' +
                'class="table table-bordered table-hover table-striped ' +
                'report-result-table w-100 align-middle">' +
                '<thead></thead>' +
                '<tbody></tbody>' +
                '</table>'
            );
        }

        R.state.table = null;
    };
    R.destroyChart = function () {

        if (R.state.chart) {
            try {
                R.state.chart.destroy();
            }
            catch (error) {
                console.warn(
                    'Unable to destroy report chart:',
                    error
                );
            }

            R.state.chart = null;
        }

        if (R.state.distanceChart) {
            try {
                R.state.distanceChart.destroy();
            }
            catch (error) {
                console.warn(
                    'Unable to destroy distance chart:',
                    error
                );
            }

            R.state.distanceChart = null;
        }

        $('#reportChartWrap')
            .addClass('d-none')
            .hide();

        var chartCanvas =
            document.getElementById('reportChart');

        if (chartCanvas) {
            var context =
                chartCanvas.getContext('2d');

            if (context) {
                context.clearRect(
                    0,
                    0,
                    chartCanvas.width,
                    chartCanvas.height
                );
            }
        }
    };
    R.formatTemperature = function (value) { if (value === null || value === undefined || value === '') return '--'; var numericValue = Number(value); if (Number.isNaN(numericValue)) return '--'; return numericValue.toFixed(1) + ' °C'; };
    R.temperatureLocation = function (value, row) { var rendered = R.renderLocation(value, row); return rendered || '--'; };
    R.temperatureStatus = function (value) { var text = String(value || '').trim(), key = text.toLowerCase(), cls = key === 'running' ? 'text-bg-success' : key === 'idle' ? 'text-bg-warning' : key === 'stopped' ? 'text-bg-danger' : key === 'offline' ? 'text-bg-secondary' : 'text-bg-primary'; return text ? '<span class="badge ' + cls + ' temperature-report-status">' + R.escapeHtml(text) + '</span>' : '--'; };
    R.getCommonTableOptions = function () {
        return {
            scrollX: true,
            scrollY: false,
            scrollCollapse: false,
            autoWidth: false,
            responsive: false,
            fixedHeader: false,
            initComplete: function () {
                R.adjustReportTable();
            }
        };
    };
    R.prepareExternalRows = function (rows, request, columns) {
        var prepared = (rows || []).slice(), search = String(request.search && request.search.value || '').trim().toLowerCase(), cellValue = function (row, column, index, type) { var value; if (typeof column.render === 'function') value = column.render(null, type || 'filter', row, { row: index, col: columns.indexOf(column) }); else value = column.data == null ? row : R.getRowValue(row, column.data); return $('<div>').html(value == null ? '' : String(value)).text(); };
        if (search) prepared = prepared.filter(function (row, index) { return columns.some(function (column) { return cellValue(row, column, index, 'filter').toLowerCase().indexOf(search) > -1; }); });
        var order = request.order && request.order[0];
        if (order && columns[order.column]) { var column = columns[order.column], direction = order.dir === 'desc' ? -1 : 1; prepared.sort(function (left, right) { var a = cellValue(left, column, 0, 'sort'), b = cellValue(right, column, 0, 'sort'), an = Number(a), bn = Number(b); if (a !== '' && b !== '' && Number.isFinite(an) && Number.isFinite(bn)) return (an - bn) * direction; return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }) * direction; }); }
        return prepared;
    };
    R.externalTableAjax = function (initialRows, initialMeta, columns) {
        var firstLoad = true;
        var pageCache = {};
        var initialPage = Number(initialMeta && (initialMeta.page || initialMeta.current_page) || R.state.page || 1);
        var initialPerPage = Number(initialMeta && (initialMeta.per_page || initialMeta.perPage) || R.state.perPage || 10);
        pageCache[initialPage + '|' + initialPerPage] = { rows: initialRows || [], meta: initialMeta || {} };
        return function (request, callback) {
            var requestedPage = Math.floor(request.start / request.length) + 1, cacheKey = requestedPage + '|' + (Number(request.length) || R.state.perPage), deliver = function (rows, meta) { var total = Number(meta && meta.total != null ? meta.total : rows.length), prepared = R.prepareExternalRows(rows, request, columns); R.state.currentRows = rows; callback({ draw: request.draw, data: prepared, recordsTotal: total, recordsFiltered: total }); };
            R.state.perPage = Number(request.length) || R.state.perPage;
            if (firstLoad) { firstLoad = false; R.state.currentRows = initialRows; deliver(initialRows, initialMeta); return; }
            if (pageCache[cacheKey]) { deliver(pageCache[cacheKey].rows, pageCache[cacheKey].meta); return; }
            R.goToPage(requestedPage, false, function (result) {
                if (!result.success) { R.showPopup('error', 'Report error', result.message || 'Unable to load the selected report page.'); deliver([], R.state.meta || initialMeta); return; }
                pageCache[cacheKey] = { rows: result.rows || [], meta: result.meta || {} };
                deliver(result.rows, result.meta);
            }, true);
        };
    };
    R.renderApiDataTable = function (rows, columns, meta, options) {
        options = options || {};
        var total = Number(meta.total == null ? rows.length : meta.total), perPage = Number(meta.per_page || meta.perPage || R.state.perPage || 10);
        R.state.exportColumns = columns;
        R.state.page = Number(meta.page || meta.current_page || R.state.page || 1); R.state.perPage = perPage; R.state.meta = $.extend({}, meta, { total: total, per_page: perPage }); R.state.currentRows = rows;
        R.state.table = $('#reportResultTable').DataTable($.extend({}, R.getCommonTableOptions(), { serverSide: true, processing: true, columns: columns, paging: true, pageLength: perPage, displayStart: Math.max(0, (R.state.page - 1) * perPage), lengthMenu: [[10, 50, 100, 200], [10, 50, 100, 200]], searching: options.searching !== false, ordering: options.ordering !== false, dom: options.dom || '<"report-datatables-toolbar"<"report-datatables-buttons"B><"report-datatables-controls"<"report-datatables-search"f><"report-datatables-length"l>>>rtip', buttons: R.exportButtons(options.title || (R.state.report && R.state.report.title) || 'Report', options.excludeLast), language: $.extend({ emptyTable: 'No data found', zeroRecords: 'No data found', search: '', searchPlaceholder: 'Search...' }, options.language || {}), ajax: R.externalTableAjax(rows, R.state.meta, columns) }));
        return R.state.table;
    };
    R.resetTemperatureKpis = function () { $('#temperatureKpiMin,#temperatureKpiAverage,#temperatureKpiMax').text('--'); $('#temperatureKpiTotal').text('0'); };
    R.parseDurationToMinutes = function (value) { if (!value) return 0; var text = String(value).trim().toLowerCase(), hourMatch = text.match(/(\d+(?:\.\d+)?)\s*h/), minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*m/), hours = hourMatch ? Number(hourMatch[1]) : 0, minutes = minuteMatch ? Number(minuteMatch[1]) : 0; return Math.round((hours * 60) + minutes); };
    R.formatMinutesAsDuration = function (totalMinutes) { var minutes = Number(totalMinutes); if (!Number.isFinite(minutes) || minutes < 0) return '--'; return Math.floor(minutes / 60) + 'h ' + Math.floor(minutes % 60) + 'm'; };
    R.formatDistance = function (value) { if (value === null || value === undefined || value === '') return '--'; var distance = Number(value); return Number.isFinite(distance) ? distance.toFixed(2) + ' km' : '--'; };
    R.idleCoordinates = function (latitude, longitude, row) { if (latitude === null || longitude === null || String(latitude || '').trim() === '' || String(longitude || '').trim() === '') return '--'; return R.renderLocation(Number(latitude).toFixed(5) + ', ' + Number(longitude).toFixed(5), row) || '--'; };
    R.idleDisplay = function (value) { return value === null || value === undefined || String(value).trim() === '' ? '--' : R.escapeHtml(value); };
    R.resetIdleKpis = function () { $('#idleKpiVehicles').text('0'); $('#idleKpiIdle,#idleKpiMaxIdle,#idleKpiDistance,#idleKpiRunning').text('--'); $('#idleKpiFailed').text('0'); };
    R.buildIdleSummaryPayload = function (page) { var v = R.values(); return { startDate: v.idleStartDate + ' ' + v.idleStartTime, endDate: v.idleEndDate + ' ' + v.idleEndTime, page: String(page || 1), perPage: String(R.state.perPage || 10), timezoneDifference: '330', vehicleList: $('.report-vehicle-check:checked').map(function () { return String(this.value).trim(); }).get().filter(Boolean).join(',') }; };
    R.renderIdleSummaryResult = function (n) { R.destroyDataTable(); R.destroyChart(); $('#reportResultTitle').text('Idle Summary Report'); $('#reportResultSummary').text(''); $('#reportResultLoading').hide(); $('#reportResultError').addClass('d-none').empty(); $('#reportResultEmpty').addClass('d-none'); $('#temperatureReportKpis,#idleSummaryNotice').hide(); $('#idleSummaryKpis').show(); if (!n.success) { R.resetIdleKpis(); $('#idleSummaryKpis').hide(); $('#reportResultError').removeClass('d-none').text(n.message || 'Unable to load the idle summary report. Please try again.'); R.state.modal.show(); return; } var rows = n.rows || [], meta = n.meta || {}, successful = rows.filter(function (item) { return !item.error || String(item.error).trim() === ''; }), failed = rows.length - successful.length, totalIdle = successful.reduce(function (total, item) { return total + R.parseDurationToMinutes(item['Total Idle Time']); }, 0), totalRunning = successful.reduce(function (total, item) { return total + R.parseDurationToMinutes(item['Total Running Time']); }, 0), maxIdle = successful.reduce(function (maximum, item) { return Math.max(maximum, R.parseDurationToMinutes(item['Max Idle'])); }, 0), totalDistance = successful.reduce(function (total, item) { var value = Number(item['Total Distance']); return Number.isFinite(value) ? total + value : total; }, 0), totalVehicles = meta.total == null ? rows.length : Number(meta.total); $('#idleKpiVehicles').text(String(totalVehicles)); $('#idleKpiIdle').text(successful.length ? R.formatMinutesAsDuration(totalIdle) : '--'); $('#idleKpiMaxIdle').text(successful.length ? R.formatMinutesAsDuration(maxIdle) : '--'); $('#idleKpiDistance').text(successful.length ? R.formatDistance(totalDistance) : '--'); $('#idleKpiRunning').text(successful.length ? R.formatMinutesAsDuration(totalRunning) : '--'); $('#idleKpiFailed').text(String(failed)); if (failed && successful.length) $('#idleSummaryNotice').text('The report loaded successfully, but data for some vehicles could not be retrieved.').show(); else if (failed && !successful.length) $('#idleSummaryNotice').text('Unable to retrieve idle data for the selected vehicles.').show(); R.state.modal.show(); if (!rows.length) { $('#idleSummaryKpis').show(); $('#reportResultEmpty').removeClass('d-none').text('No idle summary data found for the selected filters.'); $('#reportTableWrap').addClass('d-none'); return; } $('#reportTableWrap').removeClass('d-none'); var page = Number(meta.page || R.state.page || 1), perPage = Number(meta.per_page || R.state.perPage || 10), columns = [{ title: 'S.No', data: null, render: function (_, type, item, index) { return ((page - 1) * perPage) + index.row + 1; } }, { title: 'Service ID', data: null, render: function (_, type, item) { return R.escapeHtml(item.service_id ?? item.sys_service_id ?? '--'); } }, { title: 'Vehicle', data: null, render: function (_, type, item) { return R.escapeHtml(item.Unit ?? item.vehiclename ?? '--'); } }, { title: 'Total Idle Time', data: null, render: function (_, type, item) { return item.error ? '--' : R.idleDisplay(item['Total Idle Time']); } }, { title: 'Total Halt Time', data: null, render: function (_, type, item) { return item.error ? '--' : R.idleDisplay(item['Total Halt Time']); } }, { title: 'Maximum Idle', data: null, render: function (_, type, item) { return item.error ? '--' : R.idleDisplay(item['Max Idle']); } }, { title: 'Start Time', data: null, render: function (_, type, item) { return item.error ? '--' : R.idleDisplay(item['Start Time']); } }, { title: 'End Time', data: null, render: function (_, type, item) { return item.error ? '--' : R.idleDisplay(item['End Time']); } }, { title: 'Total Distance', data: null, render: function (_, type, item) { return item.error ? '--' : R.formatDistance(item['Total Distance']); } }, { title: 'Total Running Time', data: null, render: function (_, type, item) { return item.error ? '--' : R.idleDisplay(item['Total Running Time']); } }, { title: 'Maximum Idle Location', data: null, render: function (_, type, item) { return item.error ? '--' : R.renderLocation(item['Max Idle Location']); } }, { title: 'Coordinates', data: null, render: function (_, type, item) { return item.error ? '--' : R.idleCoordinates(item.idle_latitude, item.idle_longitude); } }, { title: 'Status', data: null, render: function (_, type, item) { return item.error ? '<span class="badge text-bg-danger">Failed</span>' : '<span class="badge text-bg-success">Success</span>'; } }]; R.state.page = page; R.state.perPage = perPage; R.state.table = $('#reportResultTable').DataTable($.extend({}, R.getCommonTableOptions(), { data: rows, columns: columns, searching: false, ordering: true, paging: false, info: false, lengthChange: false, dom: 'rt' })); $('#reportResultTable_wrapper').addClass('idle-summary-table-wrapper'); R.renderPager(meta); var last = Number(meta.last_page || 1), first = ((page - 1) * perPage) + 1, lastRecord = Math.min(page * perPage, Number(meta.total || rows.length)); $('#reportApiPager span').text('Page ' + page + ' of ' + last + ' • ' + (rows.length ? 'records ' + first + '-' + lastRecord + ' of ' + (meta.total == null ? rows.length : meta.total) : '0 records')); };
    R.renderIdleSummaryResult = function (n) {
        R.destroyDataTable(); R.destroyChart();
        $('#reportResultTitle').text('Idle Summary Report'); $('#reportResultSummary').text(''); $('#reportResultLoading').hide(); $('#reportResultError,#reportResultEmpty').addClass('d-none').empty(); $('#reportApiPager,#temperatureReportKpis,#idleSummaryNotice').addClass('d-none').hide(); $('#idleSummaryKpis').show();
        if (!n.success) { R.resetIdleKpis(); $('#idleSummaryKpis').hide(); $('#reportResultError').removeClass('d-none').text(n.message || 'Unable to load the idle summary report. Please try again.'); R.state.modal.show(); return; }
        var rows = n.rows || [], meta = n.meta || {}, successful = rows.filter(function (item) { return !item.error || String(item.error).trim() === ''; }), failed = rows.length - successful.length, totalIdle = successful.reduce(function (total, item) { return total + R.parseDurationToMinutes(item['Total Idle Time']); }, 0), totalRunning = successful.reduce(function (total, item) { return total + R.parseDurationToMinutes(item['Total Running Time']); }, 0), maxIdle = successful.reduce(function (maximum, item) { return Math.max(maximum, R.parseDurationToMinutes(item['Max Idle'])); }, 0), totalDistance = successful.reduce(function (total, item) { var value = Number(item['Total Distance']); return Number.isFinite(value) ? total + value : total; }, 0), totalVehicles = meta.total == null ? rows.length : Number(meta.total);
        $('#idleKpiVehicles').text(String(totalVehicles)); $('#idleKpiIdle').text(successful.length ? R.formatMinutesAsDuration(totalIdle) : '--'); $('#idleKpiMaxIdle').text(successful.length ? R.formatMinutesAsDuration(maxIdle) : '--'); $('#idleKpiDistance').text(successful.length ? R.formatDistance(totalDistance) : '--'); $('#idleKpiRunning').text(successful.length ? R.formatMinutesAsDuration(totalRunning) : '--'); $('#idleKpiFailed').text(String(failed));
        if (failed && successful.length) $('#idleSummaryNotice').text('The report loaded successfully, but data for some vehicles could not be retrieved.').removeClass('d-none').show(); else if (failed && !successful.length) $('#idleSummaryNotice').text('Unable to retrieve idle data for the selected vehicles.').removeClass('d-none').show();
        R.state.modal.show();
        if (!rows.length) { $('#reportResultEmpty').removeClass('d-none').text('No idle summary data found for the selected filters.'); $('#reportTableWrap').addClass('d-none'); return; }
        $('#reportTableWrap').removeClass('d-none').show();
        var columns = [
            { title: 'S.No', data: null, render: function (_, type, item, index) { return ((R.state.page - 1) * R.state.perPage) + index.row + 1; } },
            { title: 'Service ID', data: null, render: function (_, type, item) { return R.escapeHtml(item.service_id ?? item.sys_service_id ?? '--'); } },
            { title: 'Vehicle', data: null, render: function (_, type, item) { return R.escapeHtml(item.Unit ?? item.vehiclename ?? '--'); } },
            { title: 'Total Idle Time', data: null, render: function (_, type, item) { return item.error ? '--' : R.idleDisplay(item['Total Idle Time']); } },
            { title: 'Total Halt Time', data: null, render: function (_, type, item) { return item.error ? '--' : R.idleDisplay(item['Total Halt Time']); } },
            { title: 'Maximum Idle', data: null, render: function (_, type, item) { return item.error ? '--' : R.idleDisplay(item['Max Idle']); } },
            { title: 'Start Time', data: null, render: function (_, type, item) { return item.error ? '--' : R.idleDisplay(item['Start Time']); } },
            { title: 'End Time', data: null, render: function (_, type, item) { return item.error ? '--' : R.idleDisplay(item['End Time']); } },
            { title: 'Total Distance', data: null, render: function (_, type, item) { return item.error ? '--' : R.formatDistance(item['Total Distance']); } },
            { title: 'Total Running Time', data: null, render: function (_, type, item) { return item.error ? '--' : R.idleDisplay(item['Total Running Time']); } },
            { title: 'Maximum Idle Location', data: null, render: function (_, type, item) { return item.error ? '--' : R.renderLocation(item['Max Idle Location'], item); } },
            { title: 'Coordinates', data: null, render: function (_, type, item) { return item.error ? '--' : R.idleCoordinates(item.idle_latitude, item.idle_longitude, item); } },
            { title: 'Status', data: null, render: function (_, type, item) { return item.error ? '<span class="badge text-bg-danger">Failed</span>' : '<span class="badge text-bg-success">Success</span>'; } }
        ];
        R.renderApiDataTable(rows, columns, meta, { title: 'Idle Summary Report', searching: false, ordering: true });
        $('#reportResultTable_wrapper').addClass('idle-summary-table-wrapper');
    };
    R.resetResultTableContainer = function () {

        $('#reportTableWrap')
            .removeAttr('style')
            .addClass('d-none');

        R.destroyDataTable();
    };
    R.renderTable = function (rows) {

        var report = R.state.report;

        var definitions =
            R.columnDefinitions(
                report,
                rows
            );

        var hasAlertAction =
            report.actions &&
            report.actions.indexOf(
                'alert-summary'
            ) > -1;

        if (report.id === 'distance-chart' || report.id === 'max-speed-chart') {
            definitions.push({
                title: 'Chart',
                data: '__chart'
            });
        }

        if (hasAlertAction) {
            definitions.push({
                title: 'View Summary',
                data: '__action'
            });
        }

        var languageOptions = {
            emptyTable: 'No data found',
            zeroRecords: 'No data found',
            search: '',
            searchPlaceholder: 'Search...'
        };
        var tableColumns = definitions.map(
            function (column) {

                return {
                    title: column.title,
                    data: null,

                    createdCell: function (cell) {
                        cell.setAttribute(
                            'data-column',
                            column.title
                        );
                    },

                    render: function (
                        value,
                        type,
                        row,
                        meta
                    ) {

                        if (
                            column.data ===
                            '__action'
                        ) {
                            return type === 'display'
                                ? (
                                    '<button type="button" ' +
                                    'class="btn btn-sm btn-outline-primary report-alert-summary" ' +
                                    'data-row-index="' +
                                    meta.row +
                                    '">' +
                                    'View Summary' +
                                    '</button>'
                                )
                                : '';
                        }

                        if (
                            column.data ===
                            '__chart'
                        ) {
                            return type === 'display'
                                ? (
                                    '<button type="button" ' +
                                    'class="btn btn-sm btn-outline-primary report-distance-chart" ' +
                                    'title="View chart" ' +
                                    'data-row-index="' +
                                    meta.row +
                                    '">' +
                                    '<i class="bi bi-bar-chart-line"></i>' +
                                    '</button>'
                                )
                                : '';
                        }

                        var cellValue =
                            column.dynamicDate
                                ? (
                                    (
                                        row.Dates ||
                                        {}
                                    )[column.data]
                                )
                                : report.format === 'engine-hour' && column.data === 'Start Location'
                                    ? R.engineLocationValue(row, 'Start', R.getRowValue(row, column.data))
                                    : report.format === 'engine-hour' && column.data === 'End Location'
                                        ? R.engineLocationValue(row, 'End', R.getRowValue(row, column.data))
                                        : report.format === 'stoppage' && column.data === 'Max Halt Location'
                                            ? R.haltLocationValue(row, R.getRowValue(row, column.data))
                                            : R.getRowValue(row, column.data);

                        if (R.isLocationColumn(column.data)) {
                            cellValue = R.locationColumnValue(
                                row,
                                column.data,
                                cellValue
                            );
                        }

                        return R.formatReportValue(
                            report,
                            column.data,
                            cellValue,
                            type,
                            row
                        );
                    }
                };
            }
        );

        var usesExternalPagination =
            report.source === 'trackofy';

        R.state.exportColumns = tableColumns;

        var tableOptions = {
            data: rows,
            columns: tableColumns,

            searching: true,
            ordering: true,

            paging: true,

            pageLength: 10,

            lengthMenu: [
                [10, 50, 100, 200],
                [10, 50, 100, 200]
            ],

            lengthChange: true,

            dom:
                '<"report-datatables-toolbar"' +
                '<"report-datatables-buttons"B>' +
                '<"report-datatables-controls"' +
                '<"report-datatables-search"f>' +
                '<"report-datatables-length"l>' +
                '>' +
                '>' +
                'rtip',

            buttons:
                R.exportButtons(
                    report.title,
                    hasAlertAction
                ),

            language: languageOptions
        };

        var table = usesExternalPagination
            ? R.renderApiDataTable(rows, tableColumns, R.state.meta || {}, {
                title: report.title,
                excludeLast: hasAlertAction,
                searching: true,
                ordering: true,
                language: languageOptions
            })
            : $('#reportResultTable').DataTable(
                $.extend({}, R.getCommonTableOptions(), tableOptions)
            );

        R.state.table = table;

        table.columns.adjust();

        table
            .off('length.reportPageSize')
            .on(
                'length.reportPageSize',
                function (
                    event,
                    settings,
                    length
                ) {
                    R.adjustReportTable();
                    if (
                        report.source ===
                        'trackofy' &&
                        !usesExternalPagination &&
                        Number(length) !==
                        Number(R.state.perPage)
                    ) {
                        R.state.perPage =
                            Number(length);

                        R.goToPage(
                            1,
                            false
                        );
                    }
                }
            );

        if (
            report.specialRenderer ===
            'dynamic-dates'
        ) {
            R.renderChart(rows);
        }
    };
    R.adjustReportTable = function () {

        if (
            !$.fn.dataTable ||
            !$.fn.dataTable.isDataTable('#reportResultTable')
        ) {
            return;
        }

        var table = $('#reportResultTable').DataTable();

        table.columns.adjust();

        if (table.fixedHeader) {
            table.fixedHeader.adjust();
        }
    };
    R.renderTemperatureResult = function (n) {
        R.resetResultTableContainer(); R.destroyChart(); $('#reportResultTitle').text('Temperature Report'); $('#reportResultSummary').text(''); $('#reportResultLoading').addClass('d-none').hide(); $('#reportResultError').addClass('d-none').hide().empty(); $('#reportResultEmpty').addClass('d-none').hide().empty(); $('#reportApiPager').addClass('d-none').hide(); $('#temperatureReportKpis').show(); $('#idleSummaryKpis,#idleSummaryNotice').hide(); if (!n || !n.success) { R.resetTemperatureKpis(); $('#temperatureReportKpis').hide(); $('#reportResultError').removeClass('d-none').show().text(n && n.message ? n.message : 'Unable to load the temperature report. Please try again.'); R.state.modal.show(); return; } var rows = Array.isArray(n.rows) ? n.rows : [], meta = n.meta || {}; if (R.hasNoData(n)) { R.showNoData(); return; } function validValues(key) {
            return rows.map(function (item) {
                if (key === "Start Location") {
                    return item.first_lat + "," + item.first_long;
                }

                if (key === "End Location") {
                    return item.last_lat + "," + item.last_long;
                } return item[key];
            }).filter(function (value) { return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)); }).map(Number);
        } var minimumValues = validValues('Min Temperature(°C)'), averageValues = validValues('Avg Temperature(°C)'), maximumValues = validValues('Max Temperature(°C)'); $('#temperatureKpiMin').text(minimumValues.length ? R.formatTemperature(Math.min.apply(Math, minimumValues)) : '--'); $('#temperatureKpiAverage').text(averageValues.length ? R.formatTemperature(averageValues.reduce(function (total, value) { return total + value; }, 0) / averageValues.length) : '--'); $('#temperatureKpiMax').text(maximumValues.length ? R.formatTemperature(Math.max.apply(Math, maximumValues)) : '--'); $('#temperatureKpiTotal').text(String(meta.total !== null && meta.total !== undefined ? meta.total : rows.length)); R.state.modal.show(); if (!rows.length) { R.showNoData(); return; } var page = Number(meta.page || meta.current_page || R.state.page || 1), perPage = Number(meta.per_page || meta.perPage || R.state.perPage || 10); R.state.page = page; R.state.perPage = perPage; R.state.meta = meta; var columns = [{ title: 'S.No', data: null, className: 'text-center', render: function (_, type, item, tableMeta) { return ((page - 1) * perPage) + tableMeta.row + 1; } }, { title: 'Date', data: null, render: function (_, type, item) { return R.escapeHtml(item['Date'] ?? '--'); } }, { title: 'Min Temperature', data: null, className: 'text-center', render: function (_, type, item) { return R.formatTemperature(item['Min Temperature(°C)']); } }, { title: 'Min Location', data: null, render: function (_, type, item) { return R.temperatureLocation(item['Min Temp Lat/Long']); } }, { title: 'Min Status', data: null, className: 'text-center', render: function (_, type, item) { return R.temperatureStatus(item['Min Temp Status']); } }, { title: 'Average Temperature', data: null, className: 'text-center', render: function (_, type, item) { return R.formatTemperature(item['Avg Temperature(°C)']); } }, { title: 'Max Temperature', data: null, className: 'text-center', render: function (_, type, item) { return R.formatTemperature(item['Max Temperature(°C)']); } }, { title: 'Max Location', data: null, render: function (_, type, item) { return R.temperatureLocation(item['Max Temp Lat/Long']); } }, { title: 'Max Status', data: null, className: 'text-center', render: function (_, type, item) { return R.temperatureStatus(item['Max Temp Status']); } }]; $('#reportTableWrap').removeClass('d-none').removeAttr('style').show(); $('#reportResultTable').removeAttr('style'); R.state.table = $('#reportResultTable').DataTable($.extend({}, R.getCommonTableOptions(), { data: rows, columns: columns, searching: false, ordering: true, paging: false, info: false, lengthChange: false, dom: 'rt', language: { emptyTable: 'No temperature records available.' } })); R.renderPager(meta); if (Number(meta.last_page || meta.lastPage || 1) > 1) $('#reportApiPager').removeClass('d-none').removeAttr('style').show();
    };
    R.renderTemperatureResult = function (n) {
        R.resetResultTableContainer(); R.destroyChart();
        $('#reportResultTitle').text('Temperature Report'); $('#reportResultSummary').text(''); $('#reportResultLoading').addClass('d-none').hide(); $('#reportResultError,#reportResultEmpty').addClass('d-none').hide().empty(); $('#reportApiPager').addClass('d-none').hide(); $('#temperatureReportKpis').show(); $('#idleSummaryKpis,#idleSummaryNotice').hide();
        if (!n || !n.success) { R.resetTemperatureKpis(); $('#temperatureReportKpis').hide(); $('#reportResultError').removeClass('d-none').show().text(n && n.message ? n.message : 'Unable to load the temperature report. Please try again.'); R.state.modal.show(); return; }
        var rows = Array.isArray(n.rows) ? n.rows : [], meta = n.meta || {}, validValues = function (key) { return rows.map(function (item) { return item[key]; }).filter(function (value) { return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)); }).map(Number); }, minimumValues = validValues('Min Temperature(°C)'), averageValues = validValues('Avg Temperature(°C)'), maximumValues = validValues('Max Temperature(°C)');
        $('#temperatureKpiMin').text(minimumValues.length ? R.formatTemperature(Math.min.apply(Math, minimumValues)) : '--'); $('#temperatureKpiAverage').text(averageValues.length ? R.formatTemperature(averageValues.reduce(function (total, value) { return total + value; }, 0) / averageValues.length) : '--'); $('#temperatureKpiMax').text(maximumValues.length ? R.formatTemperature(Math.max.apply(Math, maximumValues)) : '--'); $('#temperatureKpiTotal').text(String(meta.total != null ? meta.total : rows.length));
        R.state.modal.show();
        if (!rows.length) { R.showNoData(); return; }
        var columns = [
            { title: 'S.No', data: null, className: 'text-center', render: function (_, type, item, tableMeta) { return ((R.state.page - 1) * R.state.perPage) + tableMeta.row + 1; } },
            { title: 'Date', data: null, render: function (_, type, item) { return R.escapeHtml(item.Date ?? '--'); } },
            { title: 'Min Temperature', data: null, className: 'text-center', render: function (_, type, item) { return R.formatTemperature(item['Min Temperature(°C)']); } },
            { title: 'Min Location', data: null, render: function (_, type, item) { return R.temperatureLocation(item['Min Temp Lat/Long'], item); } },
            { title: 'Min Status', data: null, className: 'text-center', render: function (_, type, item) { return R.temperatureStatus(item['Min Temp Status']); } },
            { title: 'Average Temperature', data: null, className: 'text-center', render: function (_, type, item) { return R.formatTemperature(item['Avg Temperature(°C)']); } },
            { title: 'Max Temperature', data: null, className: 'text-center', render: function (_, type, item) { return R.formatTemperature(item['Max Temperature(°C)']); } },
            { title: 'Max Location', data: null, render: function (_, type, item) { return R.temperatureLocation(item['Max Temp Lat/Long'], item); } },
            { title: 'Max Status', data: null, className: 'text-center', render: function (_, type, item) { return R.temperatureStatus(item['Max Temp Status']); } }
        ];
        $('#reportTableWrap').removeClass('d-none').removeAttr('style').show(); $('#reportResultTable').removeAttr('style');
        R.renderApiDataTable(rows, columns, meta, { title: 'Temperature Report', searching: false, ordering: true, language: { emptyTable: 'No temperature records available.' } });
    };
    var originalValidateForm = R.validateForm; R.validateForm = function () { if (!(R.state.report && R.state.report.idleSummaryReport)) return originalValidateForm.call(R); var fake = $('<input type="checkbox" class="report-column-check" checked>').appendTo('body'), valid = originalValidateForm.call(R); fake.remove(); var v = R.values(), start = R.parseReportDate(v.idleStartDate + ' ' + v.idleStartTime), end = R.parseReportDate(v.idleEndDate + ' ' + v.idleEndTime); if (start > end) { R.showError('idleEndDate', 'End date/time cannot be earlier than start.'); valid = false; } return valid; };
    var originalSetLoading = R.setLoading; R.setLoading = function (loading) { var report = R.state.report; if (report && (report.temperatureReport || report.idleSummaryReport)) { if (loading) { $('#reportResultLoading').text(report.idleSummaryReport ? 'Loading idle summary...' : 'Loading temperature report...').removeClass('d-none').show(); $('#reportResultError').addClass('d-none').hide().empty(); $('#reportResultEmpty').addClass('d-none').hide().empty(); $('#temperatureReportKpis,#idleSummaryKpis,#idleSummaryNotice').hide(); $('#reportTableWrap,#reportApiPager').addClass('d-none').hide(); } else $('#reportResultLoading').addClass('d-none').hide(); } originalSetLoading.call(R, loading); };
    var originalBuildPayload = R.buildPayload; R.buildPayload = function (page) { if (R.state.report && R.state.report.temperatureReport) return R.buildTemperaturePayload(page); if (R.state.report && R.state.report.idleSummaryReport) return R.buildIdleSummaryPayload(page); var payload = originalBuildPayload.call(R, page); if (R.state.report && R.state.report.legacyDriverPerformance) payload.per_page = String(R.state.perPage || 10); return payload; };
    var reportRenderForm = R.renderForm;
    R.renderForm = function () { var d = R.state.report; if (d && d.temperatureReport) { d.temperatureReport = false; reportRenderForm(); d.temperatureReport = true; $('#reportVehiclesAll').closest('label').hide(); return; } reportRenderForm(); };
    var reportValidateForm = R.validateForm;
    R.validateForm = function () { var d = R.state.report; if (d && d.temperatureReport && !$('.report-column-check:checked').length) { R.showError('columns', 'Please select at least one column.'); return false; } return reportValidateForm(); };
    
    // // Vanilla JS Capture-Phase event listener to completely bypass DataTables event swallowing
    // document.addEventListener('click', function(e) {
    //     var target = e.target;
    //     var btn = target.closest('.hard-capture-address-btn');
    //     if (!btn) return;
        
    //     e.preventDefault();
    //     e.stopPropagation();
        
    //     if (btn.hasAttribute('disabled')) return;
        
    //     var lat = btn.getAttribute('data-lat');
    //     var lng = btn.getAttribute('data-lng');
    //     if (!lat || !lng) return;
        
    //     btn.setAttribute('disabled', 'true');
    //     btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        
    //     var addressUrl = '/schoolbuddy/Home/address';
    //     if (window.SchoolBuddyReportsUrls && window.SchoolBuddyReportsUrls.address) {
    //         addressUrl = window.SchoolBuddyReportsUrls.address;
    //     } else if (window.location.pathname.toLowerCase().indexOf('/schoolbuddy') === -1) {
    //         addressUrl = '/Home/address';
    //     }

    //     $.ajax({
    //         url: addressUrl,
    //         type: 'GET',
    //         data: { latitude: lat, longitude: lng },
    //         success: function (response) {
    //             var address = '';
    //             if (response && typeof response === 'object') {
    //                 address = response.address || response.Address || response.data || '';
    //             } else if (typeof response === 'string') {
    //                 try {
    //                     var parsed = JSON.parse(response);
    //                     if (Array.isArray(parsed)) {
    //                         address = parsed[0] && Array.isArray(parsed[0]) ? parsed[0][0] : parsed[0];
    //                     } else if (parsed && typeof parsed === 'object') {
    //                         address = parsed.address || parsed.Address || parsed.data || response;
    //                     }
    //                 } catch (err) {
    //                     address = response;
    //                 }
    //             }
    //             address = String(address || '').trim();
                
    //             if (address && address !== '0') {
    //                 var safeAddress = window.SchoolBuddyReports ? window.SchoolBuddyReports.escapeHtml(address) : address;
    //                 $(btn).closest('.report-location-value-simple').html('<span class="report-location-display"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ' + safeAddress + '</span>');
    //             } else {
    //                 btn.removeAttribute('disabled');
    //                 btn.innerHTML = '<i class="bi bi-geo-alt" aria-hidden="true"></i>';
    //                 alert('No address was found for this location.');
    //             }
    //         },
    //         error: function (xhr, status, error) {
    //             console.error('Direct Address API Error:', error, status, xhr);
    //             btn.removeAttribute('disabled');
    //             btn.innerHTML = '<i class="bi bi-geo-alt" aria-hidden="true"></i>';
    //             alert('Failed to connect to the server to load the address.');
    //         }
    //     });
    // }, true); // true = Capture phase

    $(function () { R.init(); });
}(jQuery));
