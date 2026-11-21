import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { places } from '../src/places.mjs';

const bbox = '11.790,108.210,12.140,108.670';
const centre = [11.9416, 108.4367];
const targetCount = 500;
const groups = {
  tourism: { attraction: ['Trải nghiệm','Điểm tham quan'], museum: ['Văn hóa','Bảo tàng'], viewpoint: ['Thiên nhiên','Điểm ngắm cảnh'], zoo: ['Trải nghiệm','Vườn thú'], theme_park: ['Trải nghiệm','Khu vui chơi'], gallery: ['Văn hóa','Phòng trưng bày'], hotel: ['Lưu trú','Khách sạn'], motel: ['Lưu trú','Nhà nghỉ'], guest_house: ['Lưu trú','Nhà khách'], hostel: ['Lưu trú','Hostel'], chalet: ['Lưu trú','Nhà nghỉ dưỡng'], camp_site: ['Lưu trú','Khu cắm trại'], resort: ['Lưu trú','Khu nghỉ dưỡng'] },
  amenity: { cafe: ['Ẩm thực','Quán cà phê'], restaurant: ['Ẩm thực','Nhà hàng hoặc quán ăn'], fast_food: ['Ẩm thực','Quán ăn nhanh'], food_court: ['Ẩm thực','Khu ẩm thực'], ice_cream: ['Ẩm thực','Quán kem'], marketplace: ['Trải nghiệm','Chợ'], place_of_worship: ['Văn hóa','Công trình tôn giáo'], theatre: ['Văn hóa','Nhà hát'], arts_centre: ['Văn hóa','Không gian nghệ thuật'], pub: ['Ẩm thực','Quán đồ uống'] },
  leisure: { park: ['Thiên nhiên','Công viên'], garden: ['Thiên nhiên','Vườn'], water_park: ['Trải nghiệm','Công viên nước'], nature_reserve: ['Thiên nhiên','Khu bảo tồn'] },
  historic: { monument: ['Văn hóa','Công trình tưởng niệm'], memorial: ['Văn hóa','Đài tưởng niệm'], building: ['Văn hóa','Công trình lịch sử'], ruins: ['Văn hóa','Di tích'] },
  natural: { peak: ['Thiên nhiên','Đỉnh núi'], water: ['Thiên nhiên','Vùng nước'] },
  waterway: { waterfall: ['Thiên nhiên','Thác nước'] }
};
const endpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

function normalForm(value) {
  return value.normalize('NFD').toLowerCase().replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
}

function identity(name) {
  return normalForm(name).replace(/\b(da lat|dalat|khu du lich|thanh pho|khu vuc|nha hang|khach san|quan ca phe|tiem ca phe|ca phe|cafe|coffee|the|hotel)\b/g, ' ').replace(/\s+/g, ' ').trim();
}

function classify(tags) {
  for (const [key, types] of Object.entries(groups)) {
    if (Object.hasOwn(types, tags[key])) return types[tags[key]];
  }
}

function distance(lat, lon, origin = centre) {
  const north = (lat - origin[0]) * 111;
  const east = (lon - origin[1]) * 109;
  return Math.hypot(north, east);
}

function coordinatesLabel(lat, lon) {
  if (distance(lat, lon) <= 6) return 'Khu vực Đà Lạt';
  const north = lat - centre[0];
  const east = lon - centre[1];
  const direction = Math.abs(north) > Math.abs(east)
    ? (north >= 0 ? 'bắc' : 'nam')
    : (east >= 0 ? 'đông' : 'tây');
  return 'Vùng ven phía ' + direction + ' Đà Lạt';
}

function actualName(value) {
  return typeof value === 'string' && normalForm(value).length >= 3 &&
    !/^(quan an|nha hang|ca phe|coffee|cafe|hotel|khach san|nha nghi|restaurant|homestay|pho|bun bo|banh mi|guesthouse|guest house|viewpoint|park|temple|cua hang|food|market|cong vien)$/i.test(normalForm(value));
}

function httpsImage(tags) {
  return typeof tags.image === 'string' && /^https:\/\/[^\s<>"']+\.(jpg|jpeg|png|webp)(\?[^\s<>"']*)?$/i.test(tags.image)
    ? tags.image : undefined;
}

export function selectCatalog(elements, curated, count = targetCount) {
  const used = new Set(curated.map(place => identity(place.name)));
  for (const place of curated) {
    for (const name of (place.alias ?? '').split(/[·,]/)) {
      if (name.trim()) used.add(identity(name));
    }
  }
  const aliases = ['crazy house', 'chua ve chai', 'dalat railway station', 'ga duong sat da lat',
    'xuan huong lake', 'tuyen lam lake', 'datanla waterfall', 'pongour waterfall',
    'dalat market', 'dalat night market', 'bao dai summer palace',
    'truc lam zen monastery', 'da lat cathedral', 'than tho lake',
    'still dalat', 'thuy ta', 'zoo doo'];
  for (const name of aliases) used.add(identity(name));
  const candidates = [];
  for (const item of elements) {
    const tags = item.tags ?? {};
    const name = (tags['name:vi'] || tags.name)?.trim();
    const lat = item.center?.lat ?? item.lat;
    const lon = item.center?.lon ?? item.lon;
    const classification = classify(tags);
    if (!classification || !actualName(name) || !Number.isFinite(lat) || !Number.isFinite(lon) ||
        !['node', 'way', 'relation'].includes(item.type) || !Number.isSafeInteger(item.id) ||
        ['private', 'no'].includes(tags.access) || tags.disused === 'yes' || tags.abandoned === 'yes') continue;
    const [cat, kind] = classification;
    const area = coordinatesLabel(lat, lon);
    const address = [tags['addr:housenumber'], tags['addr:street'] ?? tags['addr:place'], tags['addr:suburb']].filter(Boolean).join(' ');
    const image = httpsImage(tags);
    candidates.push({ item, name, lat, lon, cat, kind, area, address, image });
  }
  const rank = { 'Thiên nhiên': 0, 'Văn hóa': 1, 'Trải nghiệm': 2, 'Ẩm thực': 3, 'Lưu trú': 4 };
  candidates.sort((a, b) =>
    (rank[a.cat] - rank[b.cat]) || Number(Boolean(b.image)) - Number(Boolean(a.image)) ||
    Number(Boolean(b.address)) - Number(Boolean(a.address)) ||
    distance(a.lat, a.lon) - distance(b.lat, b.lon));
  const additions = [];
  for (const c of candidates) {
    const key = identity(c.name);
    if (!key || used.has(key)) continue;
    used.add(key);
    const references = c.cat === 'Lưu trú' || c.cat === 'Ẩm thực'
      ? ['cho-da-lat', 'xuan-huong']
      : ['quang-truong-lam-vien', 'ga-da-lat'];
    const intro = c.kind + ' có tên trên bản đồ tại ' + c.area.toLowerCase() + '.';
    const info = {
      id: 'osm-' + c.item.type + '-' + c.item.id,
      name: c.name, cat: c.cat, area: c.area,
      where: c.address || c.area, address: c.address || c.area,
      mapQuery: c.lat.toFixed(6) + ',' + c.lon.toFixed(6),
      desc: intro, intro,
      duration: 'Tùy kế hoạch của anh',
      highlights: [[c.kind, c.address ? 'Địa chỉ ghi trên bản đồ là ' + c.address + '.' : 'Mở bản đồ để xem vị trí đã được ghi nhận.']],
      plan: 'Bấm Chỉ đường để mở tọa độ trên bản đồ. Kiểm tra tên và lối vào khi đến.',
      tip: c.cat === 'Lưu trú' ? 'Xác nhận giá và điều kiện đặt phòng với cơ sở trước khi đặt cọc.' :
        'Giờ mở cửa và tình trạng đón khách có thể thay đổi. Kiểm tra thông tin hiện tại trước khi đi.',
      related: references.filter(id => curated.some(place => place.id === id)),
      mapRecord: { type: c.item.type, id: c.item.id, lat: c.lat, lon: c.lon }
    };
    if (c.image) { info.img = c.image; info.alt = c.name; }
    additions.push(info);
    if (curated.length + additions.length === count) break;
  }
  if (curated.length + additions.length !== count) {
    throw Error('Có ' + (curated.length + additions.length) + '/' + count + ' điểm phù hợp. Cần bổ sung dữ liệu trước khi xuất bản.');
  }
  return [...curated, ...additions];
}

async function fetchElements() {
  const selectors = Object.entries(groups).map(([key, values]) =>
    'nwr["name"]["' + key + '"~"^(' + Object.keys(values).join('|') + ')$"](' + bbox + ');');
  const query = '[out:json][timeout:45];(' + selectors.join('') + ');out center;';
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint + '?data=' + encodeURIComponent(query), {
        signal: AbortSignal.timeout(65000), headers: { 'user-agent': 'Da-Lat-Di-Dau map catalog importer' }
      });
      if (!response.ok) throw Error('HTTP ' + response.status);
      const body = await response.json();
      if (!Array.isArray(body.elements) || body.elements.length === 0) throw Error('Không có dữ liệu địa điểm');
      return body.elements;
    } catch (error) { console.error(endpoint + ': ' + error.message); }
  }
  throw Error('Chưa tải được dữ liệu công khai từ OpenStreetMap.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const input = process.argv[2] ? JSON.parse(await readFile(process.argv[2], 'utf8')) : await fetchElements();
  const elements = input.elements ?? input;
  if (!Array.isArray(elements)) throw Error('Tệp dữ liệu cần là JSON Overpass hoặc mảng địa điểm OSM.');
  const catalog = selectCatalog(elements, places.filter(place => !place.mapRecord));
  const output = '// Dữ liệu điểm có mapRecord: © OpenStreetMap contributors, ODbL.\n' +
    '// https://www.openstreetmap.org/copyright\n' +
    'export const places = ' + JSON.stringify(catalog, null, 2) + ';\n';
  await writeFile(new URL('../src/places.mjs', import.meta.url), output);
  console.log('Đã lưu ' + catalog.length + ' địa điểm vào src/places.mjs.');
}
