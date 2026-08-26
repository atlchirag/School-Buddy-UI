
"use strict";

let dayWiseAttendanceTable = null;
let classWiseAttendanceTable = null;

$(document).ready(function () {
    initializeDefaultTab();
    initializeDatePicker();
    initializeAttendanceEvents();
});

function sortAttendanceRows(rows) {
    const classSortOrder = {
        "PRE PRIMARY": 1,
        "PRE SCHOOL": 2,
        "NURSERY": 3,
        "PRE NURSERY": 4,
        "K.G./BAL VATIKA 1": 5,
        "UKG/BAL VATIKA 3": 6,
        "I": 7,
        "II": 8,
        "III": 9,
        "IV": 10,
        "V": 11,
        "VI": 12,
        "VII": 13,
        "VIII": 14,
        "IX": 15,
        "X": 16,
        "XI": 17,
        "XII": 18
    };

    const statusSortOrder = {
        "present": 1,
        "absent": 2,
        "unknown card": 3
    };

    const normalize = function (value) {
        return String(value || "")
            .trim()
            .replace(/\s+/g, " ")
            .replace(/\s*\/\s*/g, "/");
    };

    return rows.sort(function (a, b) {
        const statusA = normalize(a.attendanceStatus).toLowerCase();
        const statusB = normalize(b.attendanceStatus).toLowerCase();
        const statusOrderA = statusSortOrder[statusA] || 999;
        const statusOrderB = statusSortOrder[statusB] || 999;

        if (statusOrderA !== statusOrderB) {
            return statusOrderA - statusOrderB;
        }

        const classNameA = normalize(a.className).toUpperCase();
        const classNameB = normalize(b.className).toUpperCase();
        const classOrderA = classSortOrder[classNameA] || 999;
        const classOrderB = classSortOrder[classNameB] || 999;

        if (classOrderA !== classOrderB) {
            return classOrderA - classOrderB;
        }

        return normalize(a.studentName).localeCompare(
            normalize(b.studentName),
            undefined,
            { sensitivity: "base" }
        );
    });
}
function initializeDefaultTab() {
    const dayWiseTabElement = document.getElementById("A1");

    if (
        dayWiseTabElement &&
        typeof bootstrap !== "undefined" &&
        bootstrap.Tab
    ) {
        const dayWiseTab =
            bootstrap.Tab.getOrCreateInstance(dayWiseTabElement);

        dayWiseTab.show();
    }
}

function initializeDatePicker() {

    const today = getTodayIsoDate();

    // Block future dates in native Class Wise fields
    $("#classWiseDateFrom").attr("max", today);

    // Make the complete Class Wise input clickable
    $(".attendance-native-date")
        .off("click.openDatePicker focus.openDatePicker")
        .on(
            "click.openDatePicker focus.openDatePicker",
            function () {
                openNativeDatePicker(this);
            }
        );

    // Day Wise Bootstrap datepicker
    if (
        typeof $ === "undefined" ||
        typeof $.fn.datepicker !== "function"
    ) {
        console.warn(
            "Bootstrap Datepicker is not loaded."
        );

        return;
    }

    $("#datepicker").datepicker({
        format: "yyyy-mm-dd",
        autoclose: true,
        todayHighlight: true,
        clearBtn: true,

        // Future dates blocked
        endDate: new Date()
    });

    // Clicking anywhere in the input opens calendar
    $("#datepicker")
        .off("click.attendanceDate focus.attendanceDate")
        .on(
            "click.attendanceDate focus.attendanceDate",
            function () {
                $(this).datepicker("show");
            }
        );

    // Calendar icon also opens it
    $("#datepicker1")
        .off("click.attendanceDate")
        .on("click.attendanceDate", function () {
            $("#datepicker").datepicker("show");
        });

    $("#datepicker")
        .off(
            "changeDate.attendance clearDate.attendance change.attendance"
        )
        .on(
            "changeDate.attendance clearDate.attendance change.attendance",
            function () {
                clearFieldError(
                    "#datepicker",
                    "#datepickerError"
                );

                const selectedDate =
                    $("#datepicker").val();

                $("#selectedDateDisplay").text(
                    selectedDate ||
                    "No date selected"
                );
            }
        );
}
function getTodayIsoDate() {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function openNativeDatePicker(inputElement) {
    if (!inputElement) {
        return;
    }

    // Supported in modern Chrome and Edge
    if (
        typeof inputElement.showPicker ===
        "function"
    ) {
        try {
            inputElement.showPicker();
        } catch (error) {
            inputElement.focus();
        }

        return;
    }

    // Browser fallback
    inputElement.focus();
}

function showFieldError(
    inputSelector,
    errorSelector,
    message
) {
    $(inputSelector)
        .addClass("attendance-field-invalid");

    $(errorSelector)
        .text(message);
}

function clearFieldError(
    inputSelector,
    errorSelector
) {
    $(inputSelector)
        .removeClass("attendance-field-invalid");

    $(errorSelector)
        .text("");
}

function clearDayWiseValidation() {
    clearFieldError(
        "#datepicker",
        "#datepickerError"
    );
}

function clearClassWiseValidation() {
    clearFieldError(
        "#classWiseClassId",
        "#classWiseClassIdError"
    );

    clearFieldError(
        "#classWiseDateFrom",
        "#classWiseDateFromError"
    );

}

function initializeAttendanceEvents() {

    // Day Wise Search
    $("#dayWiseSearchButton")
        .off("click.attendance")
        .on("click.attendance", function (event) {
            event.preventDefault();
            loadDayWiseAttendance();
        });

    // Day Wise Reset
    $("#dayWiseResetButton")
        .off("click.attendance")
        .on("click.attendance", function (event) {
            event.preventDefault();
            resetDayWiseAttendance();
        });

    // Day Wise Export
    $(".attendance-export-option")
        .off("click.attendance")
        .on("click.attendance", function (event) {
            event.preventDefault();

            const exportType = $(this).data("export-type");

            triggerAttendanceExport(exportType);
        });

    // Class Wise Search
    $("#classWiseSearchButton")
        .off("click.classWiseAttendance")
        .on("click.classWiseAttendance", function (event) {
            event.preventDefault();

            loadClassWiseAttendance();
        });

    // Class Wise Reset
    $("#classWiseResetButton")
        .off("click.classWiseAttendance")
        .on("click.classWiseAttendance", function (event) {
            event.preventDefault();

            resetClassWiseAttendance();
        });

    // Class Wise Export
    $(".class-wise-export-option")
        .off("click.classWiseAttendance")
        .on("click.classWiseAttendance", function (event) {
            event.preventDefault();

            const exportType = $(this).data("export-type");

            triggerClassWiseExport(exportType);
        });

    $("#classWiseClassId")
        .off("change.classValidation")
        .on("change.classValidation", function () {
            if ($(this).val()) {
                clearFieldError(
                    "#classWiseClassId",
                    "#classWiseClassIdError"
                );
            }
        });

    $("#classWiseDateFrom")
        .off("change.classValidation")
        .on("change.classValidation", function () {
            clearFieldError(
                "#classWiseDateFrom",
                "#classWiseDateFromError"
            );
        });
}

function loadDayWiseAttendance() {
    const selectedDate = $("#datepicker").val();
    const apiUrl = $("#attendancePageConfig")
        .data("day-wise-url");

    clearDayWiseValidation();

    if (!selectedDate) {
        showFieldError(
            "#datepicker",
            "#datepickerError",
            "Attendance Date is required."
        );

        $("#datepicker").focus();
        return;
    }

    const today = getTodayIsoDate();

    if (selectedDate > today) {
        showFieldError(
            "#datepicker",
            "#datepickerError",
            "Future dates are not allowed."
        );

        $("#datepicker").focus();
        return;
    }

    if (!apiUrl) {
        showAttendanceMessage(
            "error",
            "Attendance API URL was not found."
        );

        return;
    }

    setAttendanceLoading(true);

    $.ajax({
        url: apiUrl,
        type: "GET",
        dataType: "json",
        cache: false,

        data: {
            date: selectedDate
        },

        success: function (response) {
            if (!response) {
                showAttendanceMessage(
                    "error",
                    "Empty response received from the server."
                );

                resetAttendanceDisplay(false);
                return;
            }

            if (response.success !== true) {
                showAttendanceMessage(
                    "warning",
                    response.message ||
                    "Attendance data could not be loaded."
                );

                resetAttendanceDisplay(false);
                return;
            }

            bindDayWiseAttendance(response);
        },

        error: function (xhr) {
            console.error("Attendance API error:", xhr);

            let errorMessage =
                "Unable to load attendance data.";

            if (
                xhr.responseJSON &&
                xhr.responseJSON.message
            ) {
                errorMessage =
                    xhr.responseJSON.message;
            }

            showAttendanceMessage(
                "error",
                errorMessage
            );

            resetAttendanceDisplay(false);
        },

        complete: function () {
            setAttendanceLoading(false);
        }
    });
}

function bindDayWiseAttendance(response) {
    const students = Array.isArray(response.students)
        ? sortAttendanceRows([...response.students])
        : [];

    console.table(students.map(function (student) {
        return {
            studentName: student.studentName,
            className: student.className,
            attendanceStatus: student.attendanceStatus
        };
    }));

    const totalStudents =
        Number(response.totalStudents) || 0;

    const presentStudents =
        Number(response.presentStudents) || 0;

    const absentStudents =
        Number(response.absentStudents) || 0;

    const attendancePercentage =
        Number(response.attendancePercentage) || 0;

    updateAttendanceKpi(
        response.attendanceDate,
        totalStudents,
        presentStudents,
        absentStudents,
        attendancePercentage
    );

    initializeOrReloadAttendanceDataTable(students);

    $(".attendance-export-option")
        .prop("disabled", students.length === 0)
        .toggleClass("disabled", students.length === 0);

    if (students.length === 0) {
        showAttendanceMessage(
            "info",
            response.message ||
            "No attendance records were found."
        );
    }
}

function updateAttendanceKpi(
    attendanceDate,
    total,
    present,
    absent,
    percentage
) {
    const presentPercentage =
        total > 0
            ? (present / total) * 100
            : 0;

    const absentPercentage =
        total > 0
            ? (absent / total) * 100
            : 0;

    $("#totalStudentCount").text(
        total.toLocaleString()
    );

    $("#presentStudentCount").text(
        present.toLocaleString()
    );

    $("#absentStudentCount").text(
        absent.toLocaleString()
    );

    $("#attendancePercentage").text(
        percentage.toFixed(1) + "%"
    );

    $("#presentProgressText").text(
        present.toLocaleString() +
        " (" +
        presentPercentage.toFixed(1) +
        "%)"
    );

    $("#absentProgressText").text(
        absent.toLocaleString() +
        " (" +
        absentPercentage.toFixed(1) +
        "%)"
    );

    $("#presentProgressBar").css(
        "width",
        clampPercentage(presentPercentage) + "%"
    );

    $("#absentProgressBar").css(
        "width",
        clampPercentage(absentPercentage) + "%"
    );

    $("#selectedDateDisplay").text(
        attendanceDate || $("#datepicker").val()
    );

    if (total === 0) {
        $("#attendanceKpiMessage").text(
            "No attendance records are available for the selected date."
        );

        return;
    }

    $("#attendanceKpiMessage").text(
        present.toLocaleString() +
        " of " +
        total.toLocaleString() +
        " students are present."
    );
}

function initializeOrReloadAttendanceDataTable(students) {
    if (
        typeof $.fn.DataTable !== "function"
    ) {
        console.error("DataTables is not loaded.");
        renderAttendanceWithoutDataTable(students);
        return;
    }

    if ($.fn.DataTable.isDataTable("#dayWiseAttendanceTable")) {
        $("#dayWiseAttendanceTable").DataTable().destroy();
        dayWiseAttendanceTable = null;
    }

    $("#dayWiseAttendanceBody").empty();

    dayWiseAttendanceTable =
        $("#dayWiseAttendanceTable").DataTable({

            data: students,

            processing: true,

            responsive: false,

            scrollX: true,

            autoWidth: false,

            pageLength: 10,

            lengthMenu: [
                [10, 25, 50, 100],
                [10, 25, 50, 100]
            ],
            order: [],

            ordering: true,

            columns: [
                {
                    data: null,
                    className: "text-center",
                    orderable: false,
                    searchable: false,

                    defaultContent: ""
                },
                {
                    data: "admissionNo",
                    defaultContent: "N/A"
                },
                {
                    data: "studentName",
                    defaultContent: "N/A"
                },
                {
                    data: "className",
                    defaultContent: "N/A",

                    render: function (data, type, row) {

                        if (type === "sort" || type === "type") {
                            return getClassSortOrder(data);
                        }

                        return displayValue(data);
                    }
                },
                {
                    data: "sectionName",
                    defaultContent: "N/A"
                },
                {
                    data: "vehicleNo",
                    defaultContent: "N/A"
                },
                {
                    data: "rfid",
                    defaultContent: "N/A"
                },
                {
                    data: "attendanceStatus",
                    className: "text-center",

                    render: function (data, type, row) {

                        const status = String(data || "")
                            .trim()
                            .toLowerCase();

                        if (type === "sort" || type === "type") {
                            return getAttendanceStatusOrder(status);
                        }

                        if (status === "present") {
                            return `
                <span class="attendance-status present">
                    Present
                </span>
            `;
                        }

                        if (status === "absent") {
                            return `
                <span class="attendance-status absent">
                    Absent
                </span>
            `;
                        }

                        return `
            <span class="attendance-status">
                ${escapeHtml(data || "-")}
            </span>
        `;
                    }
                }
            ],

            dom:
                "<'row align-items-center mb-3'" +
                "<'col-12 col-md-6 text-center text-md-start'l>" +
                "<'col-12 col-md-6 text-center text-md-end'f>" +
                ">" +
                "<'attendance-hidden-buttons'B>" +
                "rt" +
                "<'row align-items-center mt-3 attendance-table-footer'" +
                "<'col-12 col-md-6 text-center text-md-start'i>" +
                "<'col-12 col-md-6 d-flex justify-content-center justify-content-md-end'p>" +
                ">",

            buttons: [
                {
                    extend: "copyHtml5",
                    title: getAttendanceExportTitle(),
                    className: "attendance-copy-button"
                },
                {
                    extend: "csvHtml5",
                    title: getAttendanceExportTitle(),
                    filename: getAttendanceExportFileName(),
                    className: "attendance-csv-button"
                },
                {
                    extend: "excelHtml5",
                    title: getAttendanceExportTitle(),
                    filename: getAttendanceExportFileName(),
                    className: "attendance-excel-button"
                },
                {
                    extend: "pdfHtml5",
                    title: getAttendanceExportTitle(),
                    filename: getAttendanceExportFileName(),
                    orientation: "landscape",
                    pageSize: "A4",
                    className: "attendance-pdf-button",

                    exportOptions: {
                        columns: ":visible"
                    },

                    customize: function (doc) {
                        doc.defaultStyle.fontSize = 8;
                        doc.styles.tableHeader.fontSize = 9;
                        doc.styles.tableHeader.alignment =
                            "center";
                    }
                },
                {
                    extend: "print",
                    title: getAttendanceExportTitle(),
                    className: "attendance-print-button",

                    exportOptions: {
                        columns: ":visible"
                    }
                }
            ],

            language: {
                emptyTable:
                    "No attendance records found.",

                zeroRecords:
                    "No matching attendance records found.",

                search:
                    "Search:",

                lengthMenu:
                    "Show _MENU_ entries",

                info:
                    "Showing _START_ to _END_ of _TOTAL_ entries",

                infoEmpty:
                    "Showing 0 to 0 of 0 entries"
            },
         

            drawCallback: function () {
                var api = this.api();

                api.column(0, { page: 'current' }).nodes().each(function (cell, i) {
                    cell.innerHTML = api.page.info().start + i + 1;
                });
            }
        
        });
}

function renderAttendanceWithoutDataTable(students) {
    const tableBody =
        document.getElementById(
            "dayWiseAttendanceBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!students.length) {
        tableBody.innerHTML = `
            <tr class="attendance-empty-row">
                <td colspan="8">
                    <div class="attendance-empty-state">
                        <i class="bi bi-calendar2-x"></i>
                        <h6>No attendance found</h6>
                        <div>
                            No attendance records are available.
                        </div>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    students.forEach(function (student, index) {
        const status =
            String(student.attendanceStatus || "")
                .toLowerCase();

        const statusClass =
            status === "present"
                ? "present"
                : status === "absent"
                    ? "absent"
                    : "";

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td class="text-center">
                ${index + 1}
            </td>

            <td>
                ${escapeHtml(student.admissionNo)}
            </td>

            <td>
                ${escapeHtml(student.studentName)}
            </td>

            <td>
                ${escapeHtml(student.className)}
            </td>

            <td>
                ${escapeHtml(student.sectionName)}
            </td>

            <td>
                ${escapeHtml(student.vehicleNo|| "N/A")}
            </td>

            <td>
                ${escapeHtml(
            student.rfid || "N/A"
        )}
            </td>

            <td class="text-center">
                <span class="attendance-status ${statusClass}">
                    ${escapeHtml(
            student.attendanceStatus
        )}
                </span>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

function triggerAttendanceExport(exportType) {
    if (!dayWiseAttendanceTable) {
        showAttendanceMessage(
            "warning",
            "Please load attendance data before exporting."
        );

        return;
    }

    const exportButtonMap = {
        copy: 0,
        csv: 1,
        excel: 2,
        pdf: 3,
        print: 4
    };

    const buttonIndex =
        exportButtonMap[exportType];

    if (
        buttonIndex === undefined ||
        buttonIndex === null
    ) {
        showAttendanceMessage(
            "warning",
            "Invalid export option selected."
        );

        return;
    }

    dayWiseAttendanceTable
        .button(buttonIndex)
        .trigger();
}

function resetDayWiseAttendance() {
    clearDayWiseValidation();
    const datePicker = $("#datepicker");

    // Clear date picker
    if (
        datePicker.length &&
        typeof $.fn.datepicker === "function"
    ) {
        try {
            datePicker.datepicker("clearDates");
        } catch (error) {
            console.warn("Datepicker reset error:", error);
        }
    }

    datePicker.val("");
    $("#selectedDateDisplay").text("No date selected");

    // Reset KPI
    $("#totalStudentCount").text("0");
    $("#presentStudentCount").text("0");
    $("#absentStudentCount").text("0");
    $("#attendancePercentage").text("0%");

    // Reset progress bars
    $("#presentProgressText").text("0 (0%)");
    $("#absentProgressText").text("0 (0%)");

    $("#presentProgressBar").css("width", "0%");
    $("#absentProgressBar").css("width", "0%");

    $("#attendanceKpiMessage").text(
        "Select a date and click Search."
    );

    // Disable export buttons
    $(".attendance-export-option")
        .prop("disabled", true)
        .addClass("disabled");

    // Clear DataTable
    if (
        typeof $.fn.DataTable === "function" &&
        $.fn.DataTable.isDataTable("#dayWiseAttendanceTable")
    ) {
        const table =
            $("#dayWiseAttendanceTable").DataTable();

        table
            .search("")
            .clear()
            .draw();

        return;
    }

    // Fallback when DataTable has not been initialized
    $("#dayWiseAttendanceBody").html(`
        <tr class="attendance-empty-row">
            <td colspan="8">
                <div class="attendance-empty-state">
                    <i class="bi bi-calendar2-check"></i>
                    <h6>No attendance data loaded</h6>
                    <div>
                        Select a date and click Search.
                    </div>
                </div>
            </td>
        </tr>
    `);
}

function resetAttendanceDisplay(resetTable) {
    $("#totalStudentCount").text("0");
    $("#presentStudentCount").text("0");
    $("#absentStudentCount").text("0");
    $("#attendancePercentage").text("0%");

    $("#presentProgressText").text(
        "0 (0%)"
    );

    $("#absentProgressText").text(
        "0 (0%)"
    );

    $("#presentProgressBar").css(
        "width",
        "0%"
    );

    $("#absentProgressBar").css(
        "width",
        "0%"
    );

    $("#attendanceKpiMessage").text(
        "Select a date and click Search."
    );
    $(".attendance-export-option")
        .prop("disabled", true)
        .addClass("disabled");

    if (!resetTable) {
        return;
    }

    if (
        dayWiseAttendanceTable &&
        $.fn.DataTable.isDataTable(
            "#dayWiseAttendanceTable"
        )
    ) {
        dayWiseAttendanceTable
            .clear()
            .draw();

        return;
    }

    $("#dayWiseAttendanceBody").html(`
        <tr class="attendance-empty-row">
            <td colspan="8">
                <div class="attendance-empty-state">
                    <i class="bi bi-calendar2-check"></i>
                    <h6>No attendance data loaded</h6>
                    <div>
                        Select a date and click Search.
                    </div>
                </div>
            </td>
        </tr>
    `);
}

function setAttendanceLoading(isLoading) {
    const searchButton =
        $("#dayWiseSearchButton");

    searchButton.prop(
        "disabled",
        isLoading
    );

    $("#attendanceSearchLoader")
        .toggleClass(
            "d-none",
            !isLoading
        );

    $("#attendanceSearchIcon")
        .toggleClass(
            "d-none",
            isLoading
        );
}

function getAttendanceExportTitle() {
    const selectedDate =
        $("#datepicker").val();

    return selectedDate
        ? "Attendance Report - " +
        selectedDate
        : "Attendance Report";
}

function getAttendanceExportFileName() {
    const selectedDate =
        $("#datepicker").val();

    return selectedDate
        ? "Attendance-" + selectedDate
        : "Attendance-Report";
}

function clampPercentage(value) {
    const numberValue =
        Number(value) || 0;

    return Math.min(
        100,
        Math.max(0, numberValue)
    );
}

function showAttendanceMessage(
    icon,
    message
) {
    if (typeof Swal !== "undefined") {
        Swal.fire({
            icon: icon,
            title: "Attendance",
            text: message,
            confirmButtonColor:
                "midnightblue"
        });

        return;
    }

    alert(message);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function loadClassWiseAttendance() {

    const classId =
        $("#classWiseClassId").val();

    const dateFrom =
        $("#classWiseDateFrom").val();

    const apiUrl =
        $("#attendancePageConfig")
            .data("class-wise-url");

    clearClassWiseValidation();

    let isValid = true;
    const today = getTodayIsoDate();

    // Validate class
    if (!classId) {
        showFieldError(
            "#classWiseClassId",
            "#classWiseClassIdError",
            "Class is required."
        );

        isValid = false;
    }

    // Validate attendance date
    if (!dateFrom) {
        showFieldError(
            "#classWiseDateFrom",
            "#classWiseDateFromError",
            "Attendance date is required."
        );

        isValid = false;
    }

    // Block future attendance date
    if (dateFrom && dateFrom > today) {
        showFieldError(
            "#classWiseDateFrom",
            "#classWiseDateFromError",
            "Future dates are not allowed."
        );

        isValid = false;
    }

    if (!isValid) {
        $(".attendance-field-invalid")
            .first()
            .focus();

        return;
    }

    if (!apiUrl) {
        showAttendanceMessage(
            "error",
            "Class Wise Attendance API URL was not found."
        );

        return;
    }

    setClassWiseLoading(true);

    $.ajax({
        url: apiUrl,
        type: "GET",
        dataType: "json",
        cache: false,

        data: {
            classId: classId,
            date: dateFrom
        },

        success: function (response) {

            console.log(
                "Class Wise Attendance Response:",
                response
            );

            if (!response) {
                showAttendanceMessage(
                    "error",
                    "Empty response received from the server."
                );

                resetClassWiseDisplay(false);
                return;
            }

            if (response.success !== true) {
                showAttendanceMessage(
                    "warning",
                    response.message ||
                    "Class Wise attendance could not be loaded."
                );

                resetClassWiseDisplay(false);
                return;
            }

            bindClassWiseAttendance(response);
        },

        error: function (xhr) {

            console.error(
                "Class Wise Attendance API Error:",
                xhr
            );

            let errorMessage =
                "Unable to load Class Wise attendance.";

            if (
                xhr.responseJSON &&
                xhr.responseJSON.message
            ) {
                errorMessage =
                    xhr.responseJSON.message;
            }

            showAttendanceMessage(
                "error",
                errorMessage
            );

            resetClassWiseDisplay(false);
        },

        complete: function () {
            setClassWiseLoading(false);
        }
    });
}
function bindClassWiseAttendance(response) {

    const rawAttendanceRows =
        Array.isArray(response.attendance)
            ? response.attendance
            : Array.isArray(response.students)
                ? response.students
                : [];

    const attendanceRows =
        sortAttendanceRows(
            [...rawAttendanceRows]
        );

    const totalDays =
        Number(response.totalDays) || 0;

    const presentDays =
        Number(response.presentDays) || 0;

    const absentDays =
        Number(response.absentDays) || 0;

    const attendancePercentage =
        Number(response.attendancePercentage) || 0;

    $("#classWiseTotalDays").text(
        totalDays.toLocaleString()
    );

    $("#classWisePresentDays").text(
        presentDays.toLocaleString()
    );

    $("#classWiseAbsentDays").text(
        absentDays.toLocaleString()
    );

    $("#classWisePercentage").text(
        attendancePercentage.toFixed(1) + "%"
    );

    const selectedClassText =
        $("#classWiseClassId option:selected")
            .text()
            .trim();

    if (attendanceRows.length > 0) {
        $("#classWiseKpiMessage").text(
            selectedClassText +
            ": " +
            presentDays +
            " present and " +
            absentDays +
            " absent records."
        );
    } else {
        $("#classWiseKpiMessage").text(
            "No attendance records found for the selected class and date."
        );
    }

    initializeOrReloadClassWiseDataTable(
        attendanceRows
    );

    $(".class-wise-export-option")
        .prop(
            "disabled",
            attendanceRows.length === 0
        )
        .toggleClass(
            "disabled",
            attendanceRows.length === 0
        );

    if (attendanceRows.length === 0) {
        showAttendanceMessage(
            "info",
            response.message ||
            "No Class Wise attendance records found."
        );
    }
}

function initializeOrReloadClassWiseDataTable(
    attendanceRows
) {
    if (
        typeof $.fn.DataTable !== "function"
    ) {
        console.error(
            "DataTables is not loaded."
        );

        renderClassWiseAttendanceWithoutDataTable(
            attendanceRows
        );

        return;
    }

    if (
        $.fn.DataTable.isDataTable(
            "#classWiseAttendanceTable"
        )
    ) {
        classWiseAttendanceTable =
            $("#classWiseAttendanceTable")
                .DataTable();

        classWiseAttendanceTable
            .clear()
            .rows.add(attendanceRows)
            .draw();

        return;
    }

    $("#classWiseAttendanceBody").empty();

    classWiseAttendanceTable =
        $("#classWiseAttendanceTable")
            .DataTable({

                data: attendanceRows,

                processing: true,

                responsive: false,

                scrollX: true,

                autoWidth: false,

                pageLength: 10,

                lengthMenu: [
                    [10, 25, 50, 100],
                    [10, 25, 50, 100]
                ],

                order: [],
                ordering: true,

                columns: [
                    {
                        data: null,
                        className: "text-center",
                        orderable: false,
                        searchable: false,

                        defaultContent: ""
                    },
                    {
                        data: "admissionNo",
                        defaultContent: "N/A",
                        render: displayValue
                    },
                    {
                        data: "studentName",
                        defaultContent: "N/A",
                        render: displayValue
                    },
                    {
                        data: "className",
                        defaultContent: "N/A",
                        render: displayValue
                    },
                    {
                        data: "sectionName",
                        defaultContent: "N/A",
                        render: displayValue
                    },
                    {
                        data: "attendanceDate",
                        defaultContent: "N/A",
                        render: displayValue
                    },
                    
                    {
                        data: "vehicleNo",
                        defaultContent: "N/A",
                        render: displayValue
                    },
                    {
                        data: "rfid",
                        defaultContent: "N/A",
                        render: displayValue
                    },
                    {
                        data: "attendanceStatus",
                        className: "text-center",

                        render: function (data) {
                            const status = String(data || "")
                                .trim()
                                .toLowerCase();

                            if (status === "present") {
                                return `
                    <span class="attendance-status present">
                        Present
                    </span>
                `;
                            }

                            if (status === "absent") {
                                return `
                    <span class="attendance-status absent">
                        Absent
                    </span>
                `;
                            }

                            return `
                <span class="attendance-status">
                    ${escapeHtml(data || "N/A")}
                </span>
            `;
                        }
                    }
                ],

                dom:
                    "<'row align-items-center mb-3'" +
                    "<'col-12 col-md-6 text-center text-md-start'l>" +
                    "<'col-12 col-md-6 text-center text-md-end'f>" +
                    ">" +
                    "<'attendance-hidden-buttons'B>" +
                    "rt" +
                    "<'row align-items-center mt-3 attendance-table-footer'" +
                    "<'col-12 col-md-6 text-center text-md-start'i>" +
                    "<'col-12 col-md-6 d-flex justify-content-center justify-content-md-end'p>" +
                    ">",

                buttons: [
                    {
                        extend: "copyHtml5",
                        title:
                            getClassWiseExportTitle(),
                        className:
                            "class-wise-copy-button"
                    },
                    {
                        extend: "csvHtml5",
                        title:
                            getClassWiseExportTitle(),
                        filename:
                            getClassWiseExportFileName(),
                        className:
                            "class-wise-csv-button"
                    },
                    {
                        extend: "excelHtml5",
                        title:
                            getClassWiseExportTitle(),
                        filename:
                            getClassWiseExportFileName(),
                        className:
                            "class-wise-excel-button"
                    },
                    {
                        extend: "pdfHtml5",
                        title:
                            getClassWiseExportTitle(),
                        filename:
                            getClassWiseExportFileName(),
                        orientation: "landscape",
                        pageSize: "A4",
                        className:
                            "class-wise-pdf-button",

                        exportOptions: {
                            columns: ":visible"
                        },

                        customize: function (doc) {
                            doc.defaultStyle.fontSize = 8;

                            doc.styles
                                .tableHeader
                                .fontSize = 9;

                            doc.styles
                                .tableHeader
                                .alignment = "center";
                        }
                    },
                    {
                        extend: "print",
                        title:
                            getClassWiseExportTitle(),
                        className:
                            "class-wise-print-button",

                        exportOptions: {
                            columns: ":visible"
                        }
                    }
                ],

                language: {
                    emptyTable:
                        "No Class Wise attendance records found.",

                    zeroRecords:
                        "No matching attendance records found.",

                    search:
                        "Search:",

                    lengthMenu:
                        "Show _MENU_ entries",

                    info:
                        "Showing _START_ to _END_ of _TOTAL_ entries",

                    infoEmpty:
                        "Showing 0 to 0 of 0 entries"
                },
                drawCallback: function () {
                    var api = this.api();

                    api.column(0, { page: 'current' }).nodes().each(function (cell, i) {
                        cell.innerHTML = api.page.info().start + i + 1;
                    });
                }
           
            });
}
function renderClassWiseAttendanceWithoutDataTable(
    attendanceRows
) {
    const tableBody =
        document.getElementById(
            "classWiseAttendanceBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!attendanceRows.length) {
        tableBody.innerHTML = `
            <tr class="attendance-empty-row">
                <td colspan="10">
                    <div class="attendance-empty-state">
                        <i class="bi bi-person-check"></i>

                        <h6>
                            No Class Wise attendance found
                        </h6>

                        <div>
                            Select a class and date,
                            then click Search.
                        </div>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    attendanceRows.forEach(
        function (rowData, index) {

            const status =
                String(
                    rowData.attendanceStatus || ""
                )
                    .trim()
                    .toLowerCase();

            let statusClass = "";

            if (status === "present") {
                statusClass = "present";
            } else if (status === "absent") {
                statusClass = "absent";
            } else if (
                status === "unknown card"
            ) {
                statusClass = "unknown";
            }

            const row =
                document.createElement("tr");

            row.innerHTML = `
    <td class="text-center">
        ${index + 1}
    </td>

    <td>
        ${displayValue(rowData.admissionNo)}
    </td>

    <td>
        ${displayValue(rowData.studentName)}
    </td>

    <td>
        ${displayValue(rowData.className)}
    </td>

    <td>
        ${displayValue(rowData.sectionName)}
    </td>

    <td>
        ${displayValue(rowData.attendanceDate)}
    </td>

   

    <td>
        ${displayValue(rowData.vehicleNo)}
    </td>

    <td>
        ${displayValue(rowData.rfid)}
    </td>

    <td class="text-center">
        <span class="attendance-status ${statusClass}">
            ${escapeHtml(
                rowData.attendanceStatus || "N/A"
            )}
        </span>
    </td>
`;

            tableBody.appendChild(row);
        }
    );
}

function resetClassWiseAttendance() {

    $("#classWiseClassId").val("");

    $("#classWiseDateFrom")
        .val("");

    clearClassWiseValidation();

    resetClassWiseDisplay(true);
}
function resetClassWiseDisplay(resetTable) {

    $("#classWiseTotalDays").text("0");
    $("#classWisePresentDays").text("0");
    $("#classWiseAbsentDays").text("0");
    $("#classWisePercentage").text("0%");

    $("#classWiseKpiMessage").text(
        "Select a class and date, then click Search."
    );

    $(".class-wise-export-option")
        .prop("disabled", true)
        .addClass("disabled");

    if (!resetTable) {
        return;
    }

    if (
        typeof $.fn.DataTable === "function" &&
        $.fn.DataTable.isDataTable(
            "#classWiseAttendanceTable"
        )
    ) {
        const table =
            $("#classWiseAttendanceTable")
                .DataTable();

        table
            .search("")
            .clear()
            .draw();

        return;
    }

    $("#classWiseAttendanceBody").html(`
        <tr class="attendance-empty-row">
            <td colspan="9">
                <div class="attendance-empty-state">
                    <i class="bi bi-person-check"></i>

                    <h6>
                        No Class Wise attendance loaded
                    </h6>

                    <div>
                        Select a class and date,
                        then click Search.
                    </div>
                </div>
            </td>
        </tr>
    `);
}
function setClassWiseLoading(isLoading) {

    $("#classWiseSearchButton")
        .prop("disabled", isLoading);

    $("#classWiseSearchLoader")
        .toggleClass(
            "d-none",
            !isLoading
        );

    $("#classWiseSearchIcon")
        .toggleClass(
            "d-none",
            isLoading
        );
}
function triggerClassWiseExport(
    exportType
) {
    if (
        !classWiseAttendanceTable ||
        !$.fn.DataTable.isDataTable(
            "#classWiseAttendanceTable"
        )
    ) {
        showAttendanceMessage(
            "warning",
            "Please load Class Wise attendance before exporting."
        );

        return;
    }

    const exportButtonMap = {
        copy: 0,
        csv: 1,
        excel: 2,
        pdf: 3,
        print: 4
    };

    const buttonIndex =
        exportButtonMap[exportType];

    if (
        buttonIndex === undefined ||
        buttonIndex === null
    ) {
        showAttendanceMessage(
            "warning",
            "Invalid export option selected."
        );

        return;
    }

    classWiseAttendanceTable
        .button(buttonIndex)
        .trigger();
}
function getClassWiseExportTitle() {

    const className =
        $("#classWiseClassId option:selected")
            .text()
            .trim();

    const dateFrom =
        $("#classWiseDateFrom").val();

    return (
        "Class Wise Attendance - " +
        className +
        " - " +
        dateFrom
    );
}
function getClassWiseExportFileName() {

    const className =
        $("#classWiseClassId option:selected")
            .text()
            .trim()
            .replace(/[^a-zA-Z0-9-_]/g, "-");

    const dateFrom =
        $("#classWiseDateFrom").val();

    return (
        "Class-Attendance-" +
        className +
        "-" +
        dateFrom
    );
}
function displayValue(value) {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return "N/A";
    }

    return escapeHtml(value);
}
function getClassSortOrder(className) {

    const classOrder = {
        "PRE PRIMARY": 1,
        "PRE SCHOOL": 2,
        "NURSERY": 3,
        "PRE NURSERY": 4,
        "K.G./BAL VATIKA 1": 5,
        "UKG/BAL VATIKA 3": 6,

        "I": 7,
        "II": 8,
        "III": 9,
        "IV": 10,
        "V": 11,
        "VI": 12,
        "VII": 13,
        "VIII": 14,
        "IX": 15,
        "X": 16,
        "XI": 17,
        "XII": 18
    };

    const normalizedClass = String(className || "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

    return classOrder[normalizedClass] || 999;
}

function getAttendanceStatusOrder(status) {

    const statusOrder = {
        "present": 1,
        "absent": 2,
        "unknown card": 3
    };

    return statusOrder[status] || 999;
}
