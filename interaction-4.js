//==========================================================================================
// INTERACTION 4 (optional): the phone free falls for more than 30 cm  ->  THUNDER
//------------------------------------------------------------------------------------------
// A drop alarm: if the phone falls more than ~30 cm, a thunder clap plays.
// Test it by dropping the phone onto a bed or a cushion!
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

const dspName = "tuono";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

tuono.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
    });


//==========================================================================================
// INTERACTIONS
//==========================================================================================

// In free fall the phone feels weightless: acceleration INCLUDING gravity drops to ~0 m/s2
// (resting it reads ~9.8). p5's accelerationX/Y/Z have gravity removed, so we read the raw
// sensor event instead.
const WEIGHTLESS = 3;     // m/s2: below this the phone is falling
// Falling 30 cm takes sqrt(2 * 0.30 m / 9.81 m/s2) = 0.247 s
const MIN_FALL_MS = 247;
let fallStart = null;
let alreadyTriggered = false;

window.addEventListener("devicemotion", (e) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x === null) {
        return;
    }
    const total = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    if (total < WEIGHTLESS) {
        if (fallStart === null) {
            fallStart = millis();
        }
        if (!alreadyTriggered && millis() - fallStart >= MIN_FALL_MS) {
            alreadyTriggered = true; // one thunder per fall
            playAudio();
        }
    } else {
        fallStart = null;         // caught / landed
        alreadyTriggered = false;
    }
});

function accelerationChange(accx, accy, accz) {
}

function rotationChange(rotx, roty, rotz) {
}

function mousePressed() {
    playAudio()
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

function playAudio() {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    dspNode.setParamValue("/thunder/rumble", 1)
    setTimeout(() => { dspNode.setParamValue("/thunder/rumble", 0) }, 100);
}

//==========================================================================================
// END
//==========================================================================================
