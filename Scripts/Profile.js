/* TODO doc */
$(document).ready(function () {
    $("#customerName").hide();
    $("#PositionID").hide();
    $("#ProviderID").hide();
    $("#PositionSingular").hide();
});

/* Google Map */
var geocoder;
var map;
var query = "Carrer de Pau Claris 184, 08037,Barcelona";
function initialize() {
    geocoder = new google.maps.Geocoder();
    var myOptions = {
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.HYBRID
    }
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    codeAddress();
}

function codeAddress() {
    var address = query;
    geocoder.geocode({ 'address': address }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            var marker = new google.maps.Marker({
                map: map,
                title: "Loconomics Labs Inc.",
                position: results[0].geometry.location
            });
            var infoWindow = new google.maps.InfoWindow({
                content: "Loconomics Labs Inc. "
                       + "<br>Where Magic happens",
                width: 60,
                heigth:20,
                position: results[0].geometry.location
            });
            infoWindow.open(map);
        } else {
            alert("Geocode was not successful for the following reason: " + status);
        }
    });
}