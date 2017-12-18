// eventList.js is a simple tool for displaying an events list based on a Google Calender id
// Handmade with love by Marc Heatley || http://github.com/TheHeat || @marcheatley
// Inspired by http://kevin.deldycke.com/2012/07/displaying-upcoming-events-google-calendar-javascript/


// **********************
// Functions and helpers.


// Get an ISO formatted string representing 'now'
var dateLast = new Date();
 
function startISO(date, days){
  if(days != 0) {
     dateLast.setDate(dateLast.getDate() + days);
  }else{
  	 dateLast = date;
  }
  dateLast.setHours(0,0,0,0);	// start at midnight to show 1st day's all day events
  var n = dateLast.toISOString();

  return n;
} 

// Day and Month name formatting helpers
//var d_names = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");
var d_names = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
var m_names = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");



// Switch to add the appropriate suffix to date
function formatDate(dateNumber){

  var append = "";

  switch (dateNumber){
    case 1: case 21: case 31: append = "st"; break;
    case 2: case 22:          append = "nd"; break;
    case 3: case 23:          append = "rd"; break;
    default:                  append = "th"; break;
  }
  return dateNumber + append;
}

// 12h am/pm
function formatTime(hour, minutes){
  minutesFormat = ':' + pad(minutes);

  if(hour < 12){
    return hour + minutesFormat + 'a';
  }else {
    return (hour - 12) + minutesFormat + 'p';
  }
}

// Utility method to pad a string on the left
// Thanks to http://sajjadhossain.com/2008/10/31/javascript-string-trimming-and-padding/
function pad(n){return n<10 ? '0'+n : n}

function ShowEvents(date, days){
	args = {
		calID: 'mcgnoj82l9h7vlmtb7gg5146pc@group.calendar.google.com',
		key: 'AIzaSyDztnX7ekIgOleB0dNy-4RbteuKzpFRe1Q',
		maxResults: 14
	}
	$('#calendar-list').eventList(args, date, days);
}

$(function() {
    $( "#datepicker" ).datepicker({
      showOn: "button",
      buttonImage: "images/calendar.png",
      buttonImageOnly: true,
      onSelect:function(selectedDate){
        var date = new Date(Date.parse(selectedDate));
		ShowEvents(date, 0);
       }

    });
});

$.fn.eventList = function(args, date, days){

  //Set some default parameters. All of these can be overridden by passing an object with one or more of these properties
  var defaults = {
    timeMin: startISO(date, days),
    singleEvents: true,
    orderBy: 'startTime',
    linkContent: true
  }

  //Combine the parameters args and defaults
  var params = $.extend({}, defaults, args);
  console.log('PARAMS: ', params);

  // set variables from the arguments
  calID = params.calID;
  linkContent = params.linkContent;

  var queryStringParams = params;
  //Delete parameters specific to this function in order to compose a query string
  delete queryStringParams.calID;
  delete queryStringParams.linkContent;

  //Serialize the parameters into a query string
  var queryString = $.param(queryStringParams);

  // Create the container elements for the list and feed links§
  $(this).html('<ol class="events-list"><li>calendar data...</li></ol>');

  // All the feed strings
  var calJSON = 'https://www.googleapis.com/calendar/v3/calendars/' + calID + '/events?' + queryString;
  //var calGoog = 'http://www.google.com/calendar/embed?src=' + calID;
  //var calICal = 'http://www.google.com/calendar/ical/' + calID + '/public/basic.ics';

  console.log(calJSON);

  // Get list of iCal events formatted in JSON
  $.getJSON( calJSON, function(data){
  var dFormatLast = '';
  var fDayStarted = false;
  var sSearch = '';

  // Parse and render each event
  $.each(data.items, function(i, item){

    if(i == 0) {
      $(".events-list li").first().hide();
    };


    // **********************
    // The Date
    // format as ISO 8601
    // format a human readable version

    if(item.start.dateTime){
      // set up the start date as a variable d
      var d = new Date(item.start.dateTime);
      var h = d.getHours();
      var m = d.getMinutes();
      var AllDay = false;
    }else if(item.start.date){
      var d = new Date(item.end.date);  // all day event - use end time
      var AllDay = true;
    }

    // format as ISO 8601
    var dISO = d;

    // format a human readable version
    var dFormat = d_names[d.getDay()] + ', ' + m_names[d.getMonth()] + ' ' + formatDate(d.getDate());

    var dString = '<time class="event-date" datetime="' + dISO + '">' + dFormat + '</time>';


    // Format the time
    var tString = "";

    if(h || m) {
      tFormat = formatTime(h, m);
      tString = '<span class="event-time">' + tFormat + '</span>';
    };


    // **********************
    // The Venue
    // Pull in the location
    // format a Google Maps link

    var venue = item.location;
    var venueLink ='';

    if(venue){
      venueLink = '<a class="event-venue" href="http://maps.google.com/maps?q=' + venue + '"target="_blank">' + venue + '</a>';
    }


    // **********************
    // The Content
    // Event title and description 

    var event_title  = '<itemprop="name">' + item.summary;
    var eventDescription = item.description;

	if(AllDay == false) {
		if(sSearch == '' && !item.summary.includes("Seahawks")) {
			sSearch = item.summary;
//			sSearch = item.summary + ' Live at The Stonegate Pizza';
			$('#input-search').val(sSearch);
			search();
		}
	}

    if(linkContent){
      eventDescription = Autolinker.link(eventDescription);
    }

    if(eventDescription){
      event_content = '<div class="event-description" itemprop="description">' + eventDescription + '</div>';
    }else{
      event_content = '';
    }

    // Render the event
    var sOut = "";

    if(AllDay == false) {
        sOut = '<li itemscope itemtype="http://schema.org/Event">' +
        '<meta itemprop="startDate" content="' + dISO  + '">';
    }
    else{
        // No Structured Schema around all day events
        sOut = '<li>';
    }

    // start of new day?
    if(dFormat != dFormatLast) {
        // start new day
        sOut = sOut + '<div id=cal-day>' + dString + '</div>';
        dFormatLast = dFormat;
    }

    if(AllDay) {
        sOut = sOut + 
            '<div id=cal-titleAd>' + '<table id="tblEventAd"><tr><td>' + event_title + 
            '</td><td>' + event_content + '</td></tr></table></div>';
    }
    else{
		if(item.attachments) {
			var sPoster = 'images/' + item.attachments["0"].title;

	        sOut = sOut + 

          '<div class=fanart style="background-image: url(' + sPoster + ');"></div>';
		}

        sOut = sOut + 
            '<div id=cal-title>' +
            '<table id="tblEvent"><tr><td>' + tString + 
            '</td><td class=event-title>' + event_title + '</td></tr></table>';

		if(item.attachments || eventDescription) {
			sOut = sOut + '<div id=cal-info><table><tr>';

			//  event_images
			if(item.attachments) {
//				sOut = sOut + '<td class=cal-img><img src="http://www.stonegaterocks.com/images/' + item.attachments["0"].title + '"></td>';
//				sOut = sOut + '<td class=cal-img><img src="' + sPoster + '"></td>';
				sOut = sOut + '<td class=cal-img><a href="' + sPoster + '" target="_blank"><img src="' + sPoster + '"></a></td>';
			}

			if(eventDescription) {
				sOut = sOut + '<td class=cal-desc>' + event_content + '</td>';
			}

			sOut = sOut + '</tr></table></div></div>';
		}
		else {
			sOut = sOut + '</div>';
		}
    }

    sOut = sOut + '</li>';

//    sOut = sOut + 
//        '</div>' + '</li>';

    $(".events-list li").last().before(sOut);

    });

	setTimeout(window.parent.autoResize, 1000);
  });
}
