//Requires - LCSCalendarControl_Settings.js

// =============================
//  Global Variables 
// =============================
var LCSGlobal_Disconnected = true;
var LCSGlobal_DblQuote = '"';
//var LCSGlobal_Language = LCSCalendar_GetCookie("Language", "English");
//var LCSGlobal_Culture = LCSCalendar_GetCookie("Culture", "en");  //see list at http://msdn.microsoft.com/en-us/goglobal/bb896001.aspx

var LCSGlobal_Language = LCSCalendar_GetCookie("Language", "Spanish");
var LCSGlobal_Culture = LCSCalendar_GetCookie("Culture", "es");  //see list at http://msdn.microsoft.com/en-us/goglobal/bb896001.aspx

//Add third party control stylesheets
var ThirdPartyBasePath = "Scripts/LCSCalendar/ThirdParty";

//Load Dependant scripts
$.getScript(LCSCalendarControl_LocalizationPath + "/" + LCSGlobal_Culture + "/Calendar-strings.js");
$.getScript(ThirdPartyBasePath + "/wwwAspNet/ServiceProxy_partial.js");
$.getScript(ThirdPartyBasePath + "/jsonpath/jsonpath-0.8.0.js");
$.getScript(ThirdPartyBasePath + "/BlockUI/jQuery.blockuUI.js");


// ==========================================================================
//  Load Calendar Control
// ==========================================================================

// this method detects calendar control place holder(s) on the page
//  (i.e div tags with class="LCSCalendarControl")
//  parses the "title" attribute to determine display type
//  - Loads the StyleSheet that corresponds to the displaytype
//  - Calls function that makes Ajax call to retrieve calendar data
$("div.lcs_calendar_control").each(function (index, curDiv) {
    var CalendarContainer = true;

    var LCSTitle = $(curDiv).attr("title"); //should be of the form "Calendar:SimpleMonth"
    //alert("LCSTitle: " + LCSTitle);

    var LCSDisplayType = LCSTitle.substring("Calendar:".length); // title should be of the form "Calendar:SimpleMonth"
    // Display type is everything after the colon

    var DataView = "Week" //default
    if (LCSDisplayType.search("Week") > -1)
        DataView = "Weeks";
    else if (LCSDisplayType.search("Month") > -1)
        DataView = "Months";
    else
        CalendarContainer = false;

    if (CalendarContainer) {

        var LCSService_url = LCSCalendarControl_ServiceRoot + DataView;

        //Set up container and Error Logging
        var LCSContainerRef = $(curDiv).attr("id");
        LCSContainerRef = InsertTable(LCSContainerRef, LCSDisplayType);

        //Load Stylesheet
        LCSStyleSheetPath = LCSCalendarControl_Directory + '/LCSCalendar/' + LCSCalendarControl_Theme + '/' + LCSDisplayType + '.css';
        LCSCalendarControl_AddStyleSheet(LCSStyleSheetPath);

        //Load Template  
        LCSTemplatePath = LCSCalendarControl_Directory + "/LCSCalendar/Templates/" + LCSDisplayType + "_tmpl.htm";
        // $('#' + LCSContainerRef).load(LCSTemplatePath); -- this works, but changed base on referenced article recommenations

        $.get(LCSTemplatePath, function (templates) {
            //based on this article - http://encosia.com/jquery-templates-composite-rendering-and-remote-loading/
            // Inject all templates at the end of the document.
            $('body').append(templates);
        });
  
        var LCSAuthtoken = GetAuthToken(LCSCalendar_GetUserId(), LCSCalendar_GetSessionId());
        LCS_GetData(LCSService_url, LCSAuthtoken, LCSContainerRef, LCSDisplayType);  //make ajax call
    }
    else {
        alert("not a CalendarContainer");
    }

});


// this function makes the Ajax call that retrieves calendar data from the server
// It sets an Http Header containing an authtoken that is sent with the request
// this token is used by the server to determine if the request is being made by
// an authenticated user, an what that users id is in order to return that users
// calendar freebusy data.
function LCS_GetData(service_url, authtoken, containerRef, displayType) {
    //$.blockUI({ message: "<h1>Remote call in progress...</h1>" }); 
    //alert("getting data");
    var jqxhr = $.ajax({ url: service_url
                       , dataType: 'json'
                       , beforeSend: function (xhr) {
                           xhr.setRequestHeader("Authorization", authtoken);
                       }
    })
            .success(function (data) { onLCSCalendar_Success(data, containerRef, displayType); })
            .error(function (xhr, ajaxOptions, thrownError) { onLCSCalendar_Error(xhr, ajaxOptions, thrownError, containerRef, displayType); })
            //.complete(function () { //$.unblockUI();  });

 } //end LCS_GetData

// Method called when the Ajax request for calendar data fails
 function onLCSCalendar_Error(xhr, ajaxOptions, thrownError, containerRef, displayType) {
    // $.unblockUI(); 
    alert('Calendar Service is currently unavailable, please try again later.');
    if(LCSGlobal_Disconnected == true)
    {
        onLCSCalendar_Success(GetStaticData(), containerRef, displayType);
    }
}


// Method called when the Ajax request is returned successfully
function onLCSCalendar_Success(data, containerRef, displayType) {
   // $.unblockUI(); 
    var path;
    var CalendarTemplate = "#" + displayType + "_tmpl";
    var EventTemplate = "#Event_tmpl";
    var TodaySortedDate = SortedDateGet();
    
    //Apply the template to the Data
    $(CalendarTemplate).tmpl(data).appendTo("#" + containerRef);

    
    
    //------------------------------------------------------------------
    //   Post (CalendarView) Template Render
    //   Event and Layout handlers
    //------------------------------------------------------------------

    $("div.LCSCalendar_day").hover(
          //specific implementation defined in selected template
          function () { LCSCAL_ShowSelectedDayEvent($(this)); }
        , function () { LCSCAL_UnselectDayMouseOff($(this)); }
    );

   $("div.LCSCalendar_EventDay").hover(
        //specific implementation defined in selected template
          function () { LCSCAL_EventDayMouseOn( $(this) );  }
        , function () { LCSCAL_EventDayMouseOff( $(this) );  }
    );

    
    //Find today, Hi-lite, select today's card and auto render to the right
    //of the current calendar display on calendar render
    //this will cause the default or initial view to be the current day.
   $(document).ready(function () {
       //Build out the current Date String in Sorted Date Format
     

       //find today in the calendar and set its styles
       var currentday = $("div").find("[data-dateSL='" + TodaySortedDate + "']")
       currentday.addClass("LCSCalendar_CurrentDay");

       //find the associate day event card and show it to the right of the calendar
       var currentdayId = currentday.attr("id");
       var LinkId = currentdayId.replace("_Day", "_Event");
       $("#" + LinkId).css({ "display": "block" });
   });

           
     //Add event to day handler - fires when each day square in calendar is clicked on
     $("div.LCSCalendar_day").click(
        //specific implementation defined below
        function () { DayEventClickHandler($(this)) }
     );

     //Add event to day "more" and "add" on events list is clicked
     //these are links within the day event cards that appear to the right of the calendar
     //Should provide the same functionality as the "Day" event handler above     
     $("li.LCSCalendarEventsList").click(
        //specific implementation defined below
        function () { DayEventClickHandler($(this)) }
     );


     function DayEventClickHandler(e) {
         try {
            var currentDay = GetCurrent(data, $(e)); //where data is the initial JSON calendar result
            var jsonObj = GenerateDayView($(e));
            
                //*************************************
                //
                //  TODO (3): Convert to Modal Dialog (Jordan, could use some ideas here)
                //
                //  #test is currently a TD cell on the page
                //  want this to by a dynamic modal dialog 
                //*************************************
            var DialogElement = "#" + containerRef.replace("_tablecell", "_Dialog")  
                $(DialogElement).empty(); //remove any detail placed here by last click event
                $("#Event_tmpl").tmpl(jsonObj).appendTo(DialogElement);

                $.blockUI({ message: $(DialogElement),
                            fadeIn: 700, 
                            fadeOut: 700, 
                            showOverlay: true,
                            centerY: true, 
                            centerX: true,
                            css: { 
                                width: '497px', 
                                top: '10px', 
                                left: '100px', 
                                right: '10px', 
                                border: 'none', 
                                padding: '5px',
                                backgroundColor: '#FFF', 
                                '-webkit-border-radius': '10px', 
                                '-moz-border-radius': '10px',
                                color: '#00989A' 
                            } 
                 });

                        
                //------------------------------------------------------------------
                //   Post (HourGrid EventsView) Template Render
                //   Event and Layout handlers
                //------------------------------------------------------------------

                var Segments = new Array();

                $('.LCSCalTimeSegment').mousedown(function () {
                    //specific implementation of LCSCAL_DaySegmentSelect defined in selected template

                    //select this time segment
                    Segments = LCSCAL_DaySegmentSelect($(this), Segments);

                    //select any other time segments this event covers
                    //e.g an event that span 90 min may cover server time segments
                    var eventid = $(this).attr("data-eventid");
                    if (eventid != "") {
                        $('.LCSCalTimeSegment[data-eventid="' + eventid + '"]').each(function () {
                            Segments = LCSCAL_DaySegmentSelect($(this), Segments);
                        });
                    }
                });

                $('.LCSCalTimeSegment').dblclick(function () {
                    //specific implementation defined in selected template

                    //deselect this time segment
                    Segments = LCSCAL_DaySegmentRemove($(this), Segments);

                    //deselect any other time segments this event covers
                    //e.g an event that span 90 min may cover server time segments
                    var eventid = $(this).attr("data-eventid");
                    if (eventid != "") {
                        $('.LCSCalTimeSegment[data-eventid="' + eventid + '"]').each(function () {
                            Segments = LCSCAL_DaySegmentRemove($(this), Segments);
                        });
                    }
                    // alert(Segments.join(","));  //for testing
                });


                $("div.LCSCalTimeSegment").hover(
                    //specific implementation defined in selected template
                    function () { LCSCAL_DaySegmentMouseOn($(this)); }
                  , function () { LCSCAL_DaySegmentMouseOff($(this)); }
                );

                //Set Synched events to pre-load colored as busy events
                $('.LCSCalTimeSegment[title="' + Lang_Busy + '"]').addClass("LCSCAL_SetBusy");

                $("#LCSCAL_HourSegmentReset").click(function () {
                    ResetDayViewGrid(); }
                );

                $("#LCSCAL_HourSegmentUpdate").click(function () {
                    $.unblockUI();
                    //$.blockUI({ message: "<h1>Remote call in progress...</h1>" }); 
                    
                    LCSService_url = LCSCalendarControl_ServiceRoot + Update;
                    LCSAuthtoken = GetAuthToken(LCSCalendar_GetUserId(), LCSCalendar_GetSessionId());
                    LCS_UpdateFreeBusy(LCSService_url, LCSAuthtoken, LCSContainerRef, LCSDisplayType);  //make ajax call

//                    function LCS_UpdateFreeBusy(service_url, authtoken, containerRef, displayType) {
//                        //alert("getting data");
//                        var jqxhr = $.ajax({     url: service_url
//                                               , dataType: 'json'
//                                               , type: 'PUT'
//                                               , beforeSend: function (xhr) {
//                                                   xhr.setRequestHeader("Authorization", authtoken);
//                                               }
//                                           })
//                        .success(function (data) { onLCSCalendar_Success(data, containerRef, displayType); })
//                        .error(function (xhr, ajaxOptions, thrownError) { onLCSCalendar_Error(xhr, ajaxOptions, thrownError, containerRef, displayType); })
                    //    .complete(function () { $.unblockUI(); });
//                   } //end GetData

               });



            }
            catch (e) {
                //normally means the JSON obj didn't parse/load correctly
                //will need to replace this with something more user friendly 
                //and a logging feature for go-live
                alert("DayEventClickHandler CatchBlock\n" + e.toString());
            }

        }
        

       

    //==============================================
    //    Calendar Sync
    //==============================================
    
    //Add event to link for calendar sync view
    $("#LCSCalendarSync").click(
        function () {
            alert("got here");
            //switch to Sync template
        }
    );

}





// ============================
// Utility Functions
// ============================
//This method dynamically insert a table shell within the calendar control place holder div tag
function InsertTable(container, className) {
    var tablestr = "<table class='" + className + "'><tr><td id='" + container + "_tablecell' ></td></tr><tr><td id='" + container + "_Dialog' style='display:none'></td></tr><tr><td id='" + container + "_log'></td></tr></table>";
    $("#" + container).append(tablestr);
    return container + "_tablecell"; //id of subcontainer
}

//Date Regex from MSDN ServiceProxy
var reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;


Array.prototype.add = function (item) {
    this[this.length] = item;
}

Array.prototype.addDistinct = function (item) {
    if (this.find(item) == -1)
    {
        this.add(item);
        return true;
    }
    return false;
}

Array.prototype.find = function (item) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == item)
            return i;
    }
    return -1;
}

Array.prototype.remove = function (item) {
    var position = this.find(item);
    if (position > -1)
        this.splice(position, 1);
}

function SortedDateGet() {
    //for some reason - Array.prototype.add does not work in IE9 (worked since IE4)
    //but directly assigning to index works xbrowser
    var today = new Date();
    var datedate = today.getDate();
    var dateBuilder = new Array();
    dateBuilder[0]=today.getFullYear(); //4 digit year
    dateBuilder[1]="-";
    dateBuilder[2]=today.getMonth() + 1; //javascript returns months as 0-11
    dateBuilder[3]="-";
    if (datedate < 10)
        dateBuilder[4] = "0" + datedate; //single digit days need a leading zero
    else
        dateBuilder[4] = datedate
    return dateBuilder.join("");
}

Date.prototype.isoTime = function () {
    var str = new Array();
    str.add(this.getHours().toString());
    str.add(this.getMinutes().toString())
    str.add(this.getSeconds().toString());    
    return str.join(":");
}

Date.prototype.isoDate = function () {
    var str = new Array();
    str.add((this.getYear() + 1).toString());
    str.add((this.getMonth() + 1).toString())
    str.add((this.getDay() + 1).toString());
    return str.join("-");
}

function LCSCalendar_GetCookie(CookieKey, DefaultValue) {
    return ($.cookie(CookieKey) == null) ? DefaultValue : $.cookie(CookieKey);
}


function LCSCalendar_GetUserId() {
    var userid = LCSCalendar_GetCookie("UserId", "54321"); //temp default is 54321
    //alert(userid);
    return userid;
}

function LCSCalendar_GetSessionId() {
    var returnvalue = $.cookie("ASP.NET_SessionId")
    if (returnvalue == null)
        returnvalue = "88888"; //temp default is 88888
    //alert(returnvalue);
    return returnvalue;
}

function GetAuthToken(user, session) {
    var returnvalue = "Basic ";
    try
    {
        var bytes = Crypto.charenc.Binary.stringToBytes(user + ":" + session);
        returnvalue += Crypto.util.bytesToBase64(bytes);        
    }
    catch(e)
    {
        returnvalue += "1234";
    }
    //alert(returnvalue);
    return returnvalue;
}


function GetStaticData()
{
    alert("loading static data");
    var dataold= {"Culture":"en-US","Language":"English","Value":"","View":1
	,"Weeks":[
		{"Days":[
			 {"Events":null,"Index":25,"Value":"Sun"}
			,{"Events":null,"Index":26,"Value":"Mon"}
			,{"Events":null,"Index":27,"Value":"Tue"}
			,{"Events":null,"Index":28,"Value":"Wed"}
			,{"Events":null,"Index":29,"Value":"Thu"}
			,{"Events":null,"Index":30,"Value":"Fri"}
			,{"Events":[
				{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null
					,"EndTime":"\/Date(1317486601000-0700)\/"
					,"EndTimeLocale":"10\/1\/2011 9:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null
					,"StartTime":"\/Date(1317481200000-0700)\/"
					,"StartTimeLocale":"10\/1\/2011 8:00 AM","TimeZone":null,"UID":null,"UserID":0}
				,{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null
					,"EndTime":"\/Date(1317490201000-0700)\/"
					,"EndTimeLocale":"10\/1\/2011 10:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null
					,"StartTime":"\/Date(1317459600000-0700)\/"
					,"StartTimeLocale":"10\/1\/2011 2:00 AM","TimeZone":null,"UID":null,"UserID":0}
				,{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null
					,"EndTime":"\/Date(1317506401000-0700)\/"
					,"EndTimeLocale":"10\/1\/2011 3:00 PM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null
					,"StartTime":"\/Date(1317501000000-0700)\/"
					,"StartTimeLocale":"10\/1\/2011 1:30 PM","TimeZone":null,"UID":null,"UserID":0}
				]
			,"Index":1,"Value":"Sat"}
		]
		,"Index":0
		,"StartDate":"\/Date(1316952260574-0700)\/"
		,"StartDateLocale":"Sunday, September 25, 2011","Value":""}
	,{"Days":[{"Events":null,"Index":2,"Value":"Sun"},{"Events":null,"Index":3,"Value":"Mon"},{"Events":null,"Index":4,"Value":"Tue"},{"Events":null,"Index":5,"Value":"Wed"},{"Events":null,"Index":6,"Value":"Thu"},{"Events":null,"Index":7,"Value":"Fri"},{"Events":[{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1318091401000-0700)\/","EndTimeLocale":"10\/8\/2011 9:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1318086000000-0700)\/","StartTimeLocale":"10\/8\/2011 8:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1318095001000-0700)\/","EndTimeLocale":"10\/8\/2011 10:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1318064400000-0700)\/","StartTimeLocale":"10\/8\/2011 2:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1318111201000-0700)\/","EndTimeLocale":"10\/8\/2011 3:00 PM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1318105800000-0700)\/","StartTimeLocale":"10\/8\/2011 1:30 PM","TimeZone":null,"UID":null,"UserID":0}],"Index":8,"Value":"Sat"}],"Index":1,"StartDate":"\/Date(1317557060590-0700)\/","StartDateLocale":"Sunday, October 02, 2011","Value":""},{"Days":[{"Events":null,"Index":9,"Value":"Sun"},{"Events":null,"Index":10,"Value":"Mon"},{"Events":null,"Index":11,"Value":"Tue"},{"Events":null,"Index":12,"Value":"Wed"},{"Events":null,"Index":13,"Value":"Thu"},{"Events":null,"Index":14,"Value":"Fri"},{"Events":[{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1318696201000-0700)\/","EndTimeLocale":"10\/15\/2011 9:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1318690800000-0700)\/","StartTimeLocale":"10\/15\/2011 8:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1318699801000-0700)\/","EndTimeLocale":"10\/15\/2011 10:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1318669200000-0700)\/","StartTimeLocale":"10\/15\/2011 2:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1318716001000-0700)\/","EndTimeLocale":"10\/15\/2011 3:00 PM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1318710600000-0700)\/","StartTimeLocale":"10\/15\/2011 1:30 PM","TimeZone":null,"UID":null,"UserID":0}],"Index":15,"Value":"Sat"}],"Index":2,"StartDate":"\/Date(1318161860604-0700)\/","StartDateLocale":"Sunday, October 09, 2011","Value":""},{"Days":[{"Events":null,"Index":16,"Value":"Sun"},{"Events":null,"Index":17,"Value":"Mon"},{"Events":null,"Index":18,"Value":"Tue"},{"Events":null,"Index":19,"Value":"Wed"},{"Events":null,"Index":20,"Value":"Thu"},{"Events":null,"Index":21,"Value":"Fri"},{"Events":[{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1319301001000-0700)\/","EndTimeLocale":"10\/22\/2011 9:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1319295600000-0700)\/","StartTimeLocale":"10\/22\/2011 8:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1319304601000-0700)\/","EndTimeLocale":"10\/22\/2011 10:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1319274000000-0700)\/","StartTimeLocale":"10\/22\/2011 2:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1319320801000-0700)\/","EndTimeLocale":"10\/22\/2011 3:00 PM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1319315400000-0700)\/","StartTimeLocale":"10\/22\/2011 1:30 PM","TimeZone":null,"UID":null,"UserID":0}],"Index":22,"Value":"Sat"}],"Index":3,"StartDate":"\/Date(1318766660614-0700)\/","StartDateLocale":"Sunday, October 16, 2011","Value":""},{"Days":[{"Events":null,"Index":23,"Value":"Sun"},{"Events":null,"Index":24,"Value":"Mon"},{"Events":null,"Index":25,"Value":"Tue"},{"Events":null,"Index":26,"Value":"Wed"},{"Events":null,"Index":27,"Value":"Thu"},{"Events":null,"Index":28,"Value":"Fri"},{"Events":[{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1319905801000-0700)\/","EndTimeLocale":"10\/29\/2011 9:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1319900400000-0700)\/","StartTimeLocale":"10\/29\/2011 8:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1319909401000-0700)\/","EndTimeLocale":"10\/29\/2011 10:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1319878800000-0700)\/","StartTimeLocale":"10\/29\/2011 2:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1319925601000-0700)\/","EndTimeLocale":"10\/29\/2011 3:00 PM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1319920200000-0700)\/","StartTimeLocale":"10\/29\/2011 1:30 PM","TimeZone":null,"UID":null,"UserID":0}],"Index":29,"Value":"Sat"}],"Index":4,"StartDate":"\/Date(1319371460622-0700)\/","StartDateLocale":"Sunday, October 23, 2011","Value":""},{"Days":[{"Events":null,"Index":30,"Value":"Sun"},{"Events":null,"Index":31,"Value":"Mon"},{"Events":null,"Index":1,"Value":"Tue"},{"Events":null,"Index":2,"Value":"Wed"},{"Events":null,"Index":3,"Value":"Thu"},{"Events":null,"Index":4,"Value":"Fri"},{"Events":[{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1320510601000-0700)\/","EndTimeLocale":"11\/5\/2011 9:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1320505200000-0700)\/","StartTimeLocale":"11\/5\/2011 8:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1320514201000-0700)\/","EndTimeLocale":"11\/5\/2011 10:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1320483600000-0700)\/","StartTimeLocale":"11\/5\/2011 2:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":0,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1320530401000-0700)\/","EndTimeLocale":"11\/5\/2011 3:00 PM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1320525000000-0700)\/","StartTimeLocale":"11\/5\/2011 1:30 PM","TimeZone":null,"UID":null,"UserID":0}],"Index":5,"Value":"Sat"}],"Index":5,"StartDate":"\/Date(1319976260633-0700)\/","StartDateLocale":"Sunday, October 30, 2011","Value":""}],"Years":null}

    var data_en = { "Culture": "en-US", "Language": "English", "Value": "", "View": 1, "Weeks": [{ "Days": [{ "Events": null, "Index": 23, "LongValue": "Sunday, October 23, 2011", "SL_Date": "2011-10-23", "Value": "Sun" }, { "Events": null, "Index": 24, "LongValue": "Monday, October 24, 2011", "SL_Date": "2011-10-24", "Value": "Mon" }, { "Events": null, "Index": 25, "LongValue": "Tuesday, October 25, 2011", "SL_Date": "2011-10-25", "Value": "Tue" }, { "Events": null, "Index": 26, "LongValue": "Wednesday, October 26, 2011", "SL_Date": "2011-10-26", "Value": "Wed" }, { "Events": null, "Index": 27, "LongValue": "Thursday, October 27, 2011", "SL_Date": "2011-10-27", "Value": "Thu" }, { "Events": null, "Index": 28, "LongValue": "Friday, October 28, 2011", "SL_Date": "2011-10-28", "Value": "Fri" }, { "Events": [{ "CalendarEventId": 1882435592, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1319905801000-0700)\/", "EndTimeLocale": "9:30 AM", "EndTimeUTC": "2011-10-29 09:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1319900400000-0700)\/", "StartTimeLocale": "8:00 AM", "StartTimeUTC": "2011-10-29 08:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 1882435593, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1319909401000-0700)\/", "EndTimeLocale": "10:30 AM", "EndTimeUTC": "2011-10-29 10:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1319907600000-0700)\/", "StartTimeLocale": "10:00 AM", "StartTimeUTC": "2011-10-29 10:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 1882435594, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1319925600000-0700)\/", "EndTimeLocale": "3:00 PM", "EndTimeUTC": "2011-10-29 15:00:00Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1319920200000-0700)\/", "StartTimeLocale": "1:30 PM", "StartTimeUTC": "2011-10-29 13:30:00Z", "TimeZone": null, "UID": null, "UserID": 0}], "Index": 29, "LongValue": "Saturday, October 29, 2011", "SL_Date": "2011-10-29", "Value": "Sat"}], "Index": 0, "StartDate": "\/Date(1319383443735-0700)\/", "StartDateLocale": "Sunday, October 23, 2011", "StartDateUTC": "2011-10-23 08:24:03Z", "Value": "" }, { "Days": [{ "Events": null, "Index": 30, "LongValue": "Sunday, October 30, 2011", "SL_Date": "2011-10-30", "Value": "Sun" }, { "Events": null, "Index": 31, "LongValue": "Monday, October 31, 2011", "SL_Date": "2011-10-31", "Value": "Mon" }, { "Events": null, "Index": 1, "LongValue": "Tuesday, November 01, 2011", "SL_Date": "2011-11-01", "Value": "Tue" }, { "Events": null, "Index": 2, "LongValue": "Wednesday, November 02, 2011", "SL_Date": "2011-11-02", "Value": "Wed" }, { "Events": null, "Index": 3, "LongValue": "Thursday, November 03, 2011", "SL_Date": "2011-11-03", "Value": "Thu" }, { "Events": null, "Index": 4, "LongValue": "Friday, November 04, 2011", "SL_Date": "2011-11-04", "Value": "Fri" }, { "Events": [{ "CalendarEventId": 726643700, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1320510601000-0700)\/", "EndTimeLocale": "9:30 AM", "EndTimeUTC": "2011-11-05 09:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1320505200000-0700)\/", "StartTimeLocale": "8:00 AM", "StartTimeUTC": "2011-11-05 08:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 726643701, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1320514201000-0700)\/", "EndTimeLocale": "10:30 AM", "EndTimeUTC": "2011-11-05 10:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1320512400000-0700)\/", "StartTimeLocale": "10:00 AM", "StartTimeUTC": "2011-11-05 10:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 726643702, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1320530400000-0700)\/", "EndTimeLocale": "3:00 PM", "EndTimeUTC": "2011-11-05 15:00:00Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1320525000000-0700)\/", "StartTimeLocale": "1:30 PM", "StartTimeUTC": "2011-11-05 13:30:00Z", "TimeZone": null, "UID": null, "UserID": 0}], "Index": 5, "LongValue": "Saturday, November 05, 2011", "SL_Date": "2011-11-05", "Value": "Sat"}], "Index": 1, "StartDate": "\/Date(1319988243758-0700)\/", "StartDateLocale": "Sunday, October 30, 2011", "StartDateUTC": "2011-10-30 08:24:03Z", "Value": "" }, { "Days": [{ "Events": null, "Index": 6, "LongValue": "Sunday, November 06, 2011", "SL_Date": "2011-11-06", "Value": "Sun" }, { "Events": null, "Index": 7, "LongValue": "Monday, November 07, 2011", "SL_Date": "2011-11-07", "Value": "Mon" }, { "Events": null, "Index": 8, "LongValue": "Tuesday, November 08, 2011", "SL_Date": "2011-11-08", "Value": "Tue" }, { "Events": null, "Index": 9, "LongValue": "Wednesday, November 09, 2011", "SL_Date": "2011-11-09", "Value": "Wed" }, { "Events": null, "Index": 10, "LongValue": "Thursday, November 10, 2011", "SL_Date": "2011-11-10", "Value": "Thu" }, { "Events": null, "Index": 11, "LongValue": "Friday, November 11, 2011", "SL_Date": "2011-11-11", "Value": "Fri" }, { "Events": [{ "CalendarEventId": 2137491492, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1321119001000-0800)\/", "EndTimeLocale": "9:30 AM", "EndTimeUTC": "2011-11-12 09:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1321113600000-0800)\/", "StartTimeLocale": "8:00 AM", "StartTimeUTC": "2011-11-12 08:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 2137491493, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1321122601000-0800)\/", "EndTimeLocale": "10:30 AM", "EndTimeUTC": "2011-11-12 10:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1321120800000-0800)\/", "StartTimeLocale": "10:00 AM", "StartTimeUTC": "2011-11-12 10:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 2137491494, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1321138800000-0800)\/", "EndTimeLocale": "3:00 PM", "EndTimeUTC": "2011-11-12 15:00:00Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1321133400000-0800)\/", "StartTimeLocale": "1:30 PM", "StartTimeUTC": "2011-11-12 13:30:00Z", "TimeZone": null, "UID": null, "UserID": 0}], "Index": 12, "LongValue": "Saturday, November 12, 2011", "SL_Date": "2011-11-12", "Value": "Sat"}], "Index": 2, "StartDate": "\/Date(1320596643775-0800)\/", "StartDateLocale": "Sunday, November 06, 2011", "StartDateUTC": "2011-11-06 08:24:03Z", "Value": "" }, { "Days": [{ "Events": null, "Index": 13, "LongValue": "Sunday, November 13, 2011", "SL_Date": "2011-11-13", "Value": "Sun" }, { "Events": null, "Index": 14, "LongValue": "Monday, November 14, 2011", "SL_Date": "2011-11-14", "Value": "Mon" }, { "Events": null, "Index": 15, "LongValue": "Tuesday, November 15, 2011", "SL_Date": "2011-11-15", "Value": "Tue" }, { "Events": null, "Index": 16, "LongValue": "Wednesday, November 16, 2011", "SL_Date": "2011-11-16", "Value": "Wed" }, { "Events": null, "Index": 17, "LongValue": "Thursday, November 17, 2011", "SL_Date": "2011-11-17", "Value": "Thu" }, { "Events": null, "Index": 18, "LongValue": "Friday, November 18, 2011", "SL_Date": "2011-11-18", "Value": "Fri" }, { "Events": [{ "CalendarEventId": 1400855637, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1321723801000-0800)\/", "EndTimeLocale": "9:30 AM", "EndTimeUTC": "2011-11-19 09:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1321718400000-0800)\/", "StartTimeLocale": "8:00 AM", "StartTimeUTC": "2011-11-19 08:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 1400855638, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1321727401000-0800)\/", "EndTimeLocale": "10:30 AM", "EndTimeUTC": "2011-11-19 10:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1321725600000-0800)\/", "StartTimeLocale": "10:00 AM", "StartTimeUTC": "2011-11-19 10:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 1400855639, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1321743600000-0800)\/", "EndTimeLocale": "3:00 PM", "EndTimeUTC": "2011-11-19 15:00:00Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1321738200000-0800)\/", "StartTimeLocale": "1:30 PM", "StartTimeUTC": "2011-11-19 13:30:00Z", "TimeZone": null, "UID": null, "UserID": 0}], "Index": 19, "LongValue": "Saturday, November 19, 2011", "SL_Date": "2011-11-19", "Value": "Sat"}], "Index": 3, "StartDate": "\/Date(1321201443799-0800)\/", "StartDateLocale": "Sunday, November 13, 2011", "StartDateUTC": "2011-11-13 08:24:03Z", "Value": "" }, { "Days": [{ "Events": null, "Index": 20, "LongValue": "Sunday, November 20, 2011", "SL_Date": "2011-11-20", "Value": "Sun" }, { "Events": null, "Index": 21, "LongValue": "Monday, November 21, 2011", "SL_Date": "2011-11-21", "Value": "Mon" }, { "Events": null, "Index": 22, "LongValue": "Tuesday, November 22, 2011", "SL_Date": "2011-11-22", "Value": "Tue" }, { "Events": null, "Index": 23, "LongValue": "Wednesday, November 23, 2011", "SL_Date": "2011-11-23", "Value": "Wed" }, { "Events": null, "Index": 24, "LongValue": "Thursday, November 24, 2011", "SL_Date": "2011-11-24", "Value": "Thu" }, { "Events": null, "Index": 25, "LongValue": "Friday, November 25, 2011", "SL_Date": "2011-11-25", "Value": "Fri" }, { "Events": [{ "CalendarEventId": 664219782, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1322328601000-0800)\/", "EndTimeLocale": "9:30 AM", "EndTimeUTC": "2011-11-26 09:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1322323200000-0800)\/", "StartTimeLocale": "8:00 AM", "StartTimeUTC": "2011-11-26 08:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 664219783, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1322332201000-0800)\/", "EndTimeLocale": "10:30 AM", "EndTimeUTC": "2011-11-26 10:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1322330400000-0800)\/", "StartTimeLocale": "10:00 AM", "StartTimeUTC": "2011-11-26 10:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 664219784, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1322348400000-0800)\/", "EndTimeLocale": "3:00 PM", "EndTimeUTC": "2011-11-26 15:00:00Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1322343000000-0800)\/", "StartTimeLocale": "1:30 PM", "StartTimeUTC": "2011-11-26 13:30:00Z", "TimeZone": null, "UID": null, "UserID": 0}], "Index": 26, "LongValue": "Saturday, November 26, 2011", "SL_Date": "2011-11-26", "Value": "Sat"}], "Index": 4, "StartDate": "\/Date(1321806243817-0800)\/", "StartDateLocale": "Sunday, November 20, 2011", "StartDateUTC": "2011-11-20 08:24:03Z", "Value": "" }, { "Days": [{ "Events": null, "Index": 27, "LongValue": "Sunday, November 27, 2011", "SL_Date": "2011-11-27", "Value": "Sun" }, { "Events": null, "Index": 28, "LongValue": "Monday, November 28, 2011", "SL_Date": "2011-11-28", "Value": "Mon" }, { "Events": null, "Index": 29, "LongValue": "Tuesday, November 29, 2011", "SL_Date": "2011-11-29", "Value": "Tue" }, { "Events": null, "Index": 30, "LongValue": "Wednesday, November 30, 2011", "SL_Date": "2011-11-30", "Value": "Wed" }, { "Events": null, "Index": 1, "LongValue": "Thursday, December 01, 2011", "SL_Date": "2011-12-01", "Value": "Thu" }, { "Events": null, "Index": 2, "LongValue": "Friday, December 02, 2011", "SL_Date": "2011-12-02", "Value": "Fri" }, { "Events": [{ "CalendarEventId": 630327709, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1322933401000-0800)\/", "EndTimeLocale": "9:30 AM", "EndTimeUTC": "2011-12-03 09:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1322928000000-0800)\/", "StartTimeLocale": "8:00 AM", "StartTimeUTC": "2011-12-03 08:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 630327710, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1322937001000-0800)\/", "EndTimeLocale": "10:30 AM", "EndTimeUTC": "2011-12-03 10:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1322935200000-0800)\/", "StartTimeLocale": "10:00 AM", "StartTimeUTC": "2011-12-03 10:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 630327711, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1322953200000-0800)\/", "EndTimeLocale": "3:00 PM", "EndTimeUTC": "2011-12-03 15:00:00Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1322947800000-0800)\/", "StartTimeLocale": "1:30 PM", "StartTimeUTC": "2011-12-03 13:30:00Z", "TimeZone": null, "UID": null, "UserID": 0}], "Index": 3, "LongValue": "Saturday, December 03, 2011", "SL_Date": "2011-12-03", "Value": "Sat"}], "Index": 5, "StartDate": "\/Date(1322411043836-0800)\/", "StartDateLocale": "Sunday, November 27, 2011", "StartDateUTC": "2011-11-27 08:24:03Z", "Value": ""}], "Years": null }
    var data_es = { "Culture": "es", "Language": "Spanish", "Value": "", "View": 1, "Weeks": [{ "Days": [{ "Events": null, "Index": 23, "LongValue": "domingo, 23 de octubre de 2011", "SL_Date": "2011-10-23", "Value": "dom" }, { "Events": null, "Index": 24, "LongValue": "lunes, 24 de octubre de 2011", "SL_Date": "2011-10-24", "Value": "lun" }, { "Events": null, "Index": 25, "LongValue": "martes, 25 de octubre de 2011", "SL_Date": "2011-10-25", "Value": "mar" }, { "Events": null, "Index": 26, "LongValue": "miercoles, 26 de octubre de 2011", "SL_Date": "2011-10-26", "Value": "mie" }, { "Events": null, "Index": 27, "LongValue": "jueves, 27 de octubre de 2011", "SL_Date": "2011-10-27", "Value": "jue" }, { "Events": null, "Index": 28, "LongValue": "viernes, 28 de octubre de 2011", "SL_Date": "2011-10-28", "Value": "vie" }, { "Events": [{ "CalendarEventId": 1882435592, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1319905801000-0700)\/", "EndTimeLocale": "9:30", "EndTimeUTC": "2011-10-29 09:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1319900400000-0700)\/", "StartTimeLocale": "8:00", "StartTimeUTC": "2011-10-29 08:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 1882435593, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1319909401000-0700)\/", "EndTimeLocale": "10:30", "EndTimeUTC": "2011-10-29 10:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1319907600000-0700)\/", "StartTimeLocale": "10:00", "StartTimeUTC": "2011-10-29 10:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 1882435594, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1319925600000-0700)\/", "EndTimeLocale": "15:00", "EndTimeUTC": "2011-10-29 15:00:00Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1319920200000-0700)\/", "StartTimeLocale": "13:30", "StartTimeUTC": "2011-10-29 13:30:00Z", "TimeZone": null, "UID": null, "UserID": 0}], "Index": 29, "LongValue": "sabado, 29 de octubre de 2011", "SL_Date": "2011-10-29", "Value": "sab"}], "Index": 0, "StartDate": "\/Date(1319383564595-0700)\/", "StartDateLocale": "domingo, 23 de octubre de 2011", "StartDateUTC": "2011-10-23 08:26:04Z", "Value": "" }, { "Days": [{ "Events": null, "Index": 30, "LongValue": "domingo, 30 de octubre de 2011", "SL_Date": "2011-10-30", "Value": "dom" }, { "Events": null, "Index": 31, "LongValue": "lunes, 31 de octubre de 2011", "SL_Date": "2011-10-31", "Value": "lun" }, { "Events": null, "Index": 1, "LongValue": "martes, 01 de noviembre de 2011", "SL_Date": "2011-11-01", "Value": "mar" }, { "Events": null, "Index": 2, "LongValue": "miercoles, 02 de noviembre de 2011", "SL_Date": "2011-11-02", "Value": "mie" }, { "Events": null, "Index": 3, "LongValue": "jueves, 03 de noviembre de 2011", "SL_Date": "2011-11-03", "Value": "jue" }, { "Events": null, "Index": 4, "LongValue": "viernes, 04 de noviembre de 2011", "SL_Date": "2011-11-04", "Value": "vie" }, { "Events": [{ "CalendarEventId": 726643700, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1320510601000-0700)\/", "EndTimeLocale": "9:30", "EndTimeUTC": "2011-11-05 09:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1320505200000-0700)\/", "StartTimeLocale": "8:00", "StartTimeUTC": "2011-11-05 08:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 726643701, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1320514201000-0700)\/", "EndTimeLocale": "10:30", "EndTimeUTC": "2011-11-05 10:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1320512400000-0700)\/", "StartTimeLocale": "10:00", "StartTimeUTC": "2011-11-05 10:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 726643702, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1320530400000-0700)\/", "EndTimeLocale": "15:00", "EndTimeUTC": "2011-11-05 15:00:00Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1320525000000-0700)\/", "StartTimeLocale": "13:30", "StartTimeUTC": "2011-11-05 13:30:00Z", "TimeZone": null, "UID": null, "UserID": 0}], "Index": 5, "LongValue": "sabado, 05 de noviembre de 2011", "SL_Date": "2011-11-05", "Value": "sab"}], "Index": 1, "StartDate": "\/Date(1319988364632-0700)\/", "StartDateLocale": "domingo, 30 de octubre de 2011", "StartDateUTC": "2011-10-30 08:26:04Z", "Value": "" }, { "Days": [{ "Events": null, "Index": 6, "LongValue": "domingo, 06 de noviembre de 2011", "SL_Date": "2011-11-06", "Value": "dom" }, { "Events": null, "Index": 7, "LongValue": "lunes, 07 de noviembre de 2011", "SL_Date": "2011-11-07", "Value": "lun" }, { "Events": null, "Index": 8, "LongValue": "martes, 08 de noviembre de 2011", "SL_Date": "2011-11-08", "Value": "mar" }, { "Events": null, "Index": 9, "LongValue": "miercoles, 09 de noviembre de 2011", "SL_Date": "2011-11-09", "Value": "mie" }, { "Events": null, "Index": 10, "LongValue": "jueves, 10 de noviembre de 2011", "SL_Date": "2011-11-10", "Value": "jue" }, { "Events": null, "Index": 11, "LongValue": "viernes, 11 de noviembre de 2011", "SL_Date": "2011-11-11", "Value": "vie" }, { "Events": [{ "CalendarEventId": 2137491492, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1321119001000-0800)\/", "EndTimeLocale": "9:30", "EndTimeUTC": "2011-11-12 09:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1321113600000-0800)\/", "StartTimeLocale": "8:00", "StartTimeUTC": "2011-11-12 08:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 2137491493, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1321122601000-0800)\/", "EndTimeLocale": "10:30", "EndTimeUTC": "2011-11-12 10:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1321120800000-0800)\/", "StartTimeLocale": "10:00", "StartTimeUTC": "2011-11-12 10:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 2137491494, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1321138800000-0800)\/", "EndTimeLocale": "15:00", "EndTimeUTC": "2011-11-12 15:00:00Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1321133400000-0800)\/", "StartTimeLocale": "13:30", "StartTimeUTC": "2011-11-12 13:30:00Z", "TimeZone": null, "UID": null, "UserID": 0}], "Index": 12, "LongValue": "sabado, 12 de noviembre de 2011", "SL_Date": "2011-11-12", "Value": "sab"}], "Index": 2, "StartDate": "\/Date(1320596764648-0800)\/", "StartDateLocale": "domingo, 06 de noviembre de 2011", "StartDateUTC": "2011-11-06 08:26:04Z", "Value": "" }, { "Days": [{ "Events": null, "Index": 13, "LongValue": "domingo, 13 de noviembre de 2011", "SL_Date": "2011-11-13", "Value": "dom" }, { "Events": null, "Index": 14, "LongValue": "lunes, 14 de noviembre de 2011", "SL_Date": "2011-11-14", "Value": "lun" }, { "Events": null, "Index": 15, "LongValue": "martes, 15 de noviembre de 2011", "SL_Date": "2011-11-15", "Value": "mar" }, { "Events": null, "Index": 16, "LongValue": "miercoles, 16 de noviembre de 2011", "SL_Date": "2011-11-16", "Value": "mie" }, { "Events": null, "Index": 17, "LongValue": "jueves, 17 de noviembre de 2011", "SL_Date": "2011-11-17", "Value": "jue" }, { "Events": null, "Index": 18, "LongValue": "viernes, 18 de noviembre de 2011", "SL_Date": "2011-11-18", "Value": "vie" }, { "Events": [{ "CalendarEventId": 1400855637, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1321723801000-0800)\/", "EndTimeLocale": "9:30", "EndTimeUTC": "2011-11-19 09:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1321718400000-0800)\/", "StartTimeLocale": "8:00", "StartTimeUTC": "2011-11-19 08:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 1400855638, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1321727401000-0800)\/", "EndTimeLocale": "10:30", "EndTimeUTC": "2011-11-19 10:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1321725600000-0800)\/", "StartTimeLocale": "10:00", "StartTimeUTC": "2011-11-19 10:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 1400855639, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1321743600000-0800)\/", "EndTimeLocale": "15:00", "EndTimeUTC": "2011-11-19 15:00:00Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1321738200000-0800)\/", "StartTimeLocale": "13:30", "StartTimeUTC": "2011-11-19 13:30:00Z", "TimeZone": null, "UID": null, "UserID": 0}], "Index": 19, "LongValue": "sabado, 19 de noviembre de 2011", "SL_Date": "2011-11-19", "Value": "sab"}], "Index": 3, "StartDate": "\/Date(1321201564652-0800)\/", "StartDateLocale": "domingo, 13 de noviembre de 2011", "StartDateUTC": "2011-11-13 08:26:04Z", "Value": "" }, { "Days": [{ "Events": null, "Index": 20, "LongValue": "domingo, 20 de noviembre de 2011", "SL_Date": "2011-11-20", "Value": "dom" }, { "Events": null, "Index": 21, "LongValue": "lunes, 21 de noviembre de 2011", "SL_Date": "2011-11-21", "Value": "lun" }, { "Events": null, "Index": 22, "LongValue": "martes, 22 de noviembre de 2011", "SL_Date": "2011-11-22", "Value": "mar" }, { "Events": null, "Index": 23, "LongValue": "miercoles, 23 de noviembre de 2011", "SL_Date": "2011-11-23", "Value": "mie" }, { "Events": null, "Index": 24, "LongValue": "jueves, 24 de noviembre de 2011", "SL_Date": "2011-11-24", "Value": "jue" }, { "Events": null, "Index": 25, "LongValue": "viernes, 25 de noviembre de 2011", "SL_Date": "2011-11-25", "Value": "vie" }, { "Events": [{ "CalendarEventId": 664219782, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1322328601000-0800)\/", "EndTimeLocale": "9:30", "EndTimeUTC": "2011-11-26 09:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1322323200000-0800)\/", "StartTimeLocale": "8:00", "StartTimeUTC": "2011-11-26 08:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 664219783, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1322332201000-0800)\/", "EndTimeLocale": "10:30", "EndTimeUTC": "2011-11-26 10:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1322330400000-0800)\/", "StartTimeLocale": "10:00", "StartTimeUTC": "2011-11-26 10:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 664219784, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1322348400000-0800)\/", "EndTimeLocale": "15:00", "EndTimeUTC": "2011-11-26 15:00:00Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1322343000000-0800)\/", "StartTimeLocale": "13:30", "StartTimeUTC": "2011-11-26 13:30:00Z", "TimeZone": null, "UID": null, "UserID": 0}], "Index": 26, "LongValue": "sabado, 26 de noviembre de 2011", "SL_Date": "2011-11-26", "Value": "sab"}], "Index": 4, "StartDate": "\/Date(1321806364664-0800)\/", "StartDateLocale": "domingo, 20 de noviembre de 2011", "StartDateUTC": "2011-11-20 08:26:04Z", "Value": "" }, { "Days": [{ "Events": null, "Index": 27, "LongValue": "domingo, 27 de noviembre de 2011", "SL_Date": "2011-11-27", "Value": "dom" }, { "Events": null, "Index": 28, "LongValue": "lunes, 28 de noviembre de 2011", "SL_Date": "2011-11-28", "Value": "lun" }, { "Events": null, "Index": 29, "LongValue": "martes, 29 de noviembre de 2011", "SL_Date": "2011-11-29", "Value": "mar" }, { "Events": null, "Index": 30, "LongValue": "miercoles, 30 de noviembre de 2011", "SL_Date": "2011-11-30", "Value": "mie" }, { "Events": null, "Index": 1, "LongValue": "jueves, 01 de diciembre de 2011", "SL_Date": "2011-12-01", "Value": "jue" }, { "Events": null, "Index": 2, "LongValue": "viernes, 02 de diciembre de 2011", "SL_Date": "2011-12-02", "Value": "vie" }, { "Events": [{ "CalendarEventId": 630327709, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1322933401000-0800)\/", "EndTimeLocale": "9:30", "EndTimeUTC": "2011-12-03 09:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1322928000000-0800)\/", "StartTimeLocale": "8:00", "StartTimeUTC": "2011-12-03 08:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 630327710, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1322937001000-0800)\/", "EndTimeLocale": "10:30", "EndTimeUTC": "2011-12-03 10:30:01Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1322935200000-0800)\/", "StartTimeLocale": "10:00", "StartTimeUTC": "2011-12-03 10:00:00Z", "TimeZone": null, "UID": null, "UserID": 0 }, { "CalendarEventId": 630327711, "CalendarEventLocationId": 0, "CrossStreets": null, "EndTime": "\/Date(1322953200000-0800)\/", "EndTimeLocale": "15:00", "EndTimeUTC": "2011-12-03 15:00:00Z", "IcsSrcName": null, "Latitude": null, "Longitude": null, "RecurringRules": null, "StartTime": "\/Date(1322947800000-0800)\/", "StartTimeLocale": "13:30", "StartTimeUTC": "2011-12-03 13:30:00Z", "TimeZone": null, "UID": null, "UserID": 0}], "Index": 3, "LongValue": "sabado, 03 de diciembre de 2011", "SL_Date": "2011-12-03", "Value": "sab"}], "Index": 5, "StartDate": "\/Date(1322411164678-0800)\/", "StartDateLocale": "domingo, 27 de noviembre de 2011", "StartDateUTC": "2011-11-27 08:26:04Z", "Value": ""}], "Years": null }
   
    //var data_prev = {"Culture":"en-US","Language":"English","Value":"","View":1,"Weeks":[{"Days":[{"Events":null,"Index":16,"LongValue":"Sunday, October 16, 2011","Value":"Sun"},{"Events":null,"Index":17,"LongValue":"Monday, October 17, 2011","Value":"Mon"},{"Events":null,"Index":18,"LongValue":"Tuesday, October 18, 2011","Value":"Tue"},{"Events":null,"Index":19,"LongValue":"Wednesday, October 19, 2011","Value":"Wed"},{"Events":null,"Index":20,"LongValue":"Thursday, October 20, 2011","Value":"Thu"},{"Events":null,"Index":21,"LongValue":"Friday, October 21, 2011","Value":"Fri"},{"Events":[{"CalendarEventId":471587800,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1319301001000-0700)\/","EndTimeLocale":"9:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1319295600000-0700)\/","StartTimeLocale":"8:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":471587801,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1319304601000-0700)\/","EndTimeLocale":"10:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1319274000000-0700)\/","StartTimeLocale":"2:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":471587802,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1319320801000-0700)\/","EndTimeLocale":"3:00 PM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1319315400000-0700)\/","StartTimeLocale":"1:30 PM","TimeZone":null,"UID":null,"UserID":0}],"Index":22,"LongValue":"Saturday, October 22, 2011","Value":"Sat"}],"Index":0,"StartDate":"\/Date(1318779926135-0700)\/","StartDateLocale":"Sunday, October 16, 2011","Value":""},{"Days":[{"Events":null,"Index":23,"LongValue":"Sunday, October 23, 2011","Value":"Sun"},{"Events":null,"Index":24,"LongValue":"Monday, October 24, 2011","Value":"Mon"},{"Events":null,"Index":25,"LongValue":"Tuesday, October 25, 2011","Value":"Tue"},{"Events":null,"Index":26,"LongValue":"Wednesday, October 26, 2011","Value":"Wed"},{"Events":null,"Index":27,"LongValue":"Thursday, October 27, 2011","Value":"Thu"},{"Events":null,"Index":28,"LongValue":"Friday, October 28, 2011","Value":"Fri"},{"Events":[{"CalendarEventId":1882435592,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1319905801000-0700)\/","EndTimeLocale":"9:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1319900400000-0700)\/","StartTimeLocale":"8:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":1882435593,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1319909401000-0700)\/","EndTimeLocale":"10:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1319878800000-0700)\/","StartTimeLocale":"2:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":1882435594,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1319925601000-0700)\/","EndTimeLocale":"3:00 PM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1319920200000-0700)\/","StartTimeLocale":"1:30 PM","TimeZone":null,"UID":null,"UserID":0}],"Index":29,"LongValue":"Saturday, October 29, 2011","Value":"Sat"}],"Index":1,"StartDate":"\/Date(1319384726170-0700)\/","StartDateLocale":"Sunday, October 23, 2011","Value":""},{"Days":[{"Events":null,"Index":30,"LongValue":"Sunday, October 30, 2011","Value":"Sun"},{"Events":null,"Index":31,"LongValue":"Monday, October 31, 2011","Value":"Mon"},{"Events":null,"Index":1,"LongValue":"Tuesday, November 01, 2011","Value":"Tue"},{"Events":null,"Index":2,"LongValue":"Wednesday, November 02, 2011","Value":"Wed"},{"Events":null,"Index":3,"LongValue":"Thursday, November 03, 2011","Value":"Thu"},{"Events":null,"Index":4,"LongValue":"Friday, November 04, 2011","Value":"Fri"},{"Events":[{"CalendarEventId":726643700,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1320510601000-0700)\/","EndTimeLocale":"9:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1320505200000-0700)\/","StartTimeLocale":"8:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":726643701,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1320514201000-0700)\/","EndTimeLocale":"10:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1320483600000-0700)\/","StartTimeLocale":"2:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":726643702,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1320530401000-0700)\/","EndTimeLocale":"3:00 PM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1320525000000-0700)\/","StartTimeLocale":"1:30 PM","TimeZone":null,"UID":null,"UserID":0}],"Index":5,"LongValue":"Saturday, November 05, 2011","Value":"Sat"}],"Index":2,"StartDate":"\/Date(1319989526193-0700)\/","StartDateLocale":"Sunday, October 30, 2011","Value":""},{"Days":[{"Events":null,"Index":6,"LongValue":"Sunday, November 06, 2011","Value":"Sun"},{"Events":null,"Index":7,"LongValue":"Monday, November 07, 2011","Value":"Mon"},{"Events":null,"Index":8,"LongValue":"Tuesday, November 08, 2011","Value":"Tue"},{"Events":null,"Index":9,"LongValue":"Wednesday, November 09, 2011","Value":"Wed"},{"Events":null,"Index":10,"LongValue":"Thursday, November 10, 2011","Value":"Thu"},{"Events":null,"Index":11,"LongValue":"Friday, November 11, 2011","Value":"Fri"},{"Events":[{"CalendarEventId":2137491492,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1321119001000-0800)\/","EndTimeLocale":"9:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1321113600000-0800)\/","StartTimeLocale":"8:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":2137491493,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1321122601000-0800)\/","EndTimeLocale":"10:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1321092000000-0800)\/","StartTimeLocale":"2:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":2137491494,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1321138801000-0800)\/","EndTimeLocale":"3:00 PM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1321133400000-0800)\/","StartTimeLocale":"1:30 PM","TimeZone":null,"UID":null,"UserID":0}],"Index":12,"LongValue":"Saturday, November 12, 2011","Value":"Sat"}],"Index":3,"StartDate":"\/Date(1320597926217-0800)\/","StartDateLocale":"Sunday, November 06, 2011","Value":""},{"Days":[{"Events":null,"Index":13,"LongValue":"Sunday, November 13, 2011","Value":"Sun"},{"Events":null,"Index":14,"LongValue":"Monday, November 14, 2011","Value":"Mon"},{"Events":null,"Index":15,"LongValue":"Tuesday, November 15, 2011","Value":"Tue"},{"Events":null,"Index":16,"LongValue":"Wednesday, November 16, 2011","Value":"Wed"},{"Events":null,"Index":17,"LongValue":"Thursday, November 17, 2011","Value":"Thu"},{"Events":null,"Index":18,"LongValue":"Friday, November 18, 2011","Value":"Fri"},{"Events":[{"CalendarEventId":1400855637,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1321723801000-0800)\/","EndTimeLocale":"9:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1321718400000-0800)\/","StartTimeLocale":"8:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":1400855638,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1321727401000-0800)\/","EndTimeLocale":"10:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1321696800000-0800)\/","StartTimeLocale":"2:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":1400855639,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1321743601000-0800)\/","EndTimeLocale":"3:00 PM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1321738200000-0800)\/","StartTimeLocale":"1:30 PM","TimeZone":null,"UID":null,"UserID":0}],"Index":19,"LongValue":"Saturday, November 19, 2011","Value":"Sat"}],"Index":4,"StartDate":"\/Date(1321202726266-0800)\/","StartDateLocale":"Sunday, November 13, 2011","Value":""},{"Days":[{"Events":null,"Index":20,"LongValue":"Sunday, November 20, 2011","Value":"Sun"},{"Events":null,"Index":21,"LongValue":"Monday, November 21, 2011","Value":"Mon"},{"Events":null,"Index":22,"LongValue":"Tuesday, November 22, 2011","Value":"Tue"},{"Events":null,"Index":23,"LongValue":"Wednesday, November 23, 2011","Value":"Wed"},{"Events":null,"Index":24,"LongValue":"Thursday, November 24, 2011","Value":"Thu"},{"Events":null,"Index":25,"LongValue":"Friday, November 25, 2011","Value":"Fri"},{"Events":[{"CalendarEventId":664219782,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1322328601000-0800)\/","EndTimeLocale":"9:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1322323200000-0800)\/","StartTimeLocale":"8:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":664219783,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1322332201000-0800)\/","EndTimeLocale":"10:30 AM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1322301600000-0800)\/","StartTimeLocale":"2:00 AM","TimeZone":null,"UID":null,"UserID":0},{"CalendarEventId":664219784,"CalendarEventLocationId":0,"CrossStreets":null,"EndTime":"\/Date(1322348401000-0800)\/","EndTimeLocale":"3:00 PM","IcsSrcName":null,"Latitude":null,"Longitude":null,"RecurringRules":null,"StartTime":"\/Date(1322343000000-0800)\/","StartTimeLocale":"1:30 PM","TimeZone":null,"UID":null,"UserID":0}],"Index":26,"LongValue":"Saturday, November 26, 2011","Value":"Sat"}],"Index":5,"StartDate":"\/Date(1321807526282-0800)\/","StartDateLocale":"Sunday, November 20, 2011","Value":""}],"Years":null}

    if (LCSGlobal_Culture =="en" )
        return data_en;
    else
        return data_es;
    
}

