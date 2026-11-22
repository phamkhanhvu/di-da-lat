import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { App, AnimationRoutes, Page, Route, ZMPRouter } from 'zmp-ui';
import { nativeStorage, openChat, openPhone } from 'zmp-sdk';
import 'zmp-ui/zaui.css';
import './styles.css';
import appConfig from '../app-config.json';
import { categories, featured, filterPlaces, pageSize, placeById, restoreSaved } from './catalog.mjs';

const savedKey = 'dalat-di-dau:saved:v1';
const oaId = import.meta.env.VITE_SENSE_OA_ID?.trim() ?? '';
const canChat = /^\d+$/.test(oaId);

function readSaved() {
  try {
    return restoreSaved(nativeStorage.getItem(savedKey));
  } catch {
    return new Set();
  }
}

function PlacePhoto({ place, className = '', eager = false }) {
  const [source, setSource] = useState(place.img);

  return (
    <div className={'cover ' + className} data-category={place.cat}>
      <span aria-hidden="true">✿</span>
      {source && <img
        src={source} alt={place.alt || place.name} loading={eager ? 'eager' : 'lazy'}
        decoding="async" referrerPolicy="no-referrer"
        onError={() => setSource(source === place.img ? place.imgFallback : undefined)}
      />}
    </div>
  );
}

function Featured({ onOpen }) {
  return (
    <section className="feature" aria-labelledby="featured-title">
      <PlacePhoto place={featured} className="feature-image" eager />
      <div className="feature-copy">
        <p className="eyebrow">✿ Gợi ý nổi bật</p>
        <h2 id="featured-title">{featured.name}</h2>
        <p>Nghe nhạc acoustic trên đường Hai Bà Trưng.</p>
        <button type="button" onClick={() => onOpen(featured.id)}>Xem lịch nhạc</button>
      </div>
    </section>
  );
}

function PlaceCard({ place, onOpen, onSave, saved }) {
  return (
    <article className="card" data-category={place.cat}>
      <button type="button" className="card-link" onClick={() => onOpen(place.id)}>
        <PlacePhoto place={place} />
        <div className="card-copy">
          <span className="category">{place.cat}</span>
          <h3>{place.name}</h3>
          <p>{place.where}</p>
        </div>
      </button>
      <button type="button" className="save" aria-pressed={saved}
        aria-label={(saved ? 'Bỏ lưu ' : 'Lưu ') + place.name}
        onClick={() => onSave(place.id)}>
        <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
      </button>
    </article>
  );
}

function Catalog({ filters, setFilters, saved, toggleSaved, openPlace, savedOnly = false }) {
  const [limit, setLimit] = useState(pageSize);
  const { query, category } = filters;
  const results = filterPlaces({ query, category, savedIds: saved, savedOnly });

  function updateFilters(next) {
    setFilters({ ...filters, ...next });
    setLimit(pageSize);
  }

  return (
    <>
      {!savedOnly && featured && <Featured onOpen={openPlace} />}
      <section aria-labelledby="catalog-title">
        <div className="section-heading">
          <h2 id="catalog-title">{savedOnly ? 'Điểm đã lưu' : 'Khám phá địa điểm'}</h2>
          <span aria-live="polite">{results.length} địa điểm</span>
        </div>
        <input className="search" type="search" value={query}
          aria-label="Tìm địa điểm"
          placeholder="Tìm hồ, vườn hoa, quán cà phê…"
          onChange={event => updateFilters({ query: event.target.value })} />
        <div className="filters" aria-label="Lọc loại địa điểm">
          {['', ...categories].map(item => <button key={item} type="button"
            aria-pressed={category === item}
            onClick={() => updateFilters({ category: item })}>
            {item || 'Tất cả'}
          </button>)}
        </div>
        {results.length ? <div className="gallery">
          {results.slice(0, limit).map(place => <PlaceCard key={place.id}
            place={place} onOpen={openPlace} onSave={toggleSaved} saved={saved.has(place.id)} />)}
        </div> : <p className="empty">{savedOnly && !saved.size
          ? 'Bấm trái tim để lưu những nơi bạn muốn ghé.'
          : 'Chưa tìm thấy địa điểm phù hợp.'}</p>}
        {results.length > limit && <button className="more" type="button"
          onClick={() => setLimit(limit + pageSize)}>Xem thêm địa điểm</button>}
      </section>
    </>
  );
}

function PlaceDetails({ saved, toggleSaved, openPlace, call, chat, copy, navigate }) {
  const { id } = useParams();
  const record = placeById.get(id);
  const place = record?.canonicalId ? placeById.get(record.canonicalId) : record;

  if (!place) return <div className="empty">
    <p>Chưa tìm thấy địa điểm này.</p>
    <button type="button" onClick={() => navigate('/')}>Về Khám phá</button>
  </div>;

  const guide = place.editorial;
  const isSaved = saved.has(place.id);
  const related = Array.from(new Set(place.related.map(relatedId => {
    const next = placeById.get(relatedId);
    return next?.canonicalId ?? next?.id;
  }))).filter(nextId => nextId && nextId !== place.id).map(nextId => placeById.get(nextId));

  return (
    <article key={place.id} className="article">
      <PlacePhoto key={place.id} place={place} eager />
      <header>
        <p className="category">{place.cat}</p>
        <h2 className="place-title">{place.name}</h2>
        <p className="lead">{guide?.summary ?? place.listingLead ?? place.desc}</p>
        <div className="actions">
          <button type="button" aria-pressed={isSaved} onClick={() => toggleSaved(place.id)}>
            {isSaved ? '♥ Đã lưu' : '♡ Lưu địa điểm'}
          </button>
          {place.bookingTel && <button type="button" className="primary"
            onClick={() => call(place.bookingTel, place.phone)}>Gọi đặt bàn</button>}
          {place.featured && canChat && <button type="button" className="primary"
            onClick={() => chat('Chào Sense, mình muốn hỏi đặt bàn tại Sense Acoustic Cafe.')}>Hỏi đặt bàn qua Zalo</button>}
        </div>
      </header>

      <section><h3>Tổng quan</h3><p>{guide?.overview ?? place.listingOverview ?? place.intro}</p></section>
      <section>
        <h3>{guide ? 'Điểm nổi bật' : 'Trải nghiệm và lưu ý'}</h3>
        {(guide?.highlights ?? place.highlights).map(([label, text]) =>
          <div key={label}><h4>{label}</h4><p>{text}</p></div>)}
      </section>
      <section className="info-panel">
        <h3>Địa chỉ và cách đi</h3>
        <p className="address">{place.address}</p>
        <p>{guide?.directions ?? place.plan}</p>
        <button type="button" onClick={() => copy(place.address)}>Sao chép địa chỉ</button>
      </section>
      <section className="info-panel">
        <h3>Giờ mở cửa và chi phí</h3>
        <dl>
          <dt>{place.timingLabel ?? 'Giờ mở cửa'}</dt>
          <dd>{place.timing ?? 'Chưa có thông tin đã đối chiếu.'}</dd>
          <dt>Chi phí</dt><dd>{place.tickets ?? 'Xác nhận trước khi ghé.'}</dd>
          {place.duration && <><dt>Thời gian nên dành</dt><dd>{place.duration}</dd></>}
          {(guide?.phone ?? place.phone) && <><dt>Điện thoại</dt><dd>{guide?.phone ?? place.phone}</dd></>}
        </dl>
        {place.ticketNote && <p>{place.ticketNote}</p>}
        {place.verifiedOn && <small>Đối chiếu ngày {place.verifiedOn}. Giờ và giá có thể thay đổi.</small>}
      </section>
      <section><h3>Mẹo khi ghé</h3><p>{guide?.tip ?? place.tip}</p></section>
      {related.length > 0 && <section className="related">
        <h3>{place.sameStreet ? 'Điểm trên cùng đường' : 'Gợi ý ghé thêm'}</h3>
        {related.map(next => <button key={next.id} type="button" onClick={() => openPlace(next.id)}>
          <strong>{next.name}</strong><span>{next.where}</span>
        </button>)}
      </section>}
      {place.featured && <aside className="sense-note">
        <strong>Từ sân khấu Sense Acoustic</strong>
        <p>Sense Group còn hỗ trợ sản xuất hình ảnh và tổ chức sự kiện tại Đà Lạt.</p>
        <button type="button" onClick={() => navigate('/sense')}>Tìm hiểu Sense Group</button>
      </aside>}
      {place.mapRecord && <small className="map-credit">Dữ liệu bản đồ © OpenStreetMap contributors · ODbL</small>}
    </article>
  );
}

function Sense({ chat, call, openPlace }) {
  return <section className="about" aria-labelledby="sense-title">
    <p className="eyebrow">Giác Quan Đà Lạt</p>
    <h2 id="sense-title">Sense Group</h2>
    <p>Thương hiệu, nội dung, sự kiện, website và thiết kế không gian tại Đà Lạt.</p>
    <div className="info-panel">
      <h3>Liên hệ Sense Group</h3>
      <p>304 Hai Bà Trưng, Đà Lạt · 0986 338 656</p>
      <div className="actions">
        {canChat && <button type="button" className="primary"
          onClick={() => chat('Chào Sense Group, mình muốn tìm hiểu dịch vụ tại Đà Lạt.')}>Chat SENSE DALAT</button>}
        <button type="button" onClick={() => call('+84986338656', '0986 338 656')}>Gọi tư vấn</button>
      </div>
    </div>
    {featured && <button type="button" className="more" onClick={() => openPlace(featured.id)}>
      Ghé Sense Acoustic Cafe
    </button>}
  </section>;
}

function Screen({ children, details = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tab = details ? (location.state?.from || '/') : location.pathname;
  const tabs = [['/', '✿', 'Khám phá'], ['/saved', '♡', 'Đã lưu'], ['/sense', '◌', 'Sense Group']];

  return (
    <Page className="mini-page">
      <main className="page">
        <header className="masthead">
          {details && <button type="button" className="back" aria-label="Quay lại"
            onClick={() => location.state?.from ? navigate(-1) : navigate('/', { replace: true })}>←</button>}
          <div><h1>Đà Lạt Đi Đâu</h1><p>Cẩm nang du lịch</p></div>
        </header>
        {children}
      </main>
      <nav className="tab-bar" aria-label="Điều hướng">
        {tabs.map(([path, symbol, label]) => <button type="button" key={path}
          aria-current={tab === path ? 'page' : undefined}
          onClick={() => navigate(path, { replace: true })}>
          <span aria-hidden="true">{symbol}</span>{label}
        </button>)}
      </nav>
    </Page>
  );
}

function Routes() {
  const [filters, setFilters] = useState({ query: '', category: '' });
  const [savedFilters, setSavedFilters] = useState({ query: '', category: '' });
  const [saved, setSaved] = useState(readSaved);
  const [notice, setNotice] = useState('');
  const savedRef = useRef(saved);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function toggleSaved(id) {
    const next = new Set(savedRef.current);
    const wasSaved = next.delete(id);
    if (!wasSaved) next.add(id);
    savedRef.current = next;
    setSaved(next);
    try {
      nativeStorage.setItem(savedKey, JSON.stringify([...next]));
      setNotice(wasSaved ? 'Đã bỏ lưu.' : 'Đã lưu địa điểm.');
    } catch {
      setNotice(wasSaved ? 'Đã bỏ lưu.' : 'Đã lưu cho phiên này.');
    }
  }

  function openPlace(id) {
    const detail = location.pathname.startsWith('/dia-diem/');
    navigate('/dia-diem/' + id, {
      state: {
        from: (detail ? location.state?.from : location.pathname) || '/'
      }
    });
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Đã sao chép địa chỉ.');
    } catch {
      setNotice('Chạm giữ dòng địa chỉ để sao chép.');
    }
  }

  async function call(phoneNumber, shownNumber) {
    try {
      await openPhone({ phoneNumber });
    } catch {
      setNotice('Liên hệ qua số ' + shownNumber);
    }
  }

  async function chat(message) {
    try {
      await openChat({ type: 'oa', id: oaId, message });
    } catch {
      setNotice('Chưa mở được chat Zalo. Vui lòng thử lại.');
    }
  }

  const catalogProps = { saved, toggleSaved, openPlace };

  return <>
    <AnimationRoutes>
      <Route path="/" element={<Screen><Catalog {...catalogProps} filters={filters} setFilters={setFilters} /></Screen>} />
      <Route path="/saved" element={<Screen><Catalog {...catalogProps}
        filters={savedFilters} setFilters={setSavedFilters} savedOnly /></Screen>} />
      <Route path="/dia-diem/:id" element={<Screen details><PlaceDetails {...catalogProps}
        call={call} chat={chat} copy={copy} navigate={navigate} /></Screen>} />
      <Route path="/sense" element={<Screen><Sense chat={chat} call={call} openPlace={openPlace} /></Screen>} />
      <Route path="*" element={<Screen><Catalog {...catalogProps} filters={filters} setFilters={setFilters} /></Screen>} />
    </AnimationRoutes>
    <div className="notice" role="status" hidden={!notice}>{notice}</div>
  </>;
}

window.APP_CONFIG ??= appConfig;
createRoot(document.getElementById('app')).render(
  <App theme="light"><ZMPRouter><Routes /></ZMPRouter></App>
);
