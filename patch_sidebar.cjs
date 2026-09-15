const fs = require('fs');
let code = fs.readFileSync('src/components/PublicPortal.tsx', 'utf8');

const searchStr = `  const [sidebarOpen, setSidebarOpen] = useState(true);`;
const replaceStr = `  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== "undefined" ? window.innerWidth > 768 : true);`;

code = code.replace(searchStr, replaceStr);

fs.writeFileSync('src/components/PublicPortal.tsx', code);
console.log("Patched sidebar responsive");
