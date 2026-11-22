import assert from 'node:assert/strict';
import test from 'node:test';
import { featured, filterPlaces, pageSize, placeById, places, restoreSaved } from './catalog.mjs';

test('danh mục lấy dữ liệu web và có mục Sense Acoustic', () => {
  assert(places.length >= 500 - 2);
  assert.equal(new Set(places.map(place => place.id)).size, places.length);
  assert.equal(featured.id, 'sense-acoustic-cafe');
  assert.match(featured.address, /304 Hai Bà Trưng/);
  assert(featured.editorial.highlights.length > 1);
  for (const place of places) {
    assert(place.address && place.desc);
    for (const related of place.related) assert(placeById.has(related));
  }
});

test('tìm tiếng Việt không dấu, lọc danh mục và danh sách đã lưu', () => {
  assert(filterPlaces({ query: 'ga da lat' }).some(place => place.id === 'ga-da-lat'));
  assert(filterPlaces({ query: 'sense acoustic', category: 'Ẩm thực' }).some(place => place.id === featured.id));
  assert.deepEqual(filterPlaces({ query: 'sense acoustic', category: 'Thiên nhiên' }), []);
  assert.equal(filterPlaces({}).slice(0, pageSize).length, pageSize);
  const savedIds = restoreSaved('["zen-valley-da-lat","sense-acoustic-cafe","wrong","sense-acoustic-cafe"]');
  assert.equal(savedIds.size, 2);
  assert(savedIds.has('zen-valley-dalat-resort'));
  assert.equal(filterPlaces({ savedOnly: true, savedIds }).length, 2);
  assert.equal(restoreSaved('{broken').size, 0);
});
