import document from "document";
import { me } from "appbit";
import { today } from "user-activity";
import { goals } from "user-activity";

class Goals {
    settings;
    stepPercent = 0;
    distancePercent = 0;
    zonePercent = 0;

    stepsBackground = document.getElementById("stepsBackground");
    distanceBackground = document.getElementById("distanceBackground");
    zoneBackground = document.getElementById("zoneBackground");

    constructor(settings) {
        this.settings = settings;
    }

    updateGoals() {
        if (me.permissions.granted("access_activity")) {
          var stepCount = today.adjusted.steps;
          var stepGoal = goals.steps;
          this.stepsBackground.style.opacity = Math.min(Math.max((stepCount / stepGoal), 0.1), 1);
          document.getElementById("stepArc").sweepAngle = Math.min(24 * (stepCount / stepGoal), 24);
        
          var distanceCount = today.adjusted.distance;
          var distanceGoal = goals.distance;
          this.distanceBackground.style.opacity = Math.min(Math.max((distanceCount / distanceGoal), 0.1), 1);
          document.getElementById("distArc").sweepAngle = Math.min(24 * (distanceCount / distanceGoal), 24);
        
          var zoneCount = today.adjusted.activeZoneMinutes.total;
          var zoneGoal = goals.activeZoneMinutes.total;
          this.zoneBackground.style.opacity = Math.min(Math.max((zoneCount / zoneGoal), 0.1), 1);
          document.getElementById("zoneArc").sweepAngle = Math.min(24 * (zoneCount / zoneGoal), 24);
          }
      
        if (!this.settings.hideGoals) {}
        console.log("Goals Updated");
    }
}

export default Goals;