import clock from "clock";
import document from "document";
import { display } from "display";
import { HeartRateSensor } from "heart-rate";
import { BodyPresenceSensor } from "body-presence";
import { me } from "appbit";
import * as messaging from "messaging";
import * as simpleSettings from "./device-settings";
import { inbox } from "file-transfer"
import * as fs from "fs";
import Clock from "./clock";
import Battery from "./battery";
import Weather from "./weather";
//import Face from "./face";
import Goals from "./goals";

// ***** Settings *****
console.log("set up settings");

var settings;

function settingsCallback(data) {
  settings = data;
}

simpleSettings.initialize(settingsCallback);

messaging.peerSocket.addEventListener("message", (evt) => {
  if (evt && evt.data && evt.data.key) {
    settings[evt.data.key] = evt.data.value;
    //console.log(`${evt.data.key} : ${evt.data.value}`); // Good for debugging
    if (evt.data.key === "tempUnit") {
      weather.tempUnit = evt.data.value.selected;
      clockController.weather.updateWeather();
    }
  }
});

// ***** Clock *****
console.log("set up clock");

var clockController = new Clock();

// ***** Daylight Image *****

const daylight1 = document.getElementById("daylight1") as ImageElement;
const daylight2 = document.getElementById("daylight2") as ImageElement;
const daylight3 = document.getElementById("daylight3") as ImageElement;
const globe = document.getElementById("globe") as GroupElement;
let daylightFileName = "";

try {
  processAllFiles(null);
}
catch (ex)
{
  console.log(JSON.stringify(ex.message));
}

function processAllFiles(evt: Event) {
  if(display.on) {
      var fileName;
      console.log(JSON.stringify(evt));

      if(evt != null) {
        while (fileName = inbox.nextFile()) {
            daylightFileName = fileName;
            console.log(`/private/data/${daylightFileName} is now available`);
        }
      }
      else {
        var files = fs.listDirSync("/private/data");
        var fileIterate = true;
        do {
          const file = files.next();
          if (!file.done) {
            fileName = new String(file.value);
            if(fileName.indexOf(".jpg") > 0) daylightFileName = fileName;
            console.log(`/private/data/${daylightFileName} found`);
          }
          else
          { 
            fileIterate = false;
          }
        } while (fileIterate === true);
      }

      var fileContent = fs.readFileSync(daylightFileName);
      if(fileContent.byteLength > 20000) {
        daylight1.href = `/private/data/${daylightFileName}`;
        console.log("Daylight image set");
      }

      console.log(`File size: ${fileContent.byteLength}`);
  }
}
inbox.addEventListener("newfile", processAllFiles);

// ***** Display *****
console.log("set up display");

//var face = new Face(settings, body, hrm, dateBox);

if (display.aodAvailable && me.permissions.granted("access_aod")) {
  // tell the system we support AOD
  display.aodAllowed = true;

  // respond to display change events
  display.addEventListener("change", () => {
    // Is the display on?
    if (!display.aodActive && display.on) {
      clock.granularity = "seconds";
      clockController.weather.updateWeather();
    }
    else {
      clock.granularity = "minutes";
    }
    //face.updateDisplay();
  });
}
else {
  // respond to display change events
  display.addEventListener("change", () => {
    // Is the display on?
    if (display.on) {
      clock.granularity = "seconds";
      clockController.weather.updateWeather();
    }
    else {
      clock.granularity = "minutes";
    }
    //face.updateDisplay();
  });
}

//clockController.updateDisplay = () => { face.updateDisplay() };

// ***** Weather *****
console.log("set up weather");

var weather = new Weather(
  document.getElementById("temperature"),
  document.getElementById("weatherImage"),
  document.getElementById("weatherRotate"),
  document.getElementById("symbolRotate"),
  document.getElementById("tempRotate"));
try {
  weather.tempUnit = settings.tempUnit.selected;
}
catch {
  weather.tempUnit = "0";
}
clockController.weather = weather;

// ***** Goals *****
console.log("set up goals");

var goals = new Goals(settings);

clockController.updateGoals = () => { goals.updateGoals() };

// ***** Battery *****
console.log("set up battery");

var battery = new Battery();

clockController.updateBattery = () => { battery.updateBattery() };

// ***** Trigger Updates *****
console.log("start updates");

clockController.updateGoals();
clockController.updateBattery();
clockController.startClock();
