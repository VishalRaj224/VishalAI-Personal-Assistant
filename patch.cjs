const fs = require('fs');
let code = fs.readFileSync('src/components/LiveVoiceModal.tsx', 'utf8');
const startTag = '{/* Core Orb */}';
const endTag = '</div>';
const startIndex = code.indexOf(startTag);
if (startIndex !== -1) {
    const orbStartIndex = code.indexOf('<div', startIndex);
    let openDivs = 0;
    let endIndex = -1;
    for (let i = orbStartIndex; i < code.length; i++) {
        if (code.slice(i, i+4) === '<div') openDivs++;
        if (code.slice(i, i+5) === '</div') openDivs--;
        if (openDivs === 0) {
            endIndex = i + 6;
            break;
        }
    }
    if (endIndex !== -1) {
        code = code.slice(0, startIndex) + '{/* Core Orb */}\n          <AssistantLogo \n            size={128} \n            state={!isConnected ? "idle" : isTalking ? "speaking" : isMuted ? "idle" : "listening"} \n          />\n' + code.slice(endIndex);
        fs.writeFileSync('src/components/LiveVoiceModal.tsx', code);
        console.log("Patched successfully");
    }
}
