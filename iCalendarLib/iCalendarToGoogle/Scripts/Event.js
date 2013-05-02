$(function () {
    $("#CalendarAvailabilityTypeID").change(function () {
        var op = $("#CalendarAvailabilityTypeID option:selected").val();
        if (op == 2 || op == 0) $("#Transparency").attr('checked', false);
        else $("#Transparency").attr('checked', true);
    });

    $("#StartTime").datetimepicker({
        dateFormat: 'dd/mm/yy',
        timeFormat: "hh:mm tt"
    });
    $("#EndTime").datetimepicker({
        dateFormat: 'dd/mm/yy',
        timeFormat: "hh:mm tt"
    });
});

//sending data to Controller
function SaveRecurrence() {
    // Step 1: Read View Data and Create JSON Object

    // Creating frequency Json Object
    //"CalendarReccursiveID": "", 
    var frec = {"CalendarReccursiveID":"", "DayOfWeek": "", "FrequencyDay": "", "ExtraValue": "" };
    // Creating recurrence Json Object
    var rec = { "ID":"", "EventID": "", "Frequency": "", "Count": "", "Interval": "", "Until": "", "FirstDayOfWeek": "", "CalendarReccurrenceFrequency": [] };

    // Set recurrence Value
    rec.ID = $("#ID").val();
    rec.EventID = $("#EventID").val();
    rec.Frequency = $("#Frequency").val();
    rec.Count = $("#Count").val();
    rec.Interval = $("#Interval").val();
    rec.Until = $("#Until").val();
    rec.FirstDayOfWeek = $("#FirstDayOfWeek").val();

    // Getting Table Data from where we will fetch Sales Sub Record
    var oTable = $('.tbl').dataTable().fnGetData();

    for (var i = 0; i < oTable.length; i++) {
        // IF This view is for edit then it will read SalesId from Hidden field
        if ($('#ID').length) {
            frec.CalendarReccursiveID= $('#ID').val();
        }
        // Set SalesSub individual Value
        frec.DayOfWeek = oTable[i][0];
        frec.FrequencyDay = oTable[i][1];
        frec.ExtraValue = oTable[i][2];
        // adding to SalesMain.SalesSub List Item
        rec.CalendarReccurrenceFrequency.push(frec);
        var frec = { "DayOfWeek": "", "FrequencyDay": "", "ExtraValue": "" };

    }
    // Step 1: Ends Here


    // Set 2: Ajax Post
    // Here i have used ajax post for saving/updating information
    $.ajax({
        url: '/Recurrence/Create',
        data: JSON.stringify(rec),
        type: 'POST',
        contentType: 'application/json;',
        dataType: 'json',
        success: function (result) {
            if (result.Success == "1") {
                ocultardiv();
                //window.location.href = "/Sales/index";
            }
            else {
                alert(result.ex);
            }
        }
    });
}

//load edit link
function loadEdit() {
    $("#EditLink").click(function () {
        $("#formulario").load($(this).attr("href")).dialog({
            modal: true,
            title: "Edit Recurrence"
        });
        return false; //not fire link
    })
}

//load delete link
function loadDelete() {
    $("#DeleteLink").click(function () {
        $("#formulario").load($(this).attr("href")).dialog({
            modal: true,
            title:"Delete Recurrence"
        });
        return false;
    });
}

//load add link
function loadAdd() {
    $("#AddLink").click(function () {
        $("#formulario").load($(this).attr("href")).dialog({
            modal: true,
            title: "Add Recurrence"
        });
        return false;
    })
}

//update zone
function ocultardiv() {
    $("#refresco").load("/Recurrence/Index", function () {
        loadEdit();
        loadDelete();
    });
    //cass: close dialogs
    $(".ui-dialog-content").dialog("close");

}

function CloseDialog(evId) {
    var ref = get_hostname()+'/Recurrence/Create/' + evId;

    $(".ui-dialog-content").dialog("close");
    $("#refresco").html("<a id='AddLink' href='" + ref + "'>Add Recurrence<a>");
    loadAdd();
}

function get_hostname() {
    var m = window.location.href.match(/^http:\/\/[^/]+/);
    return m ? m[0] : null;
}

