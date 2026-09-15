const fs = require('fs');
let code = fs.readFileSync('src/components/PublicPortal.tsx', 'utf8');

// replace the import from ../lib/firebase
code = code.replace('loginWithGoogle, signInAnonymously, onAuthStateChanged', 'loginWithGoogle, onAuthStateChanged');

// add direct import from firebase/auth
const importSplit = `import { auth, googleProvider, loginWithGoogle, onAuthStateChanged, logoutUser, db } from "../lib/firebase";`;
code = code.replace(importSplit, `import { signInAnonymously } from "firebase/auth";\n` + importSplit);

fs.writeFileSync('src/components/PublicPortal.tsx', code);
console.log("Fixed import");
