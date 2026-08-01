
// location information
const lat = 42.2511;
const lon = -83.7217;
const zip = 48104;
const stationName = "KYIP"

// HTML elements
const textOut = document.getElementById("textOut");
const UVOut = document.getElementById('UVOut');
const tabOut = document.getElementById("tabOut")

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

const myDateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    //dayPeriod: "narrow",
    hour: "2-digit",
    //minute: "numeric",
    //second: "numeric"
  })

function weatherLineString(thisLine) {
    return myDateFormatter.format(thisLine.dateObj) + " " + thisLine.temperature + "\u00B0" + 
            thisLine.temperatureUnit + " " + thisLine.probabilityOfPrecipitation.value.toString().padStart(2, "0")
             + "% chance of precipitation. " + thisLine.shortForecast;
}

function uvLineString(thisLine) {
    return myDateFormatter.format(thisLine.dateObj) + " UV Index " + thisLine.UV_VALUE;
}

function tableLineString(thisLine) {
    return myDateFormatter.format(thisLine.dateObj) + " " + thisLine.temperature + "\u00B0" + "F " + thisLine.weatherDescription;
}

// Given the JSON info, populate the paragraph elements
function giveForecastInfo(forecastWeather, forecastUV, historyTable) {
    // go through the weather JSON for time, temperature, and weather info
    var weatherHours = Array();
    for (i=0; i<24; i++) {
        var dataHere = forecastWeather.properties.periods[i]
        dataHere.dateObj = new Date(dataHere.startTime)
        weatherHours.push(dataHere);
    }

    // sort by date
    weatherHours.sort((a,b) => (a.dateObj - b.dateObj));

    var weatherArr = Array();
    weatherHours.forEach((line) => {weatherArr.push(weatherLineString(line))});

    textOut.innerHTML = weatherArr.join("\r\n");

    // create date objects
    for (i=0; i<forecastUV.length; i++) {
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
        forecastUV[i].dateObj = new Date(dtDateYear, dtMonthIdx, dtDateDay, dtHour);

    }
    // TODO!!! rework how the date is read in
    // sort by date
    forecastUV.sort((a,b) => (a.dateObj - b.dateObj));
    //forecastUV.sort((a,b) => (a.ORDER - b.ORDER));

    var uvArr = Array();
    forecastUV.forEach((line) => {uvArr.push(uvLineString(line))});

    UVOut.innerHTML = uvArr.join("\r\n");


    const today = new Date()
    const obsRows = historyTable.querySelectorAll("tr")
    var tableObservations = Array();
    for (i=0; i<24; i++) {
        var elementsHere = obsRows[i].querySelectorAll("td")

        const dataHere = new Map()
        dataHere.dayNum = parseInt(elementsHere[0].innerHTML)
        if (dataHere.dayNum < 15) {
            dataHere.monthNum = today.getMonth();
        } else {
            dataHere.monthNum = (today.getMonth() - 1) % 12;
        }

        if (dataHere.dayNum < 15 & dataHere.monthNum == 0) {
            dataHere.yearNum = today.getFullYear() - 1;
        } else {
            dataHere.yearNum = today.getFullYear();
        }

        const timeStrSplit = elementsHere[1].innerHTML.split(":");
        dataHere.hourNum = parseInt(timeStrSplit[0]);
        if (parseInt(timeStrSplit[1]) > 30) {
            dataHere.hourNum = (dataHere.hourNum + 1) % 24;
        }

        dataHere.dateObj = new Date(dataHere.yearNum, dataHere.monthNum, dataHere.dayNum, dataHere.hourNum)

        dataHere.temperature = Math.round(parseFloat(elementsHere[6].innerHTML))
        dataHere.weatherDescription = elementsHere[4].innerHTML

        tableObservations.push(dataHere);
    }

    // sort by date
    tableObservations.sort((a,b) => (a.dateObj - b.dateObj));

    var tabArr = Array();
    tableObservations.forEach((line) => {tabArr.push(tableLineString(line))});

    tabOut.innerHTML = tabArr.join("\r\n");
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
                console.log()
                giveForecastInfo(fWeatherJSON, fUVJSON, tableResult);
            })
        })
    })
})