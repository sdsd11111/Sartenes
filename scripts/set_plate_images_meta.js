const fs = require('fs').promises;
const path = require('path');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const res = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...await walk(res));
    else if (e.isFile() && res.endsWith('.html')) files.push(res);
  }
  return files;
}

function toWebUrl(absPath, publicRoot) {
  // convert absolute file path to web URL under https://www.lossartenes.com
  let rel = path.relative(publicRoot, absPath);
  rel = rel.split(path.sep).join('/');
  if (!rel.startsWith('/')) rel = '/' + rel;
  return 'https://www.lossartenes.com' + rel;
}

async function processPlate(filePath, publicRoot) {
  let content = await fs.readFile(filePath, 'utf8');
  const headMatch = content.match(/<head[\s\S]*?>[\s\S]*?<\/head>/i);
  if (!headMatch) return false;
  let head = headMatch[0];

  // Find first <img src="...">
  const imgMatch = content.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  let imgSrc = imgMatch ? imgMatch[1] : null;
  let finalImageUrl = 'https://www.lossartenes.com/images/Logo.jpg';

  if (imgSrc) {
    if (/^https?:\/\//i.test(imgSrc)) finalImageUrl = imgSrc;
    else if (imgSrc.startsWith('/')) finalImageUrl = 'https://www.lossartenes.com' + imgSrc;
    else {
      // relative path: resolve against file directory
      const abs = path.resolve(path.dirname(filePath), imgSrc);
      finalImageUrl = toWebUrl(abs, publicRoot);
    }
  }

  // Compute page title if present
  const titleMatch = head.match(/<title>([^<]*)<\/title>/i);
  const fullTitle = titleMatch ? titleMatch[1].trim() : '';
  let pageName = fullTitle.replace(/\s*\|.*$/,'').replace(/\s*-\s*Los Sartenes.*$/i,'').trim();
  if (!pageName) pageName = 'Los Sartenes';
  const metaTitle = `${pageName}-Los Sartenes`;

  // Remove existing OG/Twitter image/title/description entries
  let cleanedHead = head
    .replace(/\n?\s*<meta[^>]+(property|name)=["']og:image["'][^>]*>\s*/gi, '')
    .replace(/\n?\s*<meta[^>]+(property|name)=["']og:title["'][^>]*>\s*/gi, '')
    .replace(/\n?\s*<meta[^>]+(property|name)=["']og:description["'][^>]*>\s*/gi, '')
    .replace(/\n?\s*<meta[^>]+name=["']twitter:image["'][^>]*>\s*/gi, '')
    .replace(/\n?\s*<meta[^>]+name=["']twitter:title["'][^>]*>\s*/gi, '')
    .replace(/\n?\s*<meta[^>]+name=["']twitter:description["'][^>]*>\s*/gi, '');

  const metaBlock = `    <meta property="og:title" content="${metaTitle}">\n    <meta property="og:description" content="Bienvenido a Los Sartenes, disfruta nuestro servicio">\n    <meta property="og:image" content="${finalImageUrl}">\n    <meta property="og:image:width" content="1200">\n    <meta property="og:image:height" content="630">\n    <meta name="twitter:card" content="summary_large_image">\n    <meta name="twitter:title" content="${metaTitle}">\n    <meta name="twitter:description" content="Bienvenido a Los Sartenes, disfruta nuestro servicio">\n    <meta name="twitter:image" content="${finalImageUrl}">\n`;

  // Insert after <title> if exists
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
  try {
    const publicRoot = path.resolve(__dirname, '..', 'public');
    const platesDir = path.join(publicRoot, 'menu', 'platos');
    const files = await walk(platesDir);
    let count = 0;
    for (const f of files) {
      try {
        const ok = await processPlate(f, publicRoot);
        if (ok) count++;
      } catch (e) {
        console.error('Error on', f, e.message);
      }
    }
    console.log(`Updated ${count} plate pages.`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
