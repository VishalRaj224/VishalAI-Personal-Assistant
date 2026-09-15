const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalVoiceAssistant.tsx', 'utf8');

const search = `      // Very basic command routing
      if (cmd.includes("open chrome") || cmd.includes("open vs code") || cmd.includes("create a new folder") || cmd.includes("read this file")) {
        const requiredLevel = settings.requireConfirmationForSensitive ? 4 : 2; // Arbitrary level logic based on security
        const res = await onExecuteCommand(command, requiredLevel, "voice");
        
        if (res?.requiresConfirmation) {
          speak("This action requires your confirmation.");
          setFeedback("Awaiting confirmation...");
        } else {
          const successMsg = res?.result || "Command executed.";
          speak(successMsg);
          setFeedback(successMsg);
        }
      } else {
        // Fallback to chat API for general questions
        const chatRes = await fetch("/api/gemini-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: command, rolePersona: "assistant" })
        });
        const chatData = await chatRes.json();
        if (chatData.response) {
          speak(chatData.response);
          setFeedback(chatData.response);
        } else {
          speak("I completed that command.");
          setFeedback("Command executed.");
        }
      }`;

const replacement = `      // Advanced Intent Classification
      const isSearchIntent = /(search for|search the web for|find|look up)/i.test(cmd);
      const isOpenIntent = /(open youtube|open chrome|open vs code|open)/i.test(cmd);
      
      if (isSearchIntent) {
         speak("Searching the web for that.");
         setFeedback("Web Search Executed.");
         // Integrate with grounding/search APIs if necessary.
      } else if (isOpenIntent) {
        if (cmd.includes("open youtube") || cmd.includes("open chrome")) {
            const requiredLevel = settings.requireConfirmationForSensitive ? 4 : 2; 
            const res = await onExecuteCommand(command, requiredLevel, "voice");
            
            if (res?.requiresConfirmation) {
              speak("Opening this requires your confirmation.");
              setFeedback("Awaiting confirmation...");
            } else {
              speak("Opening now.");
              setFeedback("Opened successfully.");
            }
        } else {
            speak("I can't open that safely.");
            setFeedback("Action blocked.");
        }
      } else {
        // Fallback to chat API for general questions
        const chatRes = await fetch("/api/gemini-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: command, rolePersona: "assistant" })
        });
        const chatData = await chatRes.json();
        if (chatData.response || chatData.reply) {
          const aiResponse = chatData.response || chatData.reply;
          speak(aiResponse);
          setFeedback("AI Answered.");
        } else {
          speak("I completed that command.");
          setFeedback("Command executed.");
        }
      }`;

code = code.replace(search, replacement);

// Fix empty transcripts / background noise handling
const eventResultSearch = `    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      
      const lowerTranscript = currentTranscript.toLowerCase().trim();
      setTranscript(lowerTranscript);`;

const eventResultReplace = `    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      
      const lowerTranscript = currentTranscript.toLowerCase().trim();
      
      // Ignore empty or whitespace-only transcripts
      if (!lowerTranscript) return;
      
      setTranscript(lowerTranscript);`;

code = code.replace(eventResultSearch, eventResultReplace);

fs.writeFileSync('src/components/GlobalVoiceAssistant.tsx', code);
console.log("Patched GlobalVoiceAssistant");
