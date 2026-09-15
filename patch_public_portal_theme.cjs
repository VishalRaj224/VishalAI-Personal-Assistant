const fs = require('fs');
let code = fs.readFileSync('src/components/PublicPortal.tsx', 'utf8');

// Replace hardcoded dark mode colors with responsive ones
const replacements = [
  { search: 'bg-[#212121]', replace: 'bg-zinc-50 dark:bg-[#212121]' },
  { search: 'text-zinc-200', replace: 'text-zinc-900 dark:text-zinc-200' },
  { search: 'bg-[#171717]', replace: 'bg-zinc-100 dark:bg-[#171717]' },
  { search: 'text-zinc-400', replace: 'text-zinc-500 dark:text-zinc-400' },
  { search: 'bg-zinc-800', replace: 'bg-zinc-200 dark:bg-zinc-800' },
  { search: 'border-zinc-800', replace: 'border-zinc-300 dark:border-zinc-800' },
  { search: 'border-zinc-700', replace: 'border-zinc-300 dark:border-zinc-700' },
  { search: 'text-zinc-500', replace: 'text-zinc-500 dark:text-zinc-500' },
  { search: 'bg-[#2f2f2f]', replace: 'bg-white dark:bg-[#2f2f2f]' },
  { search: 'text-zinc-100', replace: 'text-zinc-900 dark:text-zinc-100' },
  { search: 'bg-zinc-100', replace: 'bg-zinc-900 dark:bg-zinc-100' },
  { search: 'text-zinc-900', replace: 'text-white dark:text-zinc-900' },
  { search: 'hover:bg-zinc-800', replace: 'hover:bg-zinc-200 dark:hover:bg-zinc-800' },
  { search: 'hover:bg-zinc-700', replace: 'hover:bg-zinc-300 dark:hover:bg-zinc-700' },
  { search: 'from-[#212121]', replace: 'from-zinc-50 dark:from-[#212121]' },
  { search: 'via-[#212121]', replace: 'via-zinc-50 dark:via-[#212121]' },
  { search: 'text-zinc-300', replace: 'text-zinc-700 dark:text-zinc-300' },
];

for (const r of replacements) {
    code = code.split(r.search).join(r.replace);
}

fs.writeFileSync('src/components/PublicPortal.tsx', code);
console.log("Patched PublicPortal for dark/light mode");
