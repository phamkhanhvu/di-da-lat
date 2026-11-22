export const categories = ['Thiên nhiên', 'Văn hóa', 'Trải nghiệm', 'Ẩm thực', 'Lưu trú'];
export const pageSize = 24;
const publicBase = 'https://sensegroup.vn/di-da-lat/';

function placePath(place) {
  return 'dia-diem/' + place.id + '/';
}

export function sitemap(places) {
  const paths = ['', 'dia-diem/', ...places.filter(place => !place.canonicalId).map(placePath)];
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map(path => '  <url><loc>' + escapeHtml(publicBase + path) + '</loc></url>').join('\n') +
    '\n</urlset>\n';
}

function descriptionFor(place) {
  return place.editorial?.summary ?? place.listingLead ?? place.desc;
}

function breadcrumbs(name, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Địa điểm Đà Lạt', item: publicBase + 'dia-diem/' },
      { '@type': 'ListItem', position: 2, name, item: url }
    ]
  };
}
const motifs = { 'Thiên nhiên': '✿', 'Văn hóa': '❀', 'Trải nghiệm': '✦', 'Ẩm thực': '❁', 'Lưu trú': '✤' };

export function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function mapUrl(query) {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
}

export function normalizeSearch(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
}

function photo(place, className, eager = false) {
  return `<div class="${className}"><span class="motif" aria-hidden="true">${motifs[place.cat]}</span>${place.img ? `<img src="${escapeHtml(place.img)}" alt="${escapeHtml(place.alt ?? place.name)}" ${place.imgFallback ? `data-fallback="${escapeHtml(place.imgFallback)}"` : ''} referrerpolicy="no-referrer" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>` : ''}</div>`;
}

export function card(place) {
  const { id, name, cat, where, desc, mapQuery } = place;
  const url = './dia-diem/' + id + '/';
  return `<article class="card" data-theme="${escapeHtml(cat)}">
    <div class="photo-wrap">
      ${photo(place, 'card-photo')}
      <span class="badge">${escapeHtml(cat)}</span>
      <button class="save-icon" type="button" data-save="${id}" aria-label="Yêu thích ${escapeHtml(name)}" aria-pressed="false">♡</button>
    </div>
    <div class="card-copy">
      <p class="where">${escapeHtml(where)}</p>
      <h3><a href="${url}">${escapeHtml(name)}</a></h3>
      <p class="description">${escapeHtml(desc)}</p>
      <div class="actions"><a class="button primary" href="${url}" aria-label="Xem chi tiết ${escapeHtml(name)}">Xem chi tiết</a>
      <a class="button" href="${escapeHtml(mapUrl(mapQuery))}" target="_blank" rel="noopener">Bản đồ</a></div>
    </div>
  </article>`;
}

function shell({ title, description, path, root, body, entryScript = 'app.js', mapCredit = false, image, structured }) {
  const canonical = escapeHtml(publicBase + path);
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="vi_VN">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">${image ? `\n  <meta property="og:image" content="${escapeHtml(image)}">` : ''}
  ${structured ? `<script type="application/ld+json">${JSON.stringify(structured).replaceAll('<', '\\u003c')}</script>` : ''}
  <link rel="stylesheet" href="${root}styles.css">
  <script type="module" src="${root}${escapeHtml(entryScript)}"></script>
</head>
<body>
  <header class="site-header"><nav aria-label="Điều hướng chính">
    <a class="brand" href="${root}"><span aria-hidden="true">✿</span> Đà Lạt Đi Đâu</a>
    <div class="actions"><a class="nav-link" href="${root}#places">Khám phá</a>
    <a class="button" id="saved-link" href="${root}?da-luu=1#places">♡ Đã lưu</a></div>
  </nav></header>
  ${body}
  ${mapCredit ? `<footer class="map-credit">Dữ liệu bản đồ © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · <a href="${root}map-catalog.json">Tải dữ liệu ODbL</a></footer>` : ''}
</body>
</html>\n`;
}

export function homePage(places, entryScript) {
  return shell({
    title: 'Đà Lạt Đi Đâu | Cẩm nang du lịch Đà Lạt',
    path: '',
    description: 'Cẩm nang du lịch Đà Lạt với ' + places.length + ' địa điểm và hướng dẫn tham quan.',
    mapCredit: places.some(place => place.mapRecord),
    root: './',
    entryScript,
    body: `<section class="hero">
      <div class="hero-copy">
        <div class="label"><span aria-hidden="true">✿</span> Cẩm nang du lịch</div>
        <h1>Đà Lạt <em>đi đâu?</em></h1>
        <p>Từ vườn hoa và rừng thông đến những ngôi nhà cổ, tìm nơi anh muốn ghé và lưu lại cho chuyến đi.</p>
        <label class="search" hidden><span aria-hidden="true">⌕</span><input id="query" type="search" aria-label="Tìm địa điểm" placeholder="Tìm vườn hoa, hồ, thác…"></label>
      </div>
      <div class="hero-art" aria-hidden="true"></div>
    </section>
    <main id="places">
      <div class="heading"><h2 id="list-title">Khám phá địa điểm</h2><span id="count" role="status">${places.length} địa điểm</span></div>
      <div id="filters" class="filters" aria-label="Loại địa điểm" hidden></div>
      <div id="grid" class="grid">${places.slice(0, pageSize).map(card).join('\n')}</div>
      <div class="catalog-actions">
        <button id="more-places" type="button" class="button primary" hidden>Xem thêm địa điểm</button>
        <a class="button" href="./dia-diem/">Danh sách đầy đủ</a>
      </div>
    </main>`
  });
}

function fact(term, value, note) {
  if (!value) return '';
  return `<div><dt>${term}</dt><dd>${escapeHtml(value)}${note ? `<small>${escapeHtml(note)}</small>` : ''}</dd></div>`;
}

export function detailPage(place, byId, entryScript) {
  const { id, name, cat, alias, intro, address, duration, timing, tickets, ticketNote, verifiedOn, highlights, plan, tip, related, mapQuery, editorial } = place;
  const path = placePath(place.canonicalId ? byId.get(place.canonicalId) : place);
  const relatedPlaces = related.map(relatedId => byId.get(relatedId)).filter(Boolean);
  const nearby = Boolean(place.area && relatedPlaces.length && relatedPlaces.every(next => next.area === place.area));
  return shell({
    title: name + ' | Đà Lạt Đi Đâu',
    description: descriptionFor(place),
    path,
    image: place.img?.startsWith('https://') ? place.img : undefined,
    structured: breadcrumbs(place.canonicalId ? byId.get(place.canonicalId).name : name, publicBase + path),
    mapCredit: Boolean(place.mapRecord),
    root: '../../',
    entryScript,
    body: `<main class="detail" data-theme="${escapeHtml(cat)}">
      <nav class="breadcrumb" aria-label="Vị trí trong app"><a href="../">Địa điểm</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(name)}</span></nav>
      <section class="detail-hero">
        <div class="detail-copy">
          <div class="label"><span aria-hidden="true">✿</span> ${escapeHtml(cat)}</div>
          <h1>${escapeHtml(name)}</h1>
          ${alias ? `<p class="alias">${escapeHtml(alias)}</p>` : ''}
          <p>${escapeHtml(editorial?.summary ?? place.listingLead ?? intro)}</p>
          <div class="actions"><a class="button primary" href="${escapeHtml(mapUrl(mapQuery))}" target="_blank" rel="noopener">Chỉ đường</a>
          <button class="button" type="button" data-save="${id}" aria-pressed="false" hidden>♡ Lưu địa điểm</button></div>
        </div>
        ${photo(place, 'detail-photo', true)}
      </section>
      <div class="detail-layout">
        <div class="guide">
          <section aria-labelledby="overview"><h2 id="overview">Tổng quan</h2>
            <p>${escapeHtml(editorial?.overview ?? place.listingOverview ?? intro)}</p>
          </section>
          <section aria-labelledby="highlights"><h2 id="highlights">${editorial || !place.listingLead ? 'Điểm nổi bật' : 'Trải nghiệm và lưu ý'}</h2>
            ${(editorial?.highlights ?? highlights).map(([label, value]) => `<h3>${escapeHtml(label)}</h3><p>${escapeHtml(value)}</p>`).join('')}
          </section>
          <section aria-labelledby="getting-there"><h2 id="getting-there">Địa chỉ và cách đi</h2>
            <p><strong>${escapeHtml(address)}</strong></p><p>${escapeHtml(editorial?.directions ?? plan)}</p>
          </section>
          <section class="tip" aria-labelledby="visit-tip"><h2 id="visit-tip">Mẹo khi ghé</h2><p>${escapeHtml(editorial?.tip ?? tip)}</p></section>
        </div>
        <aside class="facts">
          <h2 id="visit-info">Giờ mở cửa và chi phí</h2>
          <dl>${fact('Thời gian nên dành', duration)}${fact('Giờ mở cửa', timing || 'Chưa có thông tin đã đối chiếu.')}${fact('Chi phí', tickets || 'Xác nhận trước khi ghé.', ticketNote)}${fact('Điện thoại', editorial?.phone)}${fact('Tiện ích', editorial?.facilities)}</dl>
          ${verifiedOn ? `<small>Đối chiếu ngày ${escapeHtml(verifiedOn)}. Giờ và giá có thể thay đổi.</small>` : ''}
        </aside>
      </div>
      <section class="nearby" aria-labelledby="related-places"><h2 id="related-places">${place.sameStreet ? 'Điểm trên cùng đường' : nearby ? 'Điểm cùng khu vực' : 'Gợi ý ghé thêm'}</h2><div class="nearby-links">
        ${relatedPlaces.map(next => `<a href="../${next.id}/"><strong>${escapeHtml(next.name)}</strong><span>${escapeHtml(next.cat)} · ${escapeHtml(next.where)}</span></a>`).join('')}
      </div></section>
    </main>`
  });
}

export function indexPage(places, entryScript) {
  return shell({
    title: 'Danh sách địa điểm du lịch Đà Lạt | Đà Lạt Đi Đâu',
    path: 'dia-diem/',
    description: 'Danh sách toàn bộ ' + places.length + ' địa điểm trong cẩm nang.',
    root: '../',
    entryScript,
    mapCredit: places.some(place => place.mapRecord),
    body: `<main><div class="heading"><h1>Danh sách địa điểm</h1><span>${places.length} địa điểm</span></div>
      <ul class="full-catalog">${places.map(p => `<li><a href="./${p.id}/">${escapeHtml(p.name)}</a><span>${escapeHtml(p.cat)} · ${escapeHtml(p.where)}</span></li>`).join('')}</ul></main>`
  });
}
