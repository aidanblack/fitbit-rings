import { settingsStorage } from "settings";
import * as messaging from "messaging";
import { me as companion } from "companion";
import * as weather from "fitbit-weather/companion";
import * as weatherKey from "./weather";
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
    var coords = new String(evt.data.value).split(",");
    var lat = coords[0];
    var lon = coords[1];
    console.log(`${coords} ${lat} ${lon}`)
    daylightImage(lat, lon);
  }
});

var fileNum = 0;

function daylightImage(lat, lon) {
  // let now = new Date();
  // let year = now.getUTCFullYear();
  // let month = zeroPad((now.getUTCMonth() + 1));
  // let day = zeroPad(now.getUTCDate());
  // let hour = zeroPad(now.getUTCHours());
  // let minute = zeroPad(now.getUTCMinutes());

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
  let srcImage = encodeURI(`https://fourmilab.ch/cgi-bin/Earth?img=?img=NASA500m.evif&imgsize=336&dynimg=y&gamma=1.32&opt=-l&lat=${lat}&ns=${northSouth}&lon=${lon}&ew=${eastWest}&alt=35785&tle=&utc=&date=0&jd=`);
  //let resizeUri = `https://images.weserv.nl/?url=${srcImage}&w=192&h=96`;//&mod=1.7&con=1.25&sat=0.9&hue=-15
  let destFilename = `daylight${fileNum}.jpg`;
  fileNum++;

  // Fetch the image from the internet
  fetch(srcImage).then(function (response) {
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
