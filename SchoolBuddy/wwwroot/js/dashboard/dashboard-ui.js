// Dashboard error dialog and shared UI helpers.
// Moved out of Views/Home/Dashboard/Dashboard.cshtml.

        function showDashboardError(options) {

        const config = options || {};
        const title = config.title || "Unable to load data";
        const message = config.message || "Please try again.";
        const context = config.context || "Dashboard";
        const detail = config.detail || "";

        $("#dashboardErrorTitle").text(title);
        $("#dashboardErrorContext").text(context);
        $("#dashboardErrorMessage").text(message);

        if (detail) {
        $("#dashboardErrorDetail").text(detail).show();
        } else {
        $("#dashboardErrorDetail").hide().text("");
        }

        const modal = new bootstrap.Modal(
        document.getElementById("dashboardErrorModal")
        );

        modal.show();
        }

        function parseDashboardResponse(response, context) {
        if (response === null || response === undefined || response === "" || response === "0") {
        showDashboardError({
        title: "No data available",
        context: context,
        message: "There are no records available for this dashboard section right now."
        });
        return null;
        }

        if (Array.isArray(response)) {
        if (response.length === 0) {
        showDashboardError({
        title: "No data available",
        context: context,
        message: "There are no records available for this dashboard section right now."
        });
        return null;
        }

        return response;
        }

        try {
        const data = JSON.parse(response);

        if (!Array.isArray(data) || data.length === 0) {
        showDashboardError({
        title: "No data available",
        context: context,
        message: "There are no records available for this dashboard section right now."
        });
        return null;
        }

        return data;
        } catch (e) {
        showDashboardError({
        title: "Unable to parse JSON",
        context: context,
        message: "The server returned data in an unexpected format.",
        detail: e.message
        });
        return null;
        }
        }

        function showDashboardAjaxError(xhr, status, error, context) {
        showDashboardError({
        title: "Unable to load data",
        context: context,
        message: "The request could not be completed. Please refresh the dashboard and try again.",
        detail: error || status || (xhr && xhr.status ? "Status code: " + xhr.status : "")
        });
        }

        function getstudentsummary(){
         var table;

if ($.fn.DataTable.isDataTable('#tablestudents')) {
    table = $('#tablestudents').DataTable();
    table.clear().draw();
} else {
    table = $('#tablestudents').DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        scrollY: '55vh',
        scrollCollapse: true,
        autoWidth: false
    });
}
        table.clear().draw();
        $.ajax({
        //url: '/Home/TotalStudentSummary',
        url: '/schoolbuddy/Home/TotalStudentSummary',

        type:'GET',
        success: function (response) {

        let data = parseDashboardResponse(response, "Students");
        if (!data) {
        return;
        }
        var sno = 0;
        // Prepare data array for bulk addition
        let rows = data.map(item => [
        ++sno||"",
        item.student_name || "",
        item.father_name || "",
        item.class_name || "",
        item.mobile_no1 || "",
        item.rf_id || "",

        item.admission_no || "",
        item.route_names || ""
        ]);

        // Add all rows in a single operation
        table.rows.add(rows).draw();
        $('#totalnumofstudents').modal('show');
        },
        error: function (xhr, status, error) {
        showDashboardAjaxError(xhr, status, error, "Students");
        }

        })
        }

        function gettodaynotificationsummary(){
        var table = $("#tablestodaynotifications").DataTable();
        table.clear().draw();

        $.ajax({
        url: '/schoolbuddy/Home/TodaynotificationSummary',
        type:'GET',

        success: function (response) {
        let data = parseDashboardResponse(response, "Today's Notifications");
        if (!data) {
        return;
        }
        var sno = 0;
        // Prepare data array for bulk addition
        let rows = data.map(item => [
        ++sno||"",
        item.student_name || "",
        item.admission_no || "",
        item.mobile_no1 || "",
        // item.route_name || "",
        item.message || "",

        item.date_time || ""

        ]);

        // Add all rows in a single operation
        table.rows.add(rows).draw();
        $('#todaysnotification').modal('show');
        },
        error: function (xhr, status, error) {
        showDashboardAjaxError(xhr, status, error, "Today's Notifications");
        }

        })
        }



        let page = 1;
        const pageSize = 1000;
        let isFirstLoad = true;

        function getnotificationsummary() {

        $.ajax({
        url: '/schoolbuddy/Home/TotalnotificationSummary',
        type: 'GET',
        data: {
        page: page,
        pageSize: pageSize
        },
        success: function (response) {

        let data = parseDashboardResponse(response, "Total Notifications");

        if (!data || data.length === 0)
        return;

        var table = $("#tabletotalnoify").DataTable();

        // Clear only first time
        if (isFirstLoad) {
        table.clear().draw();
        $('#totalnotifications').modal('show');
        isFirstLoad = false;
        }

        let sno = table.rows().count();

        let rows = data.map(item => [
        ++sno,
        item.student_name || "",
        item.admission_no || "",
        item.mobile_no1 || "",
        item.route_name || "",
        item.message || "",
        item.date_time || ""
        ]);

        // Append new rows
        table.rows.add(rows).draw(false);

        page++;

        // Load next page automatically
        if (data.length === pageSize) {
        getnotificationsummary();
        }
        }
        });
        }


        function gettodaybusessummary() {

    const table = $("#tablebuses").DataTable();

    table.clear().draw();

    $.ajax({
        url: "/schoolbuddy/Home/TotalBusesSummary",
        type: "GET",

        success: function (response) {

            const data = parseDashboardResponse(response, "Buses");

            if (!data) {
                return;
            }

            // Group by vehicle number and IMEI
            const groupedBuses = Object.values(
                data.reduce((result, item) => {

                    const vehicleNumber = item.veh_reg || "";
                    const imei = item.imei || "";
                    const key = `${vehicleNumber}_${imei}`;

                    if (!result[key]) {
                        result[key] = {
                            veh_reg: vehicleNumber,
                            imei: imei,
                            routes: [],
                            vehicle_status: item.vehicle_status || ""
                        };
                    }

                    if (
                        item.route_name &&
                        !result[key].routes.includes(item.route_name)
                    ) {
                        result[key].routes.push(item.route_name);
                    }

                    return result;
                }, {})
            );

            let sno = 0;

            const rows = groupedBuses.map(item => {

                const routeHtml = item.routes.length
                    ? `
                        <ul class="route-list mb-0 ps-3">
                            ${item.routes
                                .map(route =>
                                    `<li>${escapeHtml(route)}</li>`
                                )
                                .join("")}
                        </ul>
                      `
                    : "-";

                return [
                    ++sno,
                    escapeHtml(item.veh_reg),
                    escapeHtml(item.imei),
                    routeHtml,
                    getVehicleStatusBadge(item.vehicle_status)
                ];
            });

            table.rows.add(rows).draw();

            $("#totalnumofbus").modal("show");
        },

        error: function (xhr, status, error) {
            showDashboardAjaxError(
                xhr,
                status,
                error,
                "Buses"
            );
        }
    });
}

function escapeHtml(value) {
    return $("<div>").text(value ?? "").html();
}

function getVehicleStatusBadge(status) {

    const statusText = status || "-";
    const normalizedStatus = statusText
        .toString()
        .trim()
        .toLowerCase();

    let badgeClass = "bg-secondary";

    if (
        normalizedStatus === "live" ||
        normalizedStatus === "active"
    ) {
        badgeClass = "bg-success";
    } else if (
        normalizedStatus === "stopped" ||
        normalizedStatus === "inactive"
    ) {
        badgeClass = "bg-danger";
    } else if (normalizedStatus === "idle") {
        badgeClass = "bg-warning text-dark";
    }

    return `
        <span class="badge ${badgeClass}">
            ${escapeHtml(statusText)}
        </span>
    `;
}



        async function getliveroutessummary() {
        var table = $("#tableliveroutes").DataTable();
        table.clear().draw();

        try {
        // Fetch the data from the server asynchronously
        const response = await fetchLiveRoutesSummary();

        let data = parseDashboardResponse(response, "Live Routes");
        if (!data) {
        return;
        }

        var sno = 0;

        // // Use Promise.all to handle async GetAddress calls and wait for all addresses to be fetched
        // let rows = await Promise.all(data.map(async (item) => {
        // // Fetch the address asynchronously
        // let address = await GetAddress(item.gps_latitude, item.gps_longitude);
        const rows = await Promise.all(
            data.map(async (item, index) => {
                let address = "";

                try {
                    address = await GetAddress(
                        item.gps_latitude,
                        item.gps_longitude
                    );
                } catch (error) {
                    console.error(
                        `Unable to get address for ${item.veh_reg}:`,
                        error
                    );
                }

        // Return the row with the fetched address
        return [
        ++sno || "",  // Serial number increment
        item.imei || "",
        item.veh_reg || "",
        item.gps_time || "",
        address || "",  // Address from GetAddress
        // item.gps_latitude || "",
        // item.gps_longitude || "",
        item.gps_speed || "",
        // item.firmware_version || "",
        item.i2 || "ON" ,
        item.battery_voltage || "",
        item.signal_strength || ""
        ];
        }));

        // After all rows are generated, add them to the table and redraw
        table.rows.add(rows).draw();

        // Show the modal after data is added
        $('#liveroutes').modal('show');

        } catch (error) {
        showDashboardError({
        title: "Unable to load data",
        context: "Live Routes",
        message: "The request could not be completed. Please refresh the dashboard and try again.",
        detail: error
        });
        }
        }

        // Async function to fetch data from the server
        function fetchLiveRoutesSummary() {
        return new Promise((resolve, reject) => {
        $.ajax({
        url: '/schoolbuddy/Home/TotalLiveRoutesSummary',
        type: 'GET',
        success: resolve,  // Resolve the promise with the response data
        error: (xhr, status, error) => {
        reject('An error occurred while fetching data.');  // Reject the promise on error
        }
        });
        });
        }

        // Function to fetch the address based on latitude and longitude
        async function GetAddress(latitude, longitude) {
        try {
        const response = await $.ajax({
        url: '/schoolbuddy/Home/address',  // Adjust the URL if necessary
        type: 'GET',
        data: { latitude: latitude, longitude: longitude },
        });
        // var aa = response.split('"');


        // if (response.length > 0) {

        // return aa[1];
        // } else {
        // return 'Address not found';
        // }
        return response.trim();
        } catch (error) {
        return 'Error fetching address';
        }
        }

        var stopViolationData = [];
        var RouteViolationData = [];
