import assert from 'node:assert/strict';
import test from 'node:test';
import { places as catalog } from './src/places.mjs';
import { applyPlaceGuides } from './src/apply-place-guides.mjs';
import { categories, detailPage, homePage, indexPage, mapUrl, normalizeSearch, sitemap } from './src/templates.mjs';

const places = applyPlaceGuides(catalog);
const byId = new Map(places.map(place => [place.id, place]));

test('có đủ địa điểm duy nhất, nội dung và điểm ghé thêm hợp lệ', () => {
  assert([50, 500].includes(places.length));
  assert.equal(byId.size, places.length);
  for (const place of places) {
    assert.match(place.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert(categories.includes(place.cat));
    assert(place.address && place.desc && place.plan && place.tip);
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
    for (const section of ['overview', 'highlights', 'getting-there', 'visit-info', 'visit-tip', 'related-places']) {
      assert(detail.includes('id="' + section + '"'), place.id + ': ' + section);
    }
    assert(detail.includes('rel="canonical" href="https://sensegroup.vn/di-da-lat/dia-diem/' + (place.canonicalId ?? place.id) + '/"'));
    assert(detail.includes('"@type":"BreadcrumbList"'));
    for (const id of place.related) assert(detail.includes('href="../' + id + '/"'));
    if (!place.img) assert(!detail.includes('<img'));
  }
});

test('tìm kiếm tiếng Việt có dấu và chỉ đường với ký tự được mã hóa', () => {
  assert.equal(normalizeSearch('  Đồi chè Cầu Đất '), 'doi che cau dat');
  assert.equal(normalizeSearch('Vườn cẩm tú cầu Trại Mát'), 'vuon cam tu cau trai mat');
  assert.equal(new URL(mapUrl('Chợ Đà Lạt & hồ')).searchParams.get('query'), 'Chợ Đà Lạt & hồ');
});

test('sitemap đưa đủ trang và nội dung biên tập hiển thị trên trang tương ứng', () => {
  const xml = sitemap(places);
  assert.equal((xml.match(/<loc>/g) ?? []).length, places.filter(place => !place.canonicalId).length + 2);
  const ga = detailPage(byId.get('ga-da-lat'), byId);
  assert.match(ga, /Kiến trúc sân ga và tuyến Trại Mát/);
});
