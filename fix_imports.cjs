const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalVoiceAssistant.tsx', 'utf8');

// The injected code started with:
// import { useEffect, useRef, useState as useState2 } from "react";
// Let's remove that line.

code = code.replace('import { useEffect, useRef, useState as useState2 } from "react";', '');
fs.writeFileSync('src/components/GlobalVoiceAssistant.tsx', code);
console.log("Fixed imports");
