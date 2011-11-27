/* [MonthView-settings] */
var LCSCalendarControl_ShowPreDays = true; 
	//Days in first week of month that belong to previous month, 
	//only applies to month views
var LCSCalendarControl_ShowPostDays = true; 
	//Days in last week of month that belong to following month, 
	//only applies to month views
var LCSCalendarControl_ShowNextPrevControls = true; 
	// shows controls that enable rendering of following or previous group 
var LCSCalendarControl_ShowYear = true; 
	//Will Render the Year in CCYY format
/* [/MonthView-settings] */


/* [WeeklyVeiw-settings] */
var LCSCalendarControl_NumberOfWeeks = 6; //currently this is set on the server and is defaulted to 6
                                          //changing this value will only change communication to the user
/* [/WeeklyVeiw-settings] */

                                                   
// note data is currently limited to current date + 6 weeks 


var LCSCalendarControl_Theme = "default";
var LCSCalendarControl_ServiceRoot = "http://localhost:9972/CS_weekly_Sat.json"; //"http://localhost:27147/calendarservice/"
var LCSCalendarControl_Directory = "scripts";
var LCSCalendarControl_LocalizationPath = LCSCalendarControl_Directory + "/LCSCalendar/Localization";

$(document).ready(function () {
    // Load Styles for calendar based on "Theme" setting above
    var LCSTheme_StylesheetPath = LCSCalendarControl_Directory + '/LCSCalendar/Themes/' + LCSCalendarControl_Theme + '/' + LCSCalendarControl_Theme + '_LCSCalendar.css';
    LCSCalendarControl_AddStyleSheet(LCSTheme_StylesheetPath);

    //Load CalendarControl
    $.getScript(LCSCalendarControl_Directory + "/LCSCalendar/LCSCalendarControl.js");
});



function LCSCalendarControl_AddStyleSheet(path) {
    if (document.createStyleSheet) {
        document.createStyleSheet(path); //IE syntax
    }
    else {
        $("head").append($("<link rel='stylesheet' href='" + path + "' type='text/css' media='screen' />"));
    }
}