/* TODO doc */
$(function () {
    $("#customerName").hide();
    $("#PositionID").hide();
    $("#ProviderID").hide();
    $("#PositionSingular").hide();

    /* Photos (MyWork) selection: */
    $('.position-tab > .mywork').on('click', '.photo-library li a', function () {
        var $t = $(this);
        var cont = $t.closest('.mywork');
        var hlPanel = $('.gallery-highlighted', cont);

        // Set this photo as selected
        var selected = $t.closest('li');
        selected.addClass('selected').siblings().removeClass('selected');
        if (selected != null && selected.length > 0) {
            var selImg = selected.find('img');
            // Moving selected to be highlighted panel
            hlPanel.find('img').attr('src', selImg.attr('src'));
            var caption = selImg.attr('alt');
            hlPanel.find('img').attr('alt', caption);
            hlPanel.find('.photo-caption').text(caption);
        }
        return false;
    });
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