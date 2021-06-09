import { settingsStorage } from "settings";
import * as messaging from "messaging";
import { me as companion } from "companion";
import * as weather from 'fitbit-weather/companion';
import * as weatherKey from './weather';
import { outbox } from "file-transfer";

let now = new Date();
let year = now.getUTCFullYear();
let month = (now.getUTCMonth() + 1).toString().padStart(2,"0");
let day = now.getUTCDate().toString().padStart(2,"0");
let hour = now.getUTCHours().toString().padStart(2,"0");
let minute = now.getUTCMinutes().toString().padStart(2,"0");

let srcImage = encodeURI(`https://www.timeanddate.com/scripts/sunmap.php?earth=1&iso=${year}${month}${day}T${hour}${minute}`);
let resizeUri = `https://images.weserv.nl/?url=${srcImage}&w=192&h=96&mod=1.5&con=10&sat=1.5`;
let destFilename = "daylight.jpg";

/* Api Key can be obtained from openweathermap.com */
weather.setup({ provider: weather.Providers.openweathermap, apiKey: weatherKey.apiKey });

// Settings have been changed
settingsStorage.addEventListener("change", (evt) => {
    sendValue(evt.key, evt.newValue);
});

// Settings were changed while the companion was not running
if (companion.launchReasons.settingsChanged) {
    // Send the value of the setting
    sendValue("tempUnit", settingsStorage.getItem("tempUnit"));
    sendValue("hideDate", settingsStorage.getItem("hideDate"));
    sendValue("hideWeather", settingsStorage.getItem("hideWeather"));
    sendValue("hideHeartRate", settingsStorage.getItem("hideHeartRate"));
    sendValue("hideGoals", settingsStorage.getItem("hideGoals"));
}

function sendValue(key, val) {
    if (val) {
        sendSettingData({
            key: key,
            value: JSON.parse(val)
        });
    }
}
function sendSettingData(data) {
    // If we have a MessageSocket, send the data to the device
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        messaging.peerSocket.send(data);
        //console.log(data); // Good for debugging
    } else {
        console.log("No peerSocket connection");
    }
}

function daylightTimer() {
// Fetch the image from the internet
  fetch(resizeUri).then(function (response) {
      return response.arrayBuffer();
    }).then(data => {
      outbox.enqueue(destFilename, data).then(ft => {
        console.log(`Transfer of '${destFilename}' successfully queued.`);
      }).catch(err => {
        throw new Error(`Failed to queue '${destFilename}'. Error: ${err}`);
      });
    }).catch(err => {
      console.error(`Failure: ${err}`);
    });

    setTimeout(daylightTimer, 3600000);
}

daylightTimer();