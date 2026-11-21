import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { places } from './src/places.mjs';
import { detailPage, homePage } from './src/templates.mjs';

const out = new URL('./dist/', import.meta.url);
await mkdir(out, { recursive: true });
const byId = new Map(places.map(place => [place.id, place]));

for (const path of ['styles.css', 'app.js', 'templates.mjs']) {
  await copyFile(new URL('src/' + path, import.meta.url), new URL(path, out));
}
await writeFile(new URL('index.html', out), homePage(places));
await writeFile(new URL('places.js', out), 'export const places = ' + JSON.stringify(places) + ';\n');

for (const place of places) {
  const directory = new URL('dia-diem/' + place.id + '/', out);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), detailPage(place, byId));
}
console.log('Đã tạo trang chủ và ' + places.length + ' trang địa điểm trong dist/.');
