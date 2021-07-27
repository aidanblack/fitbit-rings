import clock from "clock";
import document from "document";
import { console } from "fp-ts";
import { zeroPad } from "../common/utils";

class Clock {
    updateDisplay = function() {};
    updateBattery = function() {};
    updateGoals = function() {};
    weather;

    hourHand = document.getElementById("hourHand") as GroupElement;
    hourText = document.getElementById("hourText") as TextElement;
    hourRotate = document.getElementById("hourRotate") as GroupElement;
    minuteHand = document.getElementById("minuteHand") as GroupElement;
    minuteText = document.getElementById("minuteText") as TextElement;
    minuteRotate = document.getElementById("minuteRotate") as GroupElement;
    secondHand = document.getElementById("secondHand") as GroupElement;
    secondText = document.getElementById("secondText") as TextElement;
    secondRotate = document.getElementById("secondRotate") as GroupElement;
    dateDay = document.getElementById("dateDay") as GroupElement;
    dayText = document.getElementById("dayText") as TextElement;
    dateMonth = document.getElementById("dateMonth") as GroupElement;
    monthText = document.getElementById("monthText") as TextElement;

    constructor() {
        try {
            clock.granularity = "seconds";
        }
        catch (err) {
            console.log(err);
        }
    }

    updateTime(now) {
        let hours = now.getHours();
        hours = hours % 12 || 12;
        let minutes = now.getMinutes();
        let seconds = now.getSeconds();
        let currentTimestamp = new Date(now).getTime();

        this.hourText.text = hours;
        this.minuteText.text = zeroPad(minutes);
        this.secondText.text = zeroPad(seconds);
        this.hourHand.groupTransform.rotate.angle = ((360 / 12) * hours) + ((360 / 12 / 60) * minutes);
        this.minuteHand.groupTransform.rotate.angle = (360 / 60) * minutes + ((360 / 60 / 60) * seconds);
        this.secondHand.groupTransform.rotate.angle = seconds * 6;
        this.hourRotate.groupTransform.rotate.angle = -(((360 / 12) * hours) + ((360 / 12 / 60) * minutes));
        this.minuteRotate.groupTransform.rotate.angle = -((360 / 60) * minutes + ((360 / 60 / 60) * seconds));
        this.secondRotate.groupTransform.rotate.angle = -(seconds * 6);

        if((clock.granularity === "minutes"  && (minutes + 5) % 5 === 0) || seconds === 0) this.updateGoals();
        if((clock.granularity === "minutes"  && (minutes + 5) % 5 === 0) || seconds === 0) this.updateBattery();
        if(this.weather.timestamp === 0 || currentTimestamp - this.weather.timestamp > (30 * 60 * 1000)) this.weather.updateWeather();
        if(this.weather.fileRequested === false) {
            this.weather.sendSettingData({
                key: "getDaylightImage",
                value: true
            });
        }
        console.log(`${this.weather.timestamp} : ${currentTimestamp}`);

        this.updateDisplay();
    }

    updateDate(now) {
        let dateText = now.toLocaleString('default', { month: 'short' }).substring(4, 10);
        let monthName = dateText.substring(0,3).toUpperCase();
    
        this.dateMonth.groupTransform.rotate.angle = ((360 / 31 / 12 ) * now.getDate()) + ((now.getMonth() + 1) * 30);
        this.monthText.text = monthName;
        if(now.getDate() == 31)
            this.dateDay.groupTransform.rotate.angle = 6;
        else
            this.dateDay.groupTransform.rotate.angle = now.getDate() * 12;
        this.dayText.text = now.getDate();
    }

    // ***** Add event handler *****
    startClock() {
        clock.ontick = (evt) => {
            console.log(JSON.stringify(evt));
            let now = evt.date;
            console.log("update date");
            this.updateDate(now);
            console.log("update time");
            this.updateTime(now);
        }
    }
}

export default Clock;

