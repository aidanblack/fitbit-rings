import clock from "clock";
import document from "document";
import { display } from "display";
import { me } from "appbit";
import * as messaging from "messaging";
import * as simpleSettings from "./device-settings";
import Clock from "./clock";
import Battery from "./battery";
import Weather from "./weather";
import Goals from "./goals";
import File from "./file";

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
    if (evt.data.key === "globeStyle") {
      clockController.file.firstRun = 1;
      clockController.file.requestFile();
    }
  }
});

// ***** Clock *****
console.log("set up clock");

var clockController = new Clock();

// ***** Display *****
console.log("set up display");

if (display.aodAvailable && me.permissions.granted("access_aod")) {
  // tell the system we support AOD
  display.aodAllowed = true;

  // respond to display change events
  display.addEventListener("change", () => {
    // Is the display on?
    if (!display.aodActive && display.on) {
      clock.granularity = "seconds";
      clockController.weather.weatherRunning = true;
      clockController.weather.updateWeather();
      clockController.file.requestFile();
      clockController.updateGoals();
      clockController.updateBattery();
    }
    else {
      clock.granularity = "minutes";
    }
  });
}
else {
  // respond to display change events
  display.addEventListener("change", () => {
    // Is the display on?
    if (display.on) {
      clock.granularity = "seconds";
      clockController.weather.weatherRunning = true;
      clockController.weather.updateWeather();
      clockController.file.requestFile();
      clockController.updateGoals();
      clockController.updateBattery();
    }
    else {
      clock.granularity = "minutes";
    }
  });
}

clockController.file = new File();

// ***** Weather *****
console.log("set up weather");

var weather = new Weather(
  document.getElementById("temperature"),
  document.getElementById("weatherImage"),
  document.getElementById("weatherRotate"),
  document.getElementById("symbolRotate"),
  document.getElementById("tempRotate"));
  try {
    weather.tempUnit = settings.tempUnit.selected || "Celsius";
  }
  catch (err) {
    console.log(err);
    weather.tempUnit = "Celsius";
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
