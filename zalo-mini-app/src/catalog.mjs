import { places as websiteCatalog } from '../../src/places.mjs';
import { applyPlaceGuides } from '../../src/apply-place-guides.mjs';
import { categories, normalizeSearch } from '../../src/templates.mjs';

const curated = applyPlaceGuides(websiteCatalog);
export { categories };
export const places = curated.filter(place => !place.canonicalId);
export const placeById = new Map(curated.map(place => [place.id, place]));
export const featured = places.find(place => place.featured);
export const pageSize = 18;

const searchIndex = new Map(places.map(place => [
  place.id,
  normalizeSearch([place.name, place.alias, place.cat, place.where, place.desc].filter(Boolean).join(' '))
]));

export function filterPlaces({ query = '', category = '', savedIds, savedOnly = false }) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return places.filter(place =>
    (!category || place.cat === category) &&
    (!savedOnly || savedIds?.has(place.id)) &&
    words.every(word => searchIndex.get(place.id).includes(word))
  );
}

export function restoreSaved(serialized) {
  try {
    const values = JSON.parse(serialized ?? '[]');
    if (!Array.isArray(values)) return new Set();
    return new Set(values.map(id => placeById.get(id)).filter(Boolean)
      .map(place => place.canonicalId ?? place.id));
  } catch {
    return new Set();
  }
}
