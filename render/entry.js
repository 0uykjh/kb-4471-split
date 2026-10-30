import { render } from 'svelte/server';
import fs from 'node:fs';
import path from 'node:path';

const pages = import.meta.glob('/src/routes/kb/**/+page.svx', { eager: true });
const target = process.env.PAGE;
const key = Object.keys(pages).find((k) => k.includes(target));
if (!key) { console.error('page not found:', target, Object.keys(pages)); process.exit(1); }
const mod = pages[key];
const { head, body } = render(mod.default, { props: {} });
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${head}
</head>
<body>
${body}
</body>
</html>
`;
const out = process.env.OUT || 'render/page.html';
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('wrote', out, html.length, 'bytes');
