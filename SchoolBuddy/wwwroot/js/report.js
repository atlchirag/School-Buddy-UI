var notificationlog = document.getElementById('A1');
var studentnotificationlog = document.getElementById('A2');
var nogps = document.getElementById('A3');
var loginreport = document.getElementById('A4');
var rfidreport = document.getElementById('A55');
//alert(loginreport);
var stopviolation = document.getElementById('A6');
var uhfreport = document.getElementById('A7');
window.onload = function () {
    var requestedTab = window.location.hash;
    var requestedLink = requestedTab
        ? document.querySelector('#main a[href="' + requestedTab + '"]')
        : null;
    var notificationlog = document.getElementById('A1');
    var tabToOpen = requestedLink || notificationlog;

    if (tabToOpen) {
        tabToOpen.click();
    }
}

function changebg() {

    notificationlog.style.backgroundColor = 'midnightblue';
    notificationlog.style.color = 'white';

    studentnotificationlog.style.backgroundColor = 'white';
    studentnotificationlog.style.color = 'black';
    nogps.style.backgroundColor = 'white';
    nogps.style.color = 'black';
    loginreport.style.backgroundColor = 'white';
    loginreport.style.color = 'black';
    document.getElementById("A55").style.backgroundColor = "white";
    document.getElementById("A55").style.color = "black";
    //rfidreport.style.backgroundColor = 'white';
    //rfidreport.style.color = 'black';
    stopviolation.style.backgroundColor = 'white';
    stopviolation.style.color = 'black';
    uhfreport.style.backgroundColor = 'white';
    uhfreport.style.color = 'black';

}
function changebg1() {
    $('#ddl_student_search').val(null).trigger('change');
   
   // console.log('Hi');
    studentnotificationlog.style.backgroundColor = 'midnightblue';
    studentnotificationlog.style.color = 'white';
    notificationlog.style.backgroundColor = 'white';
    notificationlog.style.color = 'black';
    nogps.style.backgroundColor = 'white';
    nogps.style.color = 'black';
    loginreport.style.backgroundColor = 'white';
    loginreport.style.color = 'black';
    document.getElementById("A55").style.backgroundColor = "white";
    document.getElementById("A55").style.color = "black";
    stopviolation.style.backgroundColor = 'white';
    stopviolation.style.color = 'black';
    uhfreport.style.backgroundColor = 'white';
    uhfreport.style.color = 'black';
    var dropdown = document.getElementById('ddl_student_search');


    if (dropdown.options.length<=0) {
        $.ajax({
            url: '/schoolbuddy/Report/GetAllStudents',
            type: 'POST',
            // data: { uid: "5415" },
            data: { uid: uid },
            success:
                function (response) {
                    var students;

                    try {
                        students = typeof response === 'string' ? JSON.parse(response) : response;
                    } catch (e) {
                        console.error('Failed to parse student data:', e);
                        return;
                    }

                    if (!Array.isArray(students)) {
                        return;
                    }

                    students.forEach(function (student) {
                        var option = $('<option>', {
                            value: student.id,
                            text: student.student_name
                        });
                        $('#ddl_student_search').append(option);
                    });

                    $('#ddl_student_search').trigger('change');
                },

            error: function (xhr, status, error) {
                console.error('Error occurred:', error);
            }

        });
    }
    







}
function changebg2() {

    nogps.style.backgroundColor = 'midnightblue';
    nogps.style.color = 'white';
    notificationlog.style.backgroundColor = 'white';
    notificationlog.style.color = 'black';
    studentnotificationlog.style.backgroundColor = 'white';
    studentnotificationlog.style.color = 'black';
    loginreport.style.backgroundColor = 'white';
    loginreport.style.color = 'black';
    document.getElementById("A55").style.backgroundColor = "white";
    document.getElementById("A55").style.color = "black";
    stopviolation.style.backgroundColor = 'white';
    stopviolation.style.color = 'black';
    uhfreport.style.backgroundColor = 'white';
    uhfreport.style.color = 'black';



}
function changebg3() {

    loginreport.style.backgroundColor = 'midnightblue';
    loginreport.style.color = 'white';

    nogps.style.backgroundColor = 'white';
    nogps.style.color = 'black';
    notificationlog.style.backgroundColor = 'white';
    notificationlog.style.color = 'black';
    studentnotificationlog.style.backgroundColor = 'white';
    studentnotificationlog.style.color = 'black';
    document.getElementById("A55").style.backgroundColor = "white";
    document.getElementById("A55").style.color = "black";
    stopviolation.style.backgroundColor = 'white';
    stopviolation.style.color = 'black';
    uhfreport.style.backgroundColor = 'white';
    uhfreport.style.color = 'black';
}
function changebg4() {

    //rfidreport.style.backgroundColor = 'midnightblue';
    //rfidreport.style.color = 'white';
    document.getElementById("A55").style.backgroundColor = "midnightblue";
    document.getElementById("A55").style.color = "white";

    nogps.style.backgroundColor = 'white';
    nogps.style.color = 'black';
    notificationlog.style.backgroundColor = 'white';
    notificationlog.style.color = 'black';
    studentnotificationlog.style.backgroundColor = 'white';
    studentnotificationlog.style.color = 'black';
    loginreport.style.backgroundColor = 'white';
    loginreport.style.color = 'black';
    stopviolation.style.backgroundColor = 'white';
    stopviolation.style.color = 'black';
    uhfreport.style.backgroundColor = 'white';
    uhfreport.style.color = 'black';
}
function changebg5() {


    $('#ddl_route_search option').prop("selected", false);
    $('#ddl_route_search').trigger('change');
    stopviolation.style.backgroundColor = 'midnightblue';
    stopviolation.style.color = 'white';
    nogps.style.backgroundColor = 'white';
    nogps.style.color = 'black';
    notificationlog.style.backgroundColor = 'white';
    notificationlog.style.color = 'black';
    studentnotificationlog.style.backgroundColor = 'white';
    studentnotificationlog.style.color = 'black';
    loginreport.style.backgroundColor = 'white';
    loginreport.style.color = 'black';
    document.getElementById("A55").style.backgroundColor = "white";
    document.getElementById("A55").style.color = "black";
    uhfreport.style.backgroundColor = 'white';
    uhfreport.style.color = 'black';

    var dropdown = document.getElementById('ddl_route_search');


    if (dropdown.options.length <= 0) {
       // console.log('njf');
        $.ajax({
            url: '/schoolbuddy/Report/GetAllRoutes',
            type: 'POST',
            // data: { uid: "5415" },
            data: { uid: uid },
            success:
                function (response) {
                    var routes = JSON.parse(response);
                    console.log(routes);
                    //console.log(id);
                    routes.forEach(function (route) {
                        var option = $(`<option value = "${route.id}">${route.route_name}</option>`);
                        $('#ddl_route_search').append(option);
                        console.log(route.route_name);
                    })

                    console.log('find');
                },

            error: function (xhr, status, error) {
                console.error('Error occurred:', error);
            }

        });
    }

}
function changebg6() {

    uhfreport.style.backgroundColor = 'midnightblue';
    uhfreport.style.color = 'white';
    stopviolation.style.backgroundColor = 'white';
    stopviolation.style.color = 'black';
    nogps.style.backgroundColor = 'white';
    nogps.style.color = 'black';
    notificationlog.style.backgroundColor = 'white';
    notificationlog.style.color = 'black';
    studentnotificationlog.style.backgroundColor = 'white';
    studentnotificationlog.style.color = 'black';
    loginreport.style.backgroundColor = 'white';
    loginreport.style.color = 'black';
    document.getElementById("A55").style.backgroundColor = "white";
    document.getElementById("A55").style.color = "black";

}

//$('.datepicker').datepicker({
//    format: 'yyyy-mm-dd',
//    autoclose: true,
//    startView: "years", // Display the year view initially
//    minViewMode: "years" // Only display the year selection


//});
