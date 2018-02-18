import clock from "clock";
import document from "document";
import userActivity from "user-activity";
import { HeartRateSensor } from "heart-rate";
import { locale } from "user-settings";
import { preferences } from "user-settings";
import * as messaging from "messaging";
import * as fs from "fs";
import * as util from "../common/utils";

//Define screen change stuff
let MainScreen = document.getElementById("MainScreen");
let GraphScreen= document.getElementById("GraphScreen");
let button1 = document.getElementById("button1");
let button2 = document.getElementById("button2");

// Update the clock every minute
clock.granularity = "seconds";
const clockPref = preferences.clockDisplay;
let lastValueTimestamp = Date.now();

try {
  let stats = fs.statSync("theme.txt");
  let json_themeread = fs.readFileSync("theme.txt", "json");
} catch (err) {
  let json_theme = {"backg": "#f8fcf8", "foreg": "#707070"};
  fs.writeFileSync("theme.txt", json_theme, "json");
  let json_themeread = fs.readFileSync("theme.txt", "json");
}

let backgdcol = json_themeread.backg || "#f8fcf8";
let foregdcol = json_themeread.foreg || "#707070";

// Get Goals to reach
const distanceGoal = userActivity.goals.distance;
const caloriesGoal = userActivity.goals["calories"];
const stepsGoal = userActivity.goals.steps;
const elevationGoal = userActivity.goals.elevationGain;
const activeGoal = userActivity.goals.activeMinutes;

// Get a handle on the <text> element
let myClock = document.getElementById("myLabel");
let myDate = document.getElementById("myDate");
//Inserted for main screen CGM Data
let myCurrentBG = document.getElementById("myCurrentBG");
let myBGUnits = document.getElementById("myBGUnits");
let myBGUpdateArc = document.getElementById("myBGUpdateArc");
let myBGUpdateArcBackground = document.getElementById("myBGUpdateArcBackground");
let myMissedBGPollCounter = document.getElementById("myMissedBGPollCounter");
let myBGTrendBackground = document.getElementById("myBGTrendBackground");
let myBGTrendPointer = document.getElementById("myBGTrendPointer");
var bgCount = 24;
var points = [220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220];
let bgType=true;
//Normal Flashring handles below.
let dailysteps = document.getElementById("mySteps");
let dailystairs = document.getElementById("myStairs");
let dailycals = document.getElementById("myCals");
let dailymins = document.getElementById("myMins");
let currentheart = document.getElementById("myHR");
let heartRing = document.getElementById("hrtArc");
let stepRing = document.getElementById("stepsArc");
let calRing = document.getElementById("calsArc");
let heart = document.getElementById("myHR");
let otherData = document.getElementById("otherData");
let upperLine = document.getElementById("upperLine");
let bottomLine = document.getElementById("bottomLine");

function applyTheme(background, foreground) {
  //Add Theme settings for Main screen BG color, and anything else we add as customizable.
  myClock.style.fill = background;
  dailysteps.style.fill = background;
  dailystairs.style.fill = background;
  dailycals.style.fill = background;
  dailymins.style.fill = background;
  heart.style.fill = background;
  myDate.style.fill = foreground;
  upperLine.style.fill = foreground;
  bottomLine.style.fill = foreground;
}

//functions for screen switching
function showMainScreen() {
  console.log("Show main screen");
  MainScreen.style.display = "inline";
  GraphScreen.style.display = "none";
}

function showGraphScreen() {
  console.log("Show graph screen");
  MainScreen.style.display = "none";
  GraphScreen.style.display = "inline";
}

button1.onclick = function() {
  showGraphScreen();
}

button2.onclick = function () {
  showMainScreen();
}

function updateStats() {
  const metricSteps = "steps";  // distance, calories, elevationGain, activeMinutes
  const amountSteps = userActivity.today.adjusted[metricSteps] || 0;
  const metricCals = "calories";  // distance, calories, elevationGain, activeMinutes
  const amountCals = userActivity.today.adjusted[metricCals] || 0;
  const metricActive = "activeMinutes";
  const amountActive = userActivity.today.adjusted[metricActive] || 0;
  const metricElevation = "elevationGain";
  const amountElevation = userActivity.today.adjusted[metricElevation] || 0
  dailystairs.text = amountElevation;
  dailymins.text = amountActive;
  let stepString = util.thsdDot(amountSteps);
  let calString = util.thsdDot(amountCals);
  dailysteps.text = stepString;
  let stepAngle = Math.floor(360*(amountSteps/stepsGoal));
  if ( stepAngle > 360 ) {
    stepAngle = 360;
    stepRing.fill="#58e078";
  }
  stepRing.sweepAngle = stepAngle;
  dailycals.text = calString;
  let calAngle = Math.floor(360*(amountCals/caloriesGoal));
  if ( calAngle > 360 ) {
    calAngle = 360;
    calRing.fill="#58e078";
  }
  calRing.sweepAngle = calAngle;
}


var hrm = new HeartRateSensor();

hrm.onreading = function () {
  currentheart.text = ( hrm.heartRate > 0 ) ? hrm.heartRate : "--";
  lastValueTimestamp = Date.now();
  let heartAngle = Math.floor(360*((hrm.heartRate-30)/170)); //heartrate lower than 30 should not occur and 200 schould be enough anyway
  if ( heartAngle > 360 ) {
    heartAngle = 360;
  } else if ( heartAngle < 0 ) {
    heartAngle = 0;
  }
  heartRing.sweepAngle = heartAngle;
}
hrm.start();

// Update the <text> element with the current time
function updateClock() {
  let lang = locale.language;
  let today = new Date();
  let day = util.zeroPad(today.getDate());
  let wday = today.getDay();
  let month = util.zeroPad(today.getMonth()+1);
  let year = today.getFullYear();
  let hours = util.zeroPad(util.formatHour(today.getHours(), clockPref));
  let mins = util.zeroPad(today.getMinutes());
  let prefix = lang.substring(0,2);
  if ( typeof util.weekday[prefix] === 'undefined' ) {
    prefix = 'en';
  }
  let divide = "/";
  if ( prefix == 'de' ) {
    divide = ".";
  } else if ( prefix == "nl" || prefix == "ko") {
    divide = "-"
  }
  let datestring = day + divide + month + divide + year;
  if ( lang == "en-US" ) {
    datestring = month + divide + day + divide + year;
  } else if ( prefix == "zh" || prefix == "ja" || prefix == "ko") {
    datestring = year + divide + month + divide + day;
  }
  myClock.text = `${hours}:${mins}`;
  myDate.text = `${util.weekday[prefix][wday]}, ${datestring}`;

  updateStats();
  //updateBGStats();
  if ( (Date.now() - lastValueTimestamp)/1000 > 5 ) {
    currentheart.text = "--";
    heartRing.sweepAngle = 0;
  }
}


function updateBGStats(bgValue, units, pollcounter, trend) {
  /* Stuff my BG info update stuff here, I know it may have to move but good for layout know
  Also, my JS sucks, ;)  people welcome to refactor.
  BG Text comes from API call, as does BGUnits.  MissedBGPollCounter is a calculation based on the timestamp of last-good poll as indicated from the API call.  For ease at this point I suggest assuming the clock on the data source and the watch are in sync.
  Not sure if myCurrentBGTrend - currently static "FortyFiceUp" and lastGoodPollTimestamp should be passed into this function or not.. */
   myCurrentBG.text = bgValue;
   myBGUnits.text = units;
   myMissedBGPollCounter.text = pollcounter;
   updateBGTrend(trend);
   //updateBGPollingStatus(lastGoodPollTimestamp);
}

//Define a function to set the right display on the trend arc, this is just brain dump, not clean code yet.
function updateBGTrend(Trend) {
  if (Trend === "DoubleUp") {
    myBGTrendBackground.fill="#FF0000";
    myBGTrendPointer.startAngle = 0;
  } else if (Trend === "SingleUp") {
    myBGTrendBackground.fill="#FFFF00";
    myBGTrendPointer.startAngle = 0;
  } else if (Trend === "FortyFiveUp") {
    myBGTrendBackground.fill="#008000";
    myBGTrendPointer.startAngle = 41;
  } else if (Trend === "Flat") {
    myBGTrendBackground.fill="#008000";
    myBGTrendPointer.startAngle = 86;
  } else if (Trend === "FourtyFiveDown") {
    myBGTrendBackground.fill="#008000";
    myBGTrendPointer.startAngle = 131;
  } else if (Trend === "SingleDown") {
    myBGTrendBackground.fill="#FFFF00";
    myBGTrendPointer.startAngle = 172;
  } else if (Trend === "DoubleDown") {
    myBGTrendBackground.fill="#FF0000";
    myBGTrendPointer.startAngle = 172;
  }

}

function updateBGPollingStatus() {
  /* Ok, we should be passed the timestamp of the last polled datapoint.
  There may be issues if we are grabbing data from nightscout rather than the paired phone but
  it should really be at most a minute out in a scenario like parent has watch and following child
  with their phone updating nightscout.
  */
  //This angle updates in 72 degree increments per minute to fill ring in 5 min.
  myBGUpdateArc.sweepAngle = 72;

  //myBGUpdateArc.fill should be green for the first minute, yellow for the second, red for the third or more (leave it a solid red ring after 3 min and indicate numerically in the middle of the ring how many poll windows have been missed.)
  myBGUpdateArc.fill = "#7CFC00";
  //myBGUpdateArcBackground.fill should be grey for the first minute, green for the second, yellow for the third then just red or set sweep angle to 0
  myBGUpdateArcBackground.fill = "#333344";
  //I wonder if we should just calculate this based on 5 minute increments from last good poll or of we can find this as a value readable in the XDrip or Nightscout API endpoints?
  myMissedBGPollCounter = 0;
}
// Update the clock every tick event
clock.ontick = () => updateClock();

// Don't start with a blank screen
applyTheme(backgdcol, foregdcol);
updateClock();
messaging.peerSocket.onopen = () => {
  console.log("App Socket Open");
}

messaging.peerSocket.close = () => {
  console.log("App Socket Closed");
}

function mmol( bg ) {
    let mmolBG = Math.round( (0.0555 * bg) * 10 ) / 10;
  return mmolBG;
}

function updategraph(graphPoint){
  let graphPoints = document.getElementsByClassName('graph-point');
  console.log('updategraph')
  console.log(JSON.stringify(graphPoint))
  if(bgType) {
    graphData.text = graphPoint;
  } else {
    graphData.text = mmol(graphPoint);
  }
  points.push(graphPoint)

  graphPoints[0].cy = (200 - points[24]) - 5;
  graphPoints[1].cy = (200 - points[23]) - 5;
  graphPoints[2].cy = (200 - points[22]) - 5;
  graphPoints[3].cy = (200 - points[21]) - 5;
  graphPoints[4].cy = (200 - points[20]) - 5;
  graphPoints[5].cy = (200 - points[19]) - 5;
  graphPoints[6].cy = (200 - points[18]) - 5;
  graphPoints[7].cy = (200 - points[17]) - 5;
  graphPoints[8].cy = (200 - points[16]) - 5;
  graphPoints[9].cy = (200 - points[15]) - 5;
  graphPoints[10].cy = (200 - points[14]) - 5;
  graphPoints[11].cy = (200 - points[13]) - 5;
  graphPoints[12].cy = (200 - points[12]) - 5;
  graphPoints[13].cy = (200 - points[11]) - 5;
  graphPoints[14].cy = (200 - points[10]) - 5;
  graphPoints[15].cy = (200 - points[9]) - 5;
  graphPoints[16].cy = (200 - points[8]) - 5;
  graphPoints[17].cy = (200 - points[7]) - 5;
  graphPoints[18].cy = (200 - points[6]) - 5;
  graphPoints[19].cy = (200 - points[5]) - 5;
  graphPoints[20].cy = (200 - points[4]) - 5;
  graphPoints[21].cy = (200 - points[3]) - 5;
  graphPoints[22].cy = (200 - points[2]) - 5;
  graphPoints[23].cy = (200 - points[1]) - 5;
  graphPoints[24].cy = (200 - points[0]) - 5;


  console.log(JSON.stringify(points))
  points.shift()
  totalSeconds = 0;
  //removed Rytiggy polling timer function, something needs to go back in.

}


// Listen for the onmessage event
/*
Alright, need to update message handling to look for incoming BG info from the companion as well as send back current steps and heartrate.
Wondering if HR and Steps should be triggered by updateClock() or by activity in updateBGStats().
*/
messaging.peerSocket.onmessage = function(evt) {
  console.log("device got: " + evt.data);
  applyTheme(evt.data.background, evt.data.foreground);
  let json_theme = {"backg": evt.data.background, "foreg": evt.data.foreground};
  fs.writeFileSync("theme.txt", json_theme, "json");
  try { bgType = JSON.parse(evt.data).type; } catch(error) { console.log(error); }
  updategraph(evt.data[evt.data.type]);
  if(bgType) {
    updateBGStats(points[24], "mg", 0, evt.data[evt.data.direction])
  } else {
    updateBGStats(mmol(points[24]), "mmol", 0, evt.data[evt.data.direction])
  }

}
