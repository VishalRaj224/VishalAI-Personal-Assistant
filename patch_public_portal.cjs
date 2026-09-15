const fs = require('fs');
let code = fs.readFileSync('src/components/PublicPortal.tsx', 'utf8');

// Inside handleSend, when the stream is fully read and text is complete, we can speak it if voice was used.
// Or just add a toggle for read aloud.

// Add readAloud function
const readAloud = `
  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Find a good voice
    const voices = window.speechSynthesis.getVoices();
    const goodVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Samantha")) || voices[0];
    if (goodVoice) utterance.voice = goodVoice;
    window.speechSynthesis.speak(utterance);
  };
`;

const importSplit = `  const copyToClipboard = (text: string, id: string) => {`;
code = code.replace(importSplit, readAloud + '\n' + importSplit);

const streamDoneSplit = `      await saveMessageToFirestore(currentConvId, { id: assistantMsgId, role: "model", text: fullText });`;
const streamDoneReplace = `      await saveMessageToFirestore(currentConvId, { id: assistantMsgId, role: "model", text: fullText });\n      if (isListening) speakText(fullText);`;
code = code.replace(streamDoneSplit, streamDoneReplace);

fs.writeFileSync('src/components/PublicPortal.tsx', code);
console.log("Patched PublicPortal for TTS");
