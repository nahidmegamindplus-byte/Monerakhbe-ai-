const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(adminPath, 'utf8');

// Replace Root Backgrounds
content = content.replace(/min-h-screen bg-slate-950 text-slate-100/g, 'min-h-screen bg-slate-50 text-slate-900');
content = content.replace(/bg-slate-950 text-white/g, 'bg-slate-50 text-slate-900');
content = content.replace(/bg-slate-950/g, 'bg-slate-50');

// Replace Sidebar and Card Backgrounds
content = content.replace(/bg-slate-900\/80/g, 'bg-white/80');
content = content.replace(/bg-slate-900\/60/g, 'bg-white');
content = content.replace(/bg-slate-900/g, 'bg-white');

// Replace Borders
content = content.replace(/border-slate-800\/90/g, 'border-slate-200');
content = content.replace(/border-slate-800\/60/g, 'border-slate-200');
content = content.replace(/border-slate-800\/40/g, 'border-slate-200');
content = content.replace(/border-slate-800/g, 'border-slate-200');
content = content.replace(/border-slate-700\/60/g, 'border-slate-200');
content = content.replace(/border-slate-700/g, 'border-slate-300');

// Replace Dividers
content = content.replace(/divide-slate-800\/60/g, 'divide-slate-100');
content = content.replace(/divide-slate-800/g, 'divide-slate-100');

// Replace Sub-Card Backgrounds
content = content.replace(/bg-slate-800\/80/g, 'bg-slate-100');
content = content.replace(/bg-slate-800\/70/g, 'bg-slate-100');
content = content.replace(/bg-slate-800\/50/g, 'bg-slate-50');
content = content.replace(/bg-slate-800\/40/g, 'bg-slate-50');
content = content.replace(/bg-slate-800/g, 'bg-slate-100');

// Replace Text Colors for High Contrast Light Mode
content = content.replace(/text-slate-100/g, 'text-slate-900');
content = content.replace(/text-slate-200/g, 'text-slate-800');
content = content.replace(/text-slate-300/g, 'text-slate-700');
content = content.replace(/text-slate-400/g, 'text-slate-500');

// Fix specific text-white that should be dark vs inside buttons that should stay white
// Sidebar inactive buttons
content = content.replace(/text-slate-500 hover:text-slate-800 hover:bg-slate-100/g, 'text-slate-600 hover:text-slate-900 hover:bg-slate-100');

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Successfully transformed admin/page.tsx to Light Theme!');
