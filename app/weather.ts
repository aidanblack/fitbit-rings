import * as weather from 'fitbit-weather/app';
import document from "document";
import * as messaging from "messaging";
import { geolocation } from 'geolocation';
import File from "./file";
import { error } from 'fp-ts/lib/Console';

class Weather {
    temp;
    icon;
    weatherRotate;
    symbolRotate;
    tempRotate;
    firstRun;
    weatherRunning;

    tempUnit = "0";
    timestamp = 0;
    fileRequested = false;

    weatherGradient = document.getElementById("gradient");
    weatherImage = document.getElementById("weatherImage");
    sunrise = document.getElementById("sunrise");
    sunset = document.getElementById("sunset") as ArcElement;
    temperature = document.getElementById("temperature");

    file = new File();

    constructor(temp, icon, weatherRotate, symbolRotate, tempRotate) {
        this.temp = temp;
        this.icon = icon;
        this.weatherRotate = weatherRotate;
        this.symbolRotate = symbolRotate;
        this.tempRotate = tempRotate;
        this.firstRun = 1;
        this.weatherRunning = false;
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
        console.log("Process Daylight");
        this.firstRun = 30;
        
        var weatherResult = weather;

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

        console.log("Daylight Updated");
        this.weatherRunning = false;
        console.log(this.weatherRunning);
        console.log(this.fileRequested);
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
                const daylight1 = document.getElementById("daylight1") as ImageElement;

                this.file.fetch(this.firstRun * 60 * 1000, data)
                .then(file => this.file.getInboxFile())
                .then(filename => daylight1.href = `/private/data/${filename}`)
                .then(() => {this.fileRequested = true;})
                .catch(error => console.log(error.message));
                console.log(JSON.stringify(data));
            });
        }
        catch(ex) {
            console.log(ex.message);
        }
    }

    updateWeather() {
        weather.fetch(this.firstRun * 60 * 1000) // return the cached value if it is less than 30 minutes old 
        .then(weather => this.processWeather(weather))
        .catch(error => console.log(error.message));
    }
}
  
export default Weather;
