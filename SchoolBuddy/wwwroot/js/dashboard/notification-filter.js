// Notification filter form.
// Moved out of Views/Home/Dashboard/Dashboard.cshtml; server values come from window.sbDashboard.

    document.addEventListener("DOMContentLoaded", function () {
    const notificationFilterForm = document.getElementById("notificationFilterForm");

    if (!notificationFilterForm) {
        return;
    }

    notificationFilterForm.addEventListener("submit", function (e) {

    e.preventDefault();
    e.stopPropagation();


    const notificationStatus =
    $("#notificationStatus").val();

    const startDate =
    $("#notificationStartDate").val()?.trim();

    const startTime =
    $("#notificationStartTime").val()?.trim();

    const endDate =
    $("#notificationEndDate").val()?.trim();

    const endTime =
    $("#notificationEndTime").val()?.trim();

    const errorElement =
    $("#notificationFilterError");

    const submitButton =
    $("#notificationFilterSubmit");

    errorElement
    .addClass("d-none")
    .text("");

    if (!startDate ||
    !startTime ||
    !endDate ||
    !endTime) {

    errorElement
    .removeClass("d-none")
    .text("Please enter start and end date/time.");

    return false;
    }

    const startDateTime =
    new Date(`${startDate}T${startTime}:00`);

    const endDateTime =
    new Date(`${endDate}T${endTime}:00`);

    if (Number.isNaN(startDateTime.getTime()) ||
    Number.isNaN(endDateTime.getTime())) {

    errorElement
    .removeClass("d-none")
    .text("Please enter a valid date and time.");

    return false;
    }

    if (startDateTime > endDateTime) {

    errorElement
    .removeClass("d-none")
    .text(
    "Start date/time cannot be greater than end date/time."
    );

    return false;
    }

    const requestUrl =
    window.sbDashboard.filterNotificationsUrl;


    submitButton
    .prop("disabled", true)
    .html(`
    <span class="spinner-border spinner-border-sm"
    role="status">
    </span>
    `);

    $.ajax({
    url: requestUrl,
    type: "POST",

    data: {
    notificationStatus: notificationStatus,
    startDate: startDate,
    startTime: startTime,
    endDate: endDate,
    endTime: endTime
    },

    beforeSend: function () {
    },

    success: function (response) {


    let alerts = response;

    if (response &&
    response.data !== undefined) {

    alerts = response.data;
    }

    if (!Array.isArray(alerts)) {
    alerts = [];
    }
    if (alerts.length === 0) {

    Swal.fire({
    icon: "info",
    title: "No Data Found",
    text: "No alerts found for the selected filter.",
    confirmButtonText: "OK"
    });

    return;
    }

    clearAndFillAlertTable(alerts);
    },

    error: function (xhr, status, error) {



    const errorMessage =
    xhr.responseJSON?.message ||
    xhr.responseText ||
    `Request failed with status ${xhr.status}.`;

    Swal.fire({
    icon: "error",
    title: "Unable to Load Notifications",
    text: errorMessage,
    confirmButtonText: "OK"
    });

    errorElement
    .removeClass("d-none")
    .text(errorMessage);
    },

    complete: function () {

    submitButton
    .prop("disabled", false)
    .html('<i class="bi bi-search"></i>');
    }
    });

    return false;
    });
    });
function updateDashboardNotificationStatus(notificationId) {

    const alertItem =
        dashboardAlerts.find(function (item) {

            return Number(
                item.Id ??
                item.id ??
                0
            ) === Number(notificationId);
        });

    if (!alertItem) {
        return;
    }

    if ("IsRead" in alertItem) {
        alertItem.IsRead = 1;
    }

    if ("isRead" in alertItem) {
        alertItem.isRead = 1;
    }

    if ("is_read" in alertItem) {
        alertItem.is_read = 1;
    }
}

function downloadExcel() {
    $('.buttons-excel').click();
}

function downloadCSV() {
    $('.buttons-csv').click();
}

function downloadPDF() {
    $('.buttons-pdf').click();
}

function printTable() {
    $('.buttons-print').click();
}
