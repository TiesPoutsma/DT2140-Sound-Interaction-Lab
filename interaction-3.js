//==========================================================================================
// INTERACTION 3: the phone is shaken  ->  RAIN
//------------------------------------------------------------------------------------------
// Like a rain stick: shaking makes it rain, harder shaking makes heavier rain, and the rain
// keeps falling for a moment after you stop, fading out.
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

const dspName = "rain";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

rain.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        dspNode.setParamValue("/rain/density", 0); // no rain until the phone is shaken
    });


//==========================================================================================
// INTERACTIONS
//==========================================================================================

const STILL = 3;          // acceleration below this is hand tremor / sensor noise -> no rain
const HARD_SHAKE = 40;    // acceleration at which the rain is heaviest
const FADE = 0.97;        // per frame (~60 fps): how slowly the rain dies out after shaking
let shakeEnergy = 0;

function accelerationChange(accx, accy, accz) {
    // p5's acceleration has gravity removed: a phone held still reads ~0
    const strength = Math.sqrt(accx * accx + accy * accy + accz * accz);
    // follow the shake immediately when it gets stronger, fade out slowly when it stops
    shakeEnergy = Math.max(shakeEnergy * FADE, strength);
    playAudio(shakeEnergy);
}

function rotationChange(rotx, roty, rotz) {
}

function mousePressed() {
    shakeEnergy = HARD_SHAKE;
    // Use this for debugging from the desktop! (one click = one hard shake)
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

// Set the rain density (0-1000 drops) from the shake energy
function playAudio(energy) {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    const density = energy < STILL ? 0 : constrain(map(energy, STILL, HARD_SHAKE, 30, 1000), 0, 1000);
    dspNode.setParamValue("/rain/density", density);
}

//==========================================================================================
// END
//==========================================================================================
