//var checkvais = document.getElementById('A1');
var checketa = document.getElementById('A2');
//var routes = document.getElementById('A3');
var checkroutes = document.getElementById('A4');
//var checkurl = document.getElementById('A5');
//var checksta = document.getElementById('A6');
var checkignition = document.getElementById('A7');
var status_ = document.getElementById('A8')

//window.onload = function () {
//    var checkvais = document.getElementById('A1');
//    checkvais.click();
//    checkvais.style.backgroundColor = 'midnightblue';
//    checkvais.style.color = 'white';
//}
window.onload = function () {
    if (checketa) {
        checketa.click();
        checketa.style.backgroundColor = 'midnightblue';
        checketa.style.color = 'white';
    }
}
//function changebg() {



//    checkvais.style.backgroundColor = 'midnightblue';
//    checkvais.style.color = 'white';

//    checketa.style.backgroundColor = 'white';
//    checketa.style.color = 'black';
//    routes.style.backgroundColor = 'white';
//    routes.style.color = 'black';
//    checkroutes.style.backgroundColor = 'white';
//    checkroutes.style.color = 'black';
//    checkurl.style.backgroundColor = 'white';
//    checkurl.style.color = 'black';
//    checksta.style.backgroundColor = 'white';
//    checksta.style.color = 'black';
//    checkignition.style.backgroundColor = 'white';
//    checkignition.style.color = 'black';
//    status_.style.backgroundColor = 'white';
//    status_.style.color = 'black';



//    var dropdown = document.getElementById('ddl_route_search1');


//    if (dropdown.options.length <= 0) {
//        $.ajax({
//            url: '/schoolbuddy/Command/GetRoutes',
//            type: 'POST',
//            data: {uid},
//            success:
//                function (response) {
//                    var routes = JSON.parse(response);
//                    console.log(routes);
//                    //console.log(id);
//                    routes.forEach(function (route) {
//                        var option = $(`<option value = "${route.id}">${route.route_name}</option>`);
//                        $('#ddl_route_search1').append(option);
//                        //console.log(student.student_name);
//                    })

//                    console.log('find');
//                },

//            error: function (xhr, status, error) {
//                console.error('Error occurred:', error);
//            }

//        });
//    }

//    var table = $("#routevias").DataTable();
//    table.clear().draw();
    





//}
function changebg1() {
    checketa.style.backgroundColor = 'midnightblue';
    checketa.style.color = 'white';
    //checkvais.style.backgroundColor = 'white';
    //checkvais.style.color = 'black';
    //routes.style.backgroundColor = 'white';
    //routes.style.color = 'black';
    checkroutes.style.backgroundColor = 'white';
    checkroutes.style.color = 'black';
    //checkurl.style.backgroundColor = 'white';
    //checkurl.style.color = 'black';
    //checksta.style.backgroundColor = 'white';
    //checksta.style.color = 'black';
    checkignition.style.backgroundColor = 'white';
    checkignition.style.color = 'black';
    status_.style.backgroundColor = 'white';
    status_.style.color = 'black';




    var dropdown = document.getElementById('ddl_check_eta');


    if (dropdown.options.length <= 0) {
        $.ajax({
            url: '/schoolbuddy/Command/GetRoutes',
            type: 'POST',
            // data: { uid: "5415" },
            data: { uid: uid },
            success:
                function (response) {
                    var routes = JSON.parse(response);
                    console.log(routes);
                    //console.log(id);

                    var defaultOption = $('<option value="" selected disabled>Select Route</option>');
                    $('#ddl_check_eta').append(defaultOption);
                    routes.forEach(function (route) {
                        var option = $(`<option value = "${route.id}">${route.route_name}</option>`);
                        $('#ddl_check_eta').append(option);
                        //console.log(student.student_name);
                    })

                    console.log('find');
                },

            error: function (xhr, status, error) {
                console.error('Error occurred:', error);
            }

        });
    }

}
//function changebg2() {

//    routes.style.backgroundColor = 'midnightblue';
//    routes.style.color = 'white';
//    checkvais.style.backgroundColor = 'white';
//    checkvais.style.color = 'black';
//    checketa.style.backgroundColor = 'white';
//    checketa.style.color = 'black';
//    checkroutes.style.backgroundColor = 'white';
//    checkroutes.style.color = 'black';
//    checkurl.style.backgroundColor = 'white';
//    checkurl.style.color = 'black';
//    checksta.style.backgroundColor = 'white';
//    checksta.style.color = 'black';
//    checkignition.style.backgroundColor = 'white';
//    checkignition.style.color = 'black';
//    status_.style.backgroundColor = 'white';
//    status_.style.color = 'black';
//}
function changebg3() {
    checkroutes.style.backgroundColor = 'midnightblue';
    checkroutes.style.color = 'white';

    checketa.style.backgroundColor = 'white';
    checketa.style.color = 'black';

    checkignition.style.backgroundColor = 'white';
    checkignition.style.color = 'black';

    status_.style.backgroundColor = 'white';
    status_.style.color = 'black';
}
//function changebg4() {

//    checkurl.style.backgroundColor = 'midnightblue';
//    checkurl.style.color = 'white';

//    routes.style.backgroundColor = 'white';
//    routes.style.color = 'black';
//    checkvais.style.backgroundColor = 'white';
//    checkvais.style.color = 'black';
//    checketa.style.backgroundColor = 'white';
//    checketa.style.color = 'black';
//    checkroutes.style.backgroundColor = 'white';
//    checkroutes.style.color = 'black';
//    checksta.style.backgroundColor = 'white';
//    checksta.style.color = 'black';
//    checkignition.style.backgroundColor = 'white';
//    checkignition.style.color = 'black';
//    status_.style.backgroundColor = 'white';
//    status_.style.color = 'black';
//}
//function changebg5() {

//    checksta.style.backgroundColor = 'midnightblue';
//    checksta.style.color = 'white';

//    routes.style.backgroundColor = 'white';
//    routes.style.color = 'black';
//    checkvais.style.backgroundColor = 'white';
//    checkvais.style.color = 'black';
//    checketa.style.backgroundColor = 'white';
//    checketa.style.color = 'black';
//    checkroutes.style.backgroundColor = 'white';
//    checkroutes.style.color = 'black';
//    checkurl.style.backgroundColor = 'white';
//    checkurl.style.color = 'black';
//    checkignition.style.backgroundColor = 'white';
//    checkignition.style.color = 'black';
//    status_.style.backgroundColor = 'white';
//    status_.style.color = 'black';
//}
function changebg6() {

    checkignition.style.backgroundColor = 'midnightblue';
    checkignition.style.color = 'white';
    //checksta.style.backgroundColor = 'white';
    //checksta.style.color = 'black';
    //routes.style.backgroundColor = 'white';
    //routes.style.color = 'black';
    //checkvais.style.backgroundColor = 'white';
    //checkvais.style.color = 'black';
    checketa.style.backgroundColor = 'white';
    checketa.style.color = 'black';
    checkroutes.style.backgroundColor = 'white';
    checkroutes.style.color = 'black';
    //checkurl.style.backgroundColor = 'white';
    //checkurl.style.color = 'black';
    status_.style.backgroundColor = 'white';
    status_.style.color = 'black';

    var dropdown = document.getElementById('ddl_route_search2');


    if (dropdown.options.length <= 0) {
        $.ajax({
            url: '/schoolbuddy/Command/GetRoutes',
            type: 'POST',
        //    data: { uid: "5415" },
            success:
                function (response) {
                    var routes = JSON.parse(response);
                    console.log(routes);
                    //console.log(id);

                    var defaultOption = $('<option value="" selected disabled>Select Route</option>');
                    $('#ddl_route_search2').append(defaultOption);
                    routes.forEach(function (route) {
                        var option = $(`<option value = "${route.sys_service_id}">${route.route_name}</option>`);
                        $('#ddl_route_search2').append(option);
                        //console.log(student.student_name);
                    })

                    console.log('find');
                },

            error: function (xhr, status, error) {
                console.error('Error occurred:', error);
            }

        });
    }


}

function changebg7() {
    
    status_.style.backgroundColor = 'midnightblue';
    status_.style.color = 'white';
    checkignition.style.backgroundColor = 'white';
    checkignition.style.color = 'black';
    //checksta.style.backgroundColor = 'white';
    //checksta.style.color = 'black';
    //routes.style.backgroundColor = 'white';
    //routes.style.color = 'black';
    //checkvais.style.backgroundColor = 'white';
    //checkvais.style.color = 'black';
    checketa.style.backgroundColor = 'white';
    checketa.style.color = 'black';
    checkroutes.style.backgroundColor = 'white';
    checkroutes.style.color = 'black';
    //checkurl.style.backgroundColor = 'white';
    //checkurl.style.color = 'black';


    var dropdown = document.getElementById('ddl_route_search3');


    if (dropdown.options.length <= 0) {
        $.ajax({
            url: '/schoolbuddy/Command/GetRoutes',
            type: 'POST',
            // data: { uid: "5415" },
            data: { uid: uid },
            success:
                function (response) {
                    var routes = JSON.parse(response);
                    console.log(routes);
                    //console.log(id);

                    var defaultOption = $('<option value="" selected disabled>Select Route</option>');
                    $('#ddl_route_search3').append(defaultOption);
                    routes.forEach(function (route) {
                        var option = $(`<option value = "${route.sys_service_id}">${route.route_name}</option>`);
                        $('#ddl_route_search3').append(option);
                        //console.log(student.student_name);
                    })

                    console.log('find');
                },

            error: function (xhr, status, error) {
                console.error('Error occurred:', error);
            }

        });
    }




}
$('#datepicker').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true


});



function handleActionClick1(routeid) {
    $('#CheckEachRoute').modal('show');
    var table = $("#checkeachrouteviasing").DataTable();
    table.clear().draw();
    $.ajax({
        url: '/Analysis/checkeachviasing',
        data: { rid: routeid },
        type: 'post',
        success: function (response) {
            let data;
            try {
                data = JSON.parse(response);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                alert('Failed to load data.');
                return;
            }
            var result;
            let rows = data.map(item => [
                item.user_stop_name || "",
                item.link_no || ""
                


            ]);

            table.rows.add(rows).draw();

        }
    })
}






//function tb_alert_func() {
//    var table = $("#routevias").DataTable();
//    table.clear().draw();
//    var route_id = document.getElementById('ddl_route_search1').value;
//    $.ajax({
//        url: '/schoolbuddy/Analysis/GetRouteVias',
//        data: { route_id: route_id },
//        type: 'post',
//        success: function (response) {
//            let data;
//            try {
//                data = JSON.parse(response);
//            } catch (e) {
//                console.error('Failed to parse JSON:', e);
//                alert('Failed to load data.');
//                return;
//            }
//            var result;
//            let rows = data.map(item => [
//                item.latitude || "",
//                item.longitude || "",
//                item.via_order || ""


//            ]);

//            table.rows.add(rows).draw();

//        }
//    })
//}


//function getstops() {
//    $('#ddl_stop_search').empty();
//    //alert('cjhucia');
//    var route_id = document.getElementById('ddl_check_eta').value;

//    $.ajax({
//        url: '/schoolbuddy/Analysis/GetStops',
//        type: 'Post',
//        data: { route_id: route_id },
//        success: function (response) {

//            let data;
//            try {
//                data = JSON.parse(response);
//            } catch (e) {
//                console.error('Failed to parse JSON:', e);
//                alert('Failed to load data.');
//                return;
//            }




//            data.forEach(function (d) {
//                var option = $(`<option value = "${d.id}">${d.user_stop_name}</option>`);
//                $('#ddl_stop_search').append(option);
//            })

//        }
//    })

//}


function geteta() {
    var rid = document.getElementById('ddl_check_eta').value;

    if (!rid || rid === '') {
        alert('Please select route.');
        return;
    }

    $.ajax({
        url: '/Analysis/Geteta',
        type: 'POST',
        data: { rid: rid },
        success: function (response) {
            console.log('ETA response:', response);

            if (!response || response === '0' || response === 'Data Not Found' || response === 'Invalid Route') {
                alert('ETA not found for selected route.');
                return;
            }

            let data;

            try {
                data = typeof response === 'string' ? JSON.parse(response) : response;
            } catch (e) {
                console.error('Failed to parse ETA JSON:', e);
                console.log('Raw ETA response:', response);
                alert('Failed to load ETA data.');
                return;
            }

            if (!data || data.length === 0) {
                alert('ETA not found for selected route.');
                return;
            }

            $('#checkEtaModalBody').empty();

            data.forEach(function (item) {
                $('#checkEtaModalBody').append(
                    '<tr>' +
                    '<td>' + (item.route_name || '-') + '</td>' +
                    '<td>' + (item.user_stop_name || '-') + '</td>' +
                    '<td>' + (item.sta || '00:00:00') + '</td>' +
                    '<td>' + (item.eta || '00:00:00') + '</td>' +
                    '<td>' + (item.route_status || '-') + '</td>' +
                    '</tr>'
                );
            });

            var modalElement = document.getElementById('CheckEtaModal');

            if (modalElement) {
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    var etaModal = new bootstrap.Modal(modalElement);
                    etaModal.show();
                } else {
                    $('#CheckEtaModal').modal('show');
                }
            } else {
                alert('Check ETA modal not found.');
            }
        },
        error: function (xhr, status, error) {
            console.error('ETA API error:', error);
            console.log('ETA API response:', xhr.responseText);
            alert('Unable to fetch ETA.');
        }
    });
}


function ignition() {

    var service_id = $('#ddl_route_search2').val();
    var start = $('#start_for_ig').val();
    var end = $('#end_for_ig').val();

    if (!service_id || service_id === '') {
        alert('Please select route.');
        return;
    }

    if (!start || !end) {
        alert('Please select start and end time.');
        return;
    }

    start = convertToSqlDateTime(start);
    end = convertToSqlDateTime(end);

    console.log("Selected Service ID:", service_id);
    console.log("Start:", start);
    console.log("End:", end);

    var startDate = new Date(start.replace(" ", "T"));
    var endDate = new Date(end.replace(" ", "T"));

    if (endDate <= startDate) {
        alert('End time should be greater than start time.');
        return;
    }

    //var differenceInMinutes = (endDate - startDate) / (1000 * 60);

    //if (differenceInMinutes > 30) {
    //    alert('Time difference should be less than or equal to 30 minutes.');
    //    return;
    //}

    if (endDate <= startDate) {
        alert('End time should be greater than start time.');
        return;
    }

    var table = $("#ign").DataTable();
    table.clear().draw();

    $.ajax({
        url: '/Analysis/checkign',
        type: 'POST',
        data: { sid: service_id, sdate: start, edate: end },
        success: function (response) {

            if (!response || response === '0' || response === 'Data Not Found') {
                alert('Ignition data not found.');
                return;
            }

            let data;

            try {
                data = typeof response === 'string' ? JSON.parse(response) : response;
            } catch (e) {
                console.error('Failed to parse ignition JSON:', e);
                console.log('Raw response:', response);
                alert('Failed to load ignition data.');
                return;
            }

            if (!data || data.length === 0) {
                alert('Ignition data not found.');
                return;
            }

            //let rows = data.map(item => [
            //    item.time || "",
            //    item.i2 == 1 ? "ON" : "OFF"
            //]);

            let rows = groupContinuousStatusRows(data, 'i2', function (value) {
                return value == 1 ? "ON" : "OFF";
            });

            table.rows.add(rows).draw();
        },
        error: function (xhr, status, error) {
            console.error('Ignition API error:', error);
            console.log(xhr.responseText);
            alert('Unable to fetch ignition data.');
        }
    });
}

function convertToSqlDateTime(value) {
    if (!value) return "";

    value = value.trim();

    // Example: 17:00 05/16/2026
    var parts = value.split(" ");
    if (parts.length === 2) {
        var time = parts[0];
        var date = parts[1];

        var dateParts = date.split("/");
        if (dateParts.length === 3) {
            var month = dateParts[0].padStart(2, '0');
            var day = dateParts[1].padStart(2, '0');
            var year = dateParts[2];

            return year + "-" + month + "-" + day + " " + time + ":00";
        }
    }

    return value.replace("T", " ");
}

function inactive() {

    var service_id = $('#ddl_route_search3').val();
    var start = $('#start_for_status').val();
    var end = $('#end_for_status').val();

    if (!service_id || service_id === '') {
        alert('Please select route.');
        return;
    }

    if (!start || !end) {
        alert('Please select start and end time.');
        return;
    }

    start = convertToSqlDateTime(start);
    end = convertToSqlDateTime(end);

    console.log("Selected Service ID:", service_id);
    console.log("Start:", start);
    console.log("End:", end);

    var startDate = new Date(start.replace(" ", "T"));
    var endDate = new Date(end.replace(" ", "T"));

    if (endDate <= startDate) {
        alert('End time should be greater than start time.');
        return;
    }

    //var differenceInMinutes = (endDate - startDate) / (1000 * 60);

    //if (differenceInMinutes > 30) {
    //    alert('Time difference should be less than or equal to 30 minutes');
    //    return;
    //}

    if (endDate <= startDate) {
        alert('End time should be greater than start time.');
        return;
    }

    var table = $("#status").DataTable();
    table.clear().draw();

    $.ajax({
        url: '/Analysis/checinactive',
        type: 'POST',
        data: { sid: service_id, sdate: start, edate: end },
        success: function (response) {

            if (!response || response === '0' || response === 'Data Not Found') {
                alert('Inactive status data not found.');
                return;
            }

            let data;

            try {
                data = typeof response === 'string' ? JSON.parse(response) : response;
            } catch (e) {
                console.error('Failed to parse inactive JSON:', e);
                console.log('Raw response:', response);
                alert('Failed to load inactive status data.');
                return;
            }

            //let rows = data.map(item => [
            //    item.time || "",
            //    item.status || ""
            //]);

            //table.rows.add(rows).draw();

            let rows = groupContinuousStatusRows(data, 'status', function (value) {
                return value || "";
            });

            table.rows.add(rows).draw();
        },
        error: function (xhr, status, error) {
            console.error('Inactive API error:', error);
            console.log(xhr.responseText);
            alert('Unable to fetch inactive status data.');
        }
    });
}
function groupContinuousStatusRows(data, statusField, statusFormatter) {
    if (!data || data.length === 0) {
        return [];
    }

    var groupedRows = [];
    var currentStatus = null;
    var startTime = null;
    var endTime = null;

    data.forEach(function (item) {
        var time = item.time || "";
        var status = statusFormatter ? statusFormatter(item[statusField], item) : item[statusField];

        if (currentStatus === null) {
            currentStatus = status;
            startTime = time;
            endTime = time;
            return;
        }

        if (status === currentStatus) {
            endTime = time;
        } else {
            groupedRows.push([
                startTime + " - " + endTime,
                currentStatus
            ]);

            currentStatus = status;
            startTime = time;
            endTime = time;
        }
    });

    if (currentStatus !== null) {
        groupedRows.push([
            startTime + " - " + endTime,
            currentStatus
        ]);
    }

    return groupedRows;
}