import * as weather from 'fitbit-weather/app';
import document from "document";
import * as messaging from "messaging";
import { geolocation } from 'geolocation';

class Weather {
    temp;
    icon;
    weatherRotate;
    symbolRotate;
    tempRotate;

    tempUnit = "0";
    timestamp = 0;
    fileRequested = false;

    weatherGradient = document.getElementById("gradient");
    weatherImage = document.getElementById("weatherImage");
    sunrise = document.getElementById("sunrise");
    sunset = document.getElementById("sunset") as ArcElement;
    temperature = document.getElementById("temperature");

    constructor(temp, icon, weatherRotate, symbolRotate, tempRotate) {
        this.temp = temp;
        this.icon = icon;
        this.weatherRotate = weatherRotate;
        this.symbolRotate = symbolRotate;
        this.tempRotate = tempRotate;
    }

    processWeather(weather) {
        var weatherResult = weather;
        console.log(JSON.stringify(weatherResult));

        if (this.tempUnit == "1")
            this.temp.text = `${Math.round(weather.temperatureF)}°`;
        else
            this.temp.text = `${Math.round(weather.temperatureC)}°`;

        var weatherIcon = this.icon;
        var weatherCode = weather.conditionCode;
        var dayNight;
        if (weatherResult.timestamp > weatherResult.sunrise && weatherResult.timestamp < weatherResult.sunset) dayNight = "d";
        else dayNight = "n";
        weatherIcon.href = `weather/${weatherCode}${dayNight}.png`;
        this.timestamp = weather.timestamp;

        console.log("Weather Updated");

        this.processDaylight(weather);
    }

    processDaylight(weather) {
        var weatherResult = weather;
        this.fileRequested = false;

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
        this.sunset.startAngle = 180 - sunriseAngle;
        this.sunset.sweepAngle = 360 - sunsetAngle + sunriseAngle;
        this.weatherRotate.groupTransform.rotate.angle = 360 - nowAngle;
        this.symbolRotate.groupTransform.rotate.angle = nowAngle;
        if(nowHours >= 6 && nowHours < 18)
            this.tempRotate.groupTransform.rotate.angle = 180;
        else
            this.tempRotate.groupTransform.rotate.angle = 0;

        if(this.fileRequested === false) {
            this.requestFile();
        }
        
        console.log("Daylight Updated");
    }

    requestFile() {
        try {
            geolocation.getCurrentPosition((position) => {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;

                var data = {
                    key: "getDaylightImage",
                    value: `${lat},${lon}`
                };
                this.sendSettingData(data);

                console.log("Daylight image set");
            });
        }
        catch(ex) {
            console.log(ex);
        }
    }

    updateWeather() {
        weather.fetch(30 * 60 * 1000) // return the cached value if it is less than 30 minutes old 
        .then(weather => this.processWeather(weather))
        .catch(error => console.log(JSON.stringify(error)));
    }

    sendSettingData(data) {
        // If we have a MessageSocket, send the data to the device
        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
            messaging.peerSocket.send(data);
            this.fileRequested = true;
            //console.log(data); // Good for debugging
        } else {
            console.log("No peerSocket connection");
        }
    }
}
  
export default Weather;
