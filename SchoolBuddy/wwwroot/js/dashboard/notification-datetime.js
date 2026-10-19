// Date/time pickers for the notification filter.
// Moved out of Views/Home/Dashboard/Dashboard.cshtml.

    let notificationStartDatePicker;
    let notificationStartTimePicker;
    let notificationEndDatePicker;
    let notificationEndTimePicker;

    document.addEventListener("DOMContentLoaded", function () {

        initializeNotificationDateTimePickers();

        document
            .getElementById("resetNotificationFilter")
            ?.addEventListener("click", function () {
                setNotificationDefaultDateTime();
            });
    });

    function initializeNotificationDateTimePickers() {

        const now = new Date();

        /*
         * Start date:
         * Defaults to today's date.
         */
        notificationStartDatePicker = flatpickr("#notificationStartDate", {
            dateFormat: "Y-m-d",
            defaultDate: now,
            maxDate: now,
          allowInput: true,
clickOpens: false,

            disableMobile: true,
            onChange: updateNotificationTimeLimits
        });

        /*
         * Start time:
         * Defaults to 00:00.
         */
        notificationStartTimePicker = flatpickr("#notificationStartTime", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            defaultDate: "00:00",
            allowInput: true,
clickOpens: false,
            disableMobile: true
        });

        /*
         * End date:
         * Defaults to today's date.
         */
        notificationEndDatePicker = flatpickr("#notificationEndDate", {
            dateFormat: "Y-m-d",
            defaultDate: now,
            maxDate: now,
           allowInput: true,
clickOpens: false,
            disableMobile: true,
            onChange: updateNotificationTimeLimits
        });

        /*
         * End time:
         * Defaults to current time.
         */
        notificationEndTimePicker = flatpickr("#notificationEndTime", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            defaultDate: now,
            maxTime: formatTimeForFlatpickr(now),
    allowInput: true,
    clickOpens: false,
            disableMobile: true
        });

        bindNotificationPickerIcons();

        updateNotificationTimeLimits();
    }

    function bindNotificationPickerIcons() {

    bindPickerToggle(
    "notificationStartDate",
    "notificationStartDateIcon",
    notificationStartDatePicker
    );

    bindPickerToggle(
    "notificationStartTime",
    "notificationStartTimeIcon",
    notificationStartTimePicker
    );

    bindPickerToggle(
    "notificationEndDate",
    "notificationEndDateIcon",
    notificationEndDatePicker
    );

    bindPickerToggle(
    "notificationEndTime",
    "notificationEndTimeIcon",
    notificationEndTimePicker
    );
    }

    function bindPickerToggle(inputId, iconId, picker) {

    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

    if (!input || !picker) {
        return;
    }

    function togglePicker(event) {

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        /*
         * pointerdown runs before Flatpickr's document click
         * handler, so the current open state is still correct.
         */
        if (picker.isOpen) {
            picker.close();
        } else {
            picker.open();
        }
    }

    /*
     * Use pointerdown rather than click.
     */
    input.addEventListener(
        "pointerdown",
        togglePicker,
        true
    );

    if (icon) {
        icon.addEventListener(
            "pointerdown",
            togglePicker,
            true
        );
    }

    /*
     * Prevent the later click event from opening it again.
     */
    function blockClick(event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }

    input.addEventListener(
        "click",
        blockClick,
        true
    );

    if (icon) {
        icon.addEventListener(
            "click",
            blockClick,
            true
        );
    }
}

    function setNotificationDefaultDateTime() {

        const now = new Date();

        notificationStartDatePicker.setDate(now, true);
        notificationStartTimePicker.setDate("00:00", true);

        notificationEndDatePicker.setDate(now, true);
        notificationEndTimePicker.setDate(now, true);

        updateNotificationTimeLimits();

        const errorElement =
            document.getElementById("notificationFilterError");

        if (errorElement) {
            errorElement.classList.add("d-none");
            errorElement.textContent = "";
        }
    }

    function updateNotificationTimeLimits() {

        if (!notificationStartDatePicker ||
            !notificationEndDatePicker ||
            !notificationStartTimePicker ||
            !notificationEndTimePicker) {
            return;
        }

        const now = new Date();
        const today = formatDateForFlatpickr(now);
        const currentTime = formatTimeForFlatpickr(now);

        const selectedStartDate =
            document.getElementById("notificationStartDate").value;

        const selectedEndDate =
            document.getElementById("notificationEndDate").value;

        /*
         * Only restrict time to the current time when
         * the selected date is today.
         */
        notificationStartTimePicker.set(
            "maxTime",
            selectedStartDate === today ? currentTime : null
        );

        notificationEndTimePicker.set(
            "maxTime",
            selectedEndDate === today ? currentTime : null
        );
    }

    function formatDateForFlatpickr(date) {

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function formatTimeForFlatpickr(date) {

        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${hours}:${minutes}`;
    }
