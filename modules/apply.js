console.log("Started apply.js")

import { resultTable, lat, lon, zip, stationName } from "./retrieve.js";

console.log(resultTable, lat, lon, zip, stationName)

// date formatter
const myDateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  })

// time formatter
const myTimeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
  })

function formatDateCol(dateObj) {
    return myDateFormatter.format(dateObj);
}
function formatTimeCol(dateObj) {
    return myTimeFormatter.format(dateObj);
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
const colFormatters = [
    formatDateCol,
    formatTimeCol,
    formatTemperatureCol,
    formatUVCol,
    formatPrecipCol,
    formatConditionCol
];

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
            return "uv-vhi"
            break;
        default: //11 and above
            return "uv-extr"
    }
}

// turn precipitation chance into CSS class
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
const colorFuncs = [
    temperatureClassAssignment, uvClassAssignment, precipClassAssignment]

const todayNow = new Date();

var resultRow, thisTableRow, rowElements, rowDate;
for (var i=0; i < resultTable.length; i++) {
    resultRow = resultTable[i];
    thisTableRow = document.getElementById("t-row-"+i);
    rowElements = thisTableRow.querySelectorAll("td");

    // input text
    for (var k=0; k<6; k++) {
        if (resultRow[k] != null) {
            rowElements[k].innerHTML = colFormatters[k](resultRow[k]);
        }
    }

    // color elements
    for (var k=0; k<3; k++) {
        if (resultRow[k+2] != null) {
            rowElements[k+2].classList.add(colorFuncs[k](resultRow[k+2]));
        }
    }

    // mark the location of the current time, and times that have passed
    if (resultRow[0].getDate() == todayNow.getDate() 
        && resultRow[0].getHours() == todayNow.getHours()) {
        thisTableRow.classList.add("time-now");
        //rowElements[0].classList.add("time-now");
        //rowElements[1].classList.add("time-now");
    }
    else if (resultRow[0] - todayNow < 0) {
        thisTableRow.classList.add("time-passed");
        //rowElements[0].classList.add("time-passed");
        //rowElements[1].classList.add("time-passed");
    }

    // class for new day
    if (resultRow[0].getHours() == 0) {
        thisTableRow.classList.add("time-newday");
    }
}

// populate sources at the end of the document
const sourceTextElement = document.getElementById("sources-text")
sourceTextElement.innerHTML = "lat=" + lat + ",lon=" + lon + ",zip=" + zip + ",station=" + stationName