const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && (entry.name === 'route.ts' || entry.name === 'route.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('export const dynamic')) {
        console.log(`Adding dynamic to: ${fullPath}`);
        // Insert after imports
        const lines = content.split('\n');
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            lastImportIndex = i;
          }
        }
        if (lastImportIndex !== -1) {
          lines.splice(lastImportIndex + 1, 0, '\nexport const dynamic = "force-dynamic";');
        } else {
          lines.unshift('export const dynamic = "force-dynamic";\n');
        }
        fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
      }
    }
  }
}

const apiDir = path.resolve(__dirname, '../src/app/api');
processDir(apiDir);
console.log('All API routes verified for dynamic export.');
