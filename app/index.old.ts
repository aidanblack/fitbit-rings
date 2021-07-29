import { display } from "display";
import clock from "clock";
import document from "document";
import * as messaging from "messaging";
import { me } from "appbit";
import { battery } from "power";
import { HeartRateSensor } from "heart-rate";
import { BodyPresenceSensor } from "body-presence";
import { today } from "user-activity";
import { goals } from "user-activity";
import * as weather from "fitbit-weather/app";
import * as simpleSettings from "./device-settings";
import { inbox } from "file-transfer"
import { geolocation } from "geolocation";

clock.granularity = "seconds";

let daylightFileName = "";
const hourHand = document.getElementById("hourHand");
const hourText = document.getElementById("hourText");
const minuteHand = document.getElementById("minuteHand");
const minuteText = document.getElementById("minuteText");
const secondHand = document.getElementById("secondHand");
const secondText = document.getElementById("secondText");
const dateDay = document.getElementById("dateDay");
const dayText = document.getElementById("dayText");
const dateMonth = document.getElementById("dateMonth");
const monthText = document.getElementById("monthText");
const daylight1 = document.getElementById("daylight1");
const daylight2 = document.getElementById("daylight2");
const daylight3 = document.getElementById("daylight3");
const globe = document.getElementById("globe");

const heartRate = document.getElementById("heartRate");
const batteryBackground = document.getElementById("batteryBackground");
const stepsBackground = document.getElementById("stepsBackground");
const distanceBackground = document.getElementById("distanceBackground");
const zoneBackground = document.getElementById("zoneBackground");
const weatherGradient = document.getElementById("gradient");
const weatherImage = document.getElementById("weatherImage");
const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");
const temperature = document.getElementById("temperature");

// ***** Settings *****

const settings;

function settingsCallback(data) {
  settings = data;
}

simpleSettings.initialize(settingsCallback);

messaging.peerSocket.addEventListener("message", (evt) => {
  if (evt && evt.data && evt.data.key && evt.data.key == "tempUnit") {
    //console.log(`${evt.data.key} : ${evt.data.value}`); // Good for debugging
    settings[evt.data.key] = evt.data.value;
  }
});

// ***** Body Presence and Heart Rate *****

// const body = null;
// if (BodyPresenceSensor) {
//   body = new BodyPresenceSensor();
//   body.start();
// }

// const hrm;
// var heartBeats = 0;
// if (HeartRateSensor) {
//     hrm = new HeartRateSensor();
//     hrm.start();
//     heartBeats = hrm.heartRate;

//     hrm.addEventListener("reading", (evt) => {
//         if (body.present) {
//             hrm.start();
//             heartBeats = hrm.heartRate;
//             heartRate.text = heartBeats;
//             heartRate.style.visibility = "visible";
//         } else {
//             hrm.stop();
//             heartRate.style.visibility = "hidden";
//         }
//     });
// }

// ***** Daylight Image *****

function processAllFiles() {
    if(display.on) {
        var fileName;
        while (fileName = inbox.nextFile()) {
            daylightFileName = fileName;
            console.log(`/private/data/${daylightFileName} is now available`);
        }
        daylight1.href = `/private/data/${daylightFileName}`;
        daylight2.href = `/private/data/${daylightFileName}`;
        daylight3.href = `/private/data/${daylightFileName}`;

        try {
            geolocation.getCurrentPosition(function(position) {
                var mapOffset = position.coords.longitude / 180 * 96;
                globe.groupTransform.translate.x = -mapOffset;
                console.log("Daylight image set");
            });
        }
        catch(ex) {
            console.log(ex.message);
        }
    }
}
inbox.addEventListener("newfile", processAllFiles);
display.addEventListener("change", () => {
    // Is AOD inactive and the display is on?
    if (display.on) {
    //   body.start();
    //   hrm.start();
      clock.granularity = "seconds";
      processAllFiles();
      processWeather();
      updateStats();
    }
    else {
        // body.stop();
        // hrm.stop();
        clock.granularity = "minutes";
    }
});
  
// ***** Clock *****

clock.ontick = (evt) => {
    let now = evt.date;
    let dateText = now.toLocaleString('default', { month: 'short' }).substring(4, 10);
    let monthName = dateText.substring(0,3).toUpperCase();

    dateMonth.groupTransform.rotate.angle = ((360 / 31 / 12 ) * now.getDate()) + ((now.getMonth() + 1) * 30);
    monthText.text = monthName;
    if(now.getDate() == 31)
        dateDay.groupTransform.rotate.angle = 6;
    else
        dateDay.groupTransform.rotate.angle = now.getDate() * 12;
    dayText.text = now.getDate();

    let hours = now.getHours();
    hours = hours % 12 || 12;
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    hourText.text = hours;
    minuteText.text = minutes;
    secondText.text = seconds;
    hourHand.groupTransform.rotate.angle = ((360 / 12) * hours) + ((360 / 12 / 60) * minutes);
    minuteHand.groupTransform.rotate.angle = (360 / 60) * minutes + ((360 / 60 / 60) * seconds);
    secondHand.groupTransform.rotate.angle = seconds * 6;
}

// ***** Stats *****

function statsTimer() {
    if (me.permissions.granted("access_activity")) updateStats();
    setTimeout(statsTimer, 60000);
}

statsTimer();

function updateStats() {
    //     if (mode == modes.HeartRate) {
    //     meter.text = "H/B";
    //     currentCount = heartBeats;
    //     currentGoal = 220;
    // }

    if(display.on) {
        var batteryCount = battery.chargeLevel;
        var batteryGoal = 100;
        batteryBackground.style.opacity = Math.min(Math.max((batteryCount / batteryGoal), 0.1), 1);
        document.getElementById("battArc").sweepAngle = Math.min(24 * (batteryCount / batteryGoal), 24);

        var stepsCount = today.adjusted.steps;
        var stepsGoal = goals.steps;
        stepsBackground.style.opacity = Math.min(Math.max((stepsCount / stepsGoal), 0.1), 1);
        document.getElementById("stepArc").sweepAngle = Math.min(24 * (stepsCount / stepsGoal), 24);

        var distanceCount = today.adjusted.distance / 16.09344;
        var distanceGoal = goals.distance / 16.09344;
        distanceBackground.style.opacity = Math.min(Math.max((distanceCount / distanceGoal), 0.1), 1);
        document.getElementById("distArc").sweepAngle = Math.min(24 * (distanceCount / distanceGoal), 24);

        var zoneCount = today.adjusted.activeZoneMinutes.total;
        var zoneGoal = goals.activeZoneMinutes.total;
        zoneBackground.style.opacity = Math.min(Math.max((zoneCount / zoneGoal), 0.1), 1);
        document.getElementById("zoneArc").sweepAngle = Math.min(24 * (zoneCount / zoneGoal), 24);
    }
}

// ***** Weather *****

function weatherTimer() {
    if(display.on) {
        weather.fetch(30 * 60 * 1000) // return the cached value if it is less than 30 minutes old 
        .then(weather => processWeather(weather))
        .catch(error => console.log(JSON.stringify(error.stack)));
    }
    setTimeout(weatherTimer, 600000);
}

weatherTimer();

function processWeather(weather) {
    var weatherResult = weather;

    console.log(JSON.stringify(weather));

    var currentCount;
    if (settings.tempUnit.selected == "1")
        currentCount = Math.round(weather.temperatureF);
    else
        currentCount = Math.round(weather.temperatureC);

    var currentGoal = 120;
    var weatherCode = weatherResult.conditionCode;
    var dayNight;
    if (weatherResult.timestamp > weatherResult.sunrise && weatherResult.timestamp < weatherResult.sunset) dayNight = "d";
    else dayNight = "n";
    weatherImage.href = `weather/${weatherCode}${dayNight}.png`;

    var today = new Date();
    var sunriseTime = new Date(weatherResult.sunrise);
    var sunsetTime = new Date(weatherResult.sunset);

    var nowHours = today.getHours();
    var nowMinutes = today.getMinutes();
    var sunriseHours = sunriseTime.getHours();
    var sunriseMinutes = sunriseTime.getMinutes();
    var sunsetHours = sunsetTime.getHours();
    var sunsetMinutes = sunsetTime.getMinutes();

    var nowAngle = ((360 / 24) * nowHours) + ((360 / 24 / 60) * nowMinutes);
    var sunriseAngle = ((360 / 24) * sunriseHours) + ((360 / 24 / 60) * sunriseMinutes);
    var sunsetAngle = ((360 / 24) * sunsetHours) + ((360 / 24 / 60) * sunsetMinutes);
    sunset.startAngle = 180 - sunriseAngle;
    sunset.sweepAngle = 360 - sunsetAngle + sunriseAngle;
    document.getElementById("weatherRotate").groupTransform.rotate.angle = 360 - nowAngle;
    document.getElementById("symbolRotate").groupTransform.rotate.angle = nowAngle;
    temperature.text = currentCount + "°";
    if(nowHours > 6 && nowHours < 18)
        document.getElementById("tempRotate").groupTransform.rotate.angle = 180;
}

// ***** Helpers *****

Date.prototype.stdTimezoneOffset = function () {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.isDstObserved = function () {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
}

processAllFiles();