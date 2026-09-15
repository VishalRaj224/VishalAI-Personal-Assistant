const fs = require('fs');

function replaceVrLogo(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    // Replace imports
    code = code.replace(/import { VrLogo } from "\.\/VrLogo";/g, 'import { AssistantLogo } from "./AssistantLogo";');
    
    // Replace usages
    code = code.replace(/<VrLogo /g, '<AssistantLogo ');
    
    fs.writeFileSync(file, code);
    console.log(`Updated ${file}`);
}

['src/components/SettingsTab.tsx', 'src/components/Navbar.tsx', 'src/components/DeployHubTab.tsx', 'src/components/PublicPortal.tsx'].forEach(replaceVrLogo);
