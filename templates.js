export const categories = ['Thiên nhiên', 'Văn hóa', 'Trải nghiệm', 'Ẩm thực'];
const motifs = { 'Thiên nhiên': '✿', 'Văn hóa': '❀', 'Trải nghiệm': '✦', 'Ẩm thực': '❁' };

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
  return `<div class="${className}"><span class="motif" aria-hidden="true">${motifs[place.cat]}</span>${place.img ? `<img src="${escapeHtml(place.img)}" alt="${escapeHtml(place.alt ?? place.name)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>` : ''}</div>`;
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

function shell({ title, description, root, body }) {
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${root}styles.css">
  <script type="module" src="${root}app.js"></script>
</head>
<body>
  <header class="site-header"><nav aria-label="Điều hướng chính">
    <a class="brand" href="${root}"><span aria-hidden="true">✿</span> Đà Lạt Đi Đâu</a>
    <div class="actions"><a class="nav-link" href="${root}#places">Khám phá</a>
    <a class="button" id="saved-link" href="${root}?da-luu=1#places">♡ Đã lưu</a></div>
  </nav></header>
  ${body}
</body>
</html>\n`;
}

export function homePage(places) {
  return shell({
    title: 'Đà Lạt Đi Đâu',
    description: 'Cẩm nang du lịch Đà Lạt với 50 địa điểm và hướng dẫn tham quan.',
    root: './',
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
      <div id="grid" class="grid">${places.map(card).join('\n')}</div>
    </main>`
  });
}

function fact(term, value, note) {
  if (!value) return '';
  return `<div><dt>${term}</dt><dd>${escapeHtml(value)}${note ? `<small>${escapeHtml(note)}</small>` : ''}</dd></div>`;
}

export function detailPage(place, byId) {
  const { id, name, cat, alias, intro, address, duration, timing, tickets, ticketNote, verifiedOn, highlights, plan, tip, related, mapQuery } = place;
  return shell({
    title: name + ' | Đà Lạt Đi Đâu',
    description: place.desc,
    root: '../../',
    body: `<main class="detail" data-theme="${escapeHtml(cat)}">
      <nav class="breadcrumb" aria-label="Vị trí trong app"><a href="../../#places">Địa điểm</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(name)}</span></nav>
      <section class="detail-hero">
        <div class="detail-copy">
          <div class="label"><span aria-hidden="true">✿</span> ${escapeHtml(cat)}</div>
          <h1>${escapeHtml(name)}</h1>
          ${alias ? `<p class="alias">${escapeHtml(alias)}</p>` : ''}
          <p>${escapeHtml(intro)}</p>
          <div class="actions"><a class="button primary" href="${escapeHtml(mapUrl(mapQuery))}" target="_blank" rel="noopener">Chỉ đường</a>
          <button class="button" type="button" data-save="${id}" aria-pressed="false" hidden>♡ Lưu địa điểm</button></div>
        </div>
        ${photo(place, 'detail-photo', true)}
      </section>
      <div class="detail-layout">
        <div class="guide">
          <section><h2>Có gì để khám phá?</h2>
            ${highlights.map(([label, value]) => `<h3>${escapeHtml(label)}</h3><p>${escapeHtml(value)}</p>`).join('')}
          </section>
          <section><h2>Cách đi</h2><p>${escapeHtml(plan)}</p></section>
          <section class="tip"><h2>Mẹo khi ghé</h2><p>${escapeHtml(tip)}</p></section>
        </div>
        <aside class="facts">
          <h2>Thông tin tham quan</h2>
          <dl>${fact('Địa chỉ', address)}${fact('Thời gian nên dành', duration)}${fact('Giờ mở cửa tham khảo', timing)}${fact('Chi phí tham khảo', tickets, ticketNote)}</dl>
          ${verifiedOn ? `<small>Đối chiếu ngày ${escapeHtml(verifiedOn)}. Giờ và giá có thể thay đổi.</small>` : ''}
        </aside>
      </div>
      <section class="nearby"><h2>Gợi ý ghé thêm</h2><div class="nearby-links">
        ${related.map(relatedId => {
          const next = byId.get(relatedId);
          return `<a href="../${next.id}/"><strong>${escapeHtml(next.name)}</strong><span>${escapeHtml(next.cat)} · ${escapeHtml(next.where)}</span></a>`;
        }).join('')}
      </div></section>
    </main>`
  });
}
