import assert from 'node:assert/strict';
import test from 'node:test';
import { places } from './src/places.mjs';
import { categories, detailPage, homePage, indexPage, mapUrl, normalizeSearch } from './src/templates.mjs';

const byId = new Map(places.map(place => [place.id, place]));

test('có đủ địa điểm duy nhất, nội dung và điểm ghé thêm hợp lệ', () => {
  assert([50, 500].includes(places.length));
  assert.equal(byId.size, places.length);
  for (const place of places) {
    assert.match(place.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert(categories.includes(place.cat));
    assert(place.address && place.duration && place.desc && place.plan && place.tip);
    assert(place.highlights.length);
    for (const id of place.related) assert(byId.has(id) && id !== place.id);
  }
});

test('danh sách đầy đủ có mọi đường dẫn và trang riêng có chỉ đường, lưu, gợi ý', () => {
  const index = homePage(places);
  assert(index.includes(places.length + ' địa điểm'));
  assert.equal((index.match(/class="card"/g) ?? []).length, 24);
  const all = indexPage(places);
  for (const place of places) {
    assert(all.includes('href="./' + place.id + '/"'));
    const detail = detailPage(place, byId);
    assert(detail.includes('data-save="' + place.id + '"'));
    assert(detail.includes('https://www.google.com/maps/search/'));
    assert(detail.includes('Cách đi'));
    for (const id of place.related) assert(detail.includes('href="../' + id + '/"'));
    if (!place.img) assert(!detail.includes('<img'));
  }
});

test('tìm kiếm tiếng Việt có dấu và chỉ đường với ký tự được mã hóa', () => {
  assert.equal(normalizeSearch('  Đồi chè Cầu Đất '), 'doi che cau dat');
  assert.equal(normalizeSearch('Vườn cẩm tú cầu Trại Mát'), 'vuon cam tu cau trai mat');
  assert.equal(new URL(mapUrl('Chợ Đà Lạt & hồ')).searchParams.get('query'), 'Chợ Đà Lạt & hồ');
});
