/*
minimal-weather/modules/apply.js

minimal-weather is licensed under a
Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.

You should have received a copy of the license along with this
work. If not, see <https://creativecommons.org/licenses/by-nc-sa/4.0/>.
*/

//console.log("Started apply.js")

import {workingPromise, lat, lon, zip, stationName } from "./retrieve.js";

// classes for columns of the table
const columnClasses = [
    "date-col",
    "time-col",
    "temperature-col",
    "uv-col",
    "precipitation-col",
    "conditions-col"
]

// add a row to the table (even and odd considerations)
function addTableRow(bodyElement, rowNum) {
    var rowElement = document.createElement("tr");
    // give it identification
    rowElement.setAttribute("id", "t-row-"+rowNum);

    // odd/even check
    var oddEven = "odd";
    if (rowNum % 2 == 0) {
        oddEven = "even";
    }
    rowElement.classList.add(oddEven+"-row");

    // add columns with classes
    var colElement;
    for (var i = 0; i<columnClasses.length; i++) {
        colElement = document.createElement("td");
        colElement.classList.add(columnClasses[i]);
        rowElement.appendChild(colElement);
    }

    // add to table body
    bodyElement.appendChild(rowElement);
    return rowElement;
}

// add a row to the table for events (sunrise and sunset)
function addEventRow(bodyElement, evNum) {
    var rowElement = document.createElement("tr")
    // give it identification
    const eventRowElement = document.createElement("tr");
    eventRowElement.setAttribute("id", "t-row-event"+evNum);
    eventRowElement.classList.add("event-row")

    // full columns
    var colElement;
    for (var i = 0; i<columnClasses.length; i++) {
        colElement = document.createElement("td");
        colElement.classList.add(columnClasses[i]);
        colElement.classList.add("event-"+columnClasses[i]);
        //colElement.classList.add("event-col");
        eventRowElement.appendChild(colElement);
    }

    // add to table body
    bodyElement.appendChild(eventRowElement);
    return eventRowElement;
}

// date formatter
const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

// hour-only time formatter
const hourTimeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
  });

// hour and minute time formatter
const hourMinuteTimeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

// functions to format the separate columns for data rows
function formatDateCol(dateObj) {
    return dateFormatter.format(dateObj);
}
function formatTimeCol(dateObj) {
    return hourTimeFormatter.format(dateObj);
}
function formatTemperatureCol(tNum) {
    return tNum.toString();
}
function formatUVCol(uvNum) {
    return uvNum.toString();
}
function formatPrecipCol(precipNum) {
    return precipNum.toString().padStart(2, "0") + "%";
}
function formatConditionCol(text) {
    return text
}
// formatter functions for each column, for ease of for-loops
const colFormatters = [
    formatDateCol,
    formatTimeCol,
    formatTemperatureCol,
    formatUVCol,
    formatPrecipCol,
    formatConditionCol
];

// turn numerical temperature into a CSS class
// barriers are arbitrary
function temperatureClassAssignment(temperature) {
    if (temperature > 85) {
        return "temperature-hot";
    }
    else if (temperature > 75) {
        return "temperature-warm";
    }
    else if (temperature < 55) {
        return "temperature-cold";
    }
    else if (temperature < 65) {
        return "temperature-cool";
    }
    else {
        return "temperature-default";
    }
}

// turn integer UV index into a CSS class
// https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-(uv)-index
function uvClassAssignment(uvNum) {
    // negative values are invalid
    if (uvNum < 0) {
        return "uv-null";
    } 
    // switch-case for valid UV index values
    switch (uvNum) {
        case 0:
        case 1:
        case 2:
            return "uv-low";
            break;
        case 3:
        case 4:
        case 5:
            return "uv-mod";
            break;
        case 6:
        case 7:
            return "uv-high";
            break;
        case 8:
        case 9:
        case 10:
            return "uv-vhi";
            break;
        default: //11 and above
            return "uv-extr";
    }
}

// turn precipitation chance into CSS class
// arbitrary bounds
function precipClassAssignment(precip) {
    // get chance of precipitation in units of 10%
    const precip10 = Math.floor(precip/10)
    switch (precip10) {
        case 0:
            return "rain-none";
            break;
        case 1:
            return "rain-low";
            break;
        case 2:
        case 3:
        case 4:
            return "rain-med";
            break;
        default: //5 and above
            return "rain-hi";
    }
}
// collect the functions to determine colors (classes)
const colorFuncs = [
    temperatureClassAssignment, uvClassAssignment, precipClassAssignment]

// object for right now, for comparison
const todayNow = new Date();

// wait for retrieve.js to actually generate the tables
const [resultTable, eventTable] = await workingPromise;

// flag of events being done (events are assumed to be in chronological order)
var eventTableIdx = 0;
var thisEvent = eventTable[eventTableIdx];

// row-by-row in the table
// prepare some variables
var resultRow, thisTableRow, rowElements, rowDate;
var eventRow, eventColumns;
const tableBody = document.getElementById("body-of-table");

// go row-by-row in the result table
for (var i=0; i < resultTable.length; i++) {
    resultRow = resultTable[i];
    // check if we should insert an event
    if (eventTableIdx < eventTable.length) { //(any events remaining)
        if (resultRow[0] - thisEvent[0] > 0) { //(data row passes event)
            // add event row
            eventRow = addEventRow(tableBody, eventTableIdx);
            eventColumns = eventRow.querySelectorAll("td");
            // time and event type
            eventColumns[0].innerHTML = 
                                   hourMinuteTimeFormatter.format(thisEvent[0]);
            eventColumns[columnClasses.length - 1].innerHTML = thisEvent[1];
            // dashes for empty rows to look better
            for (var j = 2; j < 5; j++)
                eventColumns[j].innerHTML = "-"
            // increment current event (chronological order)
            eventTableIdx++;
            if (eventTableIdx < eventTable.length) {
                thisEvent = eventTable[eventTableIdx];
            }
        }
    }
    // create a row for this data point in the HTML document
    thisTableRow = addTableRow(tableBody, i)
    rowElements = thisTableRow.querySelectorAll("td"); //(all columns)

    // format data into the columns
    for (var k=0; k<6; k++) {
        if (resultRow[k] != null) {
            rowElements[k].innerHTML = colFormatters[k](resultRow[k]);
        }
    }

    // add classes to the columns based on the values
    for (var k=0; k<3; k++) {
        if (resultRow[k+2] != null) {
            rowElements[k+2].classList.add(colorFuncs[k](resultRow[k+2]));
        }
    }

    // mark the location of the current time, and times that have passed
    if (resultRow[0].getDate() == todayNow.getDate() 
        && resultRow[0].getHours() == todayNow.getHours()) {
        thisTableRow.classList.add("time-now");
    }
    else if (resultRow[0] - todayNow < 0) {
        thisTableRow.classList.add("time-passed");
    }

    // mark the location of new days (midnight)
    if (resultRow[0].getHours() == 0) {
        thisTableRow.classList.add("time-newday");
    }
}

// populate sources at the end of the document
const sourceTextElement = document.getElementById("sources-text")
sourceTextElement.innerHTML = "lat=" + lat + ",lon=" + lon + ",zip=" + zip + 
                              ",station=" + stationName;