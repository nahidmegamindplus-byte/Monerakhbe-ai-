const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Fix Headers & General Titles
content = content.replace(/font-black tracking-tight text-white/g, 'font-black tracking-tight text-slate-900');
content = content.replace(/font-bold text-white/g, 'font-bold text-slate-900');
content = content.replace(/font-semibold text-white/g, 'font-semibold text-slate-900');
content = content.replace(/font-extrabold text-white/g, 'font-extrabold text-slate-900');
content = content.replace(/font-mono font-bold text-white/g, 'font-mono font-bold text-slate-900');
content = content.replace(/font-mono text-white/g, 'font-mono text-slate-900 font-bold');

// 2. Fix Inputs, Selects & Textareas
content = content.replace(/text-xs text-white focus:outline-none/g, 'text-xs text-slate-900 font-medium focus:outline-none');
content = content.replace(/text-sm text-white focus:outline-none/g, 'text-sm text-slate-900 font-medium focus:outline-none');
content = content.replace(/text-white focus:outline-none/g, 'text-slate-900 font-medium focus:outline-none');
content = content.replace(/bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700/g, 'bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium');
content = content.replace(/bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-white/g, 'bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 font-medium placeholder:text-slate-400');
content = content.replace(/bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-white/g, 'bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium placeholder:text-slate-400');
content = content.replace(/bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-white/g, 'bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium placeholder:text-slate-400');

// 3. Fix Table headers, cell text & avatar initial text
content = content.replace(/text-white font-bold text-xs/g, 'text-indigo-700 font-bold text-xs');
content = content.replace(/text-white font-black text-xs/g, 'text-rose-700 font-black text-xs');
content = content.replace(/thead className="bg-slate-50 text-slate-500/g, 'thead className="bg-slate-100 text-slate-700 font-bold');
content = content.replace(/text-white text-base/g, 'text-slate-900 text-base');
content = content.replace(/text-white text-sm/g, 'text-slate-900 text-sm');

// 4. Fix Faint Colors to Rich High-Contrast Colors
content = content.replace(/text-emerald-400/g, 'text-emerald-700 font-bold');
content = content.replace(/text-rose-400/g, 'text-rose-600 font-bold');
content = content.replace(/text-amber-400/g, 'text-amber-700 font-bold');
content = content.replace(/text-indigo-400/g, 'text-indigo-700 font-bold');
content = content.replace(/text-pink-400/g, 'text-pink-700 font-bold');
content = content.replace(/text-purple-400/g, 'text-purple-700 font-bold');
content = content.replace(/text-sky-400/g, 'text-sky-700 font-bold');

// 5. Fix Status Badges for Light Mode
content = content.replace(/bg-emerald-500\/20 text-emerald-300 border border-emerald-500\/30/g, 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold');
content = content.replace(/bg-rose-500\/20 text-rose-300 border border-rose-500\/30/g, 'bg-rose-100 text-rose-800 border border-rose-200 font-bold');
content = content.replace(/bg-amber-500\/20 text-amber-300 border border-amber-500\/30/g, 'bg-amber-100 text-amber-800 border border-amber-200 font-bold');
content = content.replace(/bg-purple-500\/20 text-purple-300 border border-purple-500\/30/g, 'bg-purple-100 text-purple-800 border border-purple-200 font-bold');
content = content.replace(/bg-purple-500\/20 text-purple-300/g, 'bg-purple-100 text-purple-800 border border-purple-200 font-bold');
content = content.replace(/bg-indigo-500\/20 text-indigo-300 border border-indigo-500\/30/g, 'bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold');

// 6. Fix Button Text (Buttons that should be text-white on solid backgrounds)
content = content.replace(/bg-rose-600 hover:bg-rose-500 text-slate-900/g, 'bg-rose-600 hover:bg-rose-500 text-white font-bold');
content = content.replace(/bg-indigo-600 hover:bg-indigo-500 text-slate-900/g, 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold');
content = content.replace(/bg-emerald-600 hover:bg-emerald-500 text-slate-900/g, 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold');
content = content.replace(/bg-purple-600 hover:bg-purple-500 text-slate-900/g, 'bg-purple-600 hover:bg-purple-500 text-white font-bold');
content = content.replace(/bg-rose-500 text-slate-900/g, 'bg-rose-500 text-white font-bold');

// 7. Fix Top Sticky Header and Brand Text
content = content.replace(/hover:text-white/g, 'hover:text-slate-900');
content = content.replace(/bg-slate-100 hover:bg-slate-700 text-slate-700 hover:text-slate-900/g, 'bg-slate-100 hover:bg-slate-200 text-slate-800');

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Successfully fixed all text contrast & visibility in Admin Panel!');
