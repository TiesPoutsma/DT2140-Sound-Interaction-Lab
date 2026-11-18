//==========================================================================================
// INTERACTION 1: the phone is used as a spirit level  ->  BUBBLES
//------------------------------------------------------------------------------------------
// Lay the phone on a surface. The more the surface is tilted, the faster (and slightly higher)
// the bubbles. When the surface is level, it goes silent: you can find "level" by ear.
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

const dspName = "bubble";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

bubble.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // The bubble model plays one bubble when it starts: keep it muted until the first real drop
        dspNode.setParamValue("/bubble/bubble/volume", 0);
    });


//==========================================================================================
// INTERACTIONS
//==========================================================================================

const LEVEL_TOLERANCE = 1;     // degrees of tilt that still count as "level" (silence)
const MAX_TILT = 20;           // degrees: at this tilt (or more) the bubbles are fastest
const SLOWEST_INTERVAL = 700;  // ms between bubbles when just off level
const FASTEST_INTERVAL = 70;   // ms between bubbles at MAX_TILT
let lastBubble = 0;

function accelerationChange(accx, accy, accz) {
}

function rotationChange(rotx, roty, rotz) {
    // rotx = front/back tilt (beta), roty = left/right tilt (gamma). Lying flat, both are ~0.
    const tilt = Math.sqrt(rotx * rotx + roty * roty);
    if (tilt < LEVEL_TOLERANCE) {
        return; // level: silence
    }
    const amount = constrain((tilt - LEVEL_TOLERANCE) / (MAX_TILT - LEVEL_TOLERANCE), 0, 1);
    const interval = lerp(SLOWEST_INTERVAL, FASTEST_INTERVAL, amount);
    if (millis() - lastBubble > interval) {
        lastBubble = millis();
        playAudio(lerp(400, 1200, amount)); // more tilt -> higher bubble
    }
}

function mousePressed() {
    playAudio(600)
    // Use this for debugging from the desktop!
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}
function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
}

function getMinMaxParam(address) {
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
}

//==========================================================================================
// AUDIO INTERACTION
//==========================================================================================

// One bubble at the given frequency (Hz, 150-2000)
function playAudio(freq) {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    dspNode.setParamValue("/bubble/bubble/volume", 0.7);
    dspNode.setParamValue("/bubble/bubble/freq", freq);
    dspNode.setParamValue("/bubble/drop", 1);
    setTimeout(() => { dspNode.setParamValue("/bubble/drop", 0) }, 30);
}

//==========================================================================================
// END
//==========================================================================================
