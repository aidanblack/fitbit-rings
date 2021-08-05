import { settingsStorage } from "settings";
import * as messaging from "messaging";
import { me as companion } from "companion";
import * as weather from "fitbit-weather/companion";
import * as weatherKey from "./weather";
import { outbox } from "file-transfer";
import { zeroPad } from "../common/utils"
import { geolocation } from "geolocation"

console.log("Launch Companion");

/* Api Key can be obtained from openweathermap.com */
weather.setup({ provider: weather.Providers.openweathermap, apiKey: weatherKey.apiKey });

// Settings have been changed
settingsStorage.addEventListener("change", (evt) => {
    sendValue(evt.key, JSON.parse(evt.newValue));
});

// Settings were changed while the companion was not running
if (companion.launchReasons.settingsChanged) {
    // Send the value of the setting
    sendValue("tempUnit", JSON.parse(settingsStorage.getItem("tempUnit")));
    sendValue("hideDate", JSON.parse(settingsStorage.getItem("hideDate")));
    sendValue("hideWeather", JSON.parse(settingsStorage.getItem("hideWeather")));
    sendValue("hideHeartRate", JSON.parse(settingsStorage.getItem("hideHeartRate")));
    sendValue("hideGoals", JSON.parse(settingsStorage.getItem("hideGoals")));
    sendValue("daylightImage", JSON.parse(settingsStorage.getItem("daylightImage")));
}

messaging.peerSocket.addEventListener("error", (err) => {
  console.error(`Connection error: ${err.code} - ${err.message}`);
});

function sendValue(key, val) {
    if (val) {
        sendSettingData({
            key: key,
            value: val
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
    geolocation.getCurrentPosition(
      (position) => {
      var lat = position.coords.latitude;
      var lon = position.coords.longitude;
      daylightImage(lat, lon);
    });
  }
});

function daylightImage(lat, lon) {
  let now = new Date();
  let year = now.getUTCFullYear();
  let month = zeroPad((now.getUTCMonth() + 1));
  let day = zeroPad(now.getUTCDate());
  let hour = zeroPad(now.getUTCHours());
  let minute = zeroPad(now.getUTCMinutes());

  var northSouth: string;
  var eastWest: string;

  if(lat < 0) {
    northSouth = "South";
    lat = 0 - lat;
  }
  else northSouth = "North";

  if(lon < 0) {
    eastWest = "West";
    lon = 0 - lon;
  }
  else eastWest = "East";

  console.log(`${lat} ${northSouth}, ${lon} ${eastWest}`);

  //let srcImage = encodeURI(`https://www.timeanddate.com/scripts/sunmap.php?earth=0&iso=${year}${month}${day}T${hour}${minute}`);
  let srcImage = `https%3A%2F%2Ffourmilab.ch%2Fcgi-bin%2FEarth%3Fimg%3Dwx-cmap.bmp%26imgsize%3D336%26dynimg%3Dy%26gamma%3D1.32%26opt%3D-l%26lat%3D${lat}%26ns%3D${northSouth}%26lon%3D${lon}%26ew%3D${eastWest}%26alt%3D35785%26tle%3D%26utc%3D%26date%3D0%26jd%3D%26iso%3D${year}${month}${day}${hour}`;
  let resizeUri = `https://images.weserv.nl/?url=${srcImage}&w=336&h=336&output=jpg&mask=circle&mbg=0000`;//&mod=1.7&con=1.25&sat=0.9&hue=-15
  let destFilename = `daylight${month}${day}${hour}${minute}.jpg`;

  // Fetch the image from the internet
  fetch(resizeUri).then(function (response) {
      return response.arrayBuffer();
    }).then(data => {
      outbox.enqueue(destFilename, data).then(ft => {
        settingsStorage.setItem("daylightImage", destFilename);
        console.log(`Transfer of '${destFilename}' successfully queued.`);
        sendSettingData({ destFilename, "data": "outbox"});
      }).catch(err => {
        throw new Error(`Failed to queue '${destFilename}'. Error: ${err}`);
      });
    }).catch(err => {
      sendSettingData({ destFilename, err });
    });
}
