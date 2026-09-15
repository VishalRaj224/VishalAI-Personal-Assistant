const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

code = code.replace('export default defineConfig(() => {', 'export default defineConfig({');
code = code.replace('return {', '');
code = code.replace('};});', '});');
code = code.replace('plugins: [', 'build: { outDir: "dist" },\n    plugins: [');

fs.writeFileSync('vite.config.ts', code);
console.log("Patched vite config");
