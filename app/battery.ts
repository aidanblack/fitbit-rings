import document from "document";
import { battery } from "power";

class Battery {
    batteryBackground = document.getElementById("batteryBackground") as GroupElement;

    constructor() {}

    updateBattery() {
        var batteryCount = battery.chargeLevel;
        var batteryGoal = 100;
        this.batteryBackground.style.opacity = Math.min(Math.max((batteryCount / batteryGoal), 0.1), 1);
        var battArc = document.getElementById("battArc") as ArcElement;
        battArc.sweepAngle = Math.min(24 * (batteryCount / batteryGoal), 24);
      
        console.log("Battery Updated");
    }
}

export default Battery;