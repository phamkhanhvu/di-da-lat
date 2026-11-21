import { places } from './places.js';
import { card, categories, normalizeSearch } from './templates.mjs';

const storageKey = 'dalat-favorites';
const ids = new Set(places.map(place => place.id));
const grid = document.getElementById('grid');
const savedLink = document.getElementById('saved-link');
const query = document.getElementById('query');
const filters = document.getElementById('filters');
const savedOnly = new URLSearchParams(window.location.search).get('da-luu') === '1';
let active = '';
let favorites = new Set();

function readFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    favorites = new Set(Array.isArray(stored) ? stored.filter(id => ids.has(id)) : []);
  } catch {
    // Keep the in-memory state if storage is unavailable.
  }
}

function renderFavorites() {
  savedLink.textContent = '♡ Đã lưu ' + favorites.size;
  if (grid && savedOnly) savedLink.setAttribute('aria-current', 'page');
  for (const button of document.querySelectorAll('[data-save]')) {
    const active = favorites.has(button.dataset.save);
    button.hidden = false;
    button.setAttribute('aria-pressed', String(active));
    button.textContent = button.classList.contains('save-icon') ? (active ? '♥' : '♡')
      : (active ? '♥ Đã lưu địa điểm' : '♡ Lưu địa điểm');
  }
}

function setUpPhotos(container) {
  for (const image of container.querySelectorAll('img')) {
    function recoverPhoto() {
      const fallback = image.dataset.fallback;
      if (fallback) {
        delete image.dataset.fallback;
        image.addEventListener('error', recoverPhoto, { once: true });
        image.src = fallback;
      } else image.hidden = true;
    }
    if (image.complete && !image.naturalWidth) recoverPhoto();
    else image.addEventListener('error', recoverPhoto, { once: true });
  }
}

function renderList() {
  const search = normalizeSearch(query.value);
  const visible = places.filter(place => (!savedOnly || favorites.has(place.id)) &&
    (!active || place.cat === active) && normalizeSearch(
      [place.name, place.alias ?? '', place.cat, place.where, place.desc].join(' ')
    ).includes(search));
  grid.innerHTML = visible.map(card).join('') ||
    '<p class="empty">Chưa có địa điểm phù hợp. <a href="./#places">Xem tất cả</a></p>';
  document.getElementById('list-title').textContent = savedOnly ? 'Địa điểm đã lưu' : 'Khám phá địa điểm';
  document.getElementById('count').textContent = visible.length + ' địa điểm';
  setUpPhotos(grid);
  renderFavorites();
}

function refresh() {
  readFavorites();
  if (grid && savedOnly) renderList();
  else renderFavorites();
}

if (grid) {
  for (const name of ['', ...categories]) {
    const button = document.createElement('button');
    button.className = 'button';
    button.type = 'button';
    button.textContent = name || 'Tất cả';
    button.dataset.theme = name;
    button.setAttribute('aria-pressed', String(name === active));
    button.addEventListener('click', () => {
      active = name;
      for (const tab of filters.children) tab.setAttribute('aria-pressed', String(tab === button));
      renderList();
    });
    filters.append(button);
  }
  filters.hidden = false;
  query.closest('label').hidden = false;
  query.addEventListener('input', renderList);
  readFavorites();
  renderList();
} else {
  setUpPhotos(document);
  refresh();
}

document.addEventListener('click', event => {
  const button = event.target.closest('button[data-save]');
  if (!button || !ids.has(button.dataset.save)) return;
  const id = button.dataset.save;
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  try { localStorage.setItem(storageKey, JSON.stringify([...favorites])); } catch {}
  if (grid && savedOnly) {
    renderList();
    (grid.querySelector('[data-save="' + id + '"]') ?? savedLink).focus();
  } else renderFavorites();
});
window.addEventListener('storage', refresh);
window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
