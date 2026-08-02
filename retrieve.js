
// location information
// TODO check url
const lat = 42.2511;
const lon = -83.7217;
const zip = 48104;
const stationName = "KYIP"

// table information
const firstRowIdx = 0;
const lastRowIdx = 28; // inclusive
const startHour = 5; // 5am

// mapping to read month for UV index
const monthIdxMap = new Map()
monthIdxMap.set("Jan", 0)
monthIdxMap.set("Feb", 1)
monthIdxMap.set("Mar", 2)
monthIdxMap.set("Apr", 3)
monthIdxMap.set("May", 4)
monthIdxMap.set("Jun", 5)
monthIdxMap.set("Jul", 6)
monthIdxMap.set("Aug", 7)
monthIdxMap.set("Sep", 8)
monthIdxMap.set("Oct", 9)
monthIdxMap.set("Nov", 10)
monthIdxMap.set("Dec", 11)

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

// Given the JSON info, populate the paragraph elements,
// populate the forecast table.
function giveForecastInfo(forecastWeather, forecastUV, historyTable) {
    // create Date object for right now
    const todayNow = new Date();

    // date to use for the table
    // assume today unless it's 8pm or later, then assume tomorrow
    var tableDate = new Date();
    if (tableDate.getHours() >= 20) {
        tableDate.setDate(tableDate.getDate()+1);
    }
    // reset to start hour as reference point
    tableDate.setHours(startHour);
    tableDate.setMinutes(0);
    tableDate.setSeconds(0);

    var rowDate, thisTableRow, rowElements;
    // prep dates on all rows
    for (var i=firstRowIdx; i<=lastRowIdx; i++) {
        // start from 5am; add i hours (next day handled automatically)
        rowDate = new Date(tableDate);
        rowDate.setHours(startHour+i);

        // get row in the table
        thisTableRow = document.getElementById("t-row-"+i);

        
        rowElements = thisTableRow.querySelectorAll("td");
        // mark date and time in the leftmost two columns
        rowElements[0].innerHTML = myDateFormatter.format(rowDate);
        rowElements[1].innerHTML = myTimeFormatter.format(rowDate);

        // mark the location of the current time, and times that have passed
        if (rowDate.getDate() == todayNow.getDate() 
            && rowDate.getHours() == todayNow.getHours()) {
            thisTableRow.classList.add("time-now");
            //rowElements[0].classList.add("time-now");
            //rowElements[1].classList.add("time-now");
        }
        else if (rowDate - todayNow < 0) {
            thisTableRow.classList.add("time-passed");
            //rowElements[0].classList.add("time-passed");
            //rowElements[1].classList.add("time-passed");
        }

        // class for new day
        if (rowDate.getHours() == 0) {
            thisTableRow.classList.add("time-newday")
        }
    }

    var dateTimeString, dtSplitSpace, dtSplitSlash, dtSplitAMPM, dtHour,
        dtMonthIdx, dtDateDay, dtDateYear, dateObj, row_idx, thisTableRow, 
        uvEntry;
    // go through UV forecast
    for (var i=0; i<forecastUV.length; i++) {
        // generate the Date object from the epa.gov weird formatting

        // get the string and split it up
        dateTimeString = forecastUV[i].DATE_TIME;
        dtSplitSpace = dateTimeString.split(" ");
        dtSplitSlash = dtSplitSpace[0].split("/");
        
        // turn 12-hour am/pm into 24-hour
        dtSplitAMPM = dtSplitSpace[2];
        dtHour = parseInt(dtSplitSpace[1]);
        if (dtHour == 12) {
            dtHour = 0;
        }
        if (dtSplitAMPM == "PM") {
            dtHour += 12;
        }
        // month, day, and year
        dtMonthIdx = monthIdxMap.get(dtSplitSlash[0]);
        dtDateDay = parseInt(dtSplitSlash[1]);
        dtDateYear = parseInt(dtSplitSlash[2]);

        // create the date object for this row of the data
        dateObj = new Date(dtDateYear, dtMonthIdx, dtDateDay, dtHour);

        // attempt to find table row in the HTML
        // hour difference from 5am reference time (index 0 in the table)
        row_idx = Math.round(
            (dateObj.getTime() - tableDate.getTime()) / 3600000);
        // check if this hour exists on the table
        if (row_idx >= firstRowIdx && row_idx <= lastRowIdx) {
            thisTableRow = document.getElementById("t-row-"+row_idx);
            // add UV index
            uvEntry = thisTableRow.querySelectorAll("td")[3]
            uvEntry.innerHTML = forecastUV[i].UV_VALUE;
            uvEntry.classList.add(uvClassAssignment(forecastUV[i].UV_VALUE));
        }
    }

    var elementsHere, timeStrSplit, dateObj, row_idx, rowQuery;
    // go through observations (priority over forecast)
    const obsRows = historyTable.querySelectorAll("tr")
    var tableObservations = Array();
    // last 24 observations
    for (var i=0; i<24; i++) {
        // all table entries in this row (observation)
        var elementsHere = obsRows[i].querySelectorAll("td")

        // month is not included, so we have to infer it;
        // if the day is low, the month of the observation is the current month. 
        // if the day is high, then it's probably last month.
        const dataHere = new Map()
        dataHere.dayNum = parseInt(elementsHere[0].innerHTML)
        if (dataHere.dayNum < 15) {
            dataHere.monthNum = todayNow.getMonth();
        } else {
            dataHere.monthNum = (todayNow.getMonth() - 1) % 12;
        }

        // year is also not included. 
        // TODO double-check this one
        if (dataHere.dayNum < 15 & dataHere.monthNum == 0) {
            dataHere.yearNum = todayNow.getFullYear() - 1;
        } else {
            dataHere.yearNum = todayNow.getFullYear();
        }

        // round the time to the nearest hour
        timeStrSplit = elementsHere[1].innerHTML.split(":");
        dataHere.hourNum = parseInt(timeStrSplit[0]);
        if (parseInt(timeStrSplit[1]) > 30) {
            dataHere.hourNum = (dataHere.hourNum + 1) % 24;
        }

        // date object (rounded to the nearest hour)
        dateObj = new Date(dataHere.yearNum, dataHere.monthNum, dataHere.dayNum, dataHere.hourNum);

        // find in table
        row_idx = Math.round((dateObj.getTime() - tableDate.getTime()) / 3600000);
        if (row_idx >= firstRowIdx && row_idx <= lastRowIdx) {
            thisTableRow = document.getElementById("t-row-"+row_idx);
            // add temperature and conditions
            rowQuery = thisTableRow.querySelectorAll("td");
            rowQuery[2].innerHTML = Math.round(parseFloat(elementsHere[6].innerHTML));
            rowQuery[5].innerHTML = elementsHere[4].innerHTML;

        }
    }

    // go through the weather forecast JSON
    // first 36 predictions (hour-by-hour)
    for (var i=0; i<36; i++) {
        // super easy to read
        const dataHere = forecastWeather.properties.periods[i]
        const dateObj = new Date(dataHere.startTime)
        
        // find in table
        row_idx = Math.round((dateObj.getTime() - tableDate.getTime()) / 3600000);
        if (row_idx >= firstRowIdx && row_idx <= lastRowIdx) {
            thisTableRow = document.getElementById("t-row-"+row_idx);
            // add temperature, precipitation, and conditions
            // unless they were given by observations
            const rowQuery = thisTableRow.querySelectorAll("td");
            if (rowQuery[2].innerHTML == "") {
                rowQuery[2].innerHTML = dataHere.temperature;
            } // otherwise, this row was already given by observations
            const precipNum = dataHere.probabilityOfPrecipitation.value
            rowQuery[4].innerHTML = precipNum.toString().padStart(2, "0") + "%";
            rowQuery[4].classList.add(precipClassAssignment(precipNum))
            if (rowQuery[5].innerHTML == "") {
                rowQuery[5].innerHTML = dataHere.shortForecast;
            } // otherwise, this row was already given by observations
        }
    }
}

async function fetchWeatherForecastJSON(wLat, wLon) {
    const response1 = await fetch("https://api.weather.gov/points/"+wLat+","+wLon+"");
    if (!response1.ok) {
        throw new Error(`HTTP error: ${response1.status}`);
    }
    const text1 = await response1.text()
    const json1 = JSON.parse(text1);
    const hourlyURL = json1.properties.forecastHourly;

    const response2 = await fetch(hourlyURL);
    if (!response2.ok) {
        throw new Error(`HTTP error: ${response2.status}`);
    }
    const text2 = await response2.text()
    const json2 = JSON.parse(text2);
    return json2;
}

async function fetchUVJSON(uvZip) {
    const response = await fetch("https://data.epa.gov/dmapservice/getEnvirofactsUVHOURLY/ZIP/"+uvZip+"/JSON");
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
    const rText = await response.text()
    const uvJSON = JSON.parse(rText);
    return uvJSON;
}

async function fetchObservationHTML(stat) {
    const response = await fetch("https://forecast.weather.gov/data/obhistory/"+stat+".html");
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
    const rText = await response.text()
    const parser = new DOMParser();
    const docHTML = parser.parseFromString(rText, "text/html");
    const tableResult = docHTML.querySelector(".obs-history").querySelector("tbody");
    return tableResult
}

// populate sources at the end of the document
const sourceTextElement = document.getElementById("sources-text")
sourceTextElement.innerHTML = "lat=" + lat + ",lon=" + lon + ",zip=" + zip + ",station=" + stationName

// fetch the data
const [fWeatherJSON, fUVJSON, tableResult] = await Promise.all([
    fetchWeatherForecastJSON(lat, lon),
    fetchUVJSON(zip),
    fetchObservationHTML(stationName)
]);

giveForecastInfo(fWeatherJSON, fUVJSON, tableResult);