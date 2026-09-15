const fs = require('fs');
let code = fs.readFileSync('src/components/PublicPortal.tsx', 'utf8');

// Add Sun/Moon imports
code = code.replace('LogOut, Check', 'LogOut, Check, Sun, Moon');

// State for theme
const stateInsertion = `  const [copiedId, setCopiedId] = useState<string | null>(null);\n  const [isDarkMode, setIsDarkMode] = useState(true);\n  useEffect(() => {\n    if (isDarkMode) document.documentElement.classList.add("dark");\n    else document.documentElement.classList.remove("dark");\n  }, [isDarkMode]);`;
code = code.replace('  const [copiedId, setCopiedId] = useState<string | null>(null);', stateInsertion);

// Button in Sidebar
const buttonSearch = `          <button onClick={onAdminLogin} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition text-sm text-sky-400">`;
const buttonReplace = `          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition text-sm text-zinc-500 dark:text-zinc-400">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>\n` + buttonSearch;
code = code.replace(buttonSearch, buttonReplace);

fs.writeFileSync('src/components/PublicPortal.tsx', code);
console.log("Added theme toggle");
