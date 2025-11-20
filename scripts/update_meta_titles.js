const fs = require('fs').promises;
const path = require('path');

async function walk(dir) {
  let files = await fs.readdir(dir, { withFileTypes: true });
  let result = [];
  for (let file of files) {
    const res = path.resolve(dir, file.name);
    if (file.isDirectory()) {
      result = result.concat(await walk(res));
    } else if (file.isFile() && res.endsWith('.html')) {
      result.push(res);
    }
  }
  return result;
}

function computeMetaTitle(fullTitle) {
  if (!fullTitle) return 'Los Sartenes-Los Sartenes';
  // Remove any trailing "| Los Sartenes..." or "- Los Sartenes..."
  let t = fullTitle.replace(/\|\s*Los Sartenes.*$/i, '');
  t = t.replace(/-\s*Los Sartenes.*$/i, '');
  // Remove occurrences of "Los Sartenes" anywhere
  t = t.replace(/Los Sartenes/gi, '');
  // Take first segment before a '|' if still present
  if (t.indexOf('|') !== -1) t = t.split('|')[0];
  // Clean separators and whitespace
  t = t.replace(/[-|]/g, ' ').trim();
  if (!t) t = 'Los Sartenes';
  return `${t}-Los Sartenes`;
}

async function processFile(filePath) {
  let content = await fs.readFile(filePath, 'utf8');
  const headMatch = content.match(/<head[\s\S]*?>[\s\S]*?<\/head>/i);
  if (!headMatch) return false;
  let head = headMatch[0];

  // Extract title
  const titleMatch = head.match(/<title>([^<]*)<\/title>/i);
  const fullTitle = titleMatch ? titleMatch[1].trim() : '';
  const metaTitle = computeMetaTitle(fullTitle);

  // Prepare new meta block
  const metaBlock = `    <meta property="og:title" content="${metaTitle}">
    <meta property="og:description" content="Bienvenido a Los Sartenes, disfruta nuestro servicio">
    <meta property="og:image" content="https://www.lossartenes.com/images/Logo.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${metaTitle}">
    <meta name="twitter:description" content="Bienvenido a Los Sartenes, disfruta nuestro servicio">
    <meta name="twitter:image" content="https://www.lossartenes.com/images/Logo.jpg">
`;

  // Remove existing OG/Twitter related meta tags inside head
  const cleanedHead = head
    .replace(/\n?\s*<meta[^>]+(property|name)=["']og:title["'][^>]*>\s*/gi, '')
    .replace(/\n?\s*<meta[^>]+(property|name)=["']og:description["'][^>]*>\s*/gi, '')
    .replace(/\n?\s*<meta[^>]+(property|name)=["']og:image["'][^>]*>\s*/gi, '')
    .replace(/\n?\s*<meta[^>]+(property|name)=["']og:image:width["'][^>]*>\s*/gi, '')
    .replace(/\n?\s*<meta[^>]+(property|name)=["']og:image:height["'][^>]*>\s*/gi, '')
    .replace(/\n?\s*<meta[^>]+name=["']twitter:card["'][^>]*>\s*/gi, '')
    .replace(/\n?\s*<meta[^>]+name=["']twitter:title["'][^>]*>\s*/gi, '')
    .replace(/\n?\s*<meta[^>]+name=["']twitter:description["'][^>]*>\s*/gi, '')
    .replace(/\n?\s*<meta[^>]+name=["']twitter:image["'][^>]*>\s*/gi, '');

  // Insert metaBlock right after the <title> tag if present, otherwise after <head>
  let newHead;
  if (titleMatch) {
    newHead = cleanedHead.replace(/(<title>[^<]*<\/title>)/i, `$1\n${metaBlock}`);
  } else {
    newHead = cleanedHead.replace(/<head([^>]*)>/i, `<head$1>\n${metaBlock}`);
  }

  const newContent = content.replace(head, newHead);
  await fs.writeFile(filePath, newContent, 'utf8');
  return true;
}

(async () => {
  const root = path.resolve(__dirname, '..');
  const files = await walk(root);
  let count = 0;
  for (let f of files) {
    try {
      const changed = await processFile(f);
      if (changed) count++;
    } catch (e) {
      console.error('Error processing', f, e.message);
    }
  }
  console.log(`Processed ${count} HTML files.`);
})();
