const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // If there's no Link import, add it after the last import or at the top
  if (!content.includes('import Link from "next/link";')) {
    const importMatch = content.match(/^import .*$/m);
    if (importMatch) {
      content = content.replace(/^import .*$/m, `${importMatch[0]}\nimport Link from "next/link";`);
      changed = true;
    } else {
      content = 'import Link from "next/link";\n' + content;
      changed = true;
    }
  }

  // Replace <a href="/dpc"...>...</a> or <a href="/pac"...>...</a> with <Link>
  const regex = /<a\s+href="(\/dpc|\/pac|{backHref})"[^>]*>.*?<\/a>/g;
  content = content.replace(regex, (match) => {
    changed = true;
    return match.replace(/^<a\s+/, '<Link ').replace(/<\/a>$/, '</Link>');
  });

  const regex2 = /<a\s+href=\{isDpc \? "\/dpc" : "\/pac"\}[^>]*>.*?<\/a>/g;
  content = content.replace(regex2, (match) => {
    changed = true;
    return match.replace(/^<a\s+/, '<Link ').replace(/<\/a>$/, '</Link>');
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const files = [
  "src/app/activity/[id]/page.tsx",
  "src/app/dpc/accounts/AccountsManagerClient.tsx",
  "src/app/dpc/activity/ActivityManagerClient.tsx",
  "src/app/dpc/events/EventsManagerClient.tsx",
  "src/app/dpc/kta/KtaManagerClient.tsx",
  "src/app/dpc/members/MembersManagerClient.tsx",
  "src/app/dpc/surat/SuratClient.tsx",
  "src/app/kepengurusan/BoardClient.tsx",
  "src/app/pac/activity/page.tsx",
  "src/app/pac/kta/page.tsx",
  "src/app/pac/members/page.tsx"
];

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    replaceInFile(fullPath);
  }
});
