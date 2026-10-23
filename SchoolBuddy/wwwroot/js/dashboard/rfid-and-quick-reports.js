// RFID attendance card and the Quick Reports panel.
// Moved out of Views/Home/Dashboard/Dashboard.cshtml; server values come from window.sbDashboard.

    $(document).ready(function () {


        // Bootstrap Select
        $('.dropdownwithsearch').selectpicker();


        // First Load
        LoadRFIDData();

        // Totals come from the lazy-loaded dashboard data (~/js/dashboard/dashboard-lazy-load.js).
        window.sbDashboard.onData(updateAttendanceSummary);


        // Auto refresh every 200 seconds
        setInterval(function () {

            // Background refresh: no global loader.
            SBLoader.silent(LoadRFIDData);

        }, 200000);

    });




    // RFID counts from the last LoadRFIDData() call (null until the first one finishes).
    let lastRfidCounts = null;

    function updateAttendanceSummary() {

        if (!lastRfidCounts) {
            return;
        }

        const present = lastRfidCounts.present;
        const pickedCount = lastRfidCounts.pickedCount;
        const droppedCount = lastRfidCounts.droppedCount;

        // Total students
        const totalstudent =
            window.sbDashboard.totalStudentCount;

        // Absent students
        const absentstudent =
            Math.max(totalstudent - present, 0);

        // Percentages
        let presentPercentNumber = 0;
        let absentPercentNumber = 0;

        if (totalstudent > 0) {
            presentPercentNumber =
                (present / totalstudent) * 100;

            absentPercentNumber =
                (absentstudent / totalstudent) * 100;
        }

        // Formatted percentages for display
        const presentPercent =
            presentPercentNumber.toFixed(1);

        const absentPercent =
            absentPercentNumber.toFixed(1);

        // Update SVG
        document.getElementById("attendanceCircle")
            ?.setAttribute(
                "stroke-dasharray",
                `${presentPercentNumber} ${absentPercentNumber}`
            );

        // Update center percentage
        document.getElementById("attendancePercent")
            .innerText = presentPercent + "%";

        // Update present count
        document.getElementById("presentCount")
            .innerText =
            present + " (" + presentPercent + "%)";

        // Update absent count
        document.getElementById("absentCount")
            .innerText =
            absentstudent + " (" + absentPercent + "%)";

        // Update total students
        document.getElementById("totalStudents")
            .innerText = totalstudent;

        // Student tracking counts
        $("#studentabsent").text(absentstudent);
        $("#studentPicked").text(pickedCount);
        $("#studentDropped").text(droppedCount);

        // Get assigned students
        const totalAssigned =
            parseInt($("#totalAssigned").val(), 10) || 0;

        // Calculate pending values
        const pendingPickup =
            Math.max(totalAssigned - pickedCount, 0);

        const pendingDrop =
            Math.max(totalAssigned - droppedCount, 0);

        // Display pending values
        $("#pendingPickup").text(pendingPickup);
        $("#pendingDrop").text(pendingDrop);
    }

    function LoadRFIDData() {


        $.ajax({

            url: '/schoolbuddy/Home/RFID',

            type: 'POST',

           success: function (response) {

    // Parse response when the controller returns JSON as text
    if (typeof response === "string") {
        try {
            response = JSON.parse(response);
        }
        catch (error) {
            response = [];
        }
    }

    // Ensure response is always an array
    if (!Array.isArray(response)) {
        response = [];
    }

    let top5Html = '';
    let allHtml = '';

    let pickedCount = 0;
    let droppedCount = 0;
  let present = 0;
const uniqueRfids = new Set();

response.forEach(function (item) {

    const movementType = String(item.movement_type || "")
        .trim()
        .toLowerCase();

    if (movementType === "pick") {
        pickedCount++;
    }
    else if (movementType === "drop") {
        droppedCount++;
    }

    // Count distinct RFID values
    const rfid = String(item.rfid || "").trim();

    if (rfid !== "") {
        uniqueRfids.add(rfid);
    }
});

// Unique RFID count
present = uniqueRfids.size;

// Attendance and student tracking also need the lazy-loaded dashboard totals,
// so keep the RFID counts and recalculate when those totals arrive.
lastRfidCounts = {
    present: present,
    pickedCount: pickedCount,
    droppedCount: droppedCount
};

updateAttendanceSummary();




                   // NO DATA
    if (!response || response.length === 0) {

        top5Html = `
            <tr>
                <td colspan="6"
                    style="
                        text-align:center;
                        padding:20px;
                        font-size:13px;
                        color:#6b7280;">

                    No Data Found For Today

                </td>
            </tr>
        `;

        $('#recentBoardingBody').html(top5Html);

        $('#allBoardingBody').html(top5Html);


        // VIEW ALL CLICK
       // Clear the table
$('#allBoardingBody').html(`
    <tr>
        <td colspan="7"
            class="text-center text-muted py-4">
            No Boarding/Deboarding Events Found for Today
        </td>
    </tr>
`);

// Open modal only when user clicks View All
$('#viewAllRFID')
    .off('click')
    .on('click', function (e) {

        e.preventDefault();

        const modalElement =
            document.getElementById('boardingModal');

        const modal =
            bootstrap.Modal.getOrCreateInstance(modalElement);

        modal.show();
    });

return;
    }


    // RESET NORMAL MODAL CLICK
    $('#viewAllRFID').off('click').on('click', function (e) {

    e.preventDefault();

    var modal = new bootstrap.Modal(
        document.getElementById('boardingModal')
    );

    modal.show();

});
 response.forEach(function (item, index) {

                    // Status Badge Color
                    let badgeColor =
                        item.movement_type === 'Drop'
                        ? '#ffe5e5'
                        : '#e0f8e9';


                    let textColor =
                        item.movement_type === 'Drop'
                        ? '#dc3545'
                        : '#198754';




                    let row = `

                        <tr style="height:38px;">

    <td style="
        padding:4px 6px;
        font-size:11px;
        vertical-align:middle;
        line-height:14px;
        color:#374151;">

        ${new Date(item.sys_proc_time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
})}

    </td>

    <td style="
        padding:4px 6px;
        font-size:11px;

        vertical-align:middle;
        line-height:14px;
        color:#111827;">

        ${item.student_name ?? ''}

    </td>

    <td style="fw-bold
        padding:4px 6px;
        font-size:11px;
        vertical-align:middle;
        line-height:14px;">

        ${item.class_name ?? ''}

    </td>

    <td style="
        padding:4px 6px;
        font-size:11px;
        vertical-align:middle;
        line-height:14px;">

        ${item.veh_reg ?? ''}

    </td>

    <td style="
        padding:4px 6px;
        font-size:11px;
        vertical-align:middle;
        line-height:14px;">

        ${item.user_stop_name ?? ''}

    </td>

    <td style="
        padding:4px 6px;
        vertical-align:middle;">

        <span style="
            background:${badgeColor};
            color:${textColor};
            padding:1px 6px;
            border-radius:10px;
            font-size:10px;
            font-weight:600;
            display:inline-block;">

            ${item.movement_type ?? ''}

        </span>

    </td>

</tr>

                    `;



                    // TOP 5 TABLE
                    if (index < 3) {

                        top5Html += row;
                    }


                    // MODAL TABLE
                    allHtml += row;

                });



               // Bind recent table
$('#recentBoardingBody').html(top5Html);

// Destroy DataTable BEFORE inserting new modal rows
if ($.fn.DataTable.isDataTable('#rfidtable')) {
    $('#rfidtable').DataTable().clear().destroy();
}

// Now insert all records
$('#allBoardingBody').empty().html(allHtml);

    // REINITIALIZE DATATABLE
    $('#rfidtable').DataTable({
    language: {
        emptyTable: "No RFID data found"
    },

    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
    lengthChange: true,

    paging: true,
    searching: true,
    ordering: true,
    info: true,

    scrollY: '55vh',
    scrollCollapse: true,
    autoWidth: false,

    columnDefs: [
        {
            targets: '_all',
            className: 'text-center align-middle'
        }
    ]
});

            },



            error: function (xhr, status, error) {



            }

        });

    }
    window.downloadRFIDReport = function () {

    if (!$.fn.DataTable.isDataTable('#rfidtable')) {

        Swal.fire({
            icon: "warning",
            title: "RFID Data Not Available",
            text: "RFID data is not loaded yet.",
            confirmButtonText: "OK",
            confirmButtonColor: "#0f2d4e"
        });

        return;
    }

    const table = $('#rfidtable').DataTable();

    if (!$.fn.dataTable.Buttons) {

        Swal.fire({
            icon: "error",
            title: "Export Unavailable",
            text: "The DataTables Excel extension is not loaded.",
            confirmButtonText: "OK",
            confirmButtonColor: "#0f2d4e"
        });

        return;
    }

    if (table.rows().count() === 0) {

        Swal.fire({
            icon: "warning",
            title: "No Data Available",
            text: "There is no RFID data available to download.",
            confirmButtonText: "OK",
            confirmButtonColor: "#0f2d4e"
        });

        return;
    }

    table.button(0).trigger();
};

let quickReportStartDatePicker;
let quickReportStartTimePicker;
let quickReportEndDatePicker;
let quickReportEndTimePicker;

function initializeQuickReportDateTimePickers() {
    if (quickReportStartDatePicker) {
        return;
    }

    quickReportStartDatePicker = flatpickr("#quickReportStartDate", {
        dateFormat: "Y-m-d",
        allowInput: true,
        clickOpens: false,
        disableMobile: true,
         maxDate: "today" 
    });

    quickReportStartTimePicker = flatpickr("#quickReportStartTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        allowInput: true,
        clickOpens: false,
        disableMobile: true
    });

    quickReportEndDatePicker = flatpickr("#quickReportEndDate", {
        dateFormat: "Y-m-d",
        allowInput: true,
        clickOpens: false,
        disableMobile: true,
         maxDate: "today" 
    });

    quickReportEndTimePicker = flatpickr("#quickReportEndTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        allowInput: true,
        clickOpens: false,
        disableMobile: true
    });

    bindPickerToggle("quickReportStartDate", "quickReportStartDateIcon", quickReportStartDatePicker);
    bindPickerToggle("quickReportStartTime", "quickReportStartTimeIcon", quickReportStartTimePicker);
    bindPickerToggle("quickReportEndDate", "quickReportEndDateIcon", quickReportEndDatePicker);
    bindPickerToggle("quickReportEndTime", "quickReportEndTimeIcon", quickReportEndTimePicker);
    $("#quickReportStartDate").on("change", setMaxTimeForToday);
$("#quickReportEndDate").on("change", setMaxTimeForToday);

setMaxTimeForToday();
}

function setMaxTimeForToday() {

    const now = new Date();

    const today =
        now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0");

    const currentTime =
        String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0");

    if ($("#quickReportStartDate").val() === today) {
        quickReportStartTimePicker.set("maxTime", currentTime);
    } else {
        quickReportStartTimePicker.set("maxTime", null);
    }

    if ($("#quickReportEndDate").val() === today) {
        quickReportEndTimePicker.set("maxTime", currentTime);
    } else {
        quickReportEndTimePicker.set("maxTime", null);
    }
}
window.openReportModal = function (reportType) {

    const form =
        document.getElementById('quickReportsForm');

    const reportTypeSelect =
        document.getElementById('quickReportType');

    const excelFormat =
        document.getElementById('quickReportFormatExcel');

    const modalElement =
        document.getElementById('quickReportsModal');

    if (
        !form ||
        !reportTypeSelect ||
        !excelFormat ||
        !modalElement
    ) {
        return;
    }

    form.reset();

    initializeQuickReportDateTimePickers();

    const now = new Date();

    reportTypeSelect.value = reportType || '';
    toggleVehicleSummaryFields();

    // Start: today at 00:00
    quickReportStartDatePicker.setDate(now, true);
    quickReportStartTimePicker.setDate('00:00', true);

    // End: today at current time (Vehicle Summary exports default to the full day).
    quickReportEndDatePicker.setDate(now, true);
    quickReportEndTimePicker.setDate(
        reportType === 'Vehicle Summary' ? '23:59' : formatQuickReportTime(now),
        true
    );

    // Default export type
    excelFormat.checked = true;

    clearQuickReportError();

    bootstrap.Modal
        .getOrCreateInstance(modalElement)
        .show();
};
function formatQuickReportTime(date) {

    const hours =
        String(date.getHours()).padStart(2, '0');

    const minutes =
        String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
}


function showQuickReportError(message) {

    const errorElement =
        document.getElementById('quickReportError');

    if (!errorElement) {
        return;
    }

    errorElement.textContent =
        message || 'Please check the report filters.';

    errorElement.style.display = 'block';
}


function clearQuickReportError() {

    const errorElement =
        document.getElementById('quickReportError');

    if (!errorElement) {
        return;
    }

    errorElement.textContent = '';
    errorElement.style.display = 'none';
}


function getQuickReportFilters() {

    clearQuickReportError();

    const reportType =
        document.getElementById('quickReportType')
            ?.value
            ?.trim() || '';

    const startDate =
        document.getElementById('quickReportStartDate')
            ?.value
            ?.trim() || '';

    const startTime =
        document.getElementById('quickReportStartTime')
            ?.value
            ?.trim() || '';

    const endDate =
        document.getElementById('quickReportEndDate')
            ?.value
            ?.trim() || '';

    const endTime =
        document.getElementById('quickReportEndTime')
            ?.value
            ?.trim() || '';

    const exportType =
        document.querySelector(
            'input[name="quickReportFormat"]:checked'
        )?.value || 'excel';

    if (!reportType) {
        showQuickReportError(
            'Please select a report type.'
        );

        return null;
    }

    if (!startDate) {
        showQuickReportError(
            'Please select the start date.'
        );

        return null;
    }

    if (!startTime) {
        showQuickReportError(
            'Please select the start time.'
        );

        return null;
    }

    if (!endDate) {
        showQuickReportError(
            'Please select the end date.'
        );

        return null;
    }

    if (!endTime) {
        showQuickReportError(
            'Please select the end time.'
        );

        return null;
    }

    // Controller receives these as complete datetime strings.
    const fromDateTime =
        `${startDate} ${startTime}`;

    const toDateTime =
        `${endDate} ${endTime}`;

    const fromDateObject =
        new Date(`${startDate}T${startTime}:00`);

    const toDateObject =
        new Date(`${endDate}T${endTime}:00`);

    if (
        Number.isNaN(fromDateObject.getTime()) ||
        Number.isNaN(toDateObject.getTime())
    ) {
        showQuickReportError(
            'The selected date or time is invalid.'
        );

        return null;
    }

    if (fromDateObject > toDateObject) {
        showQuickReportError(
            'From date and time cannot be greater than To date and time.'
        );

        return null;
    }

    if (reportType === 'Vehicle Summary') {
        const vehicles = getSelectedVehicleSummaryVehicles();
        const columns = getSelectedVehicleSummaryColumns();
        if (vehicles.length === 0) {
            showQuickReportError('Please select at least one vehicle.');
            return null;
        }
        if (columns.length === 0) {
            showQuickReportError('Please select at least one column.');
            return null;
        }
    }

    if (reportType === 'Distance Chart') {
        const vehicles = getSelectedDistanceChartVehicles();
        const minimum = Number(document.getElementById('distanceChartMinDistance')?.value);
        const maximum = Number(document.getElementById('distanceChartMaxDistance')?.value);

        if (vehicles.length === 0) {
            showQuickReportError('Please select at least one vehicle.');
            return null;
        }
        if (Number.isNaN(minimum) || Number.isNaN(maximum) || maximum < minimum) {
            showQuickReportError('Enter numeric distances; maximum cannot be lower than minimum.');
            return null;
        }
    }

    return {
        reportType: reportType,

        // Example: 2026-07-21 00:00
        from: fromDateTime,

        // Example: 2026-07-21 13:45
        to: toDateTime,

        exportType: exportType,
        vehicleList: reportType === 'Vehicle Summary' ? getSelectedVehicleSummaryVehicles().join(',') : '',
        columns: reportType === 'Vehicle Summary' ? getSelectedVehicleSummaryColumns().join(', ') : '',
        distanceVehicleList: reportType === 'Distance Chart' ? getSelectedDistanceChartVehicles().join(',') : '',
        minDistance: reportType === 'Distance Chart' ? document.getElementById('distanceChartMinDistance').value : '',
        maxDistance: reportType === 'Distance Chart' ? document.getElementById('distanceChartMaxDistance').value : ''
    };
}

const vehicleSummaryColumnOrder = [
    'Vehicle', 'Driver', 'IMEI', 'Start Location', 'Total Distance',
    'Total Running Time', 'Total Idle Time', 'Total Halt Time', 'Max Idle Time',
    'Max Idle Location', 'Idle Duration(HH:MM:SS)', 'Max Halt', 'Max Halt Location',
    'Halt Duration(HH:MM:SS)', 'No of Idle', 'Avg Speed', 'Max Speed',
    'No of Overspeed', 'Alerts', 'End Location', 'Playback'
];

function toggleVehicleSummaryFields() {
    const isVehicleSummary = document.getElementById('quickReportType')?.value === 'Vehicle Summary';
    const fields = document.getElementById('vehicleSummaryFields');
    if (fields) fields.style.display = isVehicleSummary ? '' : 'none';
    const isDistanceChart = document.getElementById('quickReportType')?.value === 'Distance Chart';
    const distanceFields = document.getElementById('distanceChartFields');
    if (distanceFields) distanceFields.style.display = isDistanceChart ? '' : 'none';
    clearQuickReportError();
    updateVehicleSummaryMultiselectLabels();
    updateDistanceChartMultiselectLabel();
}

function getSelectedVehicleSummaryVehicles() {
    return Array.from(document.querySelectorAll('.vehicle-summary-vehicle:checked'))
        .map(function (input) { return input.value; });
}

function getSelectedVehicleSummaryColumns() {
    const selected = new Set(Array.from(document.querySelectorAll('.vehicle-summary-column:checked'))
        .map(function (input) { return input.value; }));
    return vehicleSummaryColumnOrder.filter(function (column) { return selected.has(column); });
}

function getSelectedDistanceChartVehicles() {
    return Array.from(document.querySelectorAll('.distance-chart-vehicle:checked'))
        .map(function (input) { return input.value; });
}

function updateDistanceChartMultiselectLabel() {
    const vehicles = getSelectedDistanceChartVehicles();
    const button = document.getElementById('distanceChartVehicleButton');
    if (button) button.textContent = vehicles.length
        ? `${vehicles.length} vehicle${vehicles.length === 1 ? '' : 's'} selected`
        : 'Select vehicles';

    const selectAll = document.getElementById('distanceChartVehiclesAll');
    const total = document.querySelectorAll('.distance-chart-vehicle').length;
    if (selectAll) selectAll.checked = total > 0 && vehicles.length === total;
}

function updateVehicleSummaryMultiselectLabels() {
    const vehicles = getSelectedVehicleSummaryVehicles();
    const columns = getSelectedVehicleSummaryColumns();
    const vehicleButton = document.getElementById('vehicleSummaryVehicleButton');
    const columnButton = document.getElementById('vehicleSummaryColumnButton');
    if (vehicleButton) vehicleButton.textContent = vehicles.length ? `${vehicles.length} vehicle${vehicles.length === 1 ? '' : 's'} selected` : 'Select vehicles';
    if (columnButton) columnButton.textContent = columns.length === vehicleSummaryColumnOrder.length ? 'All columns selected' : (columns.length ? `${columns.length} columns selected` : 'Select columns');
    const vehicleAll = document.getElementById('vehicleSummaryVehiclesAll');
    const columnAll = document.getElementById('vehicleSummaryColumnsAll');
    if (vehicleAll) vehicleAll.checked = vehicles.length > 0 && vehicles.length === document.querySelectorAll('.vehicle-summary-vehicle').length;
    if (columnAll) columnAll.checked = columns.length === vehicleSummaryColumnOrder.length;
}


function setQuickReportLoading(isLoading) {

    const button =
        document.querySelector(
            '#quickReportsForm .quick-report-download-btn'
        );

    if (!button) {
        return;
    }

    if (isLoading) {

        button.disabled = true;

        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true">
            </span>
            Please wait...
        `;

    } else {

        button.disabled = false;

        button.innerHTML = `
            <i class="bi bi-download me-1"></i>
            Download
        `;
    }
}


function requestDailyAttendanceReport(filters) {

    setQuickReportLoading(true);
    clearQuickReportError();

    $.ajax({
        url: '/schoolbuddy/Report/Attandence',
        type: 'GET',

        data: {
            from: filters.from,
            to: filters.to
        },

        success: function (response) {



            let attendanceData = [];

            try {

                // Case 1:
                // Controller returns JSON as a string
                if (typeof response === 'string') {
                    response = JSON.parse(response);
                }

                if (response && response.status === false) {
                    if (response.requireLogin) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Session Expired',
                            text: response.message || 'Session expired. Please login again.',
                            confirmButtonColor: '#0f2d4e'
                        }).then(function () {
                            window.location.href = '/Home/Index';
                        });
                        return;
                    }

                    const isError = response.message && (
                        response.message.toLowerCase().includes('wrong') ||
                        response.message.toLowerCase().includes('error') ||
                        response.message.toLowerCase().includes('fail')
                    );

                    Swal.fire({
                        icon: isError ? 'error' : 'warning',
                        title: isError ? 'Attendance Report Failed' : 'No Attendance Data',
                        text: response.message || 'No attendance records were found for the selected date range.',
                        confirmButtonColor: '#0f2d4e'
                    });
                    return;
                }

                // Case 2:
                // API directly returns an array
                if (Array.isArray(response)) {

                    attendanceData = response;
                }

                // Case 3:
                // Controller returns:
                // { status: true, data: [...] }
                else if (Array.isArray(response?.data)) {

                    attendanceData = response.data;
                }

                // Case 4:
                // data contains a serialized JSON array
                else if (typeof response?.data === 'string') {

                    const parsedData =
                        JSON.parse(response.data);

                    if (Array.isArray(parsedData)) {

                        attendanceData = parsedData;
                    }
                    else if (
                        Array.isArray(parsedData?.data)
                    ) {

                        attendanceData =
                            parsedData.data;
                    }
                }

                // Case 5:
                // Capital Data property
                else if (Array.isArray(response?.Data)) {

                    attendanceData = response.Data;
                }

                // Case 6:
                // Result property
                else if (Array.isArray(response?.result)) {

                    attendanceData = response.result;
                }
            }
            catch (parseError) {



                showQuickReportError(
                    'Unable to read the attendance response.'
                );

                return;
            }



            if (
                !Array.isArray(attendanceData) ||
                attendanceData.length === 0
            ) {

                Swal.fire({
                    icon: 'warning',
                    title: 'No Attendance Data',
                    text:
                        'No attendance records were found for the selected date range.',
                    confirmButtonColor: '#0f2d4e'
                });

                return;
            }

            const rows = attendanceData.map(
                function (item, index) {

                    return [
                        index + 1,

                        getAttendanceValue(
                            item,
                            'admission_no',
                            'admissionNo',
                            'AdmissionNo'
                        ),

                        getAttendanceValue(
                            item,
                            'student_name',
                            'studentName',
                            'StudentName'
                        ),

                        getAttendanceValue(
                            item,
                            'class_name',
                            'className',
                            'ClassName',
                            'class',
                            'Class'
                        ),

                        getAttendanceValue(
                            item,
                            'section',
                            'Section'
                        ),

                        getAttendanceValue(
                            item,
                            'father_name',
                            'fatherName',
                            'FatherName'
                        ),

                        getAttendanceValue(
                            item,
                            'mobile_no1',
                            'mobileNo1',
                            'MobileNo1'
                        ),

                        getAttendanceValue(
                            item,
                            'rfid',
                            'Rfid',
                            'RFID'
                        ),

                        getAttendanceValue(
                            item,
                            'veh_reg',
                            'vehReg',
                            'VehReg'
                        ),
                        getAttendanceValue(item,
        'AttendanceDate',
        'attendanceDate'),
                        getAttendanceValue(
                            item,
                            'AttendanceTime',
                            'attendanceTime'
                        ),

                        getAttendanceValue(
                            item,
                            'AttendanceStatus',
                            'attendanceStatus'
                        )
                    ];
                }
            );


            const table =
                initializeAttendanceExportTable(
                    filters
                );

            table.clear();

            table.rows
                .add(rows)
                .draw(false);



            if (table.rows().count() === 0) {

                Swal.fire({
                    icon: 'error',
                    title: 'Export Failed',
                    text:
                        'Attendance records could not be added to the export table.',
                    confirmButtonColor: '#0f2d4e'
                });

                return;
            }

            const selectedFormat =
                String(
                    filters.exportType || 'excel'
                ).toUpperCase();

            downloadAttendanceReport(
                table,
                filters.exportType
            );

            const modalElement =
                document.getElementById(
                    'quickReportsModal'
                );

            bootstrap.Modal
                .getInstance(modalElement)
                ?.hide();

            setTimeout(function () {

                Swal.fire({
                    icon: 'success',
                    title: 'Report Downloaded',
                    text:
                        `Daily Attendance Report has been downloaded successfully in ${selectedFormat} format.`,
                    confirmButtonColor: '#0f2d4e',
                    timer: 2500,
                    timerProgressBar: true
                });

            }, 500);
        },

        error: function (xhr, status, error) {



            let message =
                'Unable to generate attendance report.';

            if (xhr.status === 401) {

                message =
                    'Your session has expired. Please log in again.';
            }
            else if (xhr.responseJSON?.message) {

                message =
                    xhr.responseJSON.message;
            }
            else if (xhr.responseText) {

                message =
                    xhr.responseText;
            }

            showQuickReportError(message);

            Swal.fire({
                icon: 'error',
                title: 'Attendance Report Failed',
                text: message,
                confirmButtonColor: '#0f2d4e'
            });
        },

        complete: function () {

            setQuickReportLoading(false);
        }
    });
}
function getAttendanceValue(item, ...propertyNames) {

    for (const propertyName of propertyNames) {

        if (
            item[propertyName] !== undefined &&
            item[propertyName] !== null
        ) {
            return item[propertyName];
        }
    }

    return '';
}


function initializeAttendanceExportTable(filters) {

    if (
    $.fn.DataTable.isDataTable(
        '#attendanceExportTable'
    )
) {
    $('#attendanceExportTable')
        .DataTable()
        .destroy();
}

    return $('#attendanceExportTable')
        .DataTable({

            paging: false,
            searching: false,
            ordering: false,
            info: false,
            autoWidth: false,

            dom: 'Bfrtip',

            buttons: [
                {
                    extend: 'excelHtml5',

                    title:
                        'Daily Attendance Report',

                    filename:
                        createAttendanceFileName(
                            filters
                        ),

                    exportOptions: {
    columns: [
        0, 1, 2, 3, 4, 5,
        6, 7, 8, 9, 10
    ]
}
                },
                {
                    extend: 'pdfHtml5',

                    title:
                        'Daily Attendance Report',

                    filename:
                        createAttendanceFileName(
                            filters
                        ),

                    orientation: 'landscape',
                    pageSize: 'A4',

                    exportOptions: {
    columns: [
        0, 1, 2, 3, 4, 5,
        6, 7, 8, 9, 10
    ]
},

                    customize: function (doc) {

                        doc.content.splice(
                            1,
                            0,
                            {
                                text:
                                    `From: ${filters.from}   To: ${filters.to}`,
                                margin: [0, 0, 0, 10],
                                fontSize: 9
                            }
                        );

                        doc.defaultStyle.fontSize = 7;

                        doc.styles.tableHeader.fontSize = 7;
                    }
                },
                {
                    extend: 'csvHtml5',

                    title:
                        'Daily Attendance Report',

                    filename:
                        createAttendanceFileName(
                            filters
                        ),

                    exportOptions: {
    columns: [
        0, 1, 2, 3, 4, 5,
        6, 7, 8, 9, 10
    ]
}
                },
                {
    extend: 'print',
title:
                        'Daily Attendance Report',

                    filename:
                        createAttendanceFileName(
                            filters
                        ),

                    exportOptions: {
    columns: [
        0, 1, 2, 3, 4, 5,
        6, 7, 8, 9, 10
    ]
}
                }
            ]
        });
}


function downloadAttendanceReport(
    table,
    exportType
) {

    const selectedFormat =
        String(exportType || 'excel')
            .trim()
            .toLowerCase();

    let buttonIndex = 0;

    if (selectedFormat === 'pdf') {

        buttonIndex = 1;
    }
    else if (selectedFormat === 'csv') {

        buttonIndex = 2;
    }
        else if (selectedFormat === 'print') {
        buttonIndex = 3;
        }

    if (table.rows().count() === 0) {

        throw new Error(
            'No attendance rows are available for export.'
        );
    }

    table.columns.adjust();

    setTimeout(function () {

        table
            .button(buttonIndex)
            .trigger();

    }, 200);
}


function createAttendanceFileName(filters) {

    const from =
        String(filters.from)
            .replaceAll('-', '')
            .replaceAll(':', '')
            .replaceAll(' ', '_');

    const to =
        String(filters.to)
            .replaceAll('-', '')
            .replaceAll(':', '')
            .replaceAll(' ', '_');

    return `Daily_Attendance_${from}_To_${to}`;
}

function escapeQuickReportHtml(value) {

    return $('<div>')
        .text(value ?? '')
        .html();
}
document.addEventListener(
    'DOMContentLoaded',
    function () {

        const quickReportsForm =
            document.getElementById('quickReportsForm');

        if (!quickReportsForm) {
            return;
        }

        document.getElementById('quickReportType')?.addEventListener('change', toggleVehicleSummaryFields);
        document.getElementById('vehicleSummaryVehiclesAll')?.addEventListener('change', function () {
            document.querySelectorAll('.vehicle-summary-vehicle').forEach(function (input) { input.checked = this.checked; }, this);
            updateVehicleSummaryMultiselectLabels();
        });
        document.getElementById('vehicleSummaryColumnsAll')?.addEventListener('change', function () {
            document.querySelectorAll('.vehicle-summary-column').forEach(function (input) { input.checked = this.checked; }, this);
            updateVehicleSummaryMultiselectLabels();
        });
        document.getElementById('distanceChartVehiclesAll')?.addEventListener('change', function () {
            document.querySelectorAll('.distance-chart-vehicle').forEach(function (input) { input.checked = this.checked; }, this);
            updateDistanceChartMultiselectLabel();
        });
        // Delegated: the vehicle checkboxes are added later by the lazy-loaded dashboard data.
        quickReportsForm.addEventListener('change', function (event) {
            if (event.target.matches('.vehicle-summary-vehicle, .vehicle-summary-column')) {
                updateVehicleSummaryMultiselectLabels();
            } else if (event.target.matches('.distance-chart-vehicle')) {
                updateDistanceChartMultiselectLabel();
            }
        });
        document.querySelectorAll('.vehicle-summary-multiselect').forEach(function (menu) {
            menu.addEventListener('click', function (event) { event.stopPropagation(); });
        });

        quickReportsForm.addEventListener(
            'submit',
            function (event) {

                // Prevent normal form submission and page reload
                event.preventDefault();

                const filters =
                    getQuickReportFilters();

                if (!filters) {
                    return;
                }

               switch (filters.reportType) {

    case 'Daily Attendance Report':
        requestDailyAttendanceReport(filters);
        break;

    case 'Distance Chart':
        requestDistanceChartReport(filters);
        break;

    case 'Vehicle Summary':
        requestVehicleSummaryReport(filters);
        break;

    case 'Driver Performance Report':
        requestDriverPerformanceReport(filters);
        break;

    case 'Alert History Report':
        requestAlertHistoryReport(filters);
        break;

    case 'Student Pickup/Drop Report':
        requestStudentPickupDropReport(filters);
        break;


                    default:

                        showQuickReportError(
                            'Please select a valid report type.'
                        );

                        break;
                }
            }
        );
    }
);
function requestRoutePerformanceReport(filters) {

    $.ajax({
        url: '/schoolbuddy/Home/RoutePerformanceReport',
        type: 'GET',
        data: {
            from: filters.from,
            to: filters.to
        },
        success: function (response) {
        },
        error: function (xhr) {
        }
    });
}


function requestVehicleUtilizationReport(filters) {

    $.ajax({
        url: '/schoolbuddy/Home/VehicleUtilizationReport',
        type: 'GET',
        data: {
            from: filters.from,
            to: filters.to
        },
        success: function (response) {
        },
        error: function (xhr) {
        }
    });
}

function requestDistanceChartReport(filters) {
    setQuickReportLoading(true);
    clearQuickReportError();

    $.ajax({
        url: '/schoolbuddy/Report/GenerateTrackofyReport',
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        headers: {
            RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
        },
        data: JSON.stringify({
            reportType: 'distance-chart',
            columns: 'Units, Total(km), Dates',
            vehicleList: filters.distanceVehicleList,
            startDate: filters.from,
            endDate: filters.to,
            minDistance: filters.minDistance,
            maxDistance: filters.maxDistance,
            page: '1',
            perPage: '100',
            timezoneDiff: String(-new Date().getTimezoneOffset())
        }),
        success: function (response) {
            if (typeof response === 'string') {
                try { response = JSON.parse(response); }
                catch (error) {
                    showQuickReportError('Invalid distance chart response.');
                    return;
                }
            }

            const rows = response?.data?.response;
            if (!response?.status || !Array.isArray(rows) || rows.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'No Data Found',
                    text: response?.message || 'No distance data found for the selected criteria.',
                    confirmButtonColor: '#0f2d4e'
                });
                return;
            }

            try {
                const table = initializeDistanceChartExportTable(rows, filters);
                downloadDistanceChartReport(table, filters.exportType);
                bootstrap.Modal.getInstance(document.getElementById('quickReportsModal'))?.hide();

                const selectedFormat = String(filters.exportType || 'excel').toUpperCase();
                setTimeout(function () {
                    Swal.fire({
                        icon: 'success',
                        title: 'Report Downloaded',
                        text: `Distance Chart downloaded successfully in ${selectedFormat} format.`,
                        confirmButtonColor: '#0f2d4e',
                        timer: 2500,
                        timerProgressBar: true
                    });
                }, 500);
            } catch (error) {
                showQuickReportError('Distance Chart could not be exported.');
            }
        },
        error: function (xhr) {
            const message = xhr.status === 401
                ? 'Your session has expired. Please log in again.'
                : (xhr.responseJSON?.message || 'Unable to generate Distance Chart.');
            showQuickReportError(message);
            Swal.fire({ icon: 'error', title: 'Distance Chart Failed', text: message, confirmButtonColor: '#0f2d4e' });
        },
        complete: function () {
            setQuickReportLoading(false);
        }
    });
}

function getDistanceChartDateKeys(rows) {
    return Array.from(new Set([].concat.apply([], rows.map(function (row) {
        return Object.keys(row.Dates || {});
    }))));
}

function distanceChartDateTitle(value) {
    return String(value).replace(/-/g, ' ').replace(/\b\w/g, function (character) {
        return character.toUpperCase();
    });
}

function initializeDistanceChartExportTable(rows, filters) {
    if ($.fn.DataTable.isDataTable('#distanceChartExportTable')) {
        $('#distanceChartExportTable').DataTable().clear().destroy();
    }

    const dateKeys = getDistanceChartDateKeys(rows);
    const columns = ['Units'].concat(dateKeys);
    const table = $('#distanceChartExportTable');
    table.find('thead').html('<tr>' + columns.map(function (column) {
        return `<th>${escapeQuickReportHtml(column === 'Units' ? column : distanceChartDateTitle(column))}</th>`;
    }).join('') + '</tr>');

    return table.DataTable({
        data: rows.map(function (row) {
            return columns.map(function (column) {
                return column === 'Units' ? (row.Units ?? '') : (row.Dates || {})[column] ?? '';
            });
        }),
        columns: columns.map(function (column) {
            return { title: column === 'Units' ? column : distanceChartDateTitle(column) };
        }),
        paging: false,
        searching: false,
        ordering: false,
        info: false,
        autoWidth: false,
        dom: 'Bfrtip',
        buttons: [
            { extend: 'excelHtml5', title: 'Distance Chart', filename: createDistanceChartFileName(filters) },
            { extend: 'pdfHtml5', title: 'Distance Chart', filename: createDistanceChartFileName(filters), orientation: 'landscape', pageSize: 'A4' },
            { extend: 'csvHtml5', title: 'Distance Chart', filename: createDistanceChartFileName(filters) },
            { extend: 'print', title: 'Distance Chart' }
        ]
    });
}

function downloadDistanceChartReport(table, exportType) {
    const selectedFormat = String(exportType || 'excel').trim().toLowerCase();
    const buttonClass = selectedFormat === 'pdf'
        ? '.buttons-pdf'
        : selectedFormat === 'csv'
            ? '.buttons-csv'
            : selectedFormat === 'print'
                ? '.buttons-print'
                : '.buttons-excel';

    if (!table || table.rows().count() === 0) {
        throw new Error('No distance chart rows are available for export.');
    }

    table.columns.adjust();
    setTimeout(function () { table.button(buttonClass).trigger(); }, 200);
}

function createDistanceChartFileName(filters) {
    const from = String(filters.from || '').replaceAll('-', '').replaceAll(':', '').replaceAll(' ', '_');
    const to = String(filters.to || '').replaceAll('-', '').replaceAll(':', '').replaceAll(' ', '_');
    return `Distance_Chart_${from}_To_${to}`;
}

function requestVehicleSummaryReport(filters) {
    setQuickReportLoading(true);
    clearQuickReportError();

    // Close the Quick Reports modal so the user focuses on the download progress popup
    const quickModalEl = document.getElementById('quickReportsModal');
    const quickModal = quickModalEl ? bootstrap.Modal.getInstance(quickModalEl) : null;
    quickModal?.hide();

    let secondsElapsed = 0;
    let timerInterval = null;
    let isCancelled = false;

    // Prevent accidental window / tab closure while generating
    const beforeUnloadHandler = function (e) {
        e.preventDefault();
        e.returnValue = 'Vehicle Summary Report is still compiling. If you leave now, the download will be cancelled.';
        return e.returnValue;
    };
    window.addEventListener('beforeunload', beforeUnloadHandler);

    function cleanupLoadingState() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        window.removeEventListener('beforeunload', beforeUnloadHandler);
        setQuickReportLoading(false);
    }

    // Show popup informing user that downloading will start in a few minutes and not to close the window
    Swal.fire({
        title: 'Vehicle Summary Report',
        html: `
            <div class="py-2 text-center">
                <div class="spinner-border text-primary my-3" style="width: 3.2rem; height: 3.2rem;" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h5 class="fw-bold text-dark mb-2">Downloading will start in a few minutes</h5>
                <p class="text-secondary mb-3" style="font-size: 0.95rem; line-height: 1.5;">
                    Compiling comprehensive vehicle summary and telemetry data typically takes <strong>2 to 3 minutes</strong>.<br>
                    <span class="text-danger fw-semibold mt-1 d-inline-block">
                        <i class="bi bi-exclamation-triangle-fill me-1"></i>Please do not close or refresh this window.
                    </span>
                </p>
                <div class="d-inline-flex align-items-center bg-light border rounded px-3 py-2 text-muted" style="font-size: 0.9rem;">
                    <i class="bi bi-stopwatch text-primary me-2"></i> Time elapsed: <span id="vehicleSummaryElapsedTimer" class="fw-bold ms-1 text-dark">00:00</span>
                </div>
            </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        cancelButtonColor: '#6c757d',
        didOpen: () => {
            timerInterval = setInterval(() => {
                secondsElapsed++;
                const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
                const secs = String(secondsElapsed % 60).padStart(2, '0');
                const timerEl = document.getElementById('vehicleSummaryElapsedTimer');
                if (timerEl) {
                    timerEl.textContent = `${mins}:${secs}`;
                }
            }, 1000);
        }
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
            isCancelled = true;
            if (xhr) {
                xhr.abort();
            }
            cleanupLoadingState();
            Swal.fire({
                icon: 'info',
                title: 'Cancelled',
                text: 'Vehicle Summary Report download was cancelled.',
                confirmButtonColor: '#0f2d4e',
                timer: 2000
            });
        }
    });

    const xhr = $.ajax({
        url: '/schoolbuddy/Report/VehicleSummaryReport',
        type: 'POST',
        dataType: 'json',
        timeout: 600000, // 10 minutes timeout to allow 2-3 minute report compilation
        data: {
            columns: filters.columns,
            start_date: filters.from,
            end_date: filters.to,
            vehicleList: filters.vehicleList
        },
        success: function (response) {
            if (isCancelled) return;
            cleanupLoadingState();

            let apiResponse = response;
            try {
                if (typeof apiResponse === 'string') apiResponse = JSON.parse(apiResponse);
                if (apiResponse && typeof apiResponse.data === 'string') apiResponse.data = JSON.parse(apiResponse.data);
            } catch (parseError) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Response',
                    text: 'The Vehicle Summary response was invalid.',
                    confirmButtonColor: '#0f2d4e'
                });
                return;
            }

            if (!apiResponse || apiResponse.status !== true) {
                Swal.fire({
                    icon: 'error',
                    title: 'Report Failed',
                    text: apiResponse?.message || 'Unable to generate Vehicle Summary Report.',
                    confirmButtonColor: '#0f2d4e'
                });
                return;
            }

            const reportRows = apiResponse.data?.response;
            if (!Array.isArray(reportRows) || reportRows.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'No Data Found',
                    text: 'No data found for the selected filters.',
                    confirmButtonColor: '#0f2d4e'
                });
                return;
            }

            try {
                const table = populateVehicleSummaryExportTable(reportRows, getSelectedVehicleSummaryColumns(), filters);
                // Download in Excel format as requested
                downloadVehicleSummaryReport(table, 'excel');

                Swal.fire({
                    icon: 'success',
                    title: 'Download Started',
                    text: 'Vehicle Summary Report has been generated and downloaded in Excel format.',
                    confirmButtonColor: '#0f2d4e',
                    timer: 3500,
                    timerProgressBar: true
                });
            } catch (exportError) {
                Swal.fire({
                    icon: 'error',
                    title: 'Export Failed',
                    text: 'Vehicle Summary report could not be exported to Excel.',
                    confirmButtonColor: '#0f2d4e'
                });
            }
        },
        error: function (xhr, status, error) {
            if (isCancelled) return;
            cleanupLoadingState();

            if (status === 'timeout') {
                Swal.fire({
                    icon: 'error',
                    title: 'Request Timed Out',
                    text: 'The Vehicle Summary report took too long to compile. Please try selecting a narrower date range or fewer vehicles.',
                    confirmButtonColor: '#0f2d4e'
                });
                return;
            }

            if (xhr.statusText === 'abort') {
                return;
            }

            const message = xhr.status === 401
                ? 'Your session has expired. Please log in again.'
                : (xhr.responseJSON?.message || xhr.responseText || 'Unable to generate Vehicle Summary Report.');

            Swal.fire({
                icon: 'error',
                title: 'Vehicle Summary Report Failed',
                text: message,
                confirmButtonColor: '#0f2d4e'
            });
        },
        complete: function () {
            cleanupLoadingState();
        }
    });
}

function getSafeValue(value) {
    return value === null || value === undefined ? '' : value;
}

function formatPlaybackValue(playback) {
    if (!playback || typeof playback !== 'object') return 'N/A';
    const coordinate = function (value) { return value === null || value === undefined || value === '' ? 'N/A' : value; };
    const firstLat = coordinate(playback.first_lat);
    const firstLong = coordinate(playback.first_long);
    const lastLat = coordinate(playback.last_lat);
    const lastLong = coordinate(playback.last_long);
    return `First: ${firstLat}, ${firstLong} → Last: ${lastLat}, ${lastLong}`;
}

function getVehicleSummaryValue(item, column) {
    return column === 'Playback'
        ? formatPlaybackValue(item?.Playback)
        : getSafeValue(item?.[column]);
}

function initializeVehicleSummaryExportTable(columns, filters) {
    const selector = '#vehicleSummaryExportTable';
    if ($.fn.DataTable.isDataTable(selector)) $(selector).DataTable().clear().destroy();
    const $table = $(selector);
    $table.find('thead').html(`<tr>${columns.map(function (column) { return $('<th>').text(column).prop('outerHTML'); }).join('')}</tr>`);
    $table.find('tbody').empty();
    return $table.DataTable({
        paging: false, searching: false, ordering: false, info: false, autoWidth: false,
        dom: 'Bfrtip',
        buttons: [
            { extend: 'excelHtml5', title: 'Vehicle Summary Report', filename: createVehicleSummaryFileName(filters) },
            { extend: 'csvHtml5', title: 'Vehicle Summary Report', filename: createVehicleSummaryFileName(filters) },
            { extend: 'pdfHtml5', title: 'Vehicle Summary Report', filename: createVehicleSummaryFileName(filters), orientation: 'landscape', pageSize: 'A4', customize: function (doc) { doc.defaultStyle.fontSize = 5; doc.styles.tableHeader.fontSize = 5; } },
            { extend: 'print', title: 'Vehicle Summary Report' }
        ]
    });
}

function populateVehicleSummaryExportTable(reportRows, columns, filters) {
    const table = initializeVehicleSummaryExportTable(columns, filters);
    table.rows.add(reportRows.map(function (item) {
        return columns.map(function (column) { return getVehicleSummaryValue(item, column); });
    })).draw(false);
    if (table.rows().count() === 0) throw new Error('No Vehicle Summary rows are available for export.');
    return table;
}

function downloadVehicleSummaryReport(table, exportType) {
    const format = String(exportType || 'excel').trim().toLowerCase();
    table.columns.adjust();
    setTimeout(function () {
        const button = { excel: '.buttons-excel', xlsx: '.buttons-excel', csv: '.buttons-csv', pdf: '.buttons-pdf', print: '.buttons-print' }[format];
        if (!button) throw new Error('Please select a supported report format.');
        table.button(button).trigger();
    }, 200);
}

function createVehicleSummaryFileName() {
    const now = new Date();
    const stamp = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
    return `Vehicle_Summary_${stamp}`;
}


function requestDriverPerformanceReport(filters) {

    setQuickReportLoading(true);
    clearQuickReportError();

    const driverPerformanceColumns =
        "Driver, Max speed, Avg speed, Total distance, " +
        "Harsh breaking, Harsh acceleration, Fuel consumption, " +
        "Mileage, Rating, No of trips";

    $.ajax({
        url: '/schoolbuddy/Report/DriverPerformanceReport',
        type: 'POST',
        dataType: 'json',

        data: {
            columns: driverPerformanceColumns,
            start_date: filters.from,
            end_date: filters.to,
            timezoneDiff: '330',
            page: '1',

            per_page: '1000'
        },

        success: function (response) {


            let driverData = [];
            let apiResponse = response;

            if (typeof apiResponse === 'string') {

                try {
                    apiResponse = JSON.parse(apiResponse);
                }
                catch (parseError) {



                    apiResponse = null;
                }
            }

            /*
             * Expected response:
             *
             * {
             *     status: true,
             *     data: {
             *         response: [...]
             *     }
             * }
             */
            if (
                apiResponse &&
                apiResponse.status === true &&
                apiResponse.data
            ) {

                let responseData = apiResponse.data;

                /*
                 * Handle response.data when the controller
                 * returns it as a serialized JSON string.
                 */
                if (typeof responseData === 'string') {

                    try {
                        responseData =
                            JSON.parse(responseData);
                    }
                    catch (parseError) {



                        responseData = null;
                    }
                }

                if (
                    responseData &&
                    Array.isArray(responseData.response)
                ) {

                    driverData =
                        responseData.response;
                }
            }



            if (
                !Array.isArray(driverData) ||
                driverData.length === 0
            ) {

                Swal.fire({
                    icon: 'info',
                    title: 'No Data Found',
                    text:
                        'No driver performance records were found for the selected date and time.',
                    confirmButtonColor: '#0f2d4e'
                });

                return;
            }

            const rows = driverData.map(
                function (item, index) {

                    return [
                        index + 1,

                        getDriverPerformanceValue(
                            item,
                            'Driver'
                        ),

                        getDriverPerformanceValue(
                            item,
                            'Max speed'
                        ),

                        getDriverPerformanceValue(
                            item,
                            'Avg speed'
                        ),

                        getDriverPerformanceValue(
                            item,
                            'Total distance'
                        ),

                        getDriverPerformanceValue(
                            item,
                            'Harsh breaking'
                        ),

                        getDriverPerformanceValue(
                            item,
                            'Harsh acceleration'
                        ),

                        getDriverPerformanceValue(
                            item,
                            'Fuel consumption'
                        ),

                        getDriverPerformanceValue(
                            item,
                            'Mileage'
                        ),

                        getDriverPerformanceValue(
                            item,
                            'Rating'
                        ),

                        getDriverPerformanceValue(
                            item,
                            'No of trips'
                        )
                    ];
                }
            );

            const table =
                initializeDriverPerformanceExportTable(
                    filters
                );

            $('#driverPerformanceExportTable tbody').empty();
            table.clear();

            table.rows
                .add(rows)
                .draw(false);



            if (table.rows().count() === 0) {

                Swal.fire({
                    icon: 'error',
                    title: 'Export Failed',
                    text:
                        'Driver performance records could not be added to the export table.',
                    confirmButtonColor: '#0f2d4e'
                });

                return;
            }

            downloadDriverPerformanceReport(
                table,
                filters.exportType
            );

            const modalElement =
                document.getElementById(
                    'quickReportsModal'
                );

            bootstrap.Modal
                .getInstance(modalElement)
                ?.hide();

            const selectedFormat =
                String(
                    filters.exportType || 'excel'
                ).toUpperCase();

            setTimeout(function () {

                Swal.fire({
                    icon: 'success',
                    title: 'Report Downloaded',
                    text:
                        `Driver Performance Report downloaded successfully in ${selectedFormat} format.`,
                    confirmButtonColor: '#0f2d4e',
                    timer: 2500,
                    timerProgressBar: true
                });

            }, 500);
        },

        error: function (xhr, status, error) {



            let message =
                'Unable to generate Driver Performance Report.';

            if (xhr.status === 401) {

                message =
                    'Your session has expired. Please log in again.';
            }
            else if (
                xhr.responseJSON?.message
            ) {

                message =
                    xhr.responseJSON.message;
            }
            else if (
                xhr.responseText
            ) {

                message =
                    xhr.responseText;
            }

            showQuickReportError(message);

            Swal.fire({
                icon: 'error',
                title: 'Driver Performance Report Failed',
                text: message,
                confirmButtonColor: '#0f2d4e'
            });
        },

        complete: function () {

            setQuickReportLoading(false);
        }
    });
}
function getDriverPerformanceValue(
    item,
    propertyName
) {

    if (
        !item ||
        item[propertyName] === undefined ||
        item[propertyName] === null
    ) {
        return '';
    }

    /*
     * Do not use item[propertyName] || ''
     * because numeric value 0 is valid data.
     */
    return item[propertyName];
}
function initializeDriverPerformanceExportTable(
    filters
) {

    if (
        $.fn.DataTable.isDataTable(
            '#driverPerformanceExportTable'
        )
    ) {

        $('#driverPerformanceExportTable')
            .DataTable()
            .clear()
            .destroy();
    }

    return $('#driverPerformanceExportTable')
        .DataTable({

            paging: false,
            searching: false,
            ordering: false,
            info: false,
            autoWidth: false,

            dom: 'Bfrtip',

            buttons: [
                {
                    extend: 'excelHtml5',

                    title:
                        'Driver Performance Report',

                    filename:
                        createDriverPerformanceFileName(
                            filters
                        ),

                    exportOptions: {
                        columns: [
                            0, 1, 2, 3, 4, 5,
                            6, 7, 8, 9, 10
                        ]
                    }
                },
                {
                    extend: 'pdfHtml5',

                    title:
                        'Driver Performance Report',

                    filename:
                        createDriverPerformanceFileName(
                            filters
                        ),

                    orientation: 'landscape',
                    pageSize: 'A4',

                    exportOptions: {
                        columns: [
                            0, 1, 2, 3, 4, 5,
                            6, 7, 8, 9, 10
                        ]
                    },

                    customize: function (doc) {

                        doc.content.splice(
                            1,
                            0,
                            {
                                text:
                                    `From: ${filters.from}   To: ${filters.to}`,
                                margin: [0, 0, 0, 10],
                                fontSize: 8
                            }
                        );

                        doc.defaultStyle.fontSize = 6;
                        doc.styles.tableHeader.fontSize = 6;

                        if (
                            doc.content[2] &&
                            doc.content[2].table
                        ) {

                            doc.content[2].table.widths = [
                                '4%',
                                '14%',
                                '8%',
                                '8%',
                                '10%',
                                '9%',
                                '10%',
                                '10%',
                                '8%',
                                '8%',
                                '8%'
                            ];
                        }
                    }
                },
                {
                    extend: 'csvHtml5',

                    title:
                        'Driver Performance Report',

                    filename:
                        createDriverPerformanceFileName(
                            filters
                        ),

                    exportOptions: {
                        columns: [
                            0, 1, 2, 3, 4, 5,
                            6, 7, 8, 9, 10
                        ]
                    }
                },
                {
                    extend: 'print',

                    title:
                        'Driver Performance Report',

                    exportOptions: {
                        columns: [
                            0, 1, 2, 3, 4, 5,
                            6, 7, 8, 9, 10
                        ]
                    }
                }
            ]
        });
}
function downloadDriverPerformanceReport(
    table,
    exportType
) {

    const selectedFormat =
        String(exportType || 'excel')
            .trim()
            .toLowerCase();

    if (table.rows().count() === 0) {

        throw new Error(
            'No driver performance rows are available for export.'
        );
    }

    table.columns.adjust();

    setTimeout(function () {

        switch (selectedFormat) {
            case 'excel':
            case 'xlsx':
                table.button('.buttons-excel').trigger();
                break;
            case 'csv':
                table.button('.buttons-csv').trigger();
                break;
            case 'pdf':
                table.button('.buttons-pdf').trigger();
                break;
            case 'print':
                table.button('.buttons-print').trigger();
                break;
            default:
                throw new Error('Please select a supported report format.');
        }

    }, 200);
}
function createDriverPerformanceFileName(
    filters
) {

    const selectedDate =
        String(filters.from || '')
            .split(' ')[0] ||
        new Date().toISOString().split('T')[0];

    return `Driver_Performance_Report_${selectedDate}`;
}


function requestAlertHistoryReport(filters) {

    $.ajax({
        url: '/schoolbuddy/Home/AlertHistoryReport',
        type: 'GET',
        data: {
            from: filters.from,
            to: filters.to
        },
        success: function (response) {
        },
        error: function (xhr) {
        }
    });
}


        function requestStudentPickupDropReport(filters) {

        setQuickReportLoading(true);

        $.ajax({
        url: '/schoolbuddy/Report/Boarding',
        type: 'GET',
        dataType: 'json',

        data: {
        from: filters.from,
        to: filters.to
        },

        success: function (response) {



        let pickupDropData = [];

        if (
        response &&
        response.status === true &&
        response.data
        ) {

        try {

        pickupDropData =
        typeof response.data === "string"
        ? JSON.parse(response.data)
        : response.data;
        }
        catch (error) {



        pickupDropData = [];
        }
        }



        if (
        !Array.isArray(pickupDropData) ||
        pickupDropData.length === 0
        ) {

        Swal.fire({
        icon: "info",
        title: "No Data Found",
        text:
        "No student pickup/drop records were found for the selected date and time.",
        confirmButtonColor: "#0f2d4e"
        });

        return;
        }



        const rows = pickupDropData.map(
        function (item, index) {

        const punchDateTime =
        item.sys_proc_time ||
        item.sysProcTime ||
        item.SysProcTime ||
        '';

        return [
        index + 1,

        item.student_id ||
        item.studentId ||
        item.StudentId ||
        '',

        item.student_name ||
        item.studentName ||
        item.StudentName ||
        '',

        item.class_name ||
        item.className ||
        item.ClassName ||
        '',

        item.route_name ||
        item.routeName ||
        item.RouteName ||
        '',

        item.user_stop_name ||
        item.userStopName ||
        item.UserStopName ||
        '',

        item.veh_reg ||
        item.vehReg ||
        item.VehReg ||
        '',

        formatPickupDropDate(
        punchDateTime
        ),

        formatPickupDropTime(
        punchDateTime
        ),

        item.movement_type ||
        item.movementType ||
        item.MovementType ||
        '',

        item.status ||
        item.Status ||
        ''
        ];
        }
        );



        const table =
        initializeStudentPickupDropExportTable(
        filters
        );

        table.clear();

        table.rows
        .add(rows)
        .draw(false);



        if (table.rows().count() === 0) {

        Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text:
        'Student pickup/drop records could not be added to the export table.',
        confirmButtonColor: '#0f2d4e'
        });

        return;
        }

        downloadStudentPickupDropReport(
        table,
        filters.exportType
        );

        const modalElement =
        document.getElementById(
        'quickReportsModal'
        );

        bootstrap.Modal
        .getInstance(modalElement)
        ?.hide();

        const selectedFormat =
        String(
        filters.exportType || 'excel'
        ).toUpperCase();

        setTimeout(function () {

        Swal.fire({
        icon: 'success',
        title: 'Report Downloaded',
        text:
        `Student Pickup/Drop Report downloaded successfully in ${selectedFormat} format.`,
        confirmButtonColor: '#0f2d4e',
        timer: 2500,
        timerProgressBar: true
        });

        }, 500);
        },

        error: function (xhr, status, error) {



        let message =
        'Unable to generate Student Pickup/Drop Report.';

        if (xhr.status === 401) {

        message =
        'Your session has expired. Please log in again.';
        }
        else if (
        xhr.responseJSON?.message
        ) {

        message =
        xhr.responseJSON.message;
        }
        else if (
        xhr.responseText
        ) {

        message =
        xhr.responseText;
        }

        Swal.fire({
        icon: 'error',
        title: 'Pickup/Drop Report Failed',
        text: message,
        confirmButtonColor: '#0f2d4e'
        });
        },

        complete: function () {

        setQuickReportLoading(false);
        }
        });
        }
function getPickupDropValue(
    item,
    ...propertyNames
) {

    for (
        const propertyName
        of propertyNames
    ) {

        if (
            item[propertyName] !== undefined &&
            item[propertyName] !== null
        ) {

            return item[propertyName];
        }
    }

    return '';
}
function formatPickupDropDate(
    dateValue
) {

    if (!dateValue) {
        return '';
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '';
    }

    const day =
        String(
            date.getDate()
        ).padStart(2, '0');

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, '0');

    const year =
        date.getFullYear();

    return `${day}-${month}-${year}`;
}
function formatPickupDropTime(
    dateValue
) {

    if (!dateValue) {
        return '';
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '';
    }

    const hours =
        String(
            date.getHours()
        ).padStart(2, '0');

    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, '0');

    const seconds =
        String(
            date.getSeconds()
        ).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
}
function initializeStudentPickupDropExportTable(
    filters
) {

    if (
        $.fn.DataTable.isDataTable(
            '#studentPickupDropExportTable'
        )
    ) {

        $('#studentPickupDropExportTable')
            .DataTable()
            .destroy();
    }

    return $('#studentPickupDropExportTable')
        .DataTable({

            paging: false,
            searching: false,
            ordering: false,
            info: false,
            autoWidth: false,

            dom: 'Bfrtip',

            buttons: [
                {
                    extend: 'excelHtml5',

                    title:
                        'Student Pickup Drop Report',

                    filename:
                        createStudentPickupDropFileName(
                            filters
                        ),

                    exportOptions: {
                        columns: [
                            0, 1, 2, 3, 4, 5,
                            6, 7, 8, 9, 10
                        ]
                    }
                },
                 {
                    extend: 'print',

                    title:
                        'Student Pickup Drop Report',

                    filename:
                        createStudentPickupDropFileName(
                            filters
                        ),

                    exportOptions: {
                        columns: [
                            0, 1, 2, 3, 4, 5,
                            6, 7, 8, 9, 10
                        ]
                    }
                },
                {
                    extend: 'pdfHtml5',

                    title:
                        'Student Pickup Drop Report',

                    filename:
                        createStudentPickupDropFileName(
                            filters
                        ),

                    orientation: 'landscape',
                    pageSize: 'A4',

                    exportOptions: {
                        columns: [
                            0, 1, 2, 3, 4, 5,
                            6, 7, 8, 9, 10
                        ]
                    },

                    customize: function (doc) {

                        doc.content.splice(
                            1,
                            0,
                            {
                                text:
                                    `From: ${filters.from}   To: ${filters.to}`,
                                margin: [0, 0, 0, 10],
                                fontSize: 9
                            }
                        );

                        doc.defaultStyle.fontSize = 7;

                        doc.styles.tableHeader.fontSize = 7;
                    }
                },
                {
                    extend: 'csvHtml5',

                    title:
                        'Student Pickup Drop Report',

                    filename:
                        createStudentPickupDropFileName(
                            filters
                        ),

                    exportOptions: {
                        columns: [
                            0, 1, 2, 3, 4, 5,
                            6, 7, 8, 9, 10
                        ]
                    }
                }
            ]
        });
}
function downloadStudentPickupDropReport(
    table,
    exportType
) {

    const selectedFormat =
        String(
            exportType || 'excel'
        )
        .trim()
        .toLowerCase();

    let buttonIndex = 0;

if (selectedFormat === 'print') {
    buttonIndex = 1;
}
else if (selectedFormat === 'pdf') {
    buttonIndex = 2;
}
else if (selectedFormat === 'csv') {
    buttonIndex = 3;
}

    if (
        table.rows().count() === 0
    ) {

        throw new Error(
            'No student pickup/drop rows are available for export.'
        );
    }

    table.columns.adjust();

    setTimeout(function () {

        table
            .button(buttonIndex)
            .trigger();

    }, 200);
}
        function createStudentPickupDropFileName(
        filters
        ) {

        const from =
        String(filters.from)
        .replaceAll('-', '')
        .replaceAll(':', '')
        .replaceAll(' ', '_');

        const to =
        String(filters.to)
        .replaceAll('-', '')
        .replaceAll(':', '')
        .replaceAll(' ', '_');

        return `Student_Pickup_Drop_${from}_To_${to}`;
        }
        $('#boardingModal').on('show.bs.modal', function () {
    $('#rfidtable_wrapper').css('visibility', 'hidden');
});

$('#boardingModal').on('show.bs.modal', function () {
    $('#rfidTableContainer').css('visibility', 'hidden');
});

$('#boardingModal').on('shown.bs.modal', function () {

    const $container = $('#rfidTableContainer');

    if (!$.fn.DataTable.isDataTable('#rfidtable')) {
        $container.css('visibility', 'visible');
        return;
    }

    const table = $('#rfidtable').DataTable();

    requestAnimationFrame(function () {
        requestAnimationFrame(function () {

            table.columns.adjust().draw(false);

            $('#rfidtable').css('width', '100%');

            $('#rfidtable_wrapper').css({
                width: '100%',
                visibility: 'visible'
            });

            $('#rfidtable_wrapper .dataTables_scroll')
                .css('width', '100%');

            $('#rfidtable_wrapper .dataTables_scrollHead')
                .css('width', '100%');

            $('#rfidtable_wrapper .dataTables_scrollHeadInner')
                .css('width', '100%');

            $('#rfidtable_wrapper .dataTables_scrollHeadInner table')
                .css('width', '100%');

            $('#rfidtable_wrapper .dataTables_scrollBody')
                .css('width', '100%');

            $('#rfidtable_wrapper .dataTables_scrollBody table')
                .css('width', '100%');

            $container.css('visibility', 'visible');
        });
    });
});
$('#routePerformanceModal').on('show.bs.modal', function () {
    $('#routePerformanceTableContainer').css(
        'visibility',
        'hidden'
    );
});

$('#routePerformanceModal').on('shown.bs.modal', function () {

    const tableSelector = '#routePerformanceModalTable';
    const $container = $('#routePerformanceTableContainer');

    /*
     * Destroy any DataTable created earlier while the modal
     * was hidden.
     */
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $(tableSelector)
            .DataTable()
            .destroy();
    }

    const routeTable = $(tableSelector).DataTable({
        destroy: true,

        paging: true,
        searching: true,
        ordering: true,
        info: true,
        lengthChange: true,
        autoWidth: false,
        responsive: false,

        pageLength: 10,

        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],

        /*
         * Required for vertical table-body scroll.
         */
        scrollY: '52vh',

        /*
         * Route Performance contains 9 columns.
         */
        scrollX: true,

        /*
         * False keeps the fixed-height scroll area.
         */
        scrollCollapse: true,

        language: {
            emptyTable: 'No Route Performance Available',
            search: 'Search:',
            lengthMenu: 'Show _MENU_ entries',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
            infoEmpty: 'Showing 0 to 0 of 0 entries'
        },

        columnDefs: [
            {
                targets: '_all',
                className: 'text-center align-middle'
            }
        ]
    });

    requestAnimationFrame(function () {
        requestAnimationFrame(function () {

            routeTable
                .columns
                .adjust()
                .draw(false);

            $(tableSelector).css(
                'width',
                '100%'
            );

            $('#routePerformanceModalTable_wrapper').css({
                width: '100%',
                visibility: 'visible'
            });

            $('#routePerformanceModalTable_wrapper .dataTables_scroll')
                .css('width', '100%');

            $('#routePerformanceModalTable_wrapper .dataTables_scrollHead')
                .css('width', '100%');

            $('#routePerformanceModalTable_wrapper .dataTables_scrollHeadInner')
                .css('width', '100%');

            $('#routePerformanceModalTable_wrapper .dataTables_scrollHeadInner table')
                .css('width', '100%');

            const routeRowCount = routeTable.rows({
    search: 'applied'
}).count();

const $routeScrollBody =
    $('#routePerformanceModalTable_wrapper .dataTables_scrollBody');

if (routeRowCount === 0) {
    $routeScrollBody.css({
        width: '100%',
        height: 'auto',
        minHeight: '0',
        maxHeight: '90px',
        overflowY: 'hidden',
        overflowX: 'auto'
    });
}
else {
    $routeScrollBody.css({
        width: '100%',
        height: 'auto',
        minHeight: '0',
        maxHeight: '52vh',
        overflowY: 'auto',
        overflowX: 'auto'
    });
}

            $('#routePerformanceModalTable_wrapper .dataTables_scrollBody table')
                .css('width', '100%');

            $container.css(
                'visibility',
                'visible'
            );
        });
    });
});

$('#vehicleHealthModal').on('show.bs.modal', function () {

    $('#vehicleHealthTableContainer')
        .css('visibility', 'hidden');
});

$('#vehicleHealthModal').on('shown.bs.modal', function () {

    const tableSelector = '#vehicleHealthTable';
    const $container = $('#vehicleHealthTableContainer');

    // Destroy DataTable if it was previously initialized
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $(tableSelector)
            .DataTable()
            .destroy();
    }

    const vehicleHealthTable =
        $(tableSelector).DataTable({

            destroy: true,

            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,

            autoWidth: false,
            responsive: false,

            pageLength: 10,

            lengthMenu: [
                [5, 10, 25, 50, -1],
                [5, 10, 25, 50, 'All']
            ],

            // Creates the vertically scrollable table body
            scrollY: '52vh',

            // Allows horizontal table scrolling on small screens
            scrollX: true,

            // Keeps the fixed scroll area even with fewer rows
            scrollCollapse: true,

            language: {
                emptyTable: 'No vehicle health data found',
                search: 'Search:',
                lengthMenu: 'Show _MENU_ entries',
                info: 'Showing _START_ to _END_ of _TOTAL_ entries',
                infoEmpty: 'Showing 0 to 0 of 0 entries'
            },

            columnDefs: [
                {
                    targets: '_all',
                    className: 'text-center align-middle'
                }
            ]
        });

    requestAnimationFrame(function () {
        requestAnimationFrame(function () {

            vehicleHealthTable
                .columns
                .adjust()
                .draw(false);

            $(tableSelector).css(
                'width',
                '100%'
            );

            $('#vehicleHealthTable_wrapper').css({
                width: '100%',
                visibility: 'visible'
            });

            $('#vehicleHealthTable_wrapper .dataTables_scroll')
                .css('width', '100%');

            $('#vehicleHealthTable_wrapper .dataTables_scrollHead')
                .css('width', '100%');

            $('#vehicleHealthTable_wrapper .dataTables_scrollHeadInner')
                .css('width', '100%');

            $('#vehicleHealthTable_wrapper .dataTables_scrollHeadInner table')
                .css('width', '100%');

            $('#vehicleHealthTable_wrapper .dataTables_scrollBody')
                .css({
                    width: '100%',
                    height: '52vh',
                    maxHeight: '52vh',
                    overflowY: 'scroll',
                    overflowX: 'auto'
                });

            $('#vehicleHealthTable_wrapper .dataTables_scrollBody table')
                .css('width', '100%');

            $container.css(
                'visibility',
                'visible'
            );
        });
    });
});
$('#driverMonitoringModal').on('show.bs.modal', function () {

    $('#driverMonitoringTableContainer')
        .css('visibility', 'hidden');
});

$('#driverMonitoringModal').on('shown.bs.modal', function () {

    const tableSelector = '#driverMonitoringTable';
    const $container = $('#driverMonitoringTableContainer');

    // Remove any previous DataTable instance
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $(tableSelector)
            .DataTable()
            .destroy();
    }

    const driverMonitoringTable =
        $(tableSelector).DataTable({

            destroy: true,

            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,

            autoWidth: false,
            responsive: false,

            pageLength: 10,

            lengthMenu: [
                [5, 10, 25, 50, -1],
                [5, 10, 25, 50, 'All']
            ],

            // Vertical scrolling for only the table body
            scrollY: '52vh',

            // Horizontal scrolling on smaller screens
            scrollX: true,

            // Preserve fixed table-body height
            scrollCollapse: true,

            language: {
                emptyTable: 'No driver data found',
                search: 'Search:',
                lengthMenu: 'Show _MENU_ entries',
                info: 'Showing _START_ to _END_ of _TOTAL_ entries',
                infoEmpty: 'Showing 0 to 0 of 0 entries'
            },

            columnDefs: [
                {
                    targets: '_all',
                    className: 'text-center align-middle'
                }
            ]
        });

    requestAnimationFrame(function () {
        requestAnimationFrame(function () {

            driverMonitoringTable
                .columns
                .adjust()
                .draw(false);

            $(tableSelector).css(
                'width',
                '100%'
            );

            $('#driverMonitoringTable_wrapper').css({
                width: '100%',
                visibility: 'visible'
            });

            $('#driverMonitoringTable_wrapper .dataTables_scroll')
                .css('width', '100%');

            $('#driverMonitoringTable_wrapper .dataTables_scrollHead')
                .css('width', '100%');

            $('#driverMonitoringTable_wrapper .dataTables_scrollHeadInner')
                .css('width', '100%');

            $('#driverMonitoringTable_wrapper .dataTables_scrollHeadInner table')
                .css('width', '100%');

            const rowCount = driverMonitoringTable.rows().count();

const $scrollBody =
    $('#driverMonitoringTable_wrapper .dataTables_scrollBody');

if (rowCount === 0) {
    $scrollBody.css({
        width: '100%',
        height: 'auto',
        maxHeight: '90px',
        minHeight: '0',
        overflowY: 'hidden',
        overflowX: 'auto'
    });
}
else {
    $scrollBody.css({
        width: '100%',
        height: 'auto',
        maxHeight: '52vh',
        minHeight: '0',
        overflowY: 'auto',
        overflowX: 'auto'
    });
}

            $('#driverMonitoringTable_wrapper .dataTables_scrollBody table')
                .css('width', '100%');

            $container.css(
                'visibility',
                'visible'
            );
        });
    });
});
