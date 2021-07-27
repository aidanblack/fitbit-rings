import { settingsStorage } from "settings";
import * as messaging from "messaging";
import { me as companion } from "companion";
import * as weather from 'fitbit-weather/companion';
import * as weatherKey from './weather';
import { outbox } from "file-transfer";
import { zeroPad } from "../common/utils";

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

messaging.peerSocket.addEventListener("message", (evt) => {
  if (evt && evt.data && evt.data.key && evt.data.key == "getDaylightImage") {
    //console.log(`${evt.data.key} : ${evt.data.value}`); // Good for debugging
    daylightImage();
  }
});

var fileNum = 0;

function daylightImage() {
  let now = new Date();
  let year = now.getUTCFullYear();
  let month = zeroPad((now.getUTCMonth() + 1));
  let day = zeroPad(now.getUTCDate());
  let hour = zeroPad(now.getUTCHours());
  let minute = zeroPad(now.getUTCMinutes());

  let srcImage = encodeURI(`https://www.timeanddate.com/scripts/sunmap.php?earth=0&iso=${year}${month}${day}T${hour}${minute}`);
  let resizeUri = `https://images.weserv.nl/?url=${srcImage}&w=192&h=96`;//&mod=1.7&con=1.25&sat=0.9&hue=-15
  let destFilename = `daylight${fileNum}.jpg`;
  fileNum++;

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
}
