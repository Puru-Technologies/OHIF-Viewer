#!/usr/bin/env node
/*
 * Post-build trim for the PACS Ace embedded viewer (offline, LAN-only, /viewer-app/).
 * Cross-platform (plain Node, no shell utilities) so it runs on the Windows CI runner.
 *
 * Full recipe, from the repo root:
 *   (cd platform/app && APP_CONFIG=config/puru-ace.js PUBLIC_URL=/viewer-app/ NODE_ENV=production yarn run build)
 *   node scripts/puru-ace-postbuild.mjs [outDir]
 *
 * What it does to platform/app/dist (in place), then optionally copies it to outDir:
 *  - drops ort/ (onnxruntime-web wasm, only fetched by the AI segmentation tools,
 *    which puru-quick never activates) and dicom-microscopy-viewer/ (only
 *    peer-imported by the microscopy mode for whole-slide SM images)
 *  - drops *.map source maps, google.js (Docker-only GCP config copy) and sw.js
 *    (never registered: init-service-worker.js only unregisters workers)
 *  - strips the Google Fonts <link> tags from index.html (falls back to system fonts)
 *  - rewrites manifest.json icon paths from /assets/ to <PUBLIC_URL>assets/
 *  - fails if index.html or app-config.js still reference an external http(s) URL
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(repoRoot, 'platform', 'app', 'dist');
const publicUrl = process.env.PUBLIC_URL || '/viewer-app/';
const outDir = process.argv[2] ? path.resolve(process.argv[2]) : null;

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error(`No build found at ${dist}`);
  process.exit(1);
}

const rm = rel => fs.rmSync(path.join(dist, rel), { recursive: true, force: true });

for (const rel of ['ort', 'dicom-microscopy-viewer', 'google.js', 'sw.js']) {
  rm(rel);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
for (const f of walk(dist)) {
  if (f.endsWith('.map')) fs.rmSync(f);
}

// index.html: remove Google Fonts preconnect + stylesheet links.
const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<link\b[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g, '');
fs.writeFileSync(indexPath, html);

// manifest.json: icons are absolute /assets/... upstream.
const manifestPath = path.join(dist, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const m = fs.readFileSync(manifestPath, 'utf8').replace(/"\/assets\//g, `"${publicUrl}assets/`);
  fs.writeFileSync(manifestPath, m);
}

// Guard: nothing external in the shell or the runtime config.
let bad = false;
for (const rel of ['index.html', 'app-config.js']) {
  const txt = fs.readFileSync(path.join(dist, rel), 'utf8');
  const hits = txt.match(/https?:\/\/[^\s'"<>)]+/g);
  if (hits) {
    console.error(`${rel} still references external URLs: ${[...new Set(hits)].join(', ')}`);
    bad = true;
  }
}
if (!html.includes(`${publicUrl}app-config.js`)) {
  console.error(`index.html does not reference ${publicUrl}app-config.js — was PUBLIC_URL set?`);
  bad = true;
}
if (bad) process.exit(1);

if (outDir) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.cpSync(dist, outDir, { recursive: true });
  console.log(`Copied trimmed build to ${outDir}`);
}
console.log('puru-ace post-build trim OK');
