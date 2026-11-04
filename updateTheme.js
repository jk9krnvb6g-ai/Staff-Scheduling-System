import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'src');

const replacements = [
  // Core dark backgrounds to light/dark
  { match: /bg-\[#0f172a\]/g, replace: 'bg-slate-50 dark:bg-slate-900' },
  { match: /bg-\[#1e293b\]/g, replace: 'bg-white dark:bg-slate-800' },
  
  // Modals light backgrounds to light/dark
  { match: /bg-\[#f8fafc\]/g, replace: 'bg-slate-50 dark:bg-slate-900' },
  { match: /bg-\[#f1f5f9\]/g, replace: 'bg-slate-100 dark:bg-slate-800' },
  { match: /bg-white(?!(\/| dark))/g, replace: 'bg-white dark:bg-slate-800' },

  // Secondary backgrounds / hovers
  { match: /bg-\[#334155\]\/50/g, replace: 'bg-slate-100 dark:bg-slate-700/50' },
  { match: /hover:bg-\[#334155\]\/50/g, replace: 'hover:bg-slate-100 dark:hover:bg-slate-700/50' },
  { match: /hover:bg-\[#334155\]/g, replace: 'hover:bg-slate-100 dark:hover:bg-slate-700' },
  { match: /hover:bg-\[#1e293b\]/g, replace: 'hover:bg-slate-100 dark:hover:bg-slate-800' },
  { match: /bg-\[#334155\]/g, replace: 'bg-slate-200 dark:bg-slate-700' },
  
  { match: /hover:bg-gray-50/g, replace: 'hover:bg-slate-100 dark:hover:bg-slate-700' },

  // Borders
  { match: /border-\[#334155\]/g, replace: 'border-slate-200 dark:border-slate-700' },
  { match: /border-\[#e2e8f0\]/g, replace: 'border-slate-200 dark:border-slate-700' },
  { match: /border-\[#cbd5e1\]/g, replace: 'border-slate-300 dark:border-slate-600' },

  // Text colors
  { match: /text-\[#f8fafc\]/g, replace: 'text-slate-900 dark:text-slate-50' },
  { match: /text-\[#334155\]/g, replace: 'text-slate-800 dark:text-slate-200' },
  { match: /text-\[#1e293b\]/g, replace: 'text-slate-900 dark:text-slate-100' },
  { match: /text-\[#94a3b8\]/g, replace: 'text-slate-500 dark:text-slate-400' },
  { match: /text-\[#64748b\]/g, replace: 'text-slate-500 dark:text-slate-400' },
  { match: /text-[#475569]/g, replace: 'text-slate-600 dark:text-slate-300' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      for (const { match, replace } of replacements) {
        content = content.replace(match, replace);
      }
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(dir);
console.log('Theme conversion complete.');
