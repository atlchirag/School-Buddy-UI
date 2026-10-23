// Lazy loading for the dashboard, top to bottom.
//
// HomeController.Dashboard() returns the page straight away with every value at 0. This script
// then asks HomeController.DashboardData(section) for the three page sections at the same time:
//   top    - KPI cards, upcoming holiday, fleet status counts, vehicles in service
//   middle - vehicle list, alerts, route performance
//   bottom - driver monitoring, vehicle health, parent notifications
// and shows them in that order: a section is shown once it and every section above it have
// arrived. The full-screen loader stays up until the top section is shown.
//
// Each response is JSON values only:
//   - "fields" go into elements with data-dashboard-field="name" as text
//   - the lists are turned into table rows / options by the render functions below
//
// Other dashboard scripts run code each time a section is shown with:
//   window.sbDashboard.onData(function () { ... });

(function (window, document, $) {
    "use strict";

    const config = window.sbDashboard;

    const sections = ["top", "middle", "bottom"];

    const dataListeners = [];
    let dataApplied = false;

    // Placeholder HTML of every slot, restored when the user clicks Retry.
    const placeholders = {};

    config.onData = function (callback) {
        dataListeners.push(callback);

        if (dataApplied) {
            callback();
        }
    };

    function notifyDataListeners() {
        dataApplied = true;

        dataListeners.forEach(function (callback) {
            try {
                callback();
            } catch (error) {
                console.error("Dashboard data listener failed:", error);
            }
        });
    }

    /* =========================================================
       REQUEST
       ========================================================= */

    // Resolves with the section values, or null when the session has expired.
    function requestSection(section) {
        const url =
            config.dashboardDataUrl +
            (config.dashboardDataUrl.indexOf("?") === -1 ? "?" : "&") +
            "section=" + encodeURIComponent(section);

        return fetch(url, {
            // The loader is shown by loadSections() for as long as the top section takes.
            loader: false,
            cache: "no-store",
            credentials: "same-origin",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "Accept": "application/json"
            }
        }).then(function (response) {

            // BaseController answers 401 for AJAX calls when the session has expired.
            if (response.status === 401 || response.headers.get("Session-Expired") === "true") {
                return null;
            }

            if (!response.ok) {
                throw new Error("Status code: " + response.status);
            }

            return response.json();
        });
    }

    /* =========================================================
       HTML HELPERS
       ========================================================= */

    function escapeHtml(value) {
        return String(value === null || value === undefined ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function isBlank(value) {
        return value === null || value === undefined || String(value).trim() === "";
    }

    // "12.5" -> 12.5; anything else (e.g. "45%", "") -> null, like decimal.TryParse.
    function parseDecimal(value) {
        const text = String(value === null || value === undefined ? "" : value).trim();
        return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : null;
    }

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Server date "2025-06-01T14:05:00" -> "01-Jun-2025 02:05 PM" (time shown as sent, no time-zone shift).
    function formatAlertTime(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || "");

        if (!match) {
            return escapeHtml(value);
        }

        const hour = Number(match[4]);
        const hour12 = String(hour % 12 || 12).padStart(2, "0");

        return match[3] + "-" + MONTHS[Number(match[2]) - 1] + "-" + match[1] +
            " " + hour12 + ":" + match[5] + " " + (hour < 12 ? "AM" : "PM");
    }

    // "MH12AB1234XYZ" -> "MH12AB1234" + line break + "XYZ" (split after the first 4-digit group).
    function splitAfterNumber(name) {
        const match = /^(.*?\d{4})(.*)$/.exec(name);

        if (!match) {
            return null;
        }

        return escapeHtml(match[1]) + (match[2] ? "<br />" + escapeHtml(match[2]) : "");
    }

    const emptyRow = function (columns, text, extraClass) {
        return '<tr><td colspan="' + columns + '" class="text-center text-muted' +
            (extraClass ? " " + extraClass : "") + '">' + text + "</td></tr>";
    };

    /* =========================================================
       TOP SECTION
       ========================================================= */

    function renderHoliday(holiday) {
        if (holiday && !isBlank(holiday.name)) {
            return '<span class="fw-semibold d-block" style="font-size:0.72rem;">' + escapeHtml(holiday.name) + "</span>" +
                '<span class="text-muted" style="font-size:0.68rem;">' + escapeHtml(holiday.date) + "</span>";
        }

        return '<span class="text-muted" style="font-size:0.72rem;">No Upcoming Holiday</span>';
    }

    function renderVehiclesInService(vehicles) {
        return (vehicles || []).map(function (item, index) {
            const routes = item.routes && item.routes.length
                ? '<ul class="mb-0 ps-3">' + item.routes.map(function (route) {
                    return "<li>" + escapeHtml(route) + "</li>";
                }).join("") + "</ul>"
                : '<span class="text-muted">No Route</span>';

            return "<tr>" +
                '<td class="text-center">' + (index + 1) + "</td>" +
                "<td>" + escapeHtml(item.vehReg) + "</td>" +
                "<td>" + routes + "</td>" +
                "<td>" + escapeHtml(item.maximumSpeedToday) + "</td>" +
                "<td>" + escapeHtml(item.lastRunningTime) + "</td>" +
                "</tr>";
        }).join("");
    }

    /* =========================================================
       MIDDLE SECTION
       ========================================================= */

    function renderVehicleOptions(vehicles) {
        return '<option value="">Select Vehicle</option>' + (vehicles || []).map(function (vehicle) {
            return '<option value="' + escapeHtml(vehicle.id) + '">' + escapeHtml(vehicle.name) + "</option>";
        }).join("");
    }

    function renderVehicleCheckboxes(vehicles, checkboxClass) {
        return (vehicles || []).map(function (vehicle) {
            return '<label class="dropdown-item px-1"><input type="checkbox" class="form-check-input me-2 ' +
                checkboxClass + '" value="' + escapeHtml(vehicle.id) + '">' + escapeHtml(vehicle.name) + "</label>";
        }).join("");
    }

    // The vehicle number is the word right after "vehicle" in the alert message.
    function alertVehicle(message) {
        const words = String(message || "").split(" ").filter(Boolean);
        const index = words.findIndex(function (word) {
            return word.toLowerCase() === "vehicle";
        });

        return index >= 0 && index + 1 < words.length ? words[index + 1] : "";
    }

    function renderAlertsCard(alerts) {
        if (!alerts || !alerts.length) {
            return '<tr class="empty-row"><td colspan="4">No alerts found for Today.</td></tr>';
        }

        return alerts.slice(0, 4).map(function (item) {
            const seen = Number(item.is_read) === 1
                ? '<span class=" border-0 border-success text-success px-2 py-1">Seen</span>'
                : '<span class="  border-0 border-danger text-danger px-2 py-1">Unseen</span>';

            return '<tr class="pb-3">' +
                '<td><span class="fw-semibold text-dark">' + escapeHtml(item.msg_status) + "</span></td>" +
                '<td style="white-space: normal; word-break: break-word; max-width: 150px;">' +
                escapeHtml(alertVehicle(item.Message)) + "</td>" +
                "<td>" + formatAlertTime(item.sent_on) + "</td>" +
                "<td>" + seen + "</td>" +
                "</tr>";
        }).join("");
    }

    const ROUTE_STATUS_STYLES = {
        "On Time": ["text-success", "#e0f8e9"],
        "Delayed": ["text-warning", "#fff3cd"],
        "Route Time Completed": ["text-primary", "#dbeafe"],
        "Not Started": ["text-secondary", "#f1f3f5"]
    };

    const LIVE_STATUS_STYLES = {
        "Running": ["text-success", "#e0f8e9"],
        "Idle": ["text-warning", "#fff3cd"],
        "Stopped": ["text-danger", "#fde2e2"],
        "Offline": ["text-secondary", "#e9ecef"],
        "Live": ["text-white", "#198754"]
    };

    function routeEtaForCard(item) {
        if (item.eta === "0") {
            return "0 Min";
        }

        if (item.eta === "N/A") {
            return "N/A";
        }

        if (item.etaDifferenceMinutes !== null && item.etaDifferenceMinutes !== undefined) {
            return Math.abs(item.etaDifferenceMinutes) + " Min";
        }

        return escapeHtml(item.eta);
    }

    function routeEtaForModal(item) {
        if (item.routeStatus === "Route Time Completed") {
            return "<span>0 Min</span>";
        }

        if (item.eta === "N/A") {
            return '<span class="text-muted">N/A</span>';
        }

        if (item.etaDifferenceMinutes !== null && item.etaDifferenceMinutes !== undefined) {
            return "<span>" + Math.abs(item.etaDifferenceMinutes) + " Min</span>";
        }

        return "<span>" + escapeHtml(item.eta) + "</span>";
    }

    function renderRouteCard(routes) {
        if (!routes || !routes.length) {
            return emptyRow(5, "No Route Data Available", "py-3");
        }

        return routes.slice(0, 4).map(function (item) {
            const style = ROUTE_STATUS_STYLES[item.routeStatus] || ["text-secondary", "#e9ecef"];
            const vehicle = String(item.vehicle || "");
            const vehicleLines = [];

            // 8 characters per line so long vehicle numbers fit the narrow card.
            for (let i = 0; i < vehicle.length; i += 8) {
                vehicleLines.push(escapeHtml(vehicle.substring(i, i + 8)));
            }

            return "<tr>" +
                '<td style="padding: 4px 2px;" class="fw-bold text-dark">' + escapeHtml(item.route) + "</td>" +
                '<td style="padding: 4px 2px;">' + vehicleLines.join("<br />") + "</td>" +
                '<td style="padding: 4px 2px; text-align:center">' + escapeHtml(item.students) + "</td>" +
                '<td style="padding: 4px 2px;"><span class="' + style[0] + ' fw-semibold" ' +
                'style="font-size:0.55rem;background:' + style[1] + ';padding:2px 4px;border-radius:4px;">' +
                escapeHtml(item.routeStatus) + "</span></td>" +
                '<td style="padding: 4px 2px;">' + routeEtaForCard(item) + "</td>" +
                "</tr>";
        }).join("");
    }

    function statusPill(text, style) {
        return '<span class="' + style[0] + ' fw-semibold" style="font-size:0.72rem; background:' + style[1] +
            '; padding:5px 9px; border-radius:5px; white-space:nowrap;">' + escapeHtml(text) + "</span>";
    }

    function renderRouteModal(routes) {
        return (routes || []).map(function (item) {
            const vehicle = String(item.vehicle || "");
            const dash = vehicle.indexOf("-");
            const vehicleHtml = dash >= 0
                ? escapeHtml(vehicle.substring(0, dash)) + "<br />" + escapeHtml(vehicle.substring(dash))
                : escapeHtml(vehicle);

            return "<tr>" +
                '<td class="fw-bold text-dark">' + escapeHtml(item.route) + "</td>" +
                "<td>" + vehicleHtml + "</td>" +
                '<td class="text-center">' + escapeHtml(item.students) + "</td>" +
                "<td>" + escapeHtml(item.startTime) + "</td>" +
                "<td>" + escapeHtml(item.endTime) + "</td>" +
                "<td>" + escapeHtml(item.stopName) + "</td>" +
                "<td>" + routeEtaForModal(item) + "</td>" +
                "<td>" + statusPill(item.routeStatus, ROUTE_STATUS_STYLES[item.routeStatus] || ["text-secondary", "#f1f3f5"]) + "</td>" +
                "<td>" + statusPill(item.vehicleLiveStatus, LIVE_STATUS_STYLES[item.vehicleLiveStatus] || ["text-secondary", "#f1f3f5"]) + "</td>" +
                "</tr>";
        }).join("");
    }

    /* =========================================================
       BOTTOM SECTION
       ========================================================= */

    function driverBusHtml(busName) {
        const name = isBlank(busName) ? "-" : String(busName);
        return splitAfterNumber(name) || (name === "-" ? "N/A" : escapeHtml(name));
    }

    function driverCells(driver) {
        const badge = driver.driverStatus === "Active" ? "sb-badge-success" : "sb-badge-secondary";
        const busStatus = driver.busStatus === "Running"
            ? '<span class="sb-badge sb-badge-success">' + escapeHtml(driver.busStatus) + "</span>"
            : '<span class="text-muted">' + escapeHtml(driver.busStatus) + "</span>";

        return '<td class="text-muted" style="line-height:1.2;">' + driverBusHtml(driver.busName) + "</td>" +
            '<td><span class="sb-badge ' + badge + '">' + escapeHtml(driver.driverStatus) + "</span></td>" +
            "<td>" + busStatus + "</td>";
    }

    function renderDriverCard(drivers) {
        if (!drivers || !drivers.length) {
            return emptyRow(4, "No driver data available");
        }

        return drivers.slice(0, 4).map(function (driver) {
            return '<tr><td class="fw-bold text-dark">' + escapeHtml(driver.driverName) + "</td>" +
                driverCells(driver) + "</tr>";
        }).join("");
    }

    function renderDriverModal(drivers) {
        return (drivers || []).map(function (driver, index) {
            return "<tr><td>" + (index + 1) + "</td>" +
                '<td class="text-muted" style="white-space: normal; word-break: break-word; max-width: 150px;">' +
                escapeHtml(driver.driverName) + "</td>" +
                driverCells(driver) + "</tr>";
        }).join("");
    }

    function batteryClass(battery) {
        return battery >= 60 ? "text-success" : battery >= 30 ? "text-warning" : "text-danger";
    }

    function renderVehicleHealthCard(vehicles) {
        if (!vehicles || !vehicles.length) {
            return emptyRow(4, "No Data Found", "py-3");
        }

        return vehicles.slice(0, 4).map(function (item) {
            const vehicle = isBlank(item.id) ? "N/A" : String(item.id);
            const vehicleHtml = vehicle.length > 8
                ? escapeHtml(vehicle.substring(0, 8)) + "<br />" + escapeHtml(vehicle.substring(8))
                : escapeHtml(vehicle);

            return "<tr>" +
                '<td class="fw-bold text-dark" style="white-space: nowrap; font-size:10px;">' + vehicleHtml + "</td>" +
                '<td style="text-align:center">' + (isBlank(item.temperature) ? "N/A" : escapeHtml(item.temperature)) + "</td>" +
                '<td class="' + batteryClass(parseDecimal(item.batteryPercent) || 0) + ' fw-semibold">' +
                (isBlank(item.batteryPercent) ? "N/A" : escapeHtml(item.batteryPercent) + "%") + "</td>" +
                '<td class="text-muted">' + escapeHtml(item.lastUpdate) + "</td>" +
                "</tr>";
        }).join("");
    }

    function renderVehicleHealthModal(vehicles) {
        return (vehicles || []).map(function (item, index) {
            const vehicle = isBlank(item.id) ? "N/A" : String(item.id);
            const battery = parseDecimal(item.batteryPercent);
            const fuel = isBlank(item.remainingFuel) || item.remainingFuel === "N/A" ? "N/A" : escapeHtml(item.remainingFuel);

            return "<tr>" +
                '<td class="text-center">' + (index + 1) + "</td>" +
                '<td class="fw-bold text-dark" style="line-height:1.2;">' +
                (splitAfterNumber(vehicle) || (vehicle === "-" ? "N/A" : escapeHtml(vehicle))) + "</td>" +
                '<td class="text-muted">' + (isBlank(item.temperature) ? "N/A" : escapeHtml(item.temperature)) + "</td>" +
                (battery === null
                    ? '<td class="text-muted">N/A</td>'
                    : '<td class="' + batteryClass(battery) + ' fw-semibold">' + escapeHtml(String(item.batteryPercent).trim()) + "%</td>") +
                "<td>" + fuel + "</td>" +
                '<td class="text-muted">' + escapeHtml(item.lastUpdate) + "</td>" +
                "</tr>";
        }).join("");
    }

    /* =========================================================
       APPLY TO THE PAGE
       ========================================================= */

    // DataTables keeps its own copy of the rows, so rebuild the table around the new rows.
    function fillSlot(selector, html) {
        const target = document.querySelector(selector);

        if (!target) {
            return;
        }

        const table = target.closest("table");
        const wasDataTable =
            !!table && !!$.fn.DataTable && $.fn.DataTable.isDataTable(table);

        if (wasDataTable) {
            $(table).DataTable().destroy();
        }

        target.innerHTML = html;

        if (wasDataTable && typeof initDashboardTable === "function") {
            initDashboardTable(table);
        }
    }

    function sectionElements(section, attribute) {
        return document.querySelectorAll(
            '[data-dashboard-section="' + section + '"][' + attribute + "]");
    }

    function applySection(section, data) {
        const fields = data.fields || {};

        sectionElements(section, "data-dashboard-field").forEach(function (element) {
            const name = element.getAttribute("data-dashboard-field");

            if (Object.prototype.hasOwnProperty.call(fields, name)) {
                element.textContent = fields[name];
            }
        });

        if (section === "top") {
            config.totalStudentCount = data.totalStudentCount || 0;
            $("#totalAssigned").val(data.assignedStudentCount || 0);

            fillSlot("#upcomingHolidaySlot", renderHoliday(data.upcomingHoliday));
            fillSlot("#vehicleInServiceTableBody", renderVehiclesInService(data.vehiclesInService));
        }

        if (section === "middle") {
            config.alerts = Array.isArray(data.alerts) ? data.alerts : [];

            fillSlot("#alertsCardBody", renderAlertsCard(config.alerts));
            fillSlot("#routePerformanceCardBody", renderRouteCard(data.routePerformance));
            fillSlot("#routePerformanceModalBody", renderRouteModal(data.routePerformance));

            fillSlot("#selected_vehicle", renderVehicleOptions(data.vehicles));
            fillSlot("#vehicleSummaryVehicleList", renderVehicleCheckboxes(data.vehicles, "vehicle-summary-vehicle"));
            fillSlot("#distanceChartVehicleList", renderVehicleCheckboxes(data.vehicles, "distance-chart-vehicle"));

            if ($.fn.selectpicker) {
                $("#selected_vehicle").selectpicker("refresh");
            }

            if (typeof updateVehicleSummaryMultiselectLabels === "function") {
                updateVehicleSummaryMultiselectLabels();
            }

            if (typeof updateDistanceChartMultiselectLabel === "function") {
                updateDistanceChartMultiselectLabel();
            }
        }

        if (section === "bottom") {
            fillSlot("#driverMonitoringCardBody", renderDriverCard(data.drivers));
            fillSlot("#driverMonitoringModalBody", renderDriverModal(data.drivers));
            fillSlot("#vehicleHealthCardBody", renderVehicleHealthCard(data.vehicleHealth));
            fillSlot("#vehicleHealthModalBody", renderVehicleHealthModal(data.vehicleHealth));
        }
    }

    function showSectionError(section, error) {
        console.error("Dashboard " + section + " data could not be loaded:", error);

        sectionElements(section, "data-dashboard-field").forEach(function (element) {
            element.textContent = "-";
        });

        sectionElements(section, "data-dashboard-slot").forEach(function (element) {
            const columns = element.getAttribute("data-dashboard-colspan");
            const message =
                'Unable to load data. <a href="#" class="dashboard-retry" data-section="' +
                section + '">Retry</a>';

            element.innerHTML = columns
                ? '<tr><td colspan="' + columns + '" class="text-center text-muted py-3">' + message + "</td></tr>"
                : '<span class="text-muted" style="font-size:0.72rem;">' + message + "</span>";
        });
    }

    // Requests all the given sections at once and shows them in the given order.
    function loadSections(sectionsToLoad) {
        // Full-screen loader (~/js/loader.js) until the first section is on the page.
        // Shown manually: its own page-load mode gives up after 10 seconds.
        SBLoader.show();

        const requests = sectionsToLoad.map(requestSection);
        let sessionExpired = false;

        $(function () {
            let shown = Promise.resolve();

            sectionsToLoad.forEach(function (section, index) {
                shown = shown.then(function () {
                    return requests[index]
                        .then(function (data) {
                            if (data === null) {
                                sessionExpired = true;
                                return;
                            }

                            applySection(section, data);
                        })
                        .catch(function (error) {
                            showSectionError(section, error);
                        })
                        .then(function () {
                            if (sessionExpired) {
                                return;
                            }

                            if (index === 0) {
                                SBLoader.hide();
                            }

                            // Let the other scripts carry on, with empty data if this section failed.
                            notifyDataListeners();
                        });
                });
            });

            shown.then(function () {
                // Keep the loader up while the browser goes to the login page.
                if (sessionExpired) {
                    window.location.href = config.loginUrl;
                }
            });
        });
    }

    $(function () {
        document.querySelectorAll("[data-dashboard-slot]").forEach(function (element) {
            placeholders[element.id] = element.innerHTML;
        });

        $(document).on("click", ".dashboard-retry", function (event) {
            event.preventDefault();

            const section = this.getAttribute("data-section");

            sectionElements(section, "data-dashboard-slot").forEach(function (element) {
                element.innerHTML = placeholders[element.id] || "";
            });

            sectionElements(section, "data-dashboard-field").forEach(function (element) {
                element.textContent = "0";
            });

            loadSections([section]);
        });
    });

    // Start the requests now; they run while the rest of the page loads.
    loadSections(sections);

})(window, document, jQuery);
