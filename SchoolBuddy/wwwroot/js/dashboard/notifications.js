// Alerts / notifications panel.
// Moved out of Views/Home/Dashboard/Dashboard.cshtml; server values come from window.sbDashboard.

document.addEventListener("DOMContentLoaded", function () {
    /* =========================================================
       INITIAL NOTIFICATION DATA
       ========================================================= */

    const dashboardAlerts = window.sbDashboard.alerts;

    let currentAlertData = Array.isArray(dashboardAlerts)
        ? dashboardAlerts
        : [];

    let alertNotificationDataTable = null;


    /* =========================================================
       MODAL OPEN
       ========================================================= */

    $(document).ready(function () {

        const alertModal =
            document.getElementById("alertNotificationModal");

        if (alertModal) {

            alertModal.addEventListener(
                "shown.bs.modal",
                function () {

                    renderAlertNotificationTable(
                        currentAlertData
                    );
                }
            );
        }

        renderAlertNotificationTable(currentAlertData);


        /* =====================================================
           FILTER FORM SUBMIT
           ===================================================== */

        $("#notificationFilterForm").on(
            "submit",
            function (event) {

                event.preventDefault();

                filterNotifications();

                return false;
            }
        );


        /* =====================================================
           RESET FILTER
           ===================================================== */

        $("#resetNotificationFilter").on(
            "click",
            function () {

                $("#notificationStatus").val("0");

                /*
                 * This function already exists in your
                 * Flatpickr script.
                 */
                if (
                    typeof setNotificationDefaultDateTime ===
                    "function"
                ) {
                    setNotificationDefaultDateTime();
                }

                $("#notificationFilterError")
                    .addClass("d-none")
                    .text("");

                currentAlertData = Array.isArray(dashboardAlerts)
                    ? dashboardAlerts
                    : [];

                renderAlertNotificationTable(
                    currentAlertData
                );
            }
        );
    });


    /* =========================================================
       BUILD NOTIFICATION TABLE
       ========================================================= */

    function bindAlertNotificationTable(alerts) {

        const tableSelector =
            "#alertNotificationTable";

        const tableBody =
            $("#alertNotificationTableBody");

        /*
         * Destroy the previous DataTable before changing
         * the tbody HTML.
         */
        if ($.fn.DataTable.isDataTable(tableSelector)) {

            $(tableSelector)
                .DataTable()
                .clear()
                .destroy();

            alertNotificationDataTable = null;
        }

        tableBody.empty();

        if (!Array.isArray(alerts) || alerts.length === 0) {

            tableBody.html(`
                <tr class="empty-row">
                    <td colspan="6"
                        class="text-center align-middle text-muted">
                        No alerts found.
                    </td>
                </tr>
            `);

            return;
        }

        alerts.forEach(function (item, index) {

            const notification =
                normalizeNotificationItem(item);

            const statusHtml =
                notification.isRead === 1
                    ? `
                        <span class="alert-status-pill
                                     text-success fw-semibold">
                            Read
                        </span>
                      `
                    : `
                        <span class="alert-status-pill
                                     text-danger fw-semibold">
                            New
                        </span>
                      `;

            const row = $(`
                <tr class="notification-click-row"
                    title="Click to view notification details">

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        <span class="alert-type-text">
                            ${escapeAlertHtml(
                                notification.msgStatus
                            )}
                        </span>
                    </td>

                    <td class="fw-semibold">
                        ${escapeAlertHtml(
                            notification.vehicle
                        )}
                    </td>

                    <td class="alert-message-cell">
                        ${escapeAlertHtml(
                            notification.message
                        )}
                    </td>

                    <td class="alert-date-cell">
                        ${formatAlertDate(
                            notification.sentOn
                        )}
                    </td>

                    <td class="notification-read-status">
                        ${statusHtml}
                    </td>

                </tr>
            `);

            /*
             * Store the complete notification object
             * against the generated row.
             */
            row.data(
                "notification",
                notification
            );

            tableBody.append(row);
        });

        alertNotificationDataTable =
            $(tableSelector).DataTable({

                pageLength: 10,

                lengthMenu: [
                    5,
                    10,
                    25,
                    50
                ],

                responsive: false,
                autoWidth: false,
                ordering: true,
                searching: true,
                info: true,
                paging: true,
                destroy: true,
                scrollY: "36vh",
                scrollCollapse: true,

                language: {
                    search: "Search:",
                    lengthMenu:
                        "Show _MENU_ entries",
                    info:
                        "Showing _START_ to _END_ of _TOTAL_ entries",
                    emptyTable:
                        "No alerts found",
                    zeroRecords:
                        "No matching alerts found"
                },

                columnDefs: [
                    {
                        targets: 0,
                        orderable: false,
                        searchable: false
                    }
                ]
            });

        setTimeout(function () {

            if (alertNotificationDataTable) {

                alertNotificationDataTable
                    .columns
                    .adjust()
                    .draw(false);
            }

        }, 150);
    }


    /*
     * One render path for the initial server list, reset and search results.
     * bindAlertNotificationTable destroys the old DataTable and empties the
     * tbody before it creates rows for the supplied list.
     */
    function renderAlertNotificationTable(alerts) {

        bindAlertNotificationTable(
            Array.isArray(alerts)
                ? alerts
                : []
        );
    }

    /* =========================================================
       NORMALIZE API/VIEWBAG PROPERTY NAMES
       ========================================================= */

    function normalizeNotificationItem(item) {

        item = item || {};

        const message =
            item.Message ??
            item.message ??
            "-";

        return {

            id: Number(
                item.Id ??
                item.id ??
                0
            ),

            msgStatus:
                item.MsgStatus ??
                item.msgStatus ??
                item.msg_status ??
                "-",

            message: message,

            vehicle:
    item.Vehicle ??
    item.vehicle ??
    window.getVehicleFromMessage(message),

            sentOn:
                item.SentOn ??
                item.sentOn ??
                item.sent_on ??
                null,

            latitude:
                item.GpsLatitude ??
                item.gpsLatitude ??
                item.gps_latitude ??
                null,

            longitude:
                item.GpsLongitude ??
                item.gpsLongitude ??
                item.gps_longitude ??
                null,

            isRead: Number(
                item.IsRead ??
                item.isRead ??
                item.is_read ??
                0
            )
        };
    }


    /* =========================================================
       ROW CLICK
       ========================================================= */

    $(document).on(
        "click",
        "#alertNotificationTable tbody tr.notification-click-row",
        function () {

            const clickedRow = $(this);

            const notification =
                clickedRow.data("notification");

            if (!notification) {
                return;
            }

            /*
             * Open SweetAlert with the clicked row data.
             */
            showNotificationDetailSwal(
                notification
            );

            /*
             * Call the API only when:
             * 1. ID is valid.
             * 2. Notification is currently unread.
             */
            if (
                notification.id > 0 &&
                notification.isRead !== 1
            ) {
                markNotificationAsRead(
                    notification,
                    clickedRow
                );
            }
        }
    );


    /* =========================================================
       SWEETALERT NOTIFICATION DETAIL
       ========================================================= */

    function showNotificationDetailSwal(
        notification
    ) {
       console.log("Notification object:", notification);
    console.log("Latitude:", notification.latitude, 
                "Type:", typeof notification.latitude);
    console.log("Longitude:", notification.longitude, 
                "Type:", typeof notification.longitude);


        const hasLocation =
            hasValidCoordinate(
                notification.latitude
            ) &&
            hasValidCoordinate(
                notification.longitude
            );

        const latitude = hasLocation
            ? notification.latitude
            : "-";

        const longitude = hasLocation
            ? notification.longitude
            : "-";

        Swal.fire({

            width: 520,



            showConfirmButton: true,

            confirmButtonText: "Close",

            confirmButtonColor: "#6c757d",

            html: `
                <div style="
                    border:1px solid #cbd5e1;
                    border-radius:7px;
                    padding:17px;
                    text-align:left;
                ">

                    <div style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        flex-wrap:wrap;
                        gap:12px;
                        margin-bottom:18px;
                    ">

                        <span style="
                            color:#0369a1;
                            font-size:1rem;
                            font-weight:700;
                            text-decoration:underline;
                        ">
                            Notification Detail
                        </span>

                        ${
                            hasLocation
                                ? `
                                    <button type="button"
                                            id="notificationViewLocationButton"
                                            class="btn btn-primary btn-sm">

                                        <i class="bi bi-geo-alt-fill me-1"></i>
                                        View Location

                                    </button>
                                  `
                                : ""
                        }

                    </div>

                    <div style="margin-bottom:13px;">

                        <div style="
                            color:#0f172a;
                            font-weight:700;
                        ">
                            Notification Alert Type:
                        </div>

                        <div style="color:#334155;">
                            ${escapeAlertHtml(
                                notification.msgStatus
                            )}
                        </div>

                    </div>

                    <div style="margin-bottom:13px;">

                        <div style="
                            color:#0f172a;
                            font-weight:700;
                        ">
                            Vehicle:
                        </div>

                        <div style="color:#334155;">
                            ${escapeAlertHtml(
                                notification.vehicle
                            )}
                        </div>

                    </div>

                    <div style="margin-bottom:13px;">

                        <div style="
                            color:#0f172a;
                            font-weight:700;
                        ">
                            Message:
                        </div>

                        <div style="
                            color:#334155;
                            line-height:1.5;
                            overflow-wrap:anywhere;
                        ">
                            ${escapeAlertHtml(
                                notification.message
                            )}
                        </div>

                    </div>

                    <div style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        flex-wrap:wrap;
                        gap:12px;
                        margin-bottom:13px;
                    ">

                        <div style="color:#334155;">

                            <i class="
                                bi bi-geo-alt-fill
                                text-success me-2
                            "></i>

                            ${escapeAlertHtml(latitude)}

                        </div>

                        <div style="color:#334155;">

                            <i class="
                                bi bi-crosshair
                                text-primary me-2
                            "></i>

                            ${escapeAlertHtml(longitude)}

                        </div>

                    </div>

                    <div>

                        <div style="
                            color:#0f172a;
                            font-weight:700;
                        ">
                            Notification Sent On:
                        </div>

                        <div style="color:#334155;">
                            ${escapeAlertHtml(
                                formatNotificationDetailDate(
                                    notification.sentOn
                                )
                            )}
                        </div>

                    </div>

                </div>
            `,

            didOpen: function () {

                const locationButton =
                    document.getElementById(
                        "notificationViewLocationButton"
                    );

                if (!locationButton) {
                    return;
                }

                locationButton.addEventListener(
                    "click",
                    function () {

                        const mapUrl =
                            "https://www.google.com/maps?q=" +
                            encodeURIComponent(
                                notification.latitude
                            ) +
                            "," +
                            encodeURIComponent(
                                notification.longitude
                            );

                        window.open(
                            mapUrl,
                            "_blank",
                            "noopener,noreferrer"
                        );
                    }
                );
            }
        });
    }


    /* =========================================================
       MARK NOTIFICATION AS READ API
       ========================================================= */

    function markNotificationAsRead(
        notification,
        clickedRow
    ) {

        /*
         * Prevent multiple requests if the user clicks
         * the same row repeatedly before the response.
         */
        if (clickedRow.data("request-running") === true) {
            return;
        }

        clickedRow.data(
            "request-running",
            true
        );

        $.ajax({

            url: window.sbDashboard.markNotificationAsReadUrl,

            type: "POST",

            contentType:
                "application/json; charset=utf-8",

            dataType: "json",

            data: JSON.stringify({
                id: notification.id
            }),

            success: function (response) {

                if (
                    !response ||
                    response.success !== true
                ) {

                    return;
                }

                notification.isRead = 1;

                /*
                 * Update the status in the clicked row.
                 */
                clickedRow
                    .find(
                        ".notification-read-status"
                    )
                    .html(`
                        <span class="
                            alert-status-pill
                            text-success
                            fw-semibold
                        ">
                            Read
                        </span>
                    `);

                /*
                 * Update ViewBag-originated local array.
                 */
                updateNotificationStatusInArray(
                    dashboardAlerts,
                    notification.id
                );

                /*
                 * Update filtered/current array.
                 */
                updateNotificationStatusInArray(
                    currentAlertData,
                    notification.id
                );
            },

            error: function (
                xhr,
                status,
                error
            ) {

            },

            complete: function () {

                clickedRow.data(
                    "request-running",
                    false
                );
            }
        });
    }


    /* =========================================================
       FILTER NOTIFICATIONS
       ========================================================= */

    function filterNotifications() {

        const notificationStatus =
            $("#notificationStatus").val();

        const startDate =
            $("#notificationStartDate")
                .val()
                .trim();

        const startTime =
            $("#notificationStartTime")
                .val()
                .trim();

        const endDate =
            $("#notificationEndDate")
                .val()
                .trim();

        const endTime =
            $("#notificationEndTime")
                .val()
                .trim();

        const errorElement =
            $("#notificationFilterError");

        const submitButton =
            $("#notificationFilterSubmit");

        errorElement
            .addClass("d-none")
            .text("");

        if (
            !startDate ||
            !startTime ||
            !endDate ||
            !endTime
        ) {
            showNotificationFilterError(
                "Please select start and end date/time."
            );

            return;
        }

        const startDateTime =
            createLocalDateTime(
                startDate,
                startTime
            );

        const endDateTime =
            createLocalDateTime(
                endDate,
                endTime
            );

        if (
            !startDateTime ||
            !endDateTime
        ) {
            showNotificationFilterError(
                "Please select valid date and time values."
            );

            return;
        }

        if (
            startDateTime.getTime() >
            endDateTime.getTime()
        ) {
            showNotificationFilterError(
                "Start date/time cannot be greater than end date/time."
            );

            return;
        }

        const now = new Date();

        if (
            endDateTime.getTime() >
            now.getTime()
        ) {
            showNotificationFilterError(
                "End date/time cannot be greater than the current date/time."
            );

            return;
        }

        submitButton
            .prop("disabled", true)
            .html(`
                <span class="
                    spinner-border
                    spinner-border-sm
                "
                role="status">
                </span>
            `);

        $.ajax({

            url: window.sbDashboard.filterNotificationsUrl,

            type: "POST",

            data: {
                notificationStatus:
                    notificationStatus,

                startDate:
                    startDate,

                startTime:
                    startTime,

                endDate:
                    endDate,

                endTime:
                    endTime
            },

            success: function (response) {



                let alerts = response;

                /*
                 * Supports:
                 * response = [...]
                 * or
                 * response = { data: [...] }
                 */
                if (
                    response &&
                    response.data !== undefined
                ) {
                    alerts = response.data;
                }

                if (!Array.isArray(alerts)) {
                    alerts = [];
                }

                currentAlertData = alerts;

                /*
                 * Clear old rows and show the current response,
                 * including an empty-table message.
                 */
                clearAndFillAlertTable(
                    currentAlertData
                );

                if (alerts.length === 0) {

                    Swal.fire({
                        icon: "info",
                        title: "No Data Found",
                        text:
                            "No alerts found for the selected filter.",
                        confirmButtonText: "OK"
                    });
                }
            },

            error: function (
                xhr,
                status,
                error
            ) {


                const errorMessage =
                    xhr.responseJSON?.message ||
                    xhr.responseText ||
                    "Unable to load notifications.";

                errorElement
                    .removeClass("d-none")
                    .text(errorMessage);

                Swal.fire({
                    icon: "error",
                    title:
                        "Unable to Load Notifications",
                    text:
                        errorMessage,
                    confirmButtonText:
                        "OK"
                });
            },

            complete: function () {

                submitButton
                    .prop("disabled", false)
                    .html(`
                        <i class="bi bi-search fs-6"></i>
                    `);
            }
        });
    }


    /* =========================================================
       FILTER TABLE REFRESH
       ========================================================= */

    function clearAndFillAlertTable(alerts) {

        renderAlertNotificationTable(alerts);
    }


    /* =========================================================
       HELPER FUNCTIONS
       ========================================================= */

    window.getVehicleFromMessage = function (message) {

        if (!message) {
            return "-";
        }

        const words = String(message)
            .trim()
            .split(/\s+/);

        const vehicleIndex =
            words.findIndex(function (word) {

                return word
                    .replace(/[,:;]/g, "")
                    .toLowerCase() ===
                    "vehicle";
            });

        if (
            vehicleIndex >= 0 &&
            vehicleIndex + 1 < words.length
        ) {
            return words[vehicleIndex + 1]
                .replace(/[,.]+$/, "");
        }

        return "-";
    }


    function escapeAlertHtml(value) {

        return $("<div>")
            .text(
                value === null ||
                value === undefined
                    ? ""
                    : String(value)
            )
            .html();
    }


    function formatAlertDate(value) {

        const date =
            parseNotificationDate(value);

        if (!date) {
            return escapeAlertHtml(
                value || "-"
            );
        }

        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            }
        );
    }


    function formatNotificationDetailDate(value) {

        const date =
            parseNotificationDate(value);

        if (!date) {
            return value || "-";
        }

        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            }
        );
    }


    function parseNotificationDate(value) {

        if (!value) {
            return null;
        }

        if (value instanceof Date) {

            return Number.isNaN(
                value.getTime()
            )
                ? null
                : value;
        }

        /*
         * Supports API format:
         * 2026-07-17 15:04:13.003
         */
        const normalizedValue =
            String(value)
                .trim()
                .replace(" ", "T");

        const date =
            new Date(normalizedValue);

        return Number.isNaN(
            date.getTime()
        )
            ? null
            : date;
    }


    function createLocalDateTime(
        dateValue,
        timeValue
    ) {

        const dateTime =
            new Date(
                `${dateValue}T${timeValue}:00`
            );

        return Number.isNaN(
            dateTime.getTime()
        )
            ? null
            : dateTime;
    }


window.hasValidCoordinate = function (value) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return false;
        }

        return Number.isFinite(
            Number(value)
        );
    }


    function showNotificationFilterError(
        message
    ) {

        $("#notificationFilterError")
            .removeClass("d-none")
            .text(message);
    }


    function updateNotificationStatusInArray(
        alerts,
        notificationId
    ) {

        if (!Array.isArray(alerts)) {
            return;
        }

        const alertItem =
            alerts.find(function (item) {

                return Number(
                    item.Id ??
                    item.id ??
                    0
                ) === Number(
                    notificationId
                );
            });

        if (!alertItem) {
            return;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                alertItem,
                "IsRead"
            )
        ) {
            alertItem.IsRead = 1;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                alertItem,
                "isRead"
            )
        ) {
            alertItem.isRead = 1;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                alertItem,
                "is_read"
            )
        ) {
            alertItem.is_read = 1;
        }
    }
});
