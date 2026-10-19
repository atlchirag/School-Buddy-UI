// DataTables set-up for the dashboard tables.
// Moved out of Views/Home/Dashboard/Dashboard.cshtml.

    function initDashboardTable(table) {

        if ($.fn.DataTable.isDataTable(table)) {
            return;
        }

        const options = {
            pageLength: 10,
            lengthMenu: [5, 10, 25, 50],
            lengthChange: true,
            autoWidth: false,
             scrollX: true
        };

        if ($(table).closest('.dashboard-table-modal').length) {
            options.scrollY = '55vh';
            options.scrollCollapse = true;
        }

        $(table).DataTable(options);
    }

    $(document).ready(function () {

        // Tables marked data-datatable-init="on-open" are only set up when their modal first opens.
        // Only mark tables that no other script reads with .DataTable() before the modal is shown.
        $('.table').not('[data-datatable-init="on-open"]').each(function () {
            initDashboardTable(this);
        });

        $(document).on('show.bs.modal', '.modal', function () {
            $(this).find('.table[data-datatable-init="on-open"]').each(function () {
                initDashboardTable(this);
            });
        });
    $("#tableSearchBox").on("keyup", function () {

    var searchValue = $(this).val();

    $(".table").each(function () {

         $.fn.dataTable.tables({ visible: true, api: true })
        .search(value)
        .draw();

    });

});

        $('.dropdownwithsearch').selectpicker();


    });
       // function VehicleLiveTracking(val) {
       //      $.ajax({
       //          url: '/schoolbuddy/Tracking/GetImei',
       //          type: 'POST',
       //          data: { id: val },
       //          success: function (response) {
       //              var jsondata = JSON.parse(response);
       //              jsondata.forEach(function (item) {

       //                  var imei = item.imei;
       //                  var database = item.database?.toLowerCase(); Assuming you also return database from backend

       //                  $('#normal_map').hide();
       //                  $("#livetracking").show();

       //                  let url = "";

       //                  if (database === "newtrack") {
       //                      url = 'https:fasttracksoft.us/vertical_menu/newuser/vehicle_location_tracking_api.php?imei=' + imei;
       //                  } else if (database === "atltracking") {
       //                      url = 'https:trackofy.com/user/vehicle-location-tracking.php?imei=' + imei;
       //                  } else {
       //                      alert("Unknown vehicle. Cannot track.");
       //                      return;
       //                  }

       //                  $('#liveTrackingIframe').attr('src', url);
       //              });
       //          }
       //      });
       //  }

    function VehicleLiveTracking(val) {
    if (!val) {
    $('#livetracking').hide();
    $('#normal_map').show();
    $('#liveTrackingIframe').attr('src', '');
    return;
    }

    $.ajax({
    url: '/schoolbuddy/Tracking/GetImei',
    type: 'POST',
    data: { id: val },

    success: function (response) {
    let jsonData;

    try {
    jsonData = typeof response === 'string'
    ? JSON.parse(response)
    : response;
    } catch (error) {
    console.error('Invalid JSON response:', error);
    alert('Invalid vehicle response.');
    return;
    }

    if (!Array.isArray(jsonData) || jsonData.length === 0) {
    alert('Vehicle details not found.');
    return;
    }

    const imei = jsonData[0]?.imei;

    if (!imei) {
    alert('IMEI not found.');
    return;
    }

    $.ajax({
    url: '/schoolbuddy/Tracking/LiveTracking',
    type: 'GET',
    data: { imei: imei },

    success: function (result) {
    if (!result?.status || !result?.url) {
    alert('Tracking URL not found.');
    return;
    }

    $('#normal_map').hide();
    $('#livetracking').show();

    $('#liveTrackingIframe').attr(
    'src',
    result.url + '&t=' + Date.now()
    );
    },

    error: function (xhr) {
    console.error(
    'LiveTracking error:',
    xhr.responseText
    );

    alert('Unable to load live tracking.');
    }
    });
    },

    error: function (xhr, status, error) {
    console.error('GetImei error:', {
    status: status,
    error: error,
    response: xhr.responseText
    });

    alert('Unable to get vehicle details.');
    }
    });
    }
