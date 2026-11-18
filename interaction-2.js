//==========================================================================================
// INTERACTION 2: the phone is spun while lying on a flat surface  ->  ENGINE
//------------------------------------------------------------------------------------------
// Spin the phone on the table: the engine starts, and the faster it spins, the faster the
// engine runs. When the spin slows down and stops, the engine winds down too.
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

const dspName = "engine";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

engine.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // Start-up / wind-down time of the engine in seconds (default 5 s is too slow to feel connected)
        dspNode.setParamValue("/engine/runtime", 0.5);
    });


//==========================================================================================
// INTERACTIONS
//==========================================================================================

const MIN_SPIN = 40;      // deg/s: slower than this counts as "not spinning"
const MAX_SPIN = 720;     // deg/s (two turns per second): engine at full speed
const FLAT_LIMIT = 25;    // degrees: phone must lie roughly flat for the spin to count
let prevHeading = null;
let prevTime = 0;
let spinSpeed = 0;        // smoothed spin speed in deg/s

function accelerationChange(accx, accy, accz) {
}

function rotationChange(rotx, roty, rotz) {
    // rotz = heading (alpha, 0-360) = rotation around the axis pointing out of the screen
    const now = millis();
    if (prevHeading !== null && now > prevTime) {
        // shortest difference, so that going from 359 to 1 degrees counts as +2, not -358
        const delta = ((rotz - prevHeading + 540) % 360) - 180;
        const speed = Math.abs(delta) / ((now - prevTime) / 1000);
        spinSpeed = 0.85 * spinSpeed + 0.15 * speed; // smoothing against sensor noise
    }
    prevHeading = rotz;
    prevTime = now;

    const lyingFlat = Math.abs(rotx) < FLAT_LIMIT && Math.abs(roty) < FLAT_LIMIT;
    if (lyingFlat && spinSpeed > MIN_SPIN) {
        playAudio(constrain(map(spinSpeed, MIN_SPIN, MAX_SPIN, 0.15, 1), 0.15, 1));
    } else {
        stopAudio();
    }
}

function mousePressed() {
    playAudio(0.5)
    // Use this for debugging from the desktop! (hold the mouse button down)
}

function mouseReleased() {
    stopAudio();
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

// Run the engine at a speed between 0 and 1
function playAudio(speed) {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    dspNode.setParamValue("/engine/maxSpeed", speed);
    dspNode.setParamValue("/engine/gate", 1);
}

// Let the engine wind down
function stopAudio() {
    if (!dspNode) {
        return;
    }
    dspNode.setParamValue("/engine/gate", 0);
}

//==========================================================================================
// END
//==========================================================================================
