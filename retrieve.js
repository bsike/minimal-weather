
// location information
const lat = 42.2511;
const lon = -83.7217;
const zip = 48104;
const stationName = "KYIP"

// mapping to read month for UV index
const monthMap = new Map()
monthMap.set("Jan", 0)
monthMap.set("Feb", 1)
monthMap.set("Mar", 2)
monthMap.set("Apr", 3)
monthMap.set("May", 4)
monthMap.set("Jun", 5)
monthMap.set("Jul", 6)
monthMap.set("Aug", 7)
monthMap.set("Sep", 8)
monthMap.set("Oct", 9)
monthMap.set("Nov", 10)
monthMap.set("Dec", 11)

// date formatter
const myDateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    //dayPeriod: "narrow",
    //hour: "2-digit",
    //minute: "numeric",
    //second: "numeric"
  })

const myTimeFormatter = new Intl.DateTimeFormat("en-US", {
    //weekday: "short",
    //year: "numeric",
    //month: "short",
    //day: "2-digit",
    //dayPeriod: "narrow",
    hour: "2-digit",
    //minute: "numeric",
    //second: "numeric"
  })

function uvClassAssignment(uvNum) {
    if (uvNum >= 0 && uvNum <= 2) {
        return "uv-low";
    }
    else if (uvNum >= 3 && uvNum <= 5) {
        return "uv-mod";
    }
    else if (uvNum == 6 || uvNum == 7) {
        return "uv-high";
    }
    else if (uvNum >= 8 && uvNum <= 10) {
        return "uv-vhi";
    }
    else if (uvNum >= 11) {
        return "uv-extr"
    }
    else {
        return "uv-null"
    }
}

function precipClassAssignment(precip) {
    if (precip >= 0 && precip < 10) {
        return "rain-none";
    }
    else if (precip >= 10 && precip < 20) {
        return "rain-low";
    }
    else if (precip >= 20 && precip < 50) {
        return "rain-med";
    }
    else if (precip >= 50 && precip <= 100) {
        return "rain-hi";
    }
}

// Given the JSON info, populate the paragraph elements
function giveForecastInfo(forecastWeather, forecastUV, historyTable) {
    const todayNow = new Date();

    // date to use for the table
    // assume today unless it's 8pm or later, then assume tomorrow
    var tableDate = new Date();
    if (tableDate.getHours() > 19) {
        tableDate.setDate(tableDate.getDate()+1);
    }
    tableDate.setHours(5);
    tableDate.setMinutes(0);
    tableDate.setSeconds(0);

    // prep dates on all rows
    for (i=0; i<25; i++) {
        // start from 5am
        var rowDate = new Date(tableDate);
        rowDate.setHours(5+i);

        // get row
        thisTableRow = document.getElementById("t-row-"+i);

        // mark date and time
        const rowElements = thisTableRow.querySelectorAll("td");
        //if (i == 0 || i == 19) {
        rowElements[0].innerHTML = myDateFormatter.format(rowDate);
        //}
        rowElements[1].innerHTML = myTimeFormatter.format(rowDate);

        // mark if the date has already passed
        if (rowDate.getDate() == todayNow.getDate() && rowDate.getHours() == todayNow.getHours()) {
            thisTableRow.classList.add("time-now");
            //rowElements[0].classList.add("time-now");
            //rowElements[1].classList.add("time-now");
        }
        else if (rowDate - todayNow < 0) {
            thisTableRow.classList.add("time-passed");
            //rowElements[0].classList.add("time-passed");
            //rowElements[1].classList.add("time-passed");
        }
    }

    // go through UV forecast
    for (i=0; i<forecastUV.length; i++) {
        // generate the Date object from their weird formatting
        const dateTimeString = forecastUV[i].DATE_TIME;
        const dtSplitSpace = dateTimeString.split(" ");
        const dtSplitSlash = dtSplitSpace[0].split("/");
        const dtSplitAMPM = dtSplitSpace[2];
        var dtHour = parseInt(dtSplitSpace[1]);
        if (dtHour == 12) {
            dtHour = 0;
        }
        if (dtSplitAMPM == "PM") {
            dtHour += 12;
        }
        const dtMonthIdx = monthMap.get(dtSplitSlash[0]);
        const dtDateDay = parseInt(dtSplitSlash[1]);
        const dtDateYear = parseInt(dtSplitSlash[2]);
        const thisUVdateObj = new Date(dtDateYear, dtMonthIdx, dtDateDay, dtHour);

        // attempt to find table row
        row_idx = Math.round((thisUVdateObj.getTime() - tableDate.getTime()) / 3600000);
        if (row_idx >= 0 && row_idx <= 24) {
            thisTableRow = document.getElementById("t-row-"+row_idx);
            // add UV index
            uvEntry = thisTableRow.querySelectorAll("td")[3]
            uvEntry.innerHTML = forecastUV[i].UV_VALUE;
            uvEntry.classList.add(uvClassAssignment(forecastUV[i].UV_VALUE));

        }
    }

    // go through observations
    const obsRows = historyTable.querySelectorAll("tr")
    var tableObservations = Array();
    // last 24 observations
    for (i=0; i<24; i++) {
        var elementsHere = obsRows[i].querySelectorAll("td")

        const dataHere = new Map()
        dataHere.dayNum = parseInt(elementsHere[0].innerHTML)
        if (dataHere.dayNum < 15) {
            dataHere.monthNum = todayNow.getMonth();
        } else {
            dataHere.monthNum = (todayNow.getMonth() - 1) % 12;
        }

        if (dataHere.dayNum < 15 & dataHere.monthNum == 0) {
            dataHere.yearNum = todayNow.getFullYear() - 1;
        } else {
            dataHere.yearNum = todayNow.getFullYear();
        }

        const timeStrSplit = elementsHere[1].innerHTML.split(":");
        dataHere.hourNum = parseInt(timeStrSplit[0]);
        if (parseInt(timeStrSplit[1]) > 30) {
            dataHere.hourNum = (dataHere.hourNum + 1) % 24;
        }

        // date object rounded to the closest hour
        const dateObj = new Date(dataHere.yearNum, dataHere.monthNum, dataHere.dayNum, dataHere.hourNum);

        // find in table
        row_idx = Math.round((dateObj.getTime() - tableDate.getTime()) / 3600000);
        if (row_idx >= 0 && row_idx <= 24) {
            thisTableRow = document.getElementById("t-row-"+row_idx);
            // add temperature and conditions
            const rowQuery = thisTableRow.querySelectorAll("td");
            rowQuery[2].innerHTML = Math.round(parseFloat(elementsHere[6].innerHTML));
            rowQuery[5].innerHTML = elementsHere[4].innerHTML;

        }
    }

    // go through the weather forecast JSON
    for (i=0; i<36; i++) {
        const dataHere = forecastWeather.properties.periods[i]
        const dateObj = new Date(dataHere.startTime)
        
        // find in table
        row_idx = Math.round((dateObj.getTime() - tableDate.getTime()) / 3600000);
        if (row_idx >= 0 && row_idx <= 24) {
            thisTableRow = document.getElementById("t-row-"+row_idx);
            // add temperature, precipitation, and conditions
            // unless they were given by observations
            const rowQuery = thisTableRow.querySelectorAll("td");
            if (rowQuery[2].innerHTML == "") {    
                rowQuery[2].innerHTML = dataHere.temperature;
            }
            const precipNum = dataHere.probabilityOfPrecipitation.value
            rowQuery[4].innerHTML = precipNum.toString().padStart(2, "0") + "%";
            rowQuery[4].classList.add(precipClassAssignment(precipNum))
            if (rowQuery[5].innerHTML == "") {
                rowQuery[5].innerHTML = dataHere.shortForecast;
            }

        }
    }
}

// do the requests
// query lat & lon for weather station
fetch("https://api.weather.gov/points/"+lat+","+lon+"")
.then((response) => {
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
    return response.text();
})
.then((text) => {
    reqjson = JSON.parse(text)
    // from lat & lon query, get weather station URL
    hourlyURL = reqjson.properties.forecastHourly;
    fetch(hourlyURL)
    .then((response2) => {
        if (!response2.ok) {
            throw new Error(`HTTP error: ${response2.status}`);
        }
        return response2.text();
    })
    .then((text2) => {
        // this is the result from the weather station
        fWeatherJSON = JSON.parse(text2);

        // now fetch the UV index information
        fetch("https://data.epa.gov/dmapservice/getEnvirofactsUVHOURLY/ZIP/"+zip+"/JSON")
        .then((response3) => {
            if (!response3.ok) {
                throw new Error(`HTTP error: ${response3.status}`);
            }
            return response3.text();
        })
        .then((text3) => {
            fUVJSON = JSON.parse(text3);
            // now fetch the recorded information
            fetch("https://forecast.weather.gov/data/obhistory/"+stationName+".html")
            .then((response4) => {
                if (!response4.ok) {
                    throw new Error(`HTTP error: ${response4.status}`);
                }
                return response4.text();
            })
            .then((text4) => {
                const parser = new DOMParser();
                doc4 = parser.parseFromString(text4, "text/html");
                const tableResult = doc4.querySelector(".obs-history").querySelector("tbody");
                giveForecastInfo(fWeatherJSON, fUVJSON, tableResult);
            })
        })
    })
})

const sourceTextElement = document.getElementById("sources-text")
sourceTextElement.innerHTML = "lat=" + lat + ",lon=" + lon + ",zip=" + zip + ",station=" + stationName
