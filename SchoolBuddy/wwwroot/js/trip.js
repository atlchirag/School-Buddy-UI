/*const { data } = require("jquery");*/

var marker;
var dataRoute;
var mapwithmarker;
var directionsService; 
var directionsDisplaymap;
var data = [];
var fromRouteCircle = true;
var Circles = [];
var color = 'red';
var polyLines = [];
var data_vias = [];

$(document).ready(function () {
    myMap();
});

function myMap() {
    directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true
    });

    var mapProp = {
        center: new google.maps.LatLng(28.633461, 77.222654),
        zoom: 2,
    };

    var map = new google.maps.Map(document.getElementById("googleMap"), mapProp);


}
//function gotocreateroute() {
   
//    document.getElementById('idforcreatetrip').style.display = "none";
   
//    document.getElementById('text').innerHTML = "Create Route";
//    document.getElementById('idforcreateroute').style.display = "block";
//    document.getElementById('googleMap').style.display = "none";
//    document.getElementById('googleMapwithmarkers').style.display = "block";

//    //myMapwithmarkers();
//    //dataRoute=getAjaxData(51051, '2024-05-01 00:00:00', '2024-05-01 23:59:59');
//    getAjaxData(55366, '2024-04-25 14:00:00', '2024-04-25 15:00:00');



//    //getAjaxData(service_id, start, end);

//}
//function myMapwithmarkers() {
//    directionsDisplaymap = new google.maps.DirectionsRenderer({
//        draggable: true
//    });
//    directionsService = new google.maps.DirectionsService();

//    var mapProp = {
//        center: new google.maps.LatLng(28.633461, 77.222654),
//        zoom: 15,
//    };

//    mapwithmarker = new google.maps.Map(document.getElementById("googleMapwithmarkers"), mapProp);
//    directionsDisplaymap.setMap(mapwithmarker)
//    // Add click event listener to the map
//    google.maps.event.addListener(mapwithmarker, 'click', function (event) {
//        placeMarker(event.latLng); // Call function to place marker

//    });

//    function placeMarker(location) {
//        marker = new google.maps.Marker({
//            position: location,
//            map: mapwithmarker,
//            //draggable: true
//        });

//        // Get latitude and longitude
//        var latitude = location.lat();
//        var longitude = location.lng();
//        var reverseGeoCoder = new google.maps.Geocoder();
//        reverseGeoCoder.geocode({ 'location': location }, function (result, status) {
//            if (status == google.maps.GeocoderStatus.OK) {
//                if (result[0]) {
//                    var address = result[0].formatted_address;
//                    console.log(address);
//                }
//            }
//        });


//        // Display latitude and longitude
//        alert("Latitude: " + latitude + "\nLongitude: " + longitude);
//        // Add click event listener to the marker
//        google.maps.event.addListener(marker, 'click', function () {
//            marker.setMap(null); // Remove the marker when clicked
//        });
//        $('#positions').val(parseFloat(latitude) + "," + parseFloat(longitude));
//        $('#exampleModal').modal('show');


//    }



//}

//function studentallocatetostop() {
//    document.getElementById('studentallocatetostop').style.display = 'block';
//    document.getElementById('idforcreateroute').style.display = 'none';
//}

//function backbutton() {
//    $('#googleMapwithmarkers').hide();
//    $('#googleMap').show();
//    $('#idforcreatetrip').show();
//    $('#idforcreateroute').hide();
//}

//function backbuttontocreatestop() {
//    $('#idforcreateroute').show();
//    $('#studentallocatetostop').hide();
//}




//function getAjaxData(busId, start, end) {
//    var x;
//    var url = 'https://fasttracksoft.us/api_v2/abctraq/GetplaybackData.php?did=' + busId + '&sdate=' + start + '&edate=' + end;
//    console.log(url);
//    $.ajax({
//        url: url,
//        //   data:{did:7736,sdate:'2017-08-2514:00:00',edate:'2017-08-2516:00:00'},
//        type: "GET",
        
//        beforeSend: function () {
//            $('.loader').show();
//        },
//        success: function (data) {
//            dataRoute = JSON.parse(data);
//            var lastmarker;
//            for (var i = 0; i < dataRoute.length; i++) {

//                var d = dataRoute[i];
//                //console.log(d);
//                var pos = new google.maps.LatLng(parseFloat(d.lat), parseFloat(d.lng));
//                var marker = new google.maps.Marker({
//                    position: pos,
//                    map: mapwithmarker,
//                    label: { text: (i + 1).toString(), fontWeight: 'bold' },
//                    icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
//                });
//                lastmarker = marker;
//                AddViasData(i, marker, d, mapwithmarker);
//                var m = "<b>" + (i + 1) + "</b> lat :" + d.lat + " lng :" + d.lng + "<br/>" + d.date;
//                addInfoWindowBus(marker, mapwithmarker, m, d.date, i)


//                //    addInfoWindow(marker, d.user_stop_name, d.Id, d.total, d.route_name, id, color);
//                if (i < dataRoute.length - 1) {
//                    var startLat = parseFloat(dataRoute[i].lat);
//                    var stopLon = parseFloat(dataRoute[i].lng);
//                    var endLat = parseFloat(dataRoute[i + 1].lat);
//                    var endLon = parseFloat(dataRoute[i + 1].lng);
//                    var stop1 = new google.maps.LatLng(startLat, stopLon);
//                    var stop2 = new google.maps.LatLng(endLat, endLon);
//                    ShowRoute(mapwithmarker, stop1, stop2, color);
//                    //  drawCircle(map, startLat, stopLon, endLat, endLon);
//                }


//            }
            
//            if (lastmarker) {
                
//                mapwithmarker.setCenter(lastmarker.getPosition());
//            }


//        },
//        complete: function () {
//            $(".loader").hide();
//            swal.fire("Route Visible on map....");
           
//        },
//        error: function (x, t, m) {
//            //  alert(errorMsg);
//        }
//    });
//    return x;
//}

//function createvias() {
//    var start_latitude = parseFloat(dataRoute[0].lat);
//    console.log(start_latitude)
//    var start_longitude = parseFloat(dataRoute[0].lng);
//    console.log(start_longitude)
//    var end_latitude = parseFloat(dataRoute[dataRoute.length - 1].lat);
//    console.log(end_latitude)
//    var end_longitude = parseFloat(dataRoute[dataRoute.length - 1].lng);

//    var start_position = new google.maps.LatLng(start_latitude, start_longitude);
//    var end_position = new google.maps.LatLng(end_latitude, end_longitude);

//    var request = {
//        origin: start_position,
//        destination: end_position,
//        travelMode: google.maps.TravelMode.DRIVING
//    };
//    console.log(request.travelMode + ",", request.origin + "," + request.destination)
//    directionsService.route(request, function (response, status) {
     
//        if (status == google.maps.DirectionsStatus.OK) {
//            console.log(status)
//            console.log(response.routes[0].overview_path.length)
//            directionsDisplaymap.setDirections(response);
//        }
//    });

//}

//function AddViasData(i, marker, d, map) {

//    var details = { "id": i, "name": "", "latitude": parseFloat(d.lat), "longitude": parseFloat(d.lng) };
//    data.push(details);
//    drawCircle(mapwithmarker, parseFloat(d.lat), parseFloat(d.lng), null, null, null);
//    google.maps.event.addListener(marker, 'dragend', function (event) {
//        data[i].latitude = event.latLng.lat();
//        data[i].longitude = event.latLng.lng();
//        //     dis = AjaxCall("route.asmx/GetDistance1", { slat: sLat.toString(), slng: sLon.toString(), elat: eLat.toString(), elon: eLon.toString() }, '', '');
//        //info.setContent(dis.toString());

//        drawCircle(mapwithmarker, event.latLng.lat(), event.latLng.lng(), i, i, null);
//    });
//}
//function addInfoWindowBus(marker, map, message, date, no) {

//    var infoWindow = new google.maps.InfoWindow({ content: message });
//    //   infoWindow.open(map, marker);
//    google.maps.event.addListener(marker, 'click', function () {
//        if (info < 2) {
//            var m = "<b>" + (no + 1) + "</b> lat :" + this.getPosition().lat() + " lng :" + this.getPosition().lng() + "<br/>" + date;
//            infoWindow.setContent(m);
//            infoWindow.open(map, marker);
//            info += 1;
//            DateInfo.push(date);

//            //if ($("#txt_start_via").val() == "") {

//            //    $("#txt_start_via").val(this.getPosition().lat() + "," + this.getPosition().lng());
//            //    start_marker = no;

//            //}
//            //else {
//            //    if ($("#txt_end_via").val() == "") {


//            //        $("#txt_end_via").val(this.getPosition().lat() + "," + this.getPosition().lng());
//            //        end_marker = no;

//            //    }

//            //}
//        }
//    });
//    google.maps.event.addListener(infoWindow, 'closeclick', function () {
//        info -= 1;
//        for (var k = 0; k < DateInfo.length; k++) {
//            if (DateInfo[k] == date) {
//                DateInfo.splice(k, 1);


//                if ($("#txt_start_via").val() == marker.getPosition().lat() + "," + marker.getPosition().lng()) {

//                    $("#txt_start_via").val("")

//                }
//                else {
//                    if ($("#txt_end_via").val() == marker.getPosition().lat() + "," + marker.getPosition().lng()) {


//                        $("#txt_end_via").val("")

//                    }

//                }

//            }
//        }
//    });
//}
//function ShowRoute(map, stop1, stop2, color) {
//    // var lineSymbol = { path: new google.maps.SymbolPath.BACKWARD_CLOSED_ARROW };
//    var RoutePath = new google.maps.Polyline({
//        path: [stop1, stop2],
//        strokeColor: color,
//        strokeOpacity: 1,
//        strokeWeight: 2,
//        icons: [{ icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW }, offset: '100%', repeat: '100px' }]
//    });

//    RoutePath.setMap(map);
//    polyLines.push(RoutePath);
//}
//function drawCircle(map, startLat, startLon, endLat, endLon, no) {

//    //var data = AjaxCall("route.asmx/MidPoint1", { slat: startLat.toString(), slng: startLon.toString(), elat: endLat.toString(), elon: endLon.toString() }, '', '');
//    //var radius = AjaxCall("route.asmx/GetDistance1", { slat: startLat.toString(), slng: startLon.toString(), elat: endLat.toString(), elon: endLon.toString() }, '', '');
//    //data = JSON.parse(data);
//    // var lat = data.substring(0, data.indexOf(','));
//    //   var i = data.indexOf(',');
//    //var lng = data.substring(data.indexOf(',') + 1);
//    //   console.log(radius.toString());
//    //radius = radius / 2;
//    var center = new google.maps.LatLng(parseFloat(startLat), parseFloat(startLon));
//    var circle = new google.maps.Circle(
//        {
//            //  map: map,
//            radius: 50,
//            center: center,
//            strokeColor: 'black',
//            strokeWeight: 1,
//            strokeOpacity: 0.5,
//            fillColor: 'red',
//            fillOpacity: 0.5

//        });
//    if (fromRouteCircle) {
//        circle.setOptions({ fillColor: 'green' });
//    }
//    if (endLat != null && endLat == endLon) {
//        Circles[endLat].setMap(null);
//        Circles[endLat] = circle;
//    }
//    else {
//        if (no == null) {
//            Circles.push(circle);
//        }
//    }
   

//}

//function showvias() {


//    path = directionsDisplaymap.directions.routes[0].overview_path;
//    console.log(path);
//    var length = path.length;
//    console.log(length);
//    for (var i = 0; i < length; i++) {
//        var lat1 = directionsDisplaymap.directions.routes[0].overview_path[i].lat();
//        var lon1 = directionsDisplaymap.directions.routes[0].overview_path[i].lng();
//        console.log(lat1 + ",", lon1)
//        var pos1 = new google.maps.LatLng(lat1, lon1);
//        //var marker1 = new google.maps.Marker({
//        //    position: pos1,
//        //    map: map

//        //});

//        var lat;
//        var lon;
//        if (i == 0) {
//            var lat_first = directionsDisplaymap.directions.routes[0].overview_path[i].lat();
//            var lon_first = directionsDisplaymap.directions.routes[0].overview_path[i].lng();
//            console.log(lat_first + ",", lon_first)
//            data_vias.push({ "Latitude": lat_first, "Longitude": lon_first });
//            continue;
//        }

//        if (i < length - 1) {

//            console.log(data_vias.length)
//            lat = data_vias[data_vias.length - 1].Latitude;
//            lon = data_vias[data_vias.length - 1].Longitude;
//            console.log(lat + ",", lon)
//            //var lat1 = response.routes[0].overview_path[i].lat();
//            //var lon1 = response.routes[0].overview_path[i].lng();
//            var dis = AjaxCall("route.asmx/GetDistance1", { slat: lat.toString(), slng: lon.toString(), elat: lat1.toString(), elon: lon1.toString() }, '', '');

//            if (dis < 95) {

//                continue;
//            }
//            var total_run = Math.ceil(dis / 95);
//            console.log(total_run)
//            for (var k = 0; k < total_run; k++) {

//                lat = data_vias[data_vias.length - 1].Latitude;
//                lon = data_vias[data_vias.length - 1].Longitude;

//                addData(lat, lon, lat1, lon1);

//            }

//            data_vias.push({ "Latitude": lat1, "Longitude": lon1 });
//            //if (dis > 95 && dis < 101) {
//            //    data.push({ "Lat": lat1, "Lng": lon1 });
//            //}
//            //if (dis < 95) {
//            //    continue;
//            //}

//            //if (dis > 101) {

//            //    var midPoint = AjaxCall("route.asmx/GetLatLng", { slat: lat.toString(), slng: lon.toString(), elat: lat1.toString(), elon: lon1.toString() }, '', '');
//            //    var lat1 = parseFloat(midPoint.substring(0, midPoint.indexOf(',')).replace(',', ' ').trim());
//            //    var lon1 = parseFloat(midPoint.substring(midPoint.indexOf(',') + 1).replace(',', ' ').trim());
//            //    data.push({ "Lat": lat1, "Lng": lon1 });
//            //}

//            //if (i - data.length > 1) {
//            //    var lat = response.routes[0].overview_path[i].lat();
//            //    var lon = response.routes[0].overview_path[i].lng();
//            //    data.push({ "Lat": lat, "Lng": lon });

//            //}
//        }
//    }

//    for (var l = 0; l < data_vias.length; l++) {

//        if (l != 0) {

//            var lat = data_vias[l].Latitude;
//            var lon = data_vias[l].Longitude;

//            var lat1 = data_vias[l - 1].Latitude;
//            var lon1 = data_vias[l - 1].Longitude;

//            var dis = AjaxCall("route.asmx/GetDistance1", { slat: lat.toString(), slng: lon.toString(), elat: lat1.toString(), elon: lon1.toString() }, '', '');

//            if (dis < 20) {

//                data_vias.splice(l, 1);
//                console.log(l);

//            }

//        }


//    }


//    for (var j = 0; j < data_vias.length; j++) {
//        var lat = data_vias[j].Latitude;
//        var lon = data_vias[j].Longitude;
//        var pos = new google.maps.LatLng(parseFloat(lat), parseFloat(lon));
//        var marker = new google.maps.Marker({
//            position: pos,
//            map: map,
//            draggable: true,
//            icon: 'Admin/icon.png'
//        });
//        marker.setLabel((j + 1).toString());
//        markers.push(marker);
//        var circle = new google.maps.Circle({
//            map: map,
//            radius: 50,
//            center: pos,
//            strokeColor: 'black',
//            strokeWeight: 1,
//            strokeOpacity: 0.5,
//            fillColor: 'red',
//            fillOpacity: 0.5

//        });
//        circles.push(circle);
//        addDragned(marker, j);
//        // addInfoWindow(marker);
//    }




//}
//function addData(lat, lon, lat1, lon1) {
//    try {
//        var dis = AjaxCall("route.asmx/GetDistance1", { slat: lat.toString(), slng: lon.toString(), elat: lat1.toString(), elon: lon1.toString() }, '', '');
//        if (dis > 95 && dis < 101) {
//            data_vias.push({ "Latitude": lat1, "Longitude": lon1 });
//        }
//        if (dis < 95) {
//        }

//        if (dis > 101) {

//            var midPoint = AjaxCall("route.asmx/GetLatLng", { slat: lat.toString(), slng: lon.toString(), elat: lat1.toString(), elon: lon1.toString() }, '', '');
//            var lat1 = parseFloat(midPoint.substring(0, midPoint.indexOf(',')).replace(',', ' ').trim());
//            var lon1 = parseFloat(midPoint.substring(midPoint.indexOf(',') + 1).replace(',', ' ').trim());
//            data_vias.push({ "Latitude": lat1, "Longitude": lon1 });
//        }
//    }
//    catch (err) {


//    }


//}

