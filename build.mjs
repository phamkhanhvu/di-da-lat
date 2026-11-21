import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { places } from './src/places.mjs';
import { detailPage, homePage } from './src/templates.mjs';

const out = new URL('./dist/', import.meta.url);
await mkdir(out, { recursive: true });
const byId = new Map(places.map(place => [place.id, place]));
const templates = await readFile(new URL('./src/templates.mjs', import.meta.url), 'utf8');
const app = await readFile(new URL('./src/app.js', import.meta.url), 'utf8');
const data = 'export const places = ' + JSON.stringify(places) + ';\n';
const version = createHash('sha256').update(templates).update('\0').update(app).update('\0').update(data).digest('hex').slice(0, 12);
const entryScript = 'app-' + version + '.js';
const templateScript = 'templates-' + version + '.js';
const dataScript = 'places-' + version + '.js';

await copyFile(new URL('./src/styles.css', import.meta.url), new URL('styles.css', out));
await writeFile(new URL(templateScript, out), templates);
await writeFile(new URL(dataScript, out), data);
await writeFile(new URL(entryScript, out), app
  .replace('./templates.mjs', './' + templateScript)
  .replace('./places.js', './' + dataScript));
await writeFile(new URL('index.html', out), homePage(places, entryScript));

for (const place of places) {
  const directory = new URL('dia-diem/' + place.id + '/', out);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), detailPage(place, byId, entryScript));
}
console.log('Đã tạo trang chủ và ' + places.length + ' trang địa điểm trong dist/.');
