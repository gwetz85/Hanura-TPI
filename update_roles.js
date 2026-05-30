const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Special cases for Accounts and Events
      if (
        fullPath.includes(path.join('api', 'dpc', 'accounts')) ||
        fullPath.includes(path.join('api', 'events')) ||
        fullPath.includes(path.join('dpc', 'events', 'page.tsx')) ||
        fullPath.includes(path.join('dpc', 'accounts', 'page.tsx'))
      ) {
        if (content.includes('!== "DPC"')) {
          content = content.replace(/!== "DPC"/g, '!== "ADMIN"');
          changed = true;
        }
      } else {
        // General cases
        if (content.includes('session.user?.role !== "DPC"')) {
          content = content.replace(/session\.user\?\.role !== "DPC"/g, '!["DPC", "ADMIN"].includes(session.user?.role as string)');
          changed = true;
        }
        if (content.includes('session.user.role !== "DPC"')) {
          content = content.replace(/session\.user\.role !== "DPC"/g, '!["DPC", "ADMIN"].includes(session.user.role as string)');
          changed = true;
        }
        if (content.includes('token?.role !== "DPC"')) {
          content = content.replace(/token\?\.role !== "DPC"/g, '!["DPC", "ADMIN"].includes(token?.role as string)');
          changed = true;
        }
        if (content.includes('token?.role === "DPC"')) {
          content = content.replace(/token\?\.role === "DPC"/g, '["DPC", "ADMIN"].includes(token?.role as string)');
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated', fullPath);
      }
    }
  }
}

processDir(path.join(process.cwd(), 'src'));
