const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsTab.tsx', 'utf8');

// Insert import
if (!code.includes('import { LogoUploader }')) {
    code = code.replace('import { AssistantLogo } from "./AssistantLogo";', 'import { AssistantLogo } from "./AssistantLogo";\nimport { LogoUploader } from "./LogoUploader";');
}

// Find owner block end
const splitSearch = `            </div>
          </div>

          {/* Navigation Tabs Customization & Display Mode */}`;
const replacement = `            </div>
          </div>

          {/* Logo Upload Component */}
          <LogoUploader />

          {/* Navigation Tabs Customization & Display Mode */}`;

if (code.includes(splitSearch)) {
    code = code.replace(splitSearch, replacement);
    fs.writeFileSync('src/components/SettingsTab.tsx', code);
    console.log("Updated SettingsTab.tsx");
} else {
    console.log("Could not find insertion point!");
}
